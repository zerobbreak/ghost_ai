"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ShareDialog } from "@/components/editor/share-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { SidebarProject } from "@/lib/projects";

interface EditorWorkspaceClientProps {
  projectId: string;
  projectName: string;
  ownedProjects: SidebarProject[];
  sharedProjects: SidebarProject[];
}

export function EditorWorkspaceClient({
  projectId,
  projectName,
  ownedProjects,
  sharedProjects,
}: EditorWorkspaceClientProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [owned, setOwned] = useState(ownedProjects);
  const [shared, setShared] = useState(sharedProjects);

  useEffect(() => {
    setOwned(ownedProjects);
    setShared(sharedProjects);
  }, [ownedProjects, sharedProjects]);

  const actions = useProjectActions({
    activeProjectId: projectId,
    onCreateSuccess: (project) => {
      const entry: SidebarProject = { id: project.id, name: project.name, owned: true };
      setOwned((prev) => [entry, ...prev.filter((p) => p.id !== project.id)]);
    },
  });

  const projects = [...owned, ...shared];

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-(--color-bg-base)">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
        projectName={projectName}
        showWorkspaceActions
        isAiSidebarOpen={isAiSidebarOpen}
        onAiSidebarToggle={() => setIsAiSidebarOpen((prev) => !prev)}
        onShareClick={() => setIsShareOpen(true)}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={projects}
        activeProjectId={projectId}
        onProjectSelect={(project) => router.push(`/editor/${project.id}`)}
        onNewProject={actions.openCreate}
        onRenameProject={actions.openRename}
        onDeleteProject={actions.openDelete}
      />

      <main className="absolute inset-0 top-12 flex overflow-hidden">
        <section className="flex flex-1 items-center justify-center bg-(--color-bg-base)">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-(--color-text-primary)">Canvas coming soon</h1>
            <p className="mt-2 text-sm text-(--color-text-muted)">
              Real-time editing will be added in the next feature.
            </p>
          </div>
        </section>
      </main>

      <aside
        className={[
          "absolute bottom-0 right-0 top-12 z-50 flex w-80 flex-col border-l border-(--color-border-default) bg-(--color-bg-surface)",
          "transition-transform duration-200 ease-in-out",
          isAiSidebarOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-12 items-center gap-2 border-b border-(--color-border-default) px-4">
          <MessageSquareText className="h-4 w-4 text-(--color-text-muted)" />
          <p className="text-sm font-medium text-(--color-text-primary)">AI Assistant</p>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 text-center">
          <p className="text-sm text-(--color-text-muted)">
            AI chat sidebar placeholder for upcoming features.
          </p>
        </div>
      </aside>

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

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        projectId={projectId}
        projectName={projectName}
      />
    </div>
  );
}
