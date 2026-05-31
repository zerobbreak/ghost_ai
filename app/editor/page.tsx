import { getProjectsForCurrentUser } from "@/lib/projects";
import { EditorHomeClient } from "./editor-home-client";

export default async function EditorPage() {
  const { owned, shared } = await getProjectsForCurrentUser();

  return <EditorHomeClient ownedProjects={owned} sharedProjects={shared} />;
}
