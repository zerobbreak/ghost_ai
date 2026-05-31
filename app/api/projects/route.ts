import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ projects });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string } = {};
  try {
    body = await request.json();
  } catch {
    // no body or invalid JSON — use defaults
  }

  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : "Untitled Project";

  const project = await prisma.project.create({
    data: {
      ownerId: userId,
      name,
    },
    select: {
      id: true,
      name: true,
    },
  });

  return Response.json({ project }, { status: 201 });
}
