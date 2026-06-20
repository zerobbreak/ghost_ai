"use client";

import { LiveblocksCanvas } from "./liveblocks-canvas";

interface CanvasWrapperProps {
  roomId: string;
  isTemplatesOpen?: boolean;
  onTemplatesOpenChange?: (open: boolean) => void;
}

export function CanvasWrapper({
  roomId,
  isTemplatesOpen,
  onTemplatesOpenChange,
}: CanvasWrapperProps) {
  return (
    <LiveblocksCanvas
      projectId={roomId}
      isTemplatesOpen={isTemplatesOpen}
      onTemplatesOpenChange={onTemplatesOpenChange}
    />
  );
}
