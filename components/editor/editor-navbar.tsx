"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function EditorNavbar({ isSidebarOpen, onSidebarToggle }: EditorNavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center border-b border-(--color-border-default) bg-(--color-bg-surface) px-3">
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
      <div className="flex flex-1 items-center justify-center" />

      {/* Right */}
      <div className="flex items-center" />
    </header>
  );
}
