import { NextRequest } from "next/server";
import { getLiveblocks, getUserColor } from "@/lib/liveblocks";
import { getCurrentIdentity, getAccessibleProjectById } from "@/lib/project-access";

export async function POST(request: NextRequest) {
  const identity = await getCurrentIdentity({ loadProfile: false });

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

  let project = await getAccessibleProjectById(roomId, identity);
  let authorizedIdentity = identity;

  if (!project && !identity.primaryEmail) {
    authorizedIdentity = await getCurrentIdentity();
    project = await getAccessibleProjectById(roomId, authorizedIdentity);
  }

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  authorizedIdentity = await getCurrentIdentity();

  const userId = authorizedIdentity.userId;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name =
    authorizedIdentity.displayName ??
    authorizedIdentity.primaryEmail ??
    userId;
  const avatar = authorizedIdentity.avatarUrl ?? "";
  const color = getUserColor(userId);

  const lb = getLiveblocks();

  const session = lb.prepareSession(userId, {
    userInfo: { name, avatar, color },
  });

  session.allow(roomId, session.FULL_ACCESS);

  const { status, body: sessionBody } = await session.authorize();
  return new Response(sessionBody, { status });
}
