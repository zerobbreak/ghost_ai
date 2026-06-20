"use client";

import { useViewport } from "@xyflow/react";
import { useUser } from "@clerk/nextjs";
import { Bot, Loader2 } from "lucide-react";
import { shallow, useOther, useOthersConnectionIds } from "@liveblocks/react/suspense";
import { AI_AGENT_INFO, AI_AGENT_USER_ID } from "@/lib/ai-agent";
import { useAiAgentPresence } from "./ai-presence-avatar";

interface LiveCursorProps {
  connectionId: number;
  currentUserId: string | null;
  vpX: number;
  vpY: number;
  zoom: number;
}

function CursorBadge({
  name,
  color,
  thinking,
  isAi,
}: {
  name: string;
  color: string;
  thinking: boolean;
  isAi: boolean;
}) {
  if (isAi) {
    return (
      <div className="flex max-w-[9rem] items-start gap-1">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-(--color-accent-ai)/40 bg-(--color-accent-ai)/20 text-(--color-accent-ai-text)">
          <Bot className="h-3 w-3" />
        </div>
        <div
          className="flex items-center gap-1 rounded-xl px-2 py-0.5 text-xs font-medium text-(--color-bg-base) shadow-lg"
          style={{ backgroundColor: color }}
        >
          <span className="truncate">{name}</span>
          {thinking ? (
            <Loader2
              className="h-3 w-3 shrink-0 animate-spin opacity-90"
              aria-label="Thinking"
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="h-4 w-4"
        style={{
          backgroundColor: color,
          clipPath:
            "polygon(0 0, 0 100%, 35% 72%, 58% 100%, 78% 88%, 56% 62%, 100% 62%)",
        }}
      />
      <div
        className="ml-1 flex items-center gap-1 rounded-xl px-2 py-0.5 text-xs font-medium text-(--color-bg-base) shadow-lg"
        style={{ backgroundColor: color }}
      >
        <span>{name}</span>
        {thinking ? (
          <Loader2
            className="h-3 w-3 animate-spin opacity-90"
            aria-label="Thinking"
          />
        ) : null}
      </div>
    </>
  );
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

  if (!cursor || other.id === currentUserId || other.id === AI_AGENT_USER_ID) {
    return null;
  }

  const screenX = cursor.x * zoom + vpX;
  const screenY = cursor.y * zoom + vpY;

  return (
    <div
      className="absolute left-0 top-0 z-40 flex items-start"
      style={{
        transform: `translate(${screenX}px, ${screenY}px)`,
      }}
    >
      <CursorBadge
        name={other.name}
        color={other.color}
        thinking={other.thinking}
        isAi={false}
      />
    </div>
  );
}

function AiEphemeralCursor({
  vpX,
  vpY,
  zoom,
}: {
  vpX: number;
  vpY: number;
  zoom: number;
}) {
  const ai = useAiAgentPresence();
  const cursor = ai?.presence.cursor;

  if (!cursor) return null;

  const screenX = cursor.x * zoom + vpX;
  const screenY = cursor.y * zoom + vpY;

  return (
    <div
      className="absolute left-0 top-0 z-40 flex items-start transition-transform duration-300 ease-out will-change-transform"
      style={{
        transform: `translate(${screenX}px, ${screenY}px)`,
      }}
    >
      <CursorBadge
        name={ai.info.name || AI_AGENT_INFO.name}
        color={ai.info.color || AI_AGENT_INFO.color}
        thinking={ai.presence.thinking}
        isAi
      />
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
      <AiEphemeralCursor vpX={vpX} vpY={vpY} zoom={zoom} />
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
