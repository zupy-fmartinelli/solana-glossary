import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { getIcebergLayers, type Category } from "@/data/glossaryAdapter";

interface Props {
  onLayerClick: (layerId: string) => void;
  onTermClick: (layerId: string, termId: string) => void;
  selectedCategories?: Set<Category>;
}

const fullLayers = getIcebergLayers();

// ─── Iceberg shape generation ───
// Strategy: generate one cohesive silhouette from a width profile,
// then slice it horizontally into 5 layer regions.
//
// The width profile is driven by term counts — layers with more terms
// push the silhouette wider at their depth. The left and right edges
// are generated independently for asymmetry, with deterministic
// "randomness" (seeded noise) for organic irregularity.

const CX = 580; // center axis — offset left for asymmetry
const TOTAL_H = 2750;
const TIP_Y = 10;
const N_SAMPLES = 60; // vertical resolution of the silhouette
const LAYER_COUNT = 5;

// Seeded pseudo-random for deterministic wobble
function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Generate smooth noise at a point using multiple octaves
function noise(y: number, seed: number): number {
  let val = 0;
  val += Math.sin(y * 0.008 + seed * 2.3) * 30;
  val += Math.sin(y * 0.015 + seed * 5.7) * 15;
  val += Math.sin(y * 0.035 + seed * 1.1) * 8;
  val += (seededRand(y * 0.1 + seed) - 0.5) * 12;
  return val;
}

interface IcebergProfile {
  /** Y coordinates for each sample point */
  ys: number[];
  /** Left edge x at each sample */
  lefts: number[];
  /** Right edge x at each sample */
  rights: number[];
  /** Y boundaries between layers (6 values: top of first to bottom of last) */
  layerYs: number[];
}

function generateProfile(termCounts: number[]): IcebergProfile {
  const total = termCounts.reduce((s, c) => s + c, 0) || 1;

  // Layer heights — proportional to term count, with minimum
  const minH = 280;
  const distributable = TOTAL_H - minH * LAYER_COUNT;
  const layerHeights = termCounts.map(
    (c) => minH + (c / total) * distributable,
  );

  // Cap surface layer so it always fits above the waterline
  const maxSurfaceH = 385;
  if (layerHeights[0] > maxSurfaceH) {
    const excess = layerHeights[0] - maxSurfaceH;
    layerHeights[0] = maxSurfaceH;
    const deepTotal = termCounts.slice(1).reduce((s, c) => s + c, 0) || 1;
    for (let j = 1; j < LAYER_COUNT; j++) {
      layerHeights[j] += excess * (termCounts[j] / deepTotal);
    }
  }

  // Layer Y boundaries
  const layerYs: number[] = [TIP_Y];
  for (const h of layerHeights) {
    layerYs.push(layerYs[layerYs.length - 1] + h);
  }

  // Build width profile: at each Y sample, compute base half-width
  // driven by the term density at that depth
  const ys: number[] = [];
  const baseWidths: number[] = [];

  for (let i = 0; i <= N_SAMPLES; i++) {
    const t = i / N_SAMPLES; // 0..1
    const y = TIP_Y + t * TOTAL_H;
    ys.push(y);

    // Which layer are we in?
    let layerIdx = 0;
    for (let li = 0; li < LAYER_COUNT; li++) {
      if (y >= layerYs[li] && y < layerYs[li + 1]) {
        layerIdx = li;
        break;
      }
      if (li === LAYER_COUNT - 1) layerIdx = li;
    }

    // Term density factor for this layer (1.0 = average)
    const density = termCounts[layerIdx] / (total / LAYER_COUNT);

    // Base envelope: sharp peak → wide mountainous surface → diamond body → tapered bottom
    // Envelope = total width in SVG units (viewBox 1200 wide)
    // Target: 45% at surface (~540), 75-80% at widest body (~960)
    let envelope: number;
    if (t < 0.01) {
      // Sharp peak point
      envelope = t * 5400;
    } else if (t < 0.05) {
      // Rapid expansion — mountain shoulders (cap at ~500 to meet surface)
      envelope = 54 + (t - 0.01) * 11150;
    } else if (t < 0.12) {
      // Surface layer — max 50% screen width (600 SVG units)
      const surfT = (t - 0.05) / 0.07;
      envelope = 500 + surfT * 100;
    } else if (t < 0.45) {
      // Upper body — expands from surface (600) to widest zone (940)
      const bodyT = (t - 0.12) / 0.33;
      envelope = 600 + bodyT * 340 + Math.sin(bodyT * Math.PI) * 40;
    } else if (t < 0.75) {
      // Lower body — gradual taper
      const taperT = (t - 0.45) / 0.3;
      envelope = 940 - taperT * 240;
    } else {
      // Bottom taper to point
      const endT = (t - 0.75) / 0.25;
      envelope = 700 - endT * endT * 680;
    }

    // Modulate by term density (subtle — ±20%)
    const densityMod = 0.8 + 0.2 * Math.min(density, 2.0);
    baseWidths.push(Math.max(5, envelope * densityMod));
  }

  // Generate asymmetric left and right edges with independent noise
  const lefts: number[] = [];
  const rights: number[] = [];
  const leftSeed = 3.7;
  const rightSeed = 7.3;
  // Right side is ~15% wider than left for asymmetry
  const leftBias = 0.42;
  const rightBias = 0.58;

  for (let i = 0; i <= N_SAMPLES; i++) {
    const y = ys[i];
    const w = baseWidths[i];

    // Dampen noise near the tip so the narrow peak stays clean
    const noiseFade = Math.min(1, w / 200);
    const leftW = w * leftBias + noise(y, leftSeed) * noiseFade;
    const rightW = w * rightBias + noise(y, rightSeed) * noiseFade;

    lefts.push(CX - Math.max(5, leftW));
    rights.push(CX + Math.max(5, rightW));
  }

  return { ys, lefts, rights, layerYs };
}

