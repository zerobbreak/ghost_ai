const PATH_SAMPLE_STEP = 3;
const MIN_RUN_LENGTH = 20;
const AXIS_TOLERANCE = 2;

interface PathRun {
  axis: "horizontal" | "vertical";
  midpoint: { x: number; y: number };
  length: number;
}

function samplePathRuns(pathD: string): PathRun[] {
  const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathEl.setAttribute("d", pathD);
  const total = pathEl.getTotalLength();
  if (total === 0) return [];

  const runs: PathRun[] = [];
  let current: {
    axis: "horizontal" | "vertical";
    fixedValue: number;
    startDist: number;
    endDist: number;
  } | null = null;

  const flush = () => {
    if (!current) return;
    const length = current.endDist - current.startDist;
    if (length >= MIN_RUN_LENGTH) {
      const midpoint = pathEl.getPointAtLength(current.startDist + length / 2);
      runs.push({
        axis: current.axis,
        midpoint: { x: midpoint.x, y: midpoint.y },
        length,
      });
    }
    current = null;
  };

  for (let dist = 0; dist <= total; dist += PATH_SAMPLE_STEP) {
    const point = pathEl.getPointAtLength(dist);
    const prev = pathEl.getPointAtLength(Math.max(0, dist - PATH_SAMPLE_STEP));

    const dx = Math.abs(point.x - prev.x);
    const dy = Math.abs(point.y - prev.y);
    const axis: "horizontal" | "vertical" | null =
      dx > dy && dx > 1
        ? "horizontal"
        : dy > dx && dy > 1
          ? "vertical"
          : null;

    if (!axis) continue;

    const fixedValue =
      axis === "horizontal" ? Math.round(point.y) : Math.round(point.x);
    const tolerance = axis === "horizontal" ? AXIS_TOLERANCE : AXIS_TOLERANCE;

    if (
      current &&
      current.axis === axis &&
      Math.abs(fixedValue - current.fixedValue) <= tolerance
    ) {
      current.endDist = dist;
    } else {
      flush();
      current = {
        axis,
        fixedValue,
        startDist: Math.max(0, dist - PATH_SAMPLE_STEP),
        endDist: dist,
      };
    }
  }

  flush();
  return runs;
}

/**
 * Places edge labels on the edge path instead of the straight-line midpoint
 * between handles. Prefers the last horizontal segment (common in architecture
 * diagrams) so fan-out edges don't stack on a shared trunk.
 */
export function resolveEdgeLabelPosition(
  pathD: string,
  pathLabelX: number,
  pathLabelY: number,
): { x: number; y: number } {
  if (typeof document === "undefined") {
    return { x: pathLabelX, y: pathLabelY };
  }

  const runs = samplePathRuns(pathD);
  const horizontals = runs.filter((run) => run.axis === "horizontal");
  const verticals = runs.filter((run) => run.axis === "vertical");

  if (horizontals.length > 0) {
    const lastHorizontal = horizontals[horizontals.length - 1];
    const lastVertical = verticals[verticals.length - 1];

    // Fan-out edges often share one long horizontal trunk; prefer the branch.
    if (
      lastVertical &&
      horizontals.length === 1 &&
      lastHorizontal.length > 100 &&
      lastVertical.length >= MIN_RUN_LENGTH
    ) {
      return lastVertical.midpoint;
    }

    return lastHorizontal.midpoint;
  }

  if (verticals.length > 0) {
    return verticals[verticals.length - 1].midpoint;
  }

  return { x: pathLabelX, y: pathLabelY };
}
