"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { Button } from "@/components/ui/button";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dialogs = useProjectDialogs();

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-(--color-bg-base)">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={dialogs.projects}
        onNewProject={dialogs.openCreate}
        onRenameProject={dialogs.openRename}
        onDeleteProject={dialogs.openDelete}
      />

      <main className="flex flex-1 mt-12 overflow-hidden items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <h1 className="text-2xl font-semibold text-(--color-text-primary)">
            Create a project or open an existing one
          </h1>
          <p className="text-sm text-(--color-text-muted) max-w-xs">
            Start a new architecture workspace, or choose a project from the sidebar.
          </p>
          <Button onClick={dialogs.openCreate} className="mt-2 gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </main>

      <ProjectDialogs
        dialog={dialogs.dialog}
        selectedProject={dialogs.selectedProject}
        createName={dialogs.createName}
        createSlug={dialogs.createSlug}
        renameName={dialogs.renameName}
        isLoading={dialogs.isLoading}
        closeDialog={dialogs.closeDialog}
        setCreateName={dialogs.setCreateName}
        setRenameName={dialogs.setRenameName}
        handleCreate={dialogs.handleCreate}
        handleRename={dialogs.handleRename}
        handleDelete={dialogs.handleDelete}
      />
    </div>
  );
}
