"use client";

import { useState } from "react";
import { Project, MOCK_PROJECTS } from "@/lib/mock-projects";

export type DialogType = "create" | "rename" | "delete" | null;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export interface UseProjectDialogsReturn {
  projects: Project[];
  dialog: DialogType;
  selectedProject: Project | null;
  createName: string;
  createSlug: string;
  renameName: string;
  isLoading: boolean;
  openCreate: () => void;
  openRename: (project: Project) => void;
  openDelete: (project: Project) => void;
  closeDialog: () => void;
  setCreateName: (name: string) => void;
  setRenameName: (name: string) => void;
  handleCreate: () => void;
  handleRename: () => void;
  handleDelete: () => void;
}

export function useProjectDialogs(): UseProjectDialogsReturn {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [createName, setCreateName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createSlug = toSlug(createName);

  const openCreate = () => {
    setCreateName("");
    setDialog("create");
  };

  const openRename = (project: Project) => {
    setSelectedProject(project);
    setRenameName(project.name);
    setDialog("rename");
  };

  const openDelete = (project: Project) => {
    setSelectedProject(project);
    setDialog("delete");
  };

  const closeDialog = () => {
    setDialog(null);
    setSelectedProject(null);
  };

  const handleCreate = () => {
    const trimmed = createName.trim();
    if (!trimmed) return;
    setIsLoading(true);
    setProjects((prev) => [
      ...prev,
      { id: Date.now().toString(), name: trimmed, slug: toSlug(trimmed), owned: true },
    ]);
    setIsLoading(false);
    closeDialog();
  };

  const handleRename = () => {
    const trimmed = renameName.trim();
    if (!trimmed || !selectedProject) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === selectedProject.id
          ? { ...p, name: trimmed, slug: toSlug(trimmed) }
          : p
      )
    );
    closeDialog();
  };

  const handleDelete = () => {
    if (!selectedProject) return;
    setProjects((prev) => prev.filter((p) => p.id !== selectedProject.id));
    closeDialog();
  };

  return {
    projects,
    dialog,
    selectedProject,
    createName,
    createSlug,
    renameName,
    isLoading,
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