// Convert a slice of the profile into a smooth SVG path
function profileSliceToPath(
  profile: IcebergProfile,
  topY: number,
  bottomY: number,
  isFirst: boolean,
  isLast: boolean,
): string {
  const { ys, lefts, rights } = profile;

  // Find sample indices within this slice
  const indices: number[] = [];
  for (let i = 0; i < ys.length; i++) {
    if (ys[i] >= topY - 1 && ys[i] <= bottomY + 1) {
      indices.push(i);
    }
  }
  if (indices.length < 2) return "";

  // Interpolate edge positions at exact topY and bottomY
  function lerp(y: number, arr: number[]): number {
    for (let i = 0; i < ys.length - 1; i++) {
      if (y >= ys[i] && y <= ys[i + 1]) {
        const t = (y - ys[i]) / (ys[i + 1] - ys[i]);
        return arr[i] + t * (arr[i + 1] - arr[i]);
      }
    }
    return arr[arr.length - 1];
  }

  const topL = lerp(topY, lefts);
  const topR = lerp(topY, rights);
  const botL = lerp(bottomY, lefts);
  const botR = lerp(bottomY, rights);

  // Build right edge going down, then left edge going up
  const rightPoints: [number, number][] = [[topR, topY]];
  const leftPoints: [number, number][] = [[topL, topY]];

  for (const i of indices) {
    if (ys[i] > topY && ys[i] < bottomY) {
      rightPoints.push([rights[i], ys[i]]);
      leftPoints.push([lefts[i], ys[i]]);
    }
  }
  rightPoints.push([botR, bottomY]);
  leftPoints.push([botL, bottomY]);

  // Build path: top edge → right side down → bottom edge → left side up
  const parts: string[] = [];

  if (isFirst) {
    // Organic rounded mound — smooth bezier curves, slightly off-center peak
    const peakX = CX - 15; // slightly off-center
    const peakTopY = topY;
    const surfL = leftPoints[leftPoints.length - 1][0];
    const surfR = rightPoints[rightPoints.length - 1][0];
    const surfBottomY = rightPoints[rightPoints.length - 1][1];
    const h = surfBottomY - peakTopY; // total height of surface

    // Start at peak, smooth curve down-right with organic bumps
    parts.push(`M${peakX.toFixed(0)} ${peakTopY.toFixed(0)}`);

    // Right slope: smooth descent with subtle undulations
    // First segment — gentle shoulder with a soft bump
    parts.push(
      `C${(peakX + 60).toFixed(0)} ${(peakTopY + h * 0.05).toFixed(0)}, ` +
        `${(peakX + 100).toFixed(0)} ${(peakTopY + h * 0.12).toFixed(0)}, ` +
        `${(peakX + 130).toFixed(0)} ${(peakTopY + h * 0.18).toFixed(0)}`,
    );
    // Second segment — slight outward bump then steeper
    parts.push(
      `C${(peakX + 155).toFixed(0)} ${(peakTopY + h * 0.22).toFixed(0)}, ` +
        `${(peakX + 185).toFixed(0)} ${(peakTopY + h * 0.28).toFixed(0)}, ` +
        `${(peakX + 210).toFixed(0)} ${(peakTopY + h * 0.38).toFixed(0)}`,
    );
    // Third segment — curve into body edge
    parts.push(
      `C${(peakX + 230).toFixed(0)} ${(peakTopY + h * 0.48).toFixed(0)}, ` +
        `${(surfR - 20).toFixed(0)} ${(peakTopY + h * 0.7).toFixed(0)}, ` +
        `${surfR.toFixed(0)} ${surfBottomY.toFixed(0)}`,
    );
  } else {
    // Start at top-left, draw top edge to top-right
    parts.push(`M${topL.toFixed(0)} ${topY.toFixed(0)}`);
    parts.push(`L${topR.toFixed(0)} ${topY.toFixed(0)}`);
  }

  // Right edge going down (smooth curves through points)
  // For isFirst, the mountain ridge already traced right edge to the bottom
  if (!isFirst) {
    for (let j = 1; j < rightPoints.length; j++) {
      const prev = rightPoints[j - 1];
      const curr = rightPoints[j];
      const dy = curr[1] - prev[1];
      parts.push(
        `C${(prev[0] + 5).toFixed(0)} ${(prev[1] + dy * 0.4).toFixed(0)}, ${(curr[0] - 3).toFixed(0)} ${(curr[1] - dy * 0.3).toFixed(0)}, ${curr[0].toFixed(0)} ${curr[1].toFixed(0)}`,
      );
    }
  }

  if (isLast) {
    // Rounded bottom — curve to a point then back up
    const tipX = CX + 10 + noise(bottomY, 42) * 0.5;
    const tipY = bottomY + 15;
    parts.push(
      `Q${botR.toFixed(0)} ${(bottomY + 8).toFixed(0)}, ${tipX.toFixed(0)} ${tipY.toFixed(0)}`,
    );
    parts.push(
      `Q${botL.toFixed(0)} ${(bottomY + 8).toFixed(0)}, ${botL.toFixed(0)} ${bottomY.toFixed(0)}`,
    );
  } else {
    // Bottom edge: right to left
    parts.push(`L${botL.toFixed(0)} ${bottomY.toFixed(0)}`);
  }

  // Left edge going up (reverse order)
  // For isFirst, the closing ridge handles the left ascent
  if (!isFirst) {
    const leftReversed = [...leftPoints].reverse();
    for (let j = 1; j < leftReversed.length - 1; j++) {
      const prev = leftReversed[j - 1];
      const curr = leftReversed[j];
      const dy = prev[1] - curr[1];
      parts.push(
        `C${(prev[0] - 5).toFixed(0)} ${(prev[1] - dy * 0.4).toFixed(0)}, ${(curr[0] + 3).toFixed(0)} ${(curr[1] + dy * 0.3).toFixed(0)}, ${curr[0].toFixed(0)} ${curr[1].toFixed(0)}`,
      );
    }
  }

  if (isFirst) {
    // Close with smooth left slope back up to peak
    const peakX = CX - 15;
    const surfL = leftPoints[leftPoints.length - 1][0];
    const surfBottomY = leftPoints[leftPoints.length - 1][1];
    const h = surfBottomY - topY;

    // Left slope: mirror the organic mound (from body edge up to peak)
    // First segment — curve away from body
    parts.push(
      `C${(surfL + 20).toFixed(0)} ${(topY + h * 0.7).toFixed(0)}, ` +
        `${(peakX - 220).toFixed(0)} ${(topY + h * 0.48).toFixed(0)}, ` +
        `${(peakX - 200).toFixed(0)} ${(topY + h * 0.38).toFixed(0)}`,
    );
    // Second segment — subtle bump on left shoulder
    parts.push(
      `C${(peakX - 175).toFixed(0)} ${(topY + h * 0.28).toFixed(0)}, ` +
        `${(peakX - 145).toFixed(0)} ${(topY + h * 0.22).toFixed(0)}, ` +
        `${(peakX - 120).toFixed(0)} ${(topY + h * 0.18).toFixed(0)}`,
    );
    // Third segment — smooth ascent to peak
    parts.push(
      `C${(peakX - 90).toFixed(0)} ${(topY + h * 0.12).toFixed(0)}, ` +
        `${(peakX - 50).toFixed(0)} ${(topY + h * 0.05).toFixed(0)}, ` +
        `${peakX.toFixed(0)} ${topY.toFixed(0)}`,
    );
  }

  parts.push("Z");
  return parts.join(" ");
}

