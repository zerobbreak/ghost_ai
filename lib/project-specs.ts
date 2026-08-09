export interface ProjectSpecSummary {
  id: string;
  createdAt: string;
  filename: string;
}

export function specDownloadFilename(specId: string, createdAt: Date | string): string {
  const date =
    typeof createdAt === "string"
      ? createdAt.slice(0, 10)
      : createdAt.toISOString().slice(0, 10);
  return `spec-${date}-${specId.slice(0, 8)}.md`;
}

export function toProjectSpecSummary(spec: {
  id: string;
  createdAt: Date;
}): ProjectSpecSummary {
  return {
    id: spec.id,
    createdAt: spec.createdAt.toISOString(),
    filename: specDownloadFilename(spec.id, spec.createdAt),
  };
}

export function specDownloadUrl(projectId: string, specId: string): string {
  return `/api/projects/${projectId}/specs/${specId}/download`;
}
