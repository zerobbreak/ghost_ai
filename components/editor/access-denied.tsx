import Link from "next/link";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-bg-base) px-4">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-(--color-border-default) bg-(--color-bg-surface) p-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-bg-elevated)">
          <Lock className="h-6 w-6 text-(--color-text-muted)" />
        </div>
        <h1 className="text-lg font-semibold text-(--color-text-primary)">Access denied</h1>
        <p className="mt-2 text-sm text-(--color-text-muted)">
          You don&apos;t have permission to view this project.
        </p>
        <Link href="/editor" className={buttonVariants({ className: "mt-6" })}>
          Back to projects
        </Link>
      </div>
    </div>
  );
}
