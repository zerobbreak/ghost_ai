"use client";

import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  projectName?: string;
  showWorkspaceActions?: boolean;
  isAiSidebarOpen?: boolean;
  onAiSidebarToggle?: () => void;
  onShareClick?: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  projectName,
  showWorkspaceActions = false,
  isAiSidebarOpen = false,
  onAiSidebarToggle,
  onShareClick,
}: EditorNavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-60 flex h-12 items-center border-b border-(--color-border-default) bg-(--color-bg-surface) px-3">
      {/* Left */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          className="h-8 w-8 text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-bg-elevated)"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Center */}
      <div className="flex flex-1 items-center justify-center">
        {projectName ? (
          <p className="truncate px-4 text-sm font-medium text-(--color-text-primary)">
            {projectName}
          </p>
        ) : null}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {showWorkspaceActions ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onShareClick}
              className="h-8 border-(--color-border-subtle) bg-transparent text-(--color-text-secondary) hover:bg-(--color-bg-elevated) hover:text-(--color-text-primary)"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAiSidebarToggle}
              className={[
                "h-8 gap-1.5 text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-bg-elevated)",
                isAiSidebarOpen ? "bg-(--color-bg-elevated) text-(--color-text-primary)" : "",
              ].join(" ")}
              aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
            >
              <Sparkles className="h-4 w-4" />
              Ask AI
            </Button>
          </>
        ) : null}
        <UserButton />
      </div>
    </header>
  );
}
