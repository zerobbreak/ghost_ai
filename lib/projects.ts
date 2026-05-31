import prisma from "@/lib/prisma";
import { getCurrentIdentity, type CurrentIdentity } from "@/lib/project-access";

export interface SidebarProject {
  id: string;
  name: string;
  owned: boolean;
}

export async function getProjectsForCurrentUser(): Promise<{
  owned: SidebarProject[];
  shared: SidebarProject[];
}> {
  return getProjectsForIdentity(await getCurrentIdentity());
}

export async function getProjectsForIdentity(
  identity: CurrentIdentity
): Promise<{
  owned: SidebarProject[];
  shared: SidebarProject[];
}> {
  if (!identity.userId) return { owned: [], shared: [] };

  const [ownedRaw, sharedRaw] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: identity.userId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    identity.primaryEmail
      ? prisma.project.findMany({
          where: { collaborators: { some: { email: identity.primaryEmail } } },
          select: { id: true, name: true },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  return {
    owned: ownedRaw.map((p) => ({ ...p, owned: true })),
    shared: sharedRaw.map((p) => ({ ...p, owned: false })),
  };
}
