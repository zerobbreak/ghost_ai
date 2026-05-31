"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SidebarProject } from "@/lib/projects";

export type { SidebarProject };
export type DialogType = "create" | "rename" | "delete" | null;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function shortSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

export interface UseProjectActionsReturn {
  dialog: DialogType;
  selectedProject: SidebarProject | null;
  createName: string;
  createRoomId: string;
  renameName: string;
  isLoading: boolean;
  error: Error | null;
  openCreate: () => void;
  openRename: (project: SidebarProject) => void;
  openDelete: (project: SidebarProject) => void;
  closeDialog: () => void;
  setCreateName: (name: string) => void;
  setRenameName: (name: string) => void;
  handleCreate: () => Promise<void>;
  handleRename: () => Promise<void>;
  handleDelete: () => Promise<void>;
}

export interface UseProjectActionsOptions {
  activeProjectId?: string;
  /** Called after a project is created so the sidebar can update without a full reload. */
  onCreateSuccess?: (project: { id: string; name: string }) => void;
}

export function useProjectActions(
  options: UseProjectActionsOptions = {}
): UseProjectActionsReturn {
  const { activeProjectId, onCreateSuccess } = options;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] = useState<SidebarProject | null>(null);
  const [createName, setCreateName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [renameName, setRenameName] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const slug = toSlug(createName);
  const createRoomId = slug ? `${slug}-${suffix}` : "";

  const openCreate = () => {
    setError(null);
    setCreateName("");
    setSuffix(shortSuffix());
    setDialog("create");
  };

  const openRename = (project: SidebarProject) => {
    setError(null);
    setSelectedProject(project);
    setRenameName(project.name);
    setDialog("rename");
  };

  const openDelete = (project: SidebarProject) => {
    setError(null);
    setSelectedProject(project);
    setDialog("delete");
  };

  const closeDialog = () => {
    setDialog(null);
    setSelectedProject(null);
    setError(null);
  };

  const handleCreate = async () => {
    const trimmed = createName.trim();
    if (!trimmed) return;
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const data = (await res.json()) as { project: { id: string; name: string } };
      closeDialog();
      onCreateSuccess?.(data.project);
      startTransition(() => {
        router.push(`/editor/${data.project.id}`);
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsFetching(false);
    }
  };

  const handleRename = async () => {
    const trimmed = renameName.trim();
    if (!trimmed || !selectedProject) return;
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to rename project");
      closeDialog();
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsFetching(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      closeDialog();
      startTransition(() => {
        if (activeProjectId === selectedProject.id) {
          router.push("/editor");
        } else {
          router.refresh();
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsFetching(false);
    }
  };

  return {
    dialog,
    selectedProject,
    createName,
    createRoomId,
    renameName,
    isLoading: isFetching || isPending,
    error,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    setCreateName,
    setRenameName,
    handleCreate,
    handleRename,
    handleDelete,
  };
}
