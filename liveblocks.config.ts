import type { LiveblocksFlow } from "@liveblocks/react-flow";
import type { CanvasNode, CanvasEdge } from "./types/canvas";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    // "flow" is the default storage key used by useLiveblocksFlow; it
    // initialises its own storage so the field is optional here.
    Storage: {
      flow?: LiveblocksFlow<CanvasNode, CanvasEdge>;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    RoomEvent: never;

    ThreadMetadata: Record<string, never>;

    RoomInfo: Record<string, never>;

    FeedMetadata: {
      title?: string;
    };

    FeedMessageData: {
      text: string;
      phase: "start" | "processing" | "complete" | "error";
    };
  }
}

export {};
