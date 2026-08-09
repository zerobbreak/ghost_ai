import { NextRequest } from "next/server";
import { getLiveblocks, getUserColor } from "@/lib/liveblocks";
import { getCurrentIdentity, getAccessibleProjectById } from "@/lib/project-access";

export async function POST(request: NextRequest) {
  let identity = await getCurrentIdentity({ loadProfile: false });

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

  // Collaborator access is keyed by email — load profile only when claims lack it.
  if (!project && !identity.primaryEmail) {
    try {
      identity = await getCurrentIdentity({ loadProfile: true });
      project = await getAccessibleProjectById(roomId, identity);
    } catch {
      return Response.json(
        { error: "Unable to verify account profile" },
        { status: 503 },
      );
    }
  }

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = identity.userId;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name =
    identity.displayName ?? identity.primaryEmail ?? userId;
  const avatar = identity.avatarUrl ?? "";
  const color = getUserColor(userId);

  const lb = getLiveblocks();

  const session = lb.prepareSession(userId, {
    userInfo: { name, avatar, color },
  });

  session.allow(roomId, session.FULL_ACCESS);

  try {
    const { status, body: sessionBody } = await session.authorize();

    if (status !== 200) {
      return Response.json(
        { error: "Liveblocks authorization failed", detail: sessionBody },
        { status },
      );
    }

    return new Response(sessionBody, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Liveblocks authorization failed";

    return Response.json({ error: message }, { status: 503 });
  }
}
