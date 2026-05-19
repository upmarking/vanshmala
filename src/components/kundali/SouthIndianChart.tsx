import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { PlanetPosition } from '@/types/kundali';

interface Props {
  planets: PlanetPosition[];
  ascendantSignId?: number;
  className?: string;
}

const SIGN_NAMES = ['','Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];
const PA: Record<string,string> = {
  Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke',
};

/**
 * South Indian box-style chart (4×4 grid with corners empty).
 * Sign positions are fixed; the ascendant sign is highlighted.
 */
export default function SouthIndianChart({ planets, ascendantSignId = 1, className = '' }: Props) {
  // South Indian layout: fixed sign positions (row, col) → sign_id
  const LAYOUT: Array<{ r: number; c: number; sign: number }> = [
    { r: 0, c: 1, sign: 12 }, { r: 0, c: 2, sign: 1 }, { r: 0, c: 3, sign: 2 },
    { r: 1, c: 0, sign: 11 }, { r: 1, c: 3, sign: 3 },
    { r: 2, c: 0, sign: 10 }, { r: 2, c: 3, sign: 4 },
    { r: 3, c: 0, sign: 9 }, { r: 3, c: 1, sign: 8 }, { r: 3, c: 2, sign: 7 }, { r: 3, c: 3, sign: 5 },
    { r: 2, c: 1, sign: 6 },  // inner placeholder
  ];

  // We use a flat 4×4 for the outer ring only
  const CELLS: Array<{ r: number; c: number; sign: number }> = [
    { r:0,c:0,sign:11 },{ r:0,c:1,sign:12 },{ r:0,c:2,sign:1 },{ r:0,c:3,sign:2 },
    { r:1,c:0,sign:10 },                                          { r:1,c:3,sign:3 },
    { r:2,c:0,sign:9 },                                           { r:2,c:3,sign:4 },
    { r:3,c:0,sign:8 },{ r:3,c:1,sign:7 },{ r:3,c:2,sign:6 },{ r:3,c:3,sign:5 },
  ];

  const planetsBySign = useMemo(() => {
    const m: Record<number, PlanetPosition[]> = {};
    for (let i = 1; i <= 12; i++) m[i] = [];
    planets.forEach(p => {
      const s = p.sign_id || 1;
      if (m[s]) m[s].push(p);
    });
    return m;
  }, [planets]);

  const CELL = 76;
  const GAP = 2;
  const SIZE = CELL * 4 + GAP * 5;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex justify-center ${className}`}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{ maxWidth: SIZE }}>
        <rect width={SIZE} height={SIZE} rx="12" fill="hsl(20,30%,7%)" />
        {CELLS.map(({ r, c, sign }) => {
          const x = GAP + c * (CELL + GAP);
          const y = GAP + r * (CELL + GAP);
          const isAsc = sign === ascendantSignId;
          const pts = planetsBySign[sign] || [];
          return (
            <g key={sign}>
              <rect x={x} y={y} width={CELL} height={CELL} rx="4"
                fill={isAsc ? 'hsl(25,85%,52%,0.15)' : 'hsl(20,25%,11%)'}
                stroke={isAsc ? 'hsl(25,85%,52%)' : 'hsl(42,78%,55%,0.3)'}
                strokeWidth={isAsc ? 2 : 1}
              />
              <text x={x + 4} y={y + 12} fontSize="9" fill="hsl(42,78%,55%)" opacity=".7" fontWeight="bold">
                {SIGN_NAMES[sign]}
              </text>
              {isAsc && <text x={x + CELL - 4} y={y + 12} fontSize="7" fill="hsl(25,85%,52%)" textAnchor="end">ASC</text>}
              {pts.map((p, i) => {
                const ab = PA[p.name] || p.name?.slice(0, 2);
                return (
                  <text key={p.name} x={x + 6 + (i % 3) * 24} y={y + 28 + Math.floor(i / 3) * 14}
                    fontSize="9" fill="#FFD54F" fontWeight="600">
                    {ab}{p.retrograde ? 'ℛ' : ''}
                  </text>
                );
              })}
            </g>
          );
        })}
        {/* Center empty cells — fill with label */}
        <rect x={GAP + 1 * (CELL + GAP)} y={GAP + 1 * (CELL + GAP)} width={CELL * 2 + GAP} height={CELL * 2 + GAP} rx="6"
          fill="hsl(20,25%,9%)" stroke="hsl(42,78%,55%,0.2)" strokeWidth="1" />
        <text x={SIZE / 2} y={SIZE / 2 - 4} textAnchor="middle" fontSize="10" fill="hsl(42,78%,55%)" fontWeight="bold" opacity=".5">
          South Indian
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 10} textAnchor="middle" fontSize="8" fill="hsl(25,85%,52%)" opacity=".4">
          राशि चक्र
        </text>
      </svg>
    </motion.div>
  );
}
