import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export interface SidebarProject {
  id: string;
  name: string;
  owned: boolean;
}

export async function getProjectsForCurrentUser(): Promise<{
  owned: SidebarProject[];
  shared: SidebarProject[];
}> {
  const { userId } = await auth();
  if (!userId) return { owned: [], shared: [] };

  // Run the Clerk user fetch and the owned-projects query in parallel so the
  // Clerk API roundtrip does not block the DB query.
  const [user, ownedRaw] = await Promise.all([
    currentUser(),
    prisma.project.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const email = user?.emailAddresses[0]?.emailAddress;

  const sharedRaw = email
    ? await prisma.project.findMany({
        where: { collaborators: { some: { email } } },
        select: { id: true, name: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return {
    owned: ownedRaw.map((p) => ({ ...p, owned: true })),
    shared: sharedRaw.map((p) => ({ ...p, owned: false })),
  };
}
