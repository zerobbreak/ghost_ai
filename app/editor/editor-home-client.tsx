"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { SidebarProject } from "@/lib/projects";

interface EditorHomeClientProps {
  ownedProjects: SidebarProject[];
  sharedProjects: SidebarProject[];
}

export function EditorHomeClient({ ownedProjects, sharedProjects }: EditorHomeClientProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [owned, setOwned] = useState(ownedProjects);
  const [shared, setShared] = useState(sharedProjects);

  useEffect(() => {
    setOwned(ownedProjects);
    setShared(sharedProjects);
  }, [ownedProjects, sharedProjects]);

  useEffect(() => {
    const handleFocus = () => router.refresh();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  const actions = useProjectActions({
    onCreateSuccess: (project) => {
      const entry: SidebarProject = { id: project.id, name: project.name, owned: true };
      setOwned((prev) => [entry, ...prev.filter((p) => p.id !== project.id)]);
      setIsSidebarOpen(true);
    },
  });

  const projects = [...owned, ...shared];

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-(--color-bg-base)">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={projects}
        onProjectSelect={(project) => router.push(`/editor/${project.id}`)}
        onNewProject={actions.openCreate}
        onRenameProject={actions.openRename}
        onDeleteProject={actions.openDelete}
      />

      <main className="flex flex-1 mt-12 overflow-hidden items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <h1 className="text-2xl font-semibold text-(--color-text-primary)">
            Create a project or open an existing one
          </h1>
          <p className="text-sm text-(--color-text-muted) max-w-xs">
            Start a new architecture workspace, or choose a project from the sidebar.
          </p>
          <Button onClick={actions.openCreate} className="mt-2 gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </main>

      <ProjectDialogs
        dialog={actions.dialog}
        selectedProject={actions.selectedProject}
        createName={actions.createName}
        createRoomId={actions.createRoomId}
        renameName={actions.renameName}
        isLoading={actions.isLoading}
        error={actions.error}
        closeDialog={actions.closeDialog}
        setCreateName={actions.setCreateName}
        setRenameName={actions.setRenameName}
        handleCreate={actions.handleCreate}
        handleRename={actions.handleRename}
        handleDelete={actions.handleDelete}
      />
    </div>
  );
}
