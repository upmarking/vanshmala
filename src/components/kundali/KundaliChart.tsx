import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { PlanetPosition } from '@/types/kundali';

interface Props {
  planets: PlanetPosition[];
  ascendantSignId?: number;
  className?: string;
}

const SIGN_NAMES = ['','Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];
const PLANET_ABBR: Record<string,string> = {
  Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke',Ascendant:'As',Lagna:'As',
};
const PLANET_COLORS: Record<string,string> = {
  Su:'#E65100',Mo:'#1565C0',Ma:'#C62828',Me:'#2E7D32',Ju:'#F9A825',Ve:'#AD1457',Sa:'#37474F',Ra:'#4A148C',Ke:'#795548',As:'#BF360C',
};

export default function KundaliChart({ planets, ascendantSignId, className = '' }: Props) {
  const planetsByHouse = useMemo(() => {
    const m: Record<number, PlanetPosition[]> = {};
    for (let i = 1; i <= 12; i++) m[i] = [];
    planets.forEach(p => { const h = p.house || 1; if (m[h]) m[h].push(p); });
    return m;
  }, [planets]);

  const S = 320, H = S / 2, M = 10;
  const top = { x: H, y: M }, right = { x: S - M, y: H };
  const bottom = { x: H, y: S - M }, left = { x: M, y: H };
  const tr = { x: (top.x + right.x) / 2, y: (top.y + right.y) / 2 };
  const br = { x: (right.x + bottom.x) / 2, y: (right.y + bottom.y) / 2 };
  const bl = { x: (bottom.x + left.x) / 2, y: (bottom.y + left.y) / 2 };
  const tl = { x: (left.x + top.x) / 2, y: (left.y + top.y) / 2 };

  const hc: Record<number, { x: number; y: number }> = {
    1:{x:H,y:H*.42},2:{x:H*.6,y:H*.6},3:{x:H*.35,y:H*.85},4:{x:H*.42,y:H},
    5:{x:H*.35,y:H*1.15},6:{x:H*.6,y:H*1.4},7:{x:H,y:H*1.58},8:{x:H*1.4,y:H*1.4},
    9:{x:H*1.65,y:H*1.15},10:{x:H*1.58,y:H},11:{x:H*1.65,y:H*.85},12:{x:H*1.4,y:H*.6},
  };
  const asc = ascendantSignId || 1;

  return (
    <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} transition={{duration:.5}} className={`flex justify-center ${className}`}>
      <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{maxWidth:S}} className="drop-shadow-lg">
        <rect width={S} height={S} rx="12" fill="hsl(20,30%,7%)"/>
        <polygon points={`${top.x},${top.y} ${right.x},${right.y} ${bottom.x},${bottom.y} ${left.x},${left.y}`} fill="none" stroke="hsl(42,78%,55%)" strokeWidth="1.5"/>
        <polygon points={`${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y} ${tl.x},${tl.y}`} fill="none" stroke="hsl(42,78%,55%)" strokeWidth="1" opacity=".6"/>
        <line x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} stroke="hsl(42,78%,55%)" strokeWidth=".8" opacity=".4"/>
        <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="hsl(42,78%,55%)" strokeWidth=".8" opacity=".4"/>
        <line x1={tr.x} y1={tr.y} x2={bl.x} y2={bl.y} stroke="hsl(42,78%,55%)" strokeWidth=".6" opacity=".3"/>
        <line x1={tl.x} y1={tl.y} x2={br.x} y2={br.y} stroke="hsl(42,78%,55%)" strokeWidth=".6" opacity=".3"/>
        {Array.from({length:12},(_,i)=>i+1).map(house => {
          const c = hc[house]; if (!c) return null;
          const sid = ((asc-1+house-1)%12)+1;
          const pts = planetsByHouse[house]||[];
          return (
            <g key={house}>
              <text x={c.x} y={c.y-8} textAnchor="middle" fill="hsl(42,78%,55%)" fontSize="11" fontWeight="bold" opacity=".7">{SIGN_NAMES[sid]}</text>
              {pts.map((p,idx)=>{
                const ab=PLANET_ABBR[p.name]||p.name?.slice(0,2);
                const col=PLANET_COLORS[ab]||'#FFD54F';
                return <text key={p.name} x={c.x+(idx%2===0?-12:12)} y={c.y+6+Math.floor(idx/2)*12} textAnchor="middle" fill={col} fontSize="9" fontWeight="600">{ab}{p.retrograde?'ℛ':''}</text>;
              })}
            </g>
          );
        })}
        <text x={H} y={H+2} textAnchor="middle" fill="hsl(25,85%,52%)" fontSize="8" fontWeight="bold" opacity=".5">रासि</text>
      </svg>
    </motion.div>
  );
}
