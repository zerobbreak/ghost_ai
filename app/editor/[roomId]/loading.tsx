export default function EditorWorkspaceLoading() {
  return (
    <div className="relative h-screen overflow-hidden bg-(--color-bg-base)">
      {/* Navbar shell */}
      <header className="fixed top-0 left-0 right-0 z-[60] flex h-12 items-center border-b border-(--color-border-default) bg-(--color-bg-surface) px-3">
        <div className="h-7 w-7 rounded-md bg-(--color-bg-elevated)" />
        <div className="flex flex-1 justify-center">
          <div className="h-4 w-40 animate-pulse rounded-md bg-(--color-bg-elevated)" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-8 w-16 animate-pulse rounded-lg bg-(--color-bg-elevated)" />
          <div className="h-8 w-8 animate-pulse rounded-lg bg-(--color-bg-elevated)" />
          <div className="h-7 w-7 animate-pulse rounded-full bg-(--color-bg-elevated)" />
        </div>
      </header>

      {/* Canvas area */}
      <div className="absolute inset-0 top-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-2 w-32 animate-pulse rounded-full bg-(--color-bg-elevated)" />
          <div className="h-2 w-48 animate-pulse rounded-full bg-(--color-bg-elevated)" />
        </div>
      </div>
    </div>
  );
}
