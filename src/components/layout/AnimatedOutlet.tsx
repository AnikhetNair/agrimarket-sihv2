import React, { useRef } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

/**
 * 2D grid positions for each route, relative to each role's dashboard as [0, 0].
 * [x, y] — x drives horizontal, y drives vertical transitions.
 *
 * Farmer grid:          FPO grid:              Buyer grid:
 *   Alerts [0,1]          Analytics [0,1]        Logistics [0,1]
 *   Dashboard [0,0]       Dashboard [0,0]        Dashboard [0,0]
 *   Market [1,0]          Members [1,0]          Procurement [1,0]
 *   Lots [2,0]            Aggregation [2,0]      Matches [2,0]
 *   Deals [2,-1]          Lots [2,-1]            Deals [2,-1]
 */
const ROUTE_GRID: Record<string, [number, number]> = {
  // Farmer
  '/farmer':        [0, 0],
  '/farmer/market': [1, 0],
  '/farmer/lots':   [2, 0],
  '/farmer/deals':  [2, -1],
  '/farmer/alerts': [0, 1],
  // FPO
  '/fpo':             [0, 0],
  '/fpo/members':     [1, 0],
  '/fpo/aggregation': [2, 0],
  '/fpo/lots':        [2, -1],
  '/fpo/analytics':   [0, 1],
  // Buyer
  '/buyer':             [0, 0],
  '/buyer/procurement': [1, 0],
  '/buyer/matches':     [2, 0],
  '/buyer/deals':       [2, -1],
  '/buyer/logistics':   [0, 1],
};

/** Normalise paths like "/farmer/lots/abc" → "/farmer/lots" */
function resolveGrid(pathname: string): [number, number] | null {
  if (ROUTE_GRID[pathname]) return ROUTE_GRID[pathname];
  // Try stripping the last segment (handles :lotId, :dealId, :matchId)
  const parent = pathname.replace(/\/[^/]+$/, '');
  return ROUTE_GRID[parent] ?? null;
}

const SLIDE_PX = 60;
const DURATION = 0.28;

type Dir = { x: number; y: number };

function getDirection(from: string, to: string): Dir {
  const fromPos = resolveGrid(from);
  const toPos = resolveGrid(to);
  if (!fromPos || !toPos) return { x: 0, y: 0 }; // fade fallback

  const dx = toPos[0] - fromPos[0];
  const dy = toPos[1] - fromPos[1];

  if (dx === 0 && dy === 0) return { x: 0, y: 0 }; // same position → fade

  // Pure horizontal
  if (dy === 0) return { x: dx > 0 ? SLIDE_PX : -SLIDE_PX, y: 0 };
  // Pure vertical
  if (dx === 0) return { x: 0, y: dy > 0 ? SLIDE_PX : -SLIDE_PX };

  // Diagonal — use dominant axis; if equal, prefer horizontal
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: dx > 0 ? SLIDE_PX : -SLIDE_PX, y: 0 };
  }
  return { x: 0, y: dy > 0 ? SLIDE_PX : -SLIDE_PX };
}

export const AnimatedOutlet: React.FC = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const prevPath = useRef(location.pathname);
  const dirRef = useRef<Dir>({ x: 0, y: 0 });

  if (location.pathname !== prevPath.current) {
    dirRef.current = getDirection(prevPath.current, location.pathname);
    prevPath.current = location.pathname;
  }

  const dir = dirRef.current;
  const isFade = dir.x === 0 && dir.y === 0;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={
          isFade
            ? { opacity: 0 }
            : { opacity: 0, x: dir.x, y: dir.y }
        }
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={
          isFade
            ? { opacity: 0 }
            : { opacity: 0, x: -dir.x, y: -dir.y }
        }
        transition={{ duration: DURATION, ease: 'easeInOut' }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
};
