import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export interface CurrentIdentity {
  userId: string | null;
  primaryEmail: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface AccessibleProject {
  id: string;
  name: string;
  ownerId: string;
}

interface GetCurrentIdentityOptions {
  loadProfile?: boolean;
}

function getStringClaim(
  claims: Record<string, unknown> | null | undefined,
  keys: string[]
): string | null {
  if (!claims) return null;

  for (const key of keys) {
    const value = claims[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return null;
}

export async function getCurrentIdentity(
  options: GetCurrentIdentityOptions = {}
): Promise<CurrentIdentity> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return {
      userId: null,
      primaryEmail: null,
      displayName: null,
      avatarUrl: null,
    };
  }

  const claims = sessionClaims as Record<string, unknown> | null | undefined;
  let primaryEmail = getStringClaim(claims, [
    "email",
    "email_address",
    "primary_email",
    "primary_email_address",
  ]);
  const nameFromParts = [
    getStringClaim(claims, ["first_name"]),
    getStringClaim(claims, ["last_name"]),
  ]
    .filter(Boolean)
    .join(" ");
  let displayName =
    getStringClaim(claims, ["name", "full_name"]) || nameFromParts || null;
  let avatarUrl = getStringClaim(claims, ["image_url", "picture", "avatar_url"]);

  if (options.loadProfile === false) {
    return { userId, primaryEmail, displayName, avatarUrl };
  }

  const user = await currentUser();
  primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    primaryEmail;
  displayName = user?.fullName ?? user?.firstName ?? primaryEmail ?? displayName;
  avatarUrl = user?.imageUrl ?? avatarUrl;

  return { userId, primaryEmail, displayName, avatarUrl };
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
