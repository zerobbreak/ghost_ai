import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export interface CurrentIdentity {
  userId: string | null;
  primaryEmail: string | null;
}

export interface AccessibleProject {
  id: string;
  name: string;
  ownerId: string;
}

export async function getCurrentIdentity(): Promise<CurrentIdentity> {
  const { userId } = await auth();

  if (!userId) {
    return { userId: null, primaryEmail: null };
  }

  const user = await currentUser();
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null;

  return { userId, primaryEmail };
}

export async function getAccessibleProjectById(
  projectId: string,
  identity?: CurrentIdentity
): Promise<AccessibleProject | null> {
  const resolvedIdentity = identity ?? (await getCurrentIdentity());

  if (!resolvedIdentity.userId) {
    return null;
  }

  const membershipChecks: Array<{ ownerId: string } | { collaborators: { some: { email: string } } }> = [
    { ownerId: resolvedIdentity.userId },
  ];

  if (resolvedIdentity.primaryEmail) {
    membershipChecks.push({
      collaborators: { some: { email: resolvedIdentity.primaryEmail } },
    });
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: membershipChecks,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });

  return project;
}

export async function hasProjectAccess(
  projectId: string,
  identity?: CurrentIdentity
): Promise<boolean> {
  const project = await getAccessibleProjectById(projectId, identity);
  return Boolean(project);
}

export async function projectExistsById(projectId: string): Promise<boolean> {
  const row = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  return row !== null;
}
