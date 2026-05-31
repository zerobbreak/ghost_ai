import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/editor/access-denied";
import { getCurrentIdentity, getAccessibleProjectById } from "@/lib/project-access";
import { getProjectsForCurrentUser } from "@/lib/projects";
import { EditorWorkspaceClient } from "./editor-workspace-client";

interface EditorWorkspacePageProps {
  params: Promise<{ roomId: string }>;
}

export default async function EditorWorkspacePage({ params }: EditorWorkspacePageProps) {
  const identity = await getCurrentIdentity();

  if (!identity.userId) {
    redirect("/sign-in");
  }

  const { roomId } = await params;

  const [project, { owned, shared }] = await Promise.all([
    getAccessibleProjectById(roomId, identity),
    getProjectsForCurrentUser(),
  ]);

  if (!project) {
    return <AccessDenied />;
  }

  return (
    <EditorWorkspaceClient
      projectId={project.id}
      projectName={project.name}
      ownedProjects={owned}
      sharedProjects={shared}
    />
  );
}