// ─── Rendering constants ───

const layerFills = [
  "rgba(200, 220, 240, 0.9)",
  "rgba(150, 180, 210, 0.75)",
  "rgba(100, 140, 180, 0.6)",
  "rgba(60, 100, 150, 0.45)",
  "rgba(30, 60, 110, 0.35)",
];

const layerFillsDimmed = [
  "rgba(200, 220, 240, 0.35)",
  "rgba(150, 180, 210, 0.28)",
  "rgba(100, 140, 180, 0.22)",
  "rgba(60, 100, 150, 0.16)",
  "rgba(30, 60, 110, 0.12)",
];

function generateTermPositions(
  bounds: { left: number; right: number; top: number; bottom: number },
  termCount: number,
) {
  const positions: {
    x: number;
    y: number;
    animDuration: number;
    animDelay: number;
  }[] = [];
  const inset = 50;
  const width = bounds.right - bounds.left - inset * 2;
  const height = bounds.bottom - bounds.top - inset * 2;
  if (width <= 0 || height <= 0) return positions;

  for (let i = 0; i < termCount; i++) {
    const cols = Math.ceil(Math.sqrt(termCount));
    const row = Math.floor(i / cols);
    const col = i % cols;
    const rows = Math.ceil(termCount / cols);

    const x =
      bounds.left +
      inset +
      (col + 0.5) * (width / cols) +
      Math.sin(i * 7.3) * width * 0.05;
    const y =
      bounds.top +
      inset +
      (row + 0.5) * (height / rows) +
      Math.cos(i * 5.1) * height * 0.04;

    positions.push({
      x: Math.max(bounds.left + inset, Math.min(bounds.right - inset, x)),
      y: Math.max(bounds.top + inset, Math.min(bounds.bottom - inset, y)),
      animDuration: 4 + (i % 3) * 1.5,
      animDelay: (i % 5) * 0.8,
    });
  }
  return positions;
}

const MAX_TERMS_PER_LAYER_CONST = 67;
const BALL_RADIUS = 30;
const RESTITUTION = 1.0;

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function getIcebergEdgesAtY(
  y: number,
  profile: IcebergProfile,
): { left: number; right: number } {
  const { ys, lefts, rights } = profile;
  for (let i = 0; i < ys.length - 1; i++) {
    if (y >= ys[i] && y <= ys[i + 1]) {
      const t = (y - ys[i]) / (ys[i + 1] - ys[i]);
      return {
        left: lefts[i] + t * (lefts[i + 1] - lefts[i]),
        right: rights[i] + t * (rights[i + 1] - rights[i]),
      };
    }
  }
  return {
    left: lefts[lefts.length - 1],
    right: rights[rights.length - 1],
  };
}

// ─── Component ───

