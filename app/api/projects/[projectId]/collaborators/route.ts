import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentIdentity, getAccessibleProjectById } from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export interface CollaboratorWithProfile {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

const CLERK_CHUNK_SIZE = 100;

async function enrichCollaborators(emails: string[]): Promise<CollaboratorWithProfile[]> {
  if (emails.length === 0) return [];

  try {
    const clerk = await clerkClient();
    const profileByEmail = new Map<string, { displayName: string | null; avatarUrl: string | null }>();

    for (let i = 0; i < emails.length; i += CLERK_CHUNK_SIZE) {
      const chunk = emails.slice(i, i + CLERK_CHUNK_SIZE);
      const result = await clerk.users.getUserList({ emailAddress: chunk, limit: CLERK_CHUNK_SIZE });

      for (const user of result.data) {
        const rawEmail =
          user.emailAddresses.find((ea) => ea.id === user.primaryEmailAddressId)?.emailAddress ??
          user.emailAddresses[0]?.emailAddress;

        if (!rawEmail) continue;

        const key = rawEmail.trim().toLowerCase();
        const displayName =
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.username ||
          null;

        profileByEmail.set(key, { displayName, avatarUrl: user.imageUrl ?? null });
      }
    }

    return emails.map((email) => {
      const key = email.trim().toLowerCase();
      return {
        email,
        displayName: profileByEmail.get(key)?.displayName ?? null,
        avatarUrl: profileByEmail.get(key)?.avatarUrl ?? null,
      };
    });
  } catch {
    return emails.map((email) => ({ email, displayName: null, avatarUrl: null }));
  }
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const identity = await getCurrentIdentity();

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await getAccessibleProjectById(projectId, identity);

  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { email: true },
  });

  const emails = rows.map((r) => r.email);
  const collaborators = await enrichCollaborators(emails);

  return Response.json({
    collaborators,
    isOwner: project.ownerId === identity.userId,
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { email?: string } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "A valid email is required" }, { status: 400 });
  }

  const collaborator = await prisma.projectCollaborator.upsert({
    where: { projectId_email: { projectId, email } },
    create: { projectId, email },
    update: {},
  });

  const [enriched] = await enrichCollaborators([collaborator.email]);

  return Response.json({ collaborator: enriched }, { status: 201 });
}
