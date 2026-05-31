import { currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getLiveblocks, getUserColor } from "@/lib/liveblocks";
import { getCurrentIdentity, getAccessibleProjectById } from "@/lib/project-access";

export async function POST(request: NextRequest) {
  const identity = await getCurrentIdentity();

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { room?: string } = {};
  try {
    body = await request.json();
  } catch {
    // no body — fall through to validation below
  }

  const roomId = body.room;

  if (!roomId || typeof roomId !== "string") {
    return Response.json({ error: "Missing room" }, { status: 400 });
  }

  const project = await getAccessibleProjectById(roomId, identity);

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await currentUser();
  const name =
    user?.fullName ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress ??
    "Anonymous";
  const avatar = user?.imageUrl ?? "";
  const color = getUserColor(identity.userId);

  const lb = getLiveblocks();

  await lb.getOrCreateRoom(roomId, { defaultAccesses: [] });

  const session = lb.prepareSession(identity.userId, {
    userInfo: { name, avatar, color },
  });

  session.allow(roomId, session.FULL_ACCESS);

  const { status, body: sessionBody } = await session.authorize();
  return new Response(sessionBody, { status });
}