const IcebergSVG = ({
  onLayerClick,
  onTermClick,
  selectedCategories,
}: Props) => {
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  const hasFilter = selectedCategories && selectedCategories.size > 0;

  // Random surface creature — picked once on mount
  const surfaceCreature = useMemo(() => Math.floor(Math.random() * 4), []); // 0=polar bear, 1=penguins, 2=seal, 3=alien

  // Term counts per layer (filtered or total)
  const termCounts = useMemo(() => {
    return fullLayers.map((layer) => {
      if (!hasFilter) return layer.terms.length;
      return layer.terms.filter(
        (t) => t.category && selectedCategories!.has(t.category),
      ).length;
    });
  }, [selectedCategories, hasFilter]);

  const totalCounts = useMemo(() => fullLayers.map((l) => l.terms.length), []);

  // Generate the unified iceberg profile from term counts
  const profile = useMemo(() => generateProfile(termCounts), [termCounts]);

  // Slice the profile into per-layer paths
  const layerPaths = useMemo(() => {
    return profile.layerYs.slice(0, -1).map((topY, i) => {
      const bottomY = profile.layerYs[i + 1];
      return profileSliceToPath(
        profile,
        topY,
        bottomY,
        i === 0,
        i === LAYER_COUNT - 1,
      );
    });
  }, [profile]);

  // Compute bounds and positions for labels and terms
  const { layerBounds, labelPositions, allTermPositions } = useMemo(() => {
    const bounds = profile.layerYs.slice(0, -1).map((topY, i) => {
      const bottomY = profile.layerYs[i + 1];
      // Find the average left/right within this layer's Y range
      let minL = Infinity,
        maxR = -Infinity;
      for (let si = 0; si < profile.ys.length; si++) {
        if (profile.ys[si] >= topY && profile.ys[si] <= bottomY) {
          minL = Math.min(minL, profile.lefts[si]);
          maxR = Math.max(maxR, profile.rights[si]);
        }
      }
      // Inset bounds a bit from the actual edges
      return {
        left: minL + 20,
        right: maxR - 20,
        top: topY + 10,
        bottom: bottomY - 10,
      };
    });

    const labels = bounds.map((b) => ({
      x: 600, // viewport center, not iceberg center
      y: b.top + (b.bottom - b.top) * 0.4,
    }));

    const MAX_TERMS_PER_LAYER = 67;
    const termPos = fullLayers.map((layer, i) =>
      generateTermPositions(
        bounds[i],
        Math.min(layer.terms.length, MAX_TERMS_PER_LAYER),
      ),
    );

    return {
      layerBounds: bounds,
      labelPositions: labels,
      allTermPositions: termPos,
    };
  }, [profile]);

  // Per-layer match info for dimming
  const layerMatchInfo = useMemo(() => {
    return fullLayers.map((layer, i) => {
      if (!hasFilter)
        return { total: totalCounts[i], matched: totalCounts[i], active: true };
      const matched = termCounts[i];
      return { total: totalCounts[i], matched, active: matched > 0 };
    });
  }, [termCounts, totalCounts, hasFilter]);

  // ─── Physics engine ───
  // Refs for direct DOM manipulation (bypass React render cycle)
  const termGroupRefs = useRef<(SVGGElement | null)[][]>([]);
  const ballStatesRef = useRef<BallState[][]>([]);
  const rafIdRef = useRef<number>(0);

  // Assign ref callback for each term <g> element
  const setTermRef = useCallback(
    (layerIdx: number, termIdx: number, el: SVGGElement | null) => {
      if (!termGroupRefs.current[layerIdx]) {
        termGroupRefs.current[layerIdx] = [];
      }
      termGroupRefs.current[layerIdx][termIdx] = el;
    },
    [],
  );

  // Initialize ball states from term positions
  useEffect(() => {
    const states: BallState[][] = [];
    for (let li = 0; li < fullLayers.length; li++) {
      const layerStates: BallState[] = [];
      const positions = allTermPositions[li];
      const termCount = Math.min(
        fullLayers[li].terms.length,
        MAX_TERMS_PER_LAYER_CONST,
      );
      for (let ti = 0; ti < termCount; ti++) {
        const pos = positions[ti];
        if (!pos) continue;
        // Random angle, magnitude 0.15–0.4 SVG units/frame
        const angle = seededRand(li * 1000 + ti * 7.3) * Math.PI * 2;
        const speed = 0.15 + seededRand(li * 500 + ti * 3.1) * 0.25;
        layerStates.push({
          x: pos.x,
          y: pos.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        });
      }
      states.push(layerStates);
    }
    ballStatesRef.current = states;
  }, [allTermPositions]);

  // Physics loop
  useEffect(() => {
    const step = () => {
      const states = ballStatesRef.current;
      const refs = termGroupRefs.current;

      for (let li = 0; li < states.length; li++) {
        const balls = states[li];
        const topY = profile.layerYs[li] + BALL_RADIUS;
        const bottomY = profile.layerYs[li + 1] - BALL_RADIUS;

        // Move and collide walls
        for (let bi = 0; bi < balls.length; bi++) {
          const b = balls[bi];
          b.x += b.vx;
          b.y += b.vy;

          // Top/bottom wall collision
          if (b.y < topY) {
            b.y = topY;
            b.vy = Math.abs(b.vy) * RESTITUTION;
          } else if (b.y > bottomY) {
            b.y = bottomY;
            b.vy = -Math.abs(b.vy) * RESTITUTION;
          }

          // Left/right iceberg wall collision
          const edges = getIcebergEdgesAtY(b.y, profile);
          const leftWall = edges.left + BALL_RADIUS;
          const rightWall = edges.right - BALL_RADIUS;

          if (b.x < leftWall) {
            b.x = leftWall;
            b.vx = Math.abs(b.vx) * RESTITUTION;
          } else if (b.x > rightWall) {
            b.x = rightWall;
            b.vx = -Math.abs(b.vx) * RESTITUTION;
          }
        }

        // Ball-ball elastic collision within each layer
        for (let a = 0; a < balls.length; a++) {
          for (let b = a + 1; b < balls.length; b++) {
            const ba = balls[a];
            const bb = balls[b];
            const dx = bb.x - ba.x;
            const dy = bb.y - ba.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = BALL_RADIUS * 2;

            if (dist < minDist && dist > 0.01) {
              // Normalize collision axis
              const nx = dx / dist;
              const ny = dy / dist;

              // Relative velocity along collision normal
              const dvx = ba.vx - bb.vx;
              const dvy = ba.vy - bb.vy;
              const dvn = dvx * nx + dvy * ny;

              // Only collide if approaching
              if (dvn > 0) {
                ba.vx -= dvn * nx;
                ba.vy -= dvn * ny;
                bb.vx += dvn * nx;
                bb.vy += dvn * ny;
              }

              // Push apart to prevent overlap
              const overlap = (minDist - dist) / 2;
              ba.x -= nx * overlap;
              ba.y -= ny * overlap;
              bb.x += nx * overlap;
              bb.y += ny * overlap;
            }
          }
        }

        // Write transforms directly to DOM
        const layerRefs = refs[li];
        if (!layerRefs) continue;
        for (let bi = 0; bi < balls.length; bi++) {
          const el = layerRefs[bi];
          if (el) {
            el.setAttribute(
              "transform",
              `translate(${balls[bi].x}, ${balls[bi].y})`,
            );
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [profile]);

  return (
    <svg
      viewBox="0 0 1200 2800"
      className="w-full h-auto"
      style={{
        maxWidth: "3200px",
        filter: "drop-shadow(0 0 30px rgba(20, 241, 149, 0.1))",
      }}
    >
      <defs>
        {fullLayers.map((layer, i) => (
          <clipPath key={`clip-${layer.id}`} id={`clip-layer-${i}`}>
            <path d={layerPaths[i]} />
          </clipPath>
        ))}
        <filter
          id="creature-shadow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="3"
            floodColor="rgba(153,69,255,0.25)"
          />
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="2"
            floodColor="rgba(20,241,149,0.15)"
          />
        </filter>
        <filter id="term-glow">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="4"
            floodColor="rgba(153,69,255,0.8)"
          />
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="6"
            floodColor="rgba(20,241,149,0.6)"
          />
        </filter>
      </defs>

      {fullLayers.map((layer, i) => {
        const isLayerHovered = hoveredLayer === i;
        const info = layerMatchInfo[i];
        const isDimmed = hasFilter && !info.active;
        const layerTerms = layer.terms.slice(0, MAX_TERMS_PER_LAYER_CONST);

        return (
          <g
            key={layer.id}
            style={{
              opacity: isDimmed ? 0.4 : 1,
              transition: "opacity 0.4s ease",
            }}
          >
            <g
              onClick={() => onLayerClick(layer.id)}
              className="cursor-pointer iceberg-layer-group"
              style={{
                filter: isLayerHovered
                  ? "brightness(1.12) drop-shadow(0 0 10px rgba(20, 241, 149, 0.15))"
                  : hasFilter && info.active
                    ? "drop-shadow(0 0 8px rgba(20, 241, 149, 0.15))"
                    : "brightness(1)",
                transition: "filter 0.3s",
              }}
              onMouseEnter={() => setHoveredLayer(i)}
              onMouseLeave={() => setHoveredLayer(null)}
            >
              <path
                d={layerPaths[i]}
                fill={isDimmed ? layerFillsDimmed[i] : layerFills[i]}
                style={{ transition: "fill 0.4s ease" }}
              />
            </g>

            <g clipPath={`url(#clip-layer-${i})`}>
              {layerTerms.map((term, ti) => {
                const termKey = `${layer.id}-${term.id}`;
                const isHovered = hoveredTerm === termKey;
                const shouldGlow = (ti * 7 + i * 13) % 6 === 0;

                return (
                  <g
                    key={termKey}
                    ref={(el) => setTermRef(i, ti, el)}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredTerm(termKey)}
                    onMouseLeave={() => setHoveredTerm(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTermClick(layer.id, term.id);
                    }}
                  >
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      fontSize="14"
                      fontFamily="Space Grotesk, sans-serif"
                      fontWeight="400"
                      fill={
                        isHovered
                          ? "rgba(20, 241, 149, 1)"
                          : isLayerHovered
                            ? "rgba(20, 241, 149, 0.85)"
                            : layerFills[i]
                      }
                      opacity={isHovered ? 1 : isLayerHovered ? 0.85 : 0.7}
                      className="iceberg-term-text"
                      filter={
                        shouldGlow && !isHovered ? "url(#term-glow)" : undefined
                      }
                      style={{
                        transition: "fill 0.3s, opacity 0.3s",
                        filter: isHovered
                          ? "drop-shadow(0 0 6px rgba(20, 241, 149, 0.6))"
                          : undefined,
                      }}
                    >
                      {term.name}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Layer title — rendered after terms so it's always on top */}
            <g
              onClick={() => onLayerClick(layer.id)}
              className="cursor-pointer"
              style={{ pointerEvents: "none" }}
            >
              <text
                x={labelPositions[i].x}
                y={labelPositions[i].y}
                textAnchor="middle"
                fill="white"
                fontSize="30"
                fontWeight="600"
                fontFamily="Space Grotesk, sans-serif"
                letterSpacing="8"
                style={{
                  pointerEvents: "auto",
                  filter:
                    "drop-shadow(0 2px 8px rgba(0,0,0,0.7)) drop-shadow(0 0 12px rgba(0,0,0,0.4))",
                }}
              >
                {layer.name}
              </text>
              <text
                x={labelPositions[i].x}
                y={labelPositions[i].y + 28}
                textAnchor="middle"
                fill={
                  hasFilter && info.active
                    ? "rgba(20, 241, 149, 0.85)"
                    : "rgba(20, 241, 149, 0.6)"
                }
                fontSize="14"
                fontWeight="400"
                fontFamily="Space Grotesk, sans-serif"
                letterSpacing="2"
                style={{
                  pointerEvents: "auto",
                  filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.6))",
                }}
              >
                {hasFilter
                  ? `${info.matched} / ${info.total} terms`
                  : `${info.total} terms`}
              </text>
            </g>
          </g>
        );
      })}
      {/* ─── Surface creature (random per page load) ─── */}
      {(() => {
        // Position on the right slope of the surface mound
        const peakX = CX - 15;
        const peakY = profile.layerYs[0];
        const surfBottom = profile.layerYs[1];
        const h = surfBottom - peakY;

        // Creature sits on the right shoulder, ~30% down the slope
        const cx = peakX + 100;
        const cy = peakY + h * 0.22;
        // Slope angle for tilting creatures to match surface
        const slopeAngle = 12;

        if (surfaceCreature === 0) {
          // ── Sleeping Polar Bear ──
          return (
            <g
              transform={`translate(${cx}, ${cy}) rotate(${slopeAngle})`}
              opacity="0.9"
              filter="url(#creature-shadow)"
            >
              {/* Body — white with faint purple tint */}
              <ellipse
                cx="0"
                cy="0"
                rx="22"
                ry="12"
                fill="#EDE8F4"
                stroke="#C8C0D8"
                strokeWidth="0.5"
              />
              {/* Head */}
              <circle
                cx="-20"
                cy="-4"
                r="9"
                fill="#EDE8F4"
                stroke="#C8C0D8"
                strokeWidth="0.5"
              />
              {/* Ears */}
              <circle
                cx="-26"
                cy="-10"
                r="3.5"
                fill="#DDD6E8"
                stroke="#C8C0D8"
                strokeWidth="0.4"
              />
              <circle
                cx="-15"
                cy="-11"
                r="3.5"
                fill="#DDD6E8"
                stroke="#C8C0D8"
                strokeWidth="0.4"
              />
              {/* Snout */}
              <ellipse cx="-27" cy="-2" rx="4" ry="3" fill="#DDD6E8" />
              <circle cx="-29" cy="-3" r="1.5" fill="#1a1a1a" /> {/* Nose */}
              {/* Closed eyes — sleeping */}
              <path
                d="M-23,-6 Q-21,-8 -19,-6"
                fill="none"
                stroke="#333"
                strokeWidth="0.8"
              />
              {/* Front paws tucked — faint green tint */}
              <ellipse cx="-14" cy="8" rx="5" ry="3" fill="#D8EDE4" />
              <ellipse cx="-6" cy="10" rx="4" ry="2.5" fill="#D8EDE4" />
              {/* Back paws */}
              <ellipse cx="18" cy="8" rx="5" ry="3" fill="#D8EDE4" />
              {/* Tail */}
              <circle cx="22" cy="-2" r="3" fill="#EDE8F4" />
              {/* Zzz */}
              <g opacity="0.5">
                <text
                  x="-10"
                  y="-18"
                  fontSize="7"
                  fill="#fff"
                  fontFamily="monospace"
                >
                  z
                </text>
                <text
                  x="-4"
                  y="-24"
                  fontSize="9"
                  fill="#fff"
                  fontFamily="monospace"
                >
                  z
                </text>
                <text
                  x="4"
                  y="-30"
                  fontSize="11"
                  fill="#fff"
                  fontFamily="monospace"
                >
                  z
                </text>
                <animate
                  attributeName="opacity"
                  values="0.5;0.1;0.5"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </g>
              {/* Gentle breathing animation */}
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1,1; 1,1.02; 1,1"
                dur="4s"
                repeatCount="indefinite"
                additive="sum"
              />
            </g>
          );
        }

        if (surfaceCreature === 1) {
          // ── Band of Penguins diving down the slope ──
          const penguins = [
            { x: 0, y: 0, delay: 0 },
            { x: 25, y: 12, delay: 0.4 },
            { x: 50, y: 26, delay: 0.8 },
            { x: 72, y: 42, delay: 1.2 },
            { x: 90, y: 60, delay: 1.6 },
          ];
          return (
            <g
              transform={`translate(${cx - 20}, ${cy - 10})`}
              filter="url(#creature-shadow)"
            >
              {penguins.map((p, i) => (
                <g
                  key={`penguin-${i}`}
                  transform={`translate(${p.x}, ${p.y}) rotate(${slopeAngle + 5})`}
                >
                  {/* Sliding animation — wobbles side to side */}
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`${p.x},${p.y}; ${p.x + 3},${p.y - 2}; ${p.x},${p.y}`}
                    dur={`${1.5 + i * 0.2}s`}
                    begin={`${p.delay}s`}
                    repeatCount="indefinite"
                  />
                  {/* Body — black */}
                  <ellipse
                    cx="0"
                    cy="0"
                    rx="5"
                    ry="7"
                    fill="#1E1635"
                    stroke="#151030"
                    strokeWidth="0.3"
                  />
                  {/* Belly — faint green tint */}
                  <ellipse cx="0" cy="1" rx="3.5" ry="5" fill="#E8F5EE" />
                  {/* Head */}
                  <circle cx="0" cy="-7" r="4" fill="#1E1635" />
                  {/* Eyes */}
                  <circle cx="-1.5" cy="-8" r="1" fill="#fff" />
                  <circle cx="1.5" cy="-8" r="1" fill="#fff" />
                  <circle cx="-1.5" cy="-8" r="0.5" fill="#111" />
                  <circle cx="1.5" cy="-8" r="0.5" fill="#111" />
                  {/* Beak */}
                  <polygon points="-1,-6 1,-6 0,-4" fill="#FF8C00" />
                  {/* Flippers */}
                  <ellipse
                    cx="-5"
                    cy="-1"
                    rx="2"
                    ry="4"
                    fill="#1E1635"
                    transform="rotate(15,-5,-1)"
                  />
                  <ellipse
                    cx="5"
                    cy="-1"
                    rx="2"
                    ry="4"
                    fill="#1E1635"
                    transform="rotate(-15,5,-1)"
                  />
                  {/* Feet */}
                  <ellipse cx="-2" cy="7" rx="2.5" ry="1" fill="#FF8C00" />
                  <ellipse cx="2" cy="7" rx="2.5" ry="1" fill="#FF8C00" />
                </g>
              ))}
            </g>
          );
        }

        if (surfaceCreature === 2) {
          // ── Seal sliding down then hopping back up ──
          return (
            <g
              transform={`translate(${cx}, ${cy}) rotate(${slopeAngle})`}
              filter="url(#creature-shadow)"
            >
              {/* Slide down and hop up animation */}
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`${cx},${cy}; ${cx + 60},${cy + 30}; ${cx + 70},${cy + 20}; ${cx + 50},${cy + 15}; ${cx + 30},${cy + 5}; ${cx},${cy}`}
                dur="8s"
                repeatCount="indefinite"
              />
              {/* Body — purple-tinged grey */}
              <ellipse
                cx="0"
                cy="0"
                rx="20"
                ry="8"
                fill="#7E7D9A"
                stroke="#5E5C78"
                strokeWidth="0.5"
              />
              {/* Head */}
              <ellipse
                cx="-18"
                cy="-3"
                rx="8"
                ry="6"
                fill="#8D8DAB"
                stroke="#5E5C78"
                strokeWidth="0.4"
              />
              {/* Snout */}
              <ellipse cx="-24" cy="-1" rx="4" ry="3" fill="#9E9DBB" />
              <circle cx="-26" cy="-2" r="1.5" fill="#222" /> {/* Nose */}
              {/* Eyes — big and round */}
              <circle cx="-20" cy="-5" r="2.5" fill="#111" />
              <circle cx="-19.5" cy="-5.5" r="1" fill="#fff" />
              {/* Whiskers */}
              <line
                x1="-26"
                y1="0"
                x2="-33"
                y2="-2"
                stroke="#5E5C78"
                strokeWidth="0.3"
              />
              <line
                x1="-26"
                y1="1"
                x2="-33"
                y2="1"
                stroke="#5E5C78"
                strokeWidth="0.3"
              />
              <line
                x1="-26"
                y1="2"
                x2="-33"
                y2="4"
                stroke="#5E5C78"
                strokeWidth="0.3"
              />
              {/* Front flippers */}
              <ellipse
                cx="-10"
                cy="6"
                rx="6"
                ry="2"
                fill="#6D6D8A"
                transform="rotate(-10,-10,6)"
              />
              {/* Tail flipper */}
              <ellipse
                cx="20"
                cy="2"
                rx="7"
                ry="3"
                fill="#6D6D8A"
                transform="rotate(15,20,2)"
              />
              {/* Belly shine */}
              <ellipse
                cx="-5"
                cy="3"
                rx="10"
                ry="3"
                fill="rgba(255,255,255,0.15)"
              />
              {/* Happy expression — slight smile */}
              <path
                d="M-25,1 Q-23,3 -21,1"
                fill="none"
                stroke="#444"
                strokeWidth="0.5"
              />
            </g>
          );
        }

        // surfaceCreature === 3
        // ── Solana Alien chilling and smoking ──
        return (
          <g
            transform={`translate(${cx + 10}, ${cy - 5})`}
            opacity="0.9"
            filter="url(#creature-shadow)"
          >
            {/* Sitting pose — leaning back */}
            {/* Legs — crossed, dangling */}
            <line
              x1="-5"
              y1="10"
              x2="-12"
              y2="20"
              stroke="#9945FF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="5"
              y1="10"
              x2="-2"
              y2="22"
              stroke="#9945FF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Feet — green */}
            <ellipse cx="-12" cy="21" rx="4" ry="1.5" fill="#14F195" />
            <ellipse cx="-2" cy="23" rx="4" ry="1.5" fill="#14F195" />

            {/* Body — purple */}
            <ellipse
              cx="0"
              cy="2"
              rx="8"
              ry="10"
              fill="#9945FF"
              stroke="#7B3FE4"
              strokeWidth="0.5"
            />
            {/* Belly marking — green */}
            <ellipse cx="0" cy="4" rx="5" ry="6" fill="#7B3FE4" opacity="0.5" />

            {/* Arms */}
            <line
              x1="-8"
              y1="0"
              x2="-15"
              y2="-5"
              stroke="#9945FF"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="8"
              y1="-2"
              x2="16"
              y2="-8"
              stroke="#9945FF"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Left hand — resting on knee */}
            <circle cx="-15" cy="-5" r="2" fill="#14F195" />
            {/* Right hand — holding cigar */}
            <circle cx="16" cy="-8" r="2" fill="#14F195" />

            {/* Cigar */}
            <rect
              x="17"
              y="-9.5"
              width="12"
              height="2.5"
              rx="1"
              fill="#8B6914"
              stroke="#6B4F0A"
              strokeWidth="0.3"
            />
            {/* Cigar tip — glowing */}
            <circle cx="29" cy="-8.2" r="1.8" fill="#FF4500" opacity="0.8">
              <animate
                attributeName="opacity"
                values="0.8;1;0.5;0.8"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Smoke wisps */}
            <g opacity="0.3">
              <path
                d="M29,-10 Q31,-14 28,-18 Q30,-22 27,-26"
                fill="none"
                stroke="#aaa"
                strokeWidth="0.8"
              >
                <animate
                  attributeName="opacity"
                  values="0.3;0.1;0.3"
                  dur="4s"
                  repeatCount="indefinite"
                />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 2,-3; -1,-6"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </path>
              <path
                d="M30,-11 Q33,-16 30,-20 Q33,-25 29,-29"
                fill="none"
                stroke="#999"
                strokeWidth="0.6"
              >
                <animate
                  attributeName="opacity"
                  values="0.2;0.05;0.2"
                  dur="5s"
                  begin="1s"
                  repeatCount="indefinite"
                />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 3,-4; 1,-8"
                  dur="5s"
                  begin="1s"
                  repeatCount="indefinite"
                />
              </path>
            </g>

            {/* Head — big green */}
            <ellipse
              cx="0"
              cy="-12"
              rx="10"
              ry="9"
              fill="#14F195"
              stroke="#0CB873"
              strokeWidth="0.5"
            />
            {/* Big almond eyes — dark */}
            <ellipse
              cx="-4"
              cy="-13"
              rx="4"
              ry="3"
              fill="#0D0D1A"
              transform="rotate(-10,-4,-13)"
            />
            <ellipse
              cx="5"
              cy="-13"
              rx="4"
              ry="3"
              fill="#0D0D1A"
              transform="rotate(10,5,-13)"
            />
            {/* Eye shine */}
            <circle cx="-3" cy="-14" r="1.2" fill="rgba(153,69,255,0.4)" />
            <circle cx="6" cy="-14" r="1.2" fill="rgba(153,69,255,0.4)" />
            {/* Tiny mouth — smirk */}
            <path
              d="M-2,-7 Q0,-5 3,-7"
              fill="none"
              stroke="#0D0D1A"
              strokeWidth="0.6"
            />
            {/* Antennae */}
            <line
              x1="-3"
              y1="-20"
              x2="-5"
              y2="-28"
              stroke="#14F195"
              strokeWidth="1"
            />
            <circle cx="-5" cy="-29" r="2" fill="#9945FF">
              <animate
                attributeName="opacity"
                values="1;0.4;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <line
              x1="3"
              y1="-20"
              x2="5"
              y2="-27"
              stroke="#14F195"
              strokeWidth="1"
            />
            <circle cx="5" cy="-28" r="2" fill="#9945FF">
              <animate
                attributeName="opacity"
                values="1;0.4;1"
                dur="2s"
                begin="0.5s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Solana logo on belly — tiny */}
            <g transform="translate(-2, 2) scale(0.15)">
              <path
                d="M-20,-10 L20,-10 L15,0 L-25,0 Z"
                fill="#14F195"
                opacity="0.6"
              />
              <path
                d="M-25,3 L15,3 L20,13 L-20,13 Z"
                fill="#14F195"
                opacity="0.6"
              />
            </g>

            {/* Idle bob animation */}
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`${cx + 10},${cy - 5}; ${cx + 10},${cy - 8}; ${cx + 10},${cy - 5}`}
              dur="5s"
              repeatCount="indefinite"
            />
          </g>
        );
      })()}

      {/* Diver glow filters */}
      <defs>
        <filter id="helmet-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor="#14F195"
            floodOpacity="0.7"
          />
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="6"
            floodColor="#14F195"
            floodOpacity="0.3"
          />
        </filter>
        <filter id="lantern-beam" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter
          id="lantern-glow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="2"
            floodColor="#14F195"
            floodOpacity="0.8"
          />
        </filter>
      </defs>

      {/* Tiny deep-sea diver orbiting the bottom of the iceberg */}
      {(() => {
        const orbitCX = CX;
        const orbitCY = profile.layerYs[LAYER_COUNT] + 40;
        const orbitRX = 280;
        const orbitRY = 60;
        return (
          <g>
            {/* Orbit container — diver moves along wide elliptical path */}
            <g>
              {/* Opacity: occasionally dims and returns */}
              <animate
                attributeName="opacity"
                values="0.85;0.85;0.3;0.15;0.3;0.85;0.85;0.85;0.5;0.85"
                dur="25s"
                repeatCount="indefinite"
              />

              {/* Position at orbit center — wide left-to-right sweep */}
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`${orbitCX},${orbitCY}; ${orbitCX + orbitRX},${orbitCY - orbitRY * 0.5}; ${orbitCX + orbitRX * 0.3},${orbitCY + orbitRY}; ${orbitCX - orbitRX * 0.3},${orbitCY + orbitRY * 0.7}; ${orbitCX - orbitRX},${orbitCY - orbitRY * 0.4}; ${orbitCX - orbitRX * 0.5},${orbitCY + orbitRY * 0.3}; ${orbitCX},${orbitCY}`}
                dur="24s"
                repeatCount="indefinite"
              />

              {/* The diver group, centered at 0,0 for clean transforms */}
              <g>
                {/* Flip direction using scaleX only — no z-axis vanishing */}
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="0,0"
                  to="0,0"
                  dur="0.01s"
                  fill="freeze"
                  additive="sum"
                />
                <animateTransform
                  attributeName="transform"
                  type="scale"
                  values="1,1; 1,1; 1,1; -1,1; -1,1; -1,1; -1,1; 1,1; 1,1"
                  dur="24s"
                  repeatCount="indefinite"
                />

                {/* Bubble trail */}
                {[0, 1, 2].map((b) => (
                  <circle
                    key={`bubble-${b}`}
                    cx={-2 + b * 3}
                    cy={-22 + b * 2}
                    r={2 - b * 0.4}
                    fill="none"
                    stroke="rgba(20,241,149,0.3)"
                    strokeWidth="0.5"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values={`0,0; ${1 - b},${-12 - b * 5}; ${b - 1},${-25 - b * 3}`}
                      dur={`${2.8 + b * 0.4}s`}
                      begin={`${b * 0.6}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.5;0.2;0"
                      dur={`${2.8 + b * 0.4}s`}
                      begin={`${b * 0.6}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}

                {/* Lantern beam — cone of green-tinted light */}
                <polygon
                  points="10,-3 45,-15 50,10 10,0"
                  fill="rgba(20,241,149,0.06)"
                  filter="url(#lantern-beam)"
                >
                  <animate
                    attributeName="opacity"
                    values="0.8;1;0.6;1;0.8"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </polygon>
                {/* Inner brighter beam core */}
                <polygon
                  points="10,-2 25,-7 27,4 10,0"
                  fill="rgba(20,241,149,0.1)"
                >
                  <animate
                    attributeName="opacity"
                    values="0.9;0.5;0.9"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </polygon>

                {/* Diver body — Solana colors, full professional gear */}
                <g>
                  {/* Tank on back — purple */}
                  <rect
                    x="3"
                    y="-8"
                    width="4"
                    height="10"
                    rx="1.5"
                    fill="#7B3FE4"
                    stroke="#5B2DAA"
                    strokeWidth="0.5"
                  />
                  <rect
                    x="4"
                    y="-9"
                    width="2"
                    height="2"
                    rx="0.5"
                    fill="#9945FF"
                  />

                  {/* Helmet — green glow */}
                  <circle
                    cx="0"
                    cy="-10"
                    r="5"
                    fill="#14F195"
                    stroke="#0CB873"
                    strokeWidth="0.6"
                    filter="url(#helmet-glow)"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.9;1;0.7;1;0.9"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Visor — dark with green reflection */}
                  <ellipse
                    cx="-1.5"
                    cy="-10"
                    rx="2.8"
                    ry="2.2"
                    fill="rgba(10,20,40,0.8)"
                    stroke="#0D0D1A"
                    strokeWidth="0.4"
                  />
                  {/* Visor reflection */}
                  <ellipse
                    cx="-2"
                    cy="-11"
                    rx="1.2"
                    ry="0.6"
                    fill="rgba(20,241,149,0.3)"
                  />
                  {/* Helmet bolts — purple */}
                  <circle cx="3" cy="-12" r="0.8" fill="#9945FF" />
                  <circle cx="3" cy="-8" r="0.8" fill="#9945FF" />

                  {/* Torso — dark purple wetsuit */}
                  <rect
                    x="-3.5"
                    y="-5"
                    width="7"
                    height="9"
                    rx="2"
                    fill="#2D1B69"
                    stroke="#3D2580"
                    strokeWidth="0.4"
                  />
                  {/* BCD harness — green straps */}
                  <line
                    x1="-1"
                    y1="-5"
                    x2="-1"
                    y2="4"
                    stroke="#14F195"
                    strokeWidth="0.6"
                    opacity="0.5"
                  />
                  <line
                    x1="1"
                    y1="-5"
                    x2="1"
                    y2="4"
                    stroke="#14F195"
                    strokeWidth="0.6"
                    opacity="0.5"
                  />
                  <line
                    x1="-3"
                    y1="-1"
                    x2="3"
                    y2="-1"
                    stroke="#14F195"
                    strokeWidth="0.5"
                    opacity="0.5"
                  />

                  {/* Arms */}
                  <line
                    x1="-3.5"
                    y1="-3"
                    x2="-8"
                    y2="0"
                    stroke="#2D1B69"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="3.5"
                    y1="-3"
                    x2="8"
                    y2="-1"
                    stroke="#2D1B69"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Gloves — purple */}
                  <circle cx="-8" cy="0" r="1.2" fill="#5B2DAA" />
                  <circle cx="8" cy="-1" r="1.2" fill="#5B2DAA" />

                  {/* Lantern in right hand — green glow */}
                  <rect
                    x="8.5"
                    y="-2.5"
                    width="5"
                    height="2"
                    rx="0.8"
                    fill="#9945FF"
                    stroke="#7B3FE4"
                    strokeWidth="0.3"
                  />
                  {/* Lantern bulb */}
                  <circle
                    cx="13.5"
                    cy="-1.5"
                    r="1.5"
                    fill="#14F195"
                    filter="url(#lantern-glow)"
                  >
                    <animate
                      attributeName="opacity"
                      values="1;0.6;1;0.8;1"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Legs */}
                  <line
                    x1="-1.5"
                    y1="4"
                    x2="-3"
                    y2="11"
                    stroke="#2D1B69"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="1.5"
                    y1="4"
                    x2="3"
                    y2="11"
                    stroke="#2D1B69"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Fins — green */}
                  <ellipse
                    cx="-5"
                    cy="12"
                    rx="4"
                    ry="1.2"
                    fill="#14F195"
                    stroke="#0CB873"
                    strokeWidth="0.3"
                    opacity="0.7"
                    transform="rotate(-15,-5,12)"
                  />
                  <ellipse
                    cx="5"
                    cy="12"
                    rx="4"
                    ry="1.2"
                    fill="#14F195"
                    stroke="#0CB873"
                    strokeWidth="0.3"
                    opacity="0.7"
                    transform="rotate(10,5,12)"
                  />

                  {/* Regulator hose — purple */}
                  <path
                    d="M5,-8 Q8,-12 3,-12"
                    fill="none"
                    stroke="#7B3FE4"
                    strokeWidth="0.6"
                  />

                  {/* Ambient glow around diver from helmet — large canvas to prevent clipping */}
                  <circle cx="0" cy="2" r="35" fill="rgba(20,241,149,0.02)" />
                </g>
              </g>
            </g>
          </g>
        );
      })()}
    </svg>
  );
};

export default IcebergSVG;
