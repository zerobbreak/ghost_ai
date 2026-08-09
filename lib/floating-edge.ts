import { Position } from "@xyflow/react";
import type { InternalNode, Node } from "@xyflow/react";

const ROW_ALIGN_THRESHOLD = 40;

export interface FloatingEdgeParams {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePosition: Position;
  targetPosition: Position;
}

function rect(node: InternalNode<Node>) {
  const { x, y } = node.internals.positionAbsolute;
  const width = node.measured?.width;
  const height = node.measured?.height;
  if (!width || !height) return null;
  return { x, y, width, height, cx: x + width / 2, cy: y + height / 2 };
}

/**
 * Picks the connection point + cardinal side on each node's boundary that
 * best matches the other node's relative position, instead of relying on a
 * fixed handle id (this app's nodes expose 4 same-typed connection ports,
 * which React Flow can't disambiguate on its own when no handle is chosen).
 * Orthogonal (step) edges read best when they leave/enter perpendicular to
 * the node boundary, so this picks a cardinal side rather than an angle.
 */
export function getFloatingEdgeParams(
  sourceNode: InternalNode<Node>,
  targetNode: InternalNode<Node>,
): FloatingEdgeParams | null {
  const source = rect(sourceNode);
  const target = rect(targetNode);
  if (!source || !target) return null;

  const dx = target.cx - source.cx;
  const dy = target.cy - source.cy;

  // Architecture/flow diagrams are organized in rows (rank = depth), so any
  // meaningful vertical gap means "this edge flows to the next row" even
  // when a wide fan-out makes the horizontal offset larger in magnitude —
  // orthogonal step paths handle that by jogging sideways mid-route.
  // Only route sideways when the nodes are effectively in the same row.
  const sameRow = Math.abs(dy) < ROW_ALIGN_THRESHOLD;

  if (!sameRow) {
    const targetBelow = dy >= 0;
    return {
      sx: source.cx,
      sy: targetBelow ? source.y + source.height : source.y,
      tx: target.cx,
      ty: targetBelow ? target.y : target.y + target.height,
      sourcePosition: targetBelow ? Position.Bottom : Position.Top,
      targetPosition: targetBelow ? Position.Top : Position.Bottom,
    };
  }

  const targetRight = dx >= 0;
  return {
    sx: targetRight ? source.x + source.width : source.x,
    sy: source.cy,
    tx: targetRight ? target.x : target.x + target.width,
    ty: target.cy,
    sourcePosition: targetRight ? Position.Right : Position.Left,
    targetPosition: targetRight ? Position.Left : Position.Right,
  };
}
