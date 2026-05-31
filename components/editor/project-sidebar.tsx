"use client";

import { Pencil, Trash2, X, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { SidebarProject } from "@/lib/projects";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SidebarProject[];
  onNewProject: () => void;
  onRenameProject: (project: SidebarProject) => void;
  onDeleteProject: (project: SidebarProject) => void;
  activeProjectId?: string;
  onProjectSelect?: (project: SidebarProject) => void;
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

function ProjectItem({
  project,
  onRename,
  onDelete,
  isActive = false,
  onSelect,
}: {
  project: SidebarProject;
  onRename?: () => void;
  onDelete?: () => void;
  isActive?: boolean;
  onSelect?: () => void;
}) {
  const rowClass = [
    "group/item flex w-full items-center gap-1 rounded-md px-2 py-1.5 transition-colors",
    isActive
      ? "bg-(--color-accent-primary-dim)"
      : "hover:bg-(--color-bg-elevated)",
  ].join(" ");

  const nameClass = [
    "flex-1 truncate text-sm group-hover/item:text-(--color-text-primary)",
    isActive ? "text-(--color-text-primary)" : "text-(--color-text-secondary)",
  ].join(" ");

  return (
    <div className={rowClass}>
      {onSelect ? (
        <button type="button" onClick={onSelect} className={`${nameClass} text-left`}>
          {project.name}
        </button>
      ) : (
        <span className={nameClass}>{project.name}</span>
      )}
      {onRename && onDelete && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRename}
            className="h-6 w-6 text-(--color-text-muted) hover:text-(--color-text-primary)"
            aria-label={`Rename ${project.name}`}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onDelete}
            className="h-6 w-6 text-(--color-text-muted) hover:text-destructive"
            aria-label={`Delete ${project.name}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  projects,
  onNewProject,
  onRenameProject,
  onDeleteProject,
  activeProjectId,
  onProjectSelect,
}: ProjectSidebarProps) {
  const ownedProjects = projects.filter((p) => p.owned);
  const sharedProjects = projects.filter((p) => !p.owned);

  return (
    <>
      {/* Backdrop — visible scrim on mobile, transparent on desktop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:bg-transparent"
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
              {ownedProjects.length === 0 ? (
                <EmptyPlaceholder label="projects" />
              ) : (
                <div className="flex flex-col gap-0.5">
                  {ownedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      isActive={project.id === activeProjectId}
                      onSelect={() => onProjectSelect?.(project)}
                      onRename={() => onRenameProject(project)}
                      onDelete={() => onDeleteProject(project)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shared" className="mt-2 flex-1 overflow-y-auto">
              {sharedProjects.length === 0 ? (
                <EmptyPlaceholder label="shared projects" />
              ) : (
                <div className="flex flex-col gap-0.5">
                  {sharedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      isActive={project.id === activeProjectId}
                      onSelect={() => onProjectSelect?.(project)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-(--color-border-default) p-3">
          <Button
            variant="outline"
            className="w-full gap-2 border-(--color-border-subtle) bg-transparent text-sm text-(--color-text-secondary) hover:border-(--color-accent-primary) hover:text-(--color-accent-primary) hover:bg-(--color-accent-primary-dim)"
            onClick={onNewProject}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
