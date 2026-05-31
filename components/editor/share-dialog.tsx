"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Link, Loader2, UserMinus, UserPlus, Users } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CollaboratorWithProfile {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

function CollaboratorAvatar({
  email,
  displayName,
  avatarUrl,
}: {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const initials = (displayName ?? email)
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={displayName ?? email}
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-bg-subtle) text-xs font-medium text-(--color-text-secondary)">
      {initials || "?"}
    </div>
  );
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorWithProfile[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/collaborators`);
        if (cancelled) return;
        if (!res.ok) throw new Error("Failed to load collaborators");
        const data = await res.json();
        if (cancelled) return;
        setCollaborators(data.collaborators ?? []);
        setIsOwner(data.isOwner ?? false);
      } catch {
        // leave previous state on error
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError(null);

    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    setIsInviting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error ?? "Failed to invite collaborator");
        return;
      }

      setCollaborators((prev) => {
        const already = prev.some((c) => c.email === data.collaborator.email);
        return already ? prev : [...prev, data.collaborator];
      });
      setInviteEmail("");
    } catch {
      setInviteError("Something went wrong. Please try again.");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemove(email: string) {
    setRemovingEmail(email);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators/${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setCollaborators((prev) => prev.filter((c) => c.email !== email));
      }
    } catch {
      // silently ignore — the UI reverts on next load
    } finally {
      setRemovingEmail(null);
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/editor/${projectId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-md rounded-3xl border border-(--color-border-default) bg-(--color-bg-surface) p-0 shadow-2xl"
        showCloseButton
      >
        <DialogHeader className="border-b border-(--color-border-default) px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-(--color-text-muted)" />
            <DialogTitle className="text-sm font-semibold text-(--color-text-primary)">
              Share &ldquo;{projectName}&rdquo;
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 py-5">
          {/* Copy link */}
          <div>
            <p className="mb-2 text-xs font-medium text-(--color-text-muted)">Project link</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="w-full justify-start gap-2 border-(--color-border-subtle) bg-transparent text-(--color-text-secondary) hover:bg-(--color-bg-elevated) hover:text-(--color-text-primary)"
            >
              {copied ? (
                <Check className="h-4 w-4 text-(--color-state-success)" />
              ) : (
                <Link className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>

          {/* Invite form — owners only */}
          {isOwner && (
            <div>
              <p className="mb-2 text-xs font-medium text-(--color-text-muted)">Invite collaborator</p>
              <form onSubmit={handleInvite} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError(null);
                  }}
                  disabled={isInviting}
                  className="flex-1 border-(--color-border-default) bg-(--color-bg-elevated) text-(--color-text-primary) placeholder:text-(--color-text-faint) focus-visible:ring-(--color-accent-primary)"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="shrink-0 gap-1.5 bg-(--color-accent-primary) text-(--color-bg-base) hover:opacity-90 disabled:opacity-50"
                >
                  {isInviting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Invite
                </Button>
              </form>
              {inviteError && (
                <p className="mt-1.5 text-xs text-(--color-state-error)">{inviteError}</p>
              )}
            </div>
          )}

          {/* Collaborator list */}
          <div>
            <p className="mb-2 text-xs font-medium text-(--color-text-muted)">
              {collaborators.length > 0
                ? `${collaborators.length} collaborator${collaborators.length > 1 ? "s" : ""}`
                : "No collaborators yet"}
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-(--color-text-muted)" />
              </div>
            ) : collaborators.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {collaborators.map((c) => (
                  <li
                    key={c.email}
                    className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-(--color-bg-elevated)"
                  >
                    <CollaboratorAvatar
                      email={c.email}
                      displayName={c.displayName}
                      avatarUrl={c.avatarUrl}
                    />
                    <div className="min-w-0 flex-1">
                      {c.displayName && (
                        <p className="truncate text-sm font-medium text-(--color-text-primary)">
                          {c.displayName}
                        </p>
                      )}
                      <p className="truncate text-xs text-(--color-text-muted)">{c.email}</p>
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={removingEmail === c.email}
                        onClick={() => handleRemove(c.email)}
                        className="h-7 w-7 shrink-0 text-(--color-text-faint) hover:text-(--color-state-error) hover:bg-(--color-bg-subtle)"
                        aria-label={`Remove ${c.email}`}
                      >
                        {removingEmail === c.email ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserMinus className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
