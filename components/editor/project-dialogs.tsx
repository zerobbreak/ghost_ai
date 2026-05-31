"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UseProjectActionsReturn } from "@/hooks/use-project-actions";

type Props = Pick<
  UseProjectActionsReturn,
  | "dialog"
  | "selectedProject"
  | "createName"
  | "createRoomId"
  | "renameName"
  | "isLoading"
  | "closeDialog"
  | "setCreateName"
  | "setRenameName"
  | "handleCreate"
  | "handleRename"
  | "handleDelete"
>;

export function ProjectDialogs({
  dialog,
  selectedProject,
  createName,
  createRoomId,
  renameName,
  isLoading,
  closeDialog,
  setCreateName,
  setRenameName,
  handleCreate,
  handleRename,
  handleDelete,
}: Props) {
  const renameInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Create Project */}
      <Dialog
        open={dialog === "create"}
        onOpenChange={(open: boolean) => !open && closeDialog()}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Give your project a name to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="create-name">
                Project name
              </label>
              <Input
                id="create-name"
                placeholder="My Architecture"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>

            {createRoomId && (
              <p className="text-xs text-muted-foreground">
                Room ID:{" "}
                <span className="font-mono text-foreground/70">{createRoomId}</span>
              </p>
            )}
          </div>

          <DialogFooter showCloseButton>
            <Button
              onClick={handleCreate}
              disabled={!createName.trim() || isLoading}
            >
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Project */}
      <Dialog
        open={dialog === "rename"}
        onOpenChange={(open: boolean) => !open && closeDialog()}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            {selectedProject && (
              <DialogDescription>
                Renaming &ldquo;{selectedProject.name}&rdquo;
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="rename-name">
              New name
            </label>
            <Input
              id="rename-name"
              ref={renameInputRef}
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
          </div>

          <DialogFooter showCloseButton>
            <Button
              onClick={handleRename}
              disabled={!renameName.trim() || isLoading}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project */}
      <Dialog
        open={dialog === "delete"}
        onOpenChange={(open: boolean) => !open && closeDialog()}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            {selectedProject && (
              <DialogDescription>
                Are you sure you want to delete &ldquo;{selectedProject.name}&rdquo;?
                This action cannot be undone.
              </DialogDescription>
            )}
          </DialogHeader>

          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
