"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toUserFriendlyError } from "@/lib/user-friendly-error";
import type { ProjectSpecSummary } from "@/lib/project-specs";

interface SpecPreviewDialogProps {
  spec: ProjectSpecSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchContent: (specId: string) => Promise<string>;
  onDownload: (spec: ProjectSpecSummary) => void;
}

function formatSpecDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function SpecPreviewDialog({
  spec,
  open,
  onOpenChange,
  fetchContent,
  onDownload,
}: SpecPreviewDialogProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !spec) {
      setContent(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const specId = spec.id;

    async function load() {
      setIsLoading(true);
      setError(null);
      setContent(null);

      try {
        const markdown = await fetchContent(specId);
        if (!cancelled) {
          setContent(markdown);
        }
      } catch (err) {
        if (!cancelled) {
          setError(toUserFriendlyError(err));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, spec, fetchContent]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-4 py-3 pr-12">
          <DialogTitle className="truncate text-sm font-semibold">
            {spec?.filename ?? "Spec preview"}
          </DialogTitle>
          {spec ? (
            <DialogDescription className="font-mono text-[10px] uppercase tracking-wider">
              {formatSpecDate(spec.createdAt)}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-copy-muted">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Loading spec…</span>
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="py-8 text-center text-sm text-destructive">
                {error}
              </p>
            ) : null}

            {content && !isLoading ? (
              <article className="spec-markdown text-sm leading-relaxed text-copy-secondary [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-copy-primary [&_h1:first-child]:mt-0 [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-copy-primary [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-copy-primary [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-surface-border [&_pre]:bg-bg-elevated [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:text-copy-primary [&_strong]:font-semibold [&_strong]:text-copy-primary [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_code]:rounded [&_code]:bg-bg-elevated [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-copy-primary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </article>
            ) : null}
          </div>
        </ScrollArea>

        {spec ? (
          <DialogFooter className="border-t border-border px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDownload(spec)}
            >
              <Download data-icon="inline-start" />
              Download
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
