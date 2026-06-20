"use client";

import { Component, type ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react";

interface EditorRoomProviderProps {
  roomId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class RoomErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-medium text-(--color-text-primary)">
              Unable to connect to workspace
            </p>
            <p className="mt-1 text-xs text-(--color-text-muted)">
              Check your connection and reload the page.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function EditorRoomProvider({
  roomId,
  children,
  fallback = (
    <div className="flex h-full w-full items-center justify-center">
      <p className="text-sm text-(--color-text-muted)">Loading workspace…</p>
    </div>
  ),
}: EditorRoomProviderProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth" throttle={16}>
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
      >
        <RoomErrorBoundary>
          <ClientSideSuspense fallback={fallback}>{children}</ClientSideSuspense>
        </RoomErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
