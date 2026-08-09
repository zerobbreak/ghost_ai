"use client";

import { LiveblocksCanvas } from "./liveblocks-canvas";

interface CanvasWrapperProps {
  roomId: string;
  isTemplatesOpen?: boolean;
  onTemplatesOpenChange?: (open: boolean) => void;
  isMermaidOpen?: boolean;
  onMermaidOpenChange?: (open: boolean) => void;
}

export function CanvasWrapper({
  roomId,
  isTemplatesOpen,
  onTemplatesOpenChange,
  isMermaidOpen,
  onMermaidOpenChange,
}: CanvasWrapperProps) {
  return (
    <LiveblocksCanvas
      projectId={roomId}
      isTemplatesOpen={isTemplatesOpen}
      onTemplatesOpenChange={onTemplatesOpenChange}
      isMermaidOpen={isMermaidOpen}
      onMermaidOpenChange={onMermaidOpenChange}
    />
  );
}
