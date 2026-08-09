"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { shallow, useOthers } from "@liveblocks/react/suspense";
import { AiPresenceAvatar, useAiAgentPresence } from "./ai-presence-avatar";
import { AI_AGENT_USER_ID } from "@/lib/ai-agent";

const MAX_VISIBLE_COLLABORATORS = 5;

function getInitials(name: string, fallback: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (parts[0]?.slice(0, 2) || fallback.slice(0, 2) || "?").toUpperCase();
}

interface CollaboratorAvatarProps {
  name: string;
  avatar: string;
  color: string;
  userId: string;
  index: number;
}

function CollaboratorAvatar({
  name,
  avatar,
  color,
  userId,
  index,
}: CollaboratorAvatarProps) {
  const commonClassName =
    "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-(--color-bg-base) text-[10px] font-semibold text-(--color-text-primary) shadow-lg ring-1 ring-(--color-border-subtle)";

  return (
    <div
      className={commonClassName}
      style={{
        backgroundColor: color,
        marginLeft: index === 0 ? 0 : -10,
        zIndex: MAX_VISIBLE_COLLABORATORS - index,
      }}
      aria-label={name}
      title={name}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{getInitials(name, userId)}</span>
      )}
    </div>
  );
}

export function PresenceAvatarGroup() {
  const { user } = useUser();
  const currentUserId = user?.id ?? null;
  const collaborators = useOthers(
    (others) =>
      others.filter(
        (other) => other.id !== currentUserId && other.id !== AI_AGENT_USER_ID,
      ),
    shallow,
  );

  const aiAgent = useAiAgentPresence();
  const visibleCollaborators = collaborators.slice(0, MAX_VISIBLE_COLLABORATORS);
  const overflowCount = Math.max(0, collaborators.length - MAX_VISIBLE_COLLABORATORS);
  const hasCollaborators = collaborators.length > 0;
  const hasAvatarGroup = Boolean(aiAgent) || hasCollaborators;

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-(--color-border-default) bg-(--color-bg-surface) px-2 py-1.5 shadow-2xl">
      {hasAvatarGroup ? (
        <>
          <div className="flex items-center">
            <AiPresenceAvatar index={0} />
            {visibleCollaborators.map((collaborator, index) => (
              <CollaboratorAvatar
                key={collaborator.connectionId}
                name={collaborator.info.name}
                avatar={collaborator.info.avatar}
                color={collaborator.info.color}
                userId={collaborator.id}
                index={index + (aiAgent ? 1 : 0)}
              />
            ))}
            {overflowCount > 0 ? (
              <div className="-ml-2 flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-(--color-bg-base) bg-(--color-bg-elevated) px-2 text-[10px] font-semibold text-(--color-text-secondary) shadow-lg ring-1 ring-(--color-border-subtle)">
                +{overflowCount}
              </div>
            ) : null}
          </div>
          <div className="h-6 w-px bg-(--color-border-subtle)" />
        </>
      ) : null}
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: "h-8 w-8",
          },
        }}
      />
    </div>
  );
}
