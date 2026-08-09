"use client";

import { useCallback, useEffect, useState } from "react";
import { toUserFriendlyError } from "@/lib/user-friendly-error";
import {
  specDownloadUrl,
  type ProjectSpecSummary,
} from "@/lib/project-specs";

export interface UseProjectSpecsResult {
  specs: ProjectSpecSummary[];
  isLoading: boolean;
  loadError: string | null;
  refreshSpecs: () => Promise<void>;
  fetchSpecContent: (specId: string) => Promise<string>;
  downloadSpec: (spec: ProjectSpecSummary) => void;
}

export function useProjectSpecs(
  projectId: string,
  enabled: boolean,
): UseProjectSpecsResult {
  const [specs, setSpecs] = useState<ProjectSpecSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshSpecs = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/specs`);
      const body = (await res.json().catch(() => ({}))) as {
        specs?: ProjectSpecSummary[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to load specs");
      }

      setSpecs(body.specs ?? []);
    } catch (error) {
      setLoadError(toUserFriendlyError(error));
      setSpecs([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!enabled) return;
    void refreshSpecs();
  }, [enabled, refreshSpecs]);

  const fetchSpecContent = useCallback(
    async (specId: string) => {
      const res = await fetch(specDownloadUrl(projectId, specId));
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to load spec content");
      }
      return res.text();
    },
    [projectId],
  );

  const downloadSpec = useCallback(
    (spec: ProjectSpecSummary) => {
      const anchor = document.createElement("a");
      anchor.href = specDownloadUrl(projectId, spec.id);
      anchor.download = spec.filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    },
    [projectId],
  );

  return {
    specs,
    isLoading,
    loadError,
    refreshSpecs,
    fetchSpecContent,
    downloadSpec,
  };
}
