"use client";

import { X, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function EmptyPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-bg-elevated)">
        <FolderOpen className="h-5 w-5 text-(--color-text-faint)" />
      </div>
      <p className="text-sm text-(--color-text-muted)">No {label} yet</p>
    </div>
  );
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <>
      {/* Overlay — closes sidebar on click but doesn't block content */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          "fixed left-0 top-12 z-50 flex h-[calc(100vh-3rem)] w-64 flex-col",
          "border-r border-(--color-border-default) bg-(--color-bg-surface)",
          "shadow-[4px_0_24px_rgba(0,0,0,0.4)]",
          "transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-(--color-border-default) px-4">
          <span className="text-sm font-semibold text-(--color-text-primary) tracking-wide">
            Projects
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-bg-elevated)"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-1 flex-col overflow-hidden px-3 pt-3">
          <Tabs defaultValue="my-projects" className="flex flex-1 flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects" className="flex-1 text-xs">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1 text-xs">
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="mt-2 flex-1 overflow-y-auto">
              <EmptyPlaceholder label="projects" />
            </TabsContent>

            <TabsContent value="shared" className="mt-2 flex-1 overflow-y-auto">
              <EmptyPlaceholder label="shared projects" />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-(--color-border-default) p-3">
          <Button
            variant="outline"
            className="w-full gap-2 border-(--color-border-subtle) bg-transparent text-sm text-(--color-text-secondary) hover:border-(--color-accent-primary) hover:text-(--color-accent-primary) hover:bg-(--color-accent-primary-dim)"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
