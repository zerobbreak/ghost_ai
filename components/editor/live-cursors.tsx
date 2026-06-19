"use client";

import { useViewport } from "@xyflow/react";
import { useUser } from "@clerk/nextjs";
import { Bot } from "lucide-react";
import { shallow, useOther, useOthersConnectionIds } from "@liveblocks/react/suspense";
import { AI_AGENT_USER_ID } from "@/lib/ai-agent";

interface LiveCursorProps {
  connectionId: number;
  currentUserId: string | null;
  vpX: number;
  vpY: number;
  zoom: number;
}

function LiveCursor({ connectionId, currentUserId, vpX, vpY, zoom }: LiveCursorProps) {
  const other = useOther(
    connectionId,
    (other) => ({
      id: other.id,
      cursor: other.presence.cursor,
      thinking: other.presence.thinking,
      color: other.info.color,
      name: other.info.name,
    }),
    shallow,
  );
  const cursor = other.cursor;

  if (!cursor || other.id === currentUserId) {
    return null;
  }

  const color = other.color;
  const name = other.name;
  const isAi = other.id === AI_AGENT_USER_ID;

  // Convert flow coordinates to screen pixel offsets within the canvas div
  const screenX = cursor.x * zoom + vpX;
  const screenY = cursor.y * zoom + vpY;

  return (
    <div
      className="absolute left-0 top-0 z-40 flex items-start"
      style={{
        transform: `translate(${screenX}px, ${screenY}px)`,
      }}
    >
      {isAi ? (
        <div
          className="flex h-5 w-5 items-center justify-center rounded-md border border-(--color-accent-ai)/40 bg-(--color-accent-ai)/20 text-(--color-accent-ai-text)"
        >
          <Bot className="h-3 w-3" />
        </div>
      ) : (
        <div
          className="h-4 w-4"
          style={{
            backgroundColor: color,
            clipPath: "polygon(0 0, 0 100%, 35% 72%, 58% 100%, 78% 88%, 56% 62%, 100% 62%)",
          }}
        />
      )}
      <div
        className="ml-1 flex items-center gap-1 rounded-xl px-2 py-0.5 text-xs font-medium text-(--color-bg-base) shadow-lg"
        style={{ backgroundColor: color }}
      >
        <span>{name}</span>
        {other.thinking ? (
          <span className="rounded-full bg-(--color-bg-base)/25 px-1.5 py-0 text-[10px]">
            thinking
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function LiveCursors() {
  const { user } = useUser();
  const currentUserId = user?.id ?? null;
  const connectionIds = useOthersConnectionIds();
  const { x: vpX, y: vpY, zoom } = useViewport();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {connectionIds.map((connectionId) => (
        <LiveCursor
          key={connectionId}
          connectionId={connectionId}
          currentUserId={currentUserId}
          vpX={vpX}
          vpY={vpY}
          zoom={zoom}
        />
      ))}
    </div>
  );
}
