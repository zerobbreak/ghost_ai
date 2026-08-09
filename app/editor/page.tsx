import { getCurrentIdentity } from "@/lib/project-access";
import { getProjectsForIdentity } from "@/lib/projects";
import { EditorHomeClient } from "./editor-home-client";

export default async function EditorPage() {
  const identity = await getCurrentIdentity();
  const { owned, shared } = await getProjectsForIdentity(identity);

  return <EditorHomeClient ownedProjects={owned} sharedProjects={shared} />;
}
