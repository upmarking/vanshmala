import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const blogDir = path.join(root, 'src', 'data', 'dharma', 'blogs');
const outDir = path.join(root, 'public', 'dharma-images');

const themes = [
  {
    id: 'shiva',
    keywords: ['shiva', 'shiv', 'mahesh', 'jyotirlinga', 'kailash', 'bhairav', 'rudra', 'ardhanarishvara', 'mahamrityunjaya', 'शिव', 'ज्योतिर्लिंग', 'कैलाश', 'भैरव', 'अर्धनारीश्वर'],
    symbol: 'त्रिशूल',
    accent: '#6ee7f9',
    secondary: '#c4b5fd',
    bgA: '#07111f',
    bgB: '#19233f',
    motif: 'mountains',
  },
  {
    id: 'vishnu',
    keywords: ['vishnu', 'krishna', 'gita', 'dashavatar', 'sheshnag', 'balaji', 'venkatesh', 'sahasranama', 'भागवत', 'विष्णु', 'कृष्ण', 'गीता', 'दशावतार', 'शेषनाग'],
    symbol: 'चक्र',
    accent: '#7dd3fc',
    secondary: '#facc15',
    bgA: '#06152f',
    bgB: '#0f3a5f',
    motif: 'chakra',
  },
  {
    id: 'devi',
    keywords: ['durga', 'navdurga', 'shakti', 'sati', 'lalitha', 'tripura', 'lakshmi', 'laxmi', 'saraswati', 'vaishno', 'देवी', 'दुर्गा', 'शक्ति', 'लक्ष्मी', 'सरस्वती', 'वैष्णो'],
    symbol: 'कमल',
    accent: '#f9a8d4',
    secondary: '#fbbf24',
    bgA: '#2b0718',
    bgB: '#5a1237',
    motif: 'lotus',
  },
  {
    id: 'rama',
    keywords: ['rama', 'ramayana', 'ramcharitmanas', 'tulsidas', 'hanuman', 'shabari', 'राम', 'रामायण', 'तुलसीदास', 'हनुमान'],
    symbol: 'धनुष',
    accent: '#fdba74',
    secondary: '#86efac',
    bgA: '#1f1208',
    bgB: '#5b2a0a',
    motif: 'bow',
  },
  {
    id: 'veda',
    keywords: ['veda', 'upanishad', 'brahma-sutra', 'smriti', 'manusmriti', 'purana', 'agni-purana', 'garuda', 'markandeya', 'वेद', 'उपनिषद', 'स्मृति', 'पुराण', 'मनुस्मृति'],
    symbol: 'ग्रंथ',
    accent: '#fcd34d',
    secondary: '#fb923c',
    bgA: '#201104',
    bgB: '#5b3311',
    motif: 'scripture',
  },
  {
    id: 'yoga',
    keywords: ['yoga', 'kundalini', 'chakra', 'meditation', 'mauna', 'om', 'patanjali', 'ashtanga', 'योग', 'कुंडलिनी', 'चक्र', 'ध्यान', 'मौन', 'ओम', 'ॐ'],
    symbol: 'ॐ',
    accent: '#a7f3d0',
    secondary: '#fde68a',
    bgA: '#05231d',
    bgB: '#0f4d3f',
    motif: 'aura',
  },
  {
    id: 'temple',
    keywords: ['mandir', 'temple', 'darshan', 'dham', 'yatra', 'kashi', 'varanasi', 'tirupati', 'kumbh', 'puri', 'मंदिर', 'दर्शन', 'धाम', 'यात्रा', 'काशी', 'कुंभ'],
    symbol: 'मंदिर',
    accent: '#fb923c',
    secondary: '#fef3c7',
    bgA: '#210b05',
    bgB: '#67330f',
    motif: 'temple',
  },
  {
    id: 'ritual',
    keywords: ['yajna', 'havan', 'vrat', 'fasting', 'tulsi', 'shankh', 'gayatri', 'surya', 'janeu', 'shikha', 'swastika', 'charan', 'यज्ञ', 'हवन', 'व्रत', 'तुलसी', 'शंख', 'गायत्री', 'सूर्य', 'जनेऊ', 'स्वास्तिक'],
    symbol: 'दीप',
    accent: '#fde047',
    secondary: '#f97316',
    bgA: '#1e1404',
    bgB: '#5a2508',
    motif: 'flame',
  },
  {
    id: 'philosophy',
    keywords: ['dharma', 'karma', 'advaita', 'dvaita', 'maya', 'moksha', 'purushartha', 'ashrama', 'reincarnation', 'दार्शनिक', 'धर्म', 'कर्म', 'अद्वैत', 'द्वैत', 'माया', 'मोक्ष', 'आश्रम', 'पुनर्जन्म'],
    symbol: 'ॐ',
    accent: '#c4b5fd',
    secondary: '#fcd34d',
    bgA: '#130b2a',
    bgB: '#3a2267',
    motif: 'mandala',
  },
];

const fallback = themes.at(-1);

function hashText(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function getTheme(blog) {
  const haystack = `${blog.slug} ${blog.title}`.toLowerCase();
  return themes.find((theme) => theme.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) || fallback;
}

function getBlog(source) {
  const slug = source.match(/slug:\s*"([^"]+)"/)?.[1];
  const title = source.match(/title:\s*"([^"]+)"/)?.[1];
  const id = source.match(/id:\s*"([^"]+)"/)?.[1];
  if (!slug || !title || !id) {
    throw new Error('Missing id, slug, or title');
  }
  return { id, slug, title };
}

function starField(seed, theme) {
  return Array.from({ length: 68 }, (_, index) => {
    const x = (hashText(`${seed}-x-${index}`) % 1600);
    const y = (hashText(`${seed}-y-${index}`) % 900);
    const r = 0.8 + (hashText(`${seed}-r-${index}`) % 24) / 10;
    const opacity = 0.18 + (hashText(`${seed}-o-${index}`) % 50) / 100;
    return `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="${theme.secondary}" opacity="${opacity.toFixed(2)}" />`;
  }).join('\n');
}

function petalRing(cx, cy, count, radius, petalW, petalH, fill, opacity) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (360 / count) * index;
    return `<ellipse cx="${cx}" cy="${cy - radius}" rx="${petalW}" ry="${petalH}" fill="${fill}" opacity="${opacity}" transform="rotate(${angle} ${cx} ${cy})" />`;
  }).join('\n');
}

function motifSvg(theme, seed) {
  const smallShift = (hashText(seed) % 70) - 35;
  if (theme.motif === 'mountains') {
    return `
      <path d="M0 760 L260 430 L420 630 L620 315 L860 710 L1100 390 L1370 760 Z" fill="url(#glassMountain)" opacity="0.72"/>
      <path d="M586 360 L620 315 L654 360 L632 350 L620 385 L607 350 Z" fill="#f8fafc" opacity="0.88"/>
      <path d="M1062 442 L1100 390 L1140 446 L1118 432 L1100 472 L1084 432 Z" fill="#f8fafc" opacity="0.82"/>
      <path d="M778 225 v285 M708 332 h140 M738 275 q40 28 80 0" stroke="${theme.secondary}" stroke-width="22" stroke-linecap="round" fill="none" opacity="0.84"/>
    `;
  }
  if (theme.motif === 'chakra') {
    return `
      <circle cx="${800 + smallShift}" cy="430" r="185" fill="none" stroke="${theme.secondary}" stroke-width="20" opacity="0.78"/>
      ${Array.from({ length: 24 }, (_, index) => `<line x1="${800 + smallShift}" y1="430" x2="${800 + smallShift}" y2="245" stroke="${theme.secondary}" stroke-width="7" opacity="0.58" transform="rotate(${index * 15} ${800 + smallShift} 430)" />`).join('\n')}
      <circle cx="${800 + smallShift}" cy="430" r="64" fill="url(#glassOrb)" opacity="0.92"/>
      <path d="M545 585 C660 525 940 525 1055 585 C975 655 625 655 545 585 Z" fill="${theme.accent}" opacity="0.18"/>
    `;
  }
  if (theme.motif === 'lotus') {
    return `
      ${petalRing(800, 500, 18, 96, 34, 110, theme.accent, 0.42)}
      ${petalRing(800, 500, 12, 62, 26, 82, theme.secondary, 0.5)}
      <circle cx="800" cy="500" r="74" fill="url(#glassOrb)" opacity="0.92"/>
      <path d="M585 690 C680 590 920 590 1015 690 C890 735 710 735 585 690 Z" fill="${theme.accent}" opacity="0.32"/>
    `;
  }
  if (theme.motif === 'bow') {
    return `
      <path d="M660 225 C500 405 500 610 660 770" fill="none" stroke="${theme.secondary}" stroke-width="23" stroke-linecap="round" opacity="0.78"/>
      <path d="M660 225 C760 410 760 585 660 770" fill="none" stroke="${theme.accent}" stroke-width="7" opacity="0.74"/>
      <line x1="658" y1="225" x2="658" y2="770" stroke="#fff7ed" stroke-width="4" opacity="0.68"/>
      <line x1="700" y1="505" x2="1045" y2="505" stroke="${theme.secondary}" stroke-width="13" stroke-linecap="round" opacity="0.82"/>
      <path d="M1045 505 l-58 -32 l16 32 l-16 32 Z" fill="${theme.secondary}" opacity="0.86"/>
    `;
  }
  if (theme.motif === 'scripture') {
    return `
      <path d="M520 300 h560 a44 44 0 0 1 44 44 v280 a44 44 0 0 1 -44 44 H520 a44 44 0 0 1 -44 -44 V344 a44 44 0 0 1 44 -44 Z" fill="url(#glassPanel)" opacity="0.72"/>
      <path d="M800 320 v330" stroke="#fff7ed" stroke-width="9" opacity="0.48"/>
      ${Array.from({ length: 7 }, (_, index) => `<path d="M555 ${380 + index * 36} h185" stroke="${theme.secondary}" stroke-width="10" stroke-linecap="round" opacity="${0.35 + index * 0.035}" />`).join('\n')}
      ${Array.from({ length: 7 }, (_, index) => `<path d="M865 ${380 + index * 36} h185" stroke="${theme.accent}" stroke-width="10" stroke-linecap="round" opacity="${0.35 + index * 0.035}" />`).join('\n')}
    `;
  }
  if (theme.motif === 'aura') {
    return `
      <circle cx="800" cy="455" r="245" fill="none" stroke="${theme.accent}" stroke-width="18" opacity="0.28"/>
      <circle cx="800" cy="455" r="175" fill="none" stroke="${theme.secondary}" stroke-width="12" opacity="0.42"/>
      <text x="800" y="520" text-anchor="middle" font-family="Georgia, 'Noto Serif Devanagari', serif" font-size="230" font-weight="700" fill="#fff7ed" opacity="0.92">ॐ</text>
      <path d="M596 700 C700 624 900 624 1004 700" stroke="${theme.accent}" stroke-width="22" stroke-linecap="round" opacity="0.42" fill="none"/>
    `;
  }
  if (theme.motif === 'temple') {
    return `
      <path d="M450 705 h700 v-48 H450 Z" fill="url(#glassPanel)" opacity="0.72"/>
      <path d="M535 657 v-250 h530 v250 Z" fill="url(#glassPanel)" opacity="0.48"/>
      <path d="M495 407 h610 L800 210 Z" fill="${theme.secondary}" opacity="0.6"/>
      <path d="M645 657 V500 a155 155 0 0 1 310 0 v157 Z" fill="${theme.bgA}" opacity="0.74"/>
      <path d="M800 210 v-88" stroke="${theme.accent}" stroke-width="9" opacity="0.88"/>
      <path d="M800 126 c48 -26 72 6 115 -15 c-34 60 -78 38 -115 64 Z" fill="${theme.accent}" opacity="0.82"/>
    `;
  }
  if (theme.motif === 'flame') {
    return `
      <path d="M800 705 C635 585 690 445 772 358 C765 458 875 465 842 275 C995 405 1025 595 800 705 Z" fill="${theme.secondary}" opacity="0.75"/>
      <path d="M805 670 C725 598 742 506 807 438 C802 514 888 535 878 442 C950 538 928 632 805 670 Z" fill="${theme.accent}" opacity="0.84"/>
      <path d="M615 728 h370" stroke="#fff7ed" stroke-width="20" stroke-linecap="round" opacity="0.44"/>
      <path d="M690 760 h220" stroke="${theme.secondary}" stroke-width="18" stroke-linecap="round" opacity="0.52"/>
    `;
  }
  return `
    ${petalRing(800, 460, 32, 175, 16, 90, theme.accent, 0.22)}
    ${petalRing(800, 460, 18, 112, 20, 72, theme.secondary, 0.32)}
    <circle cx="800" cy="460" r="140" fill="url(#glassOrb)" opacity="0.78"/>
    <text x="800" y="525" text-anchor="middle" font-family="Georgia, 'Noto Serif Devanagari', serif" font-size="210" font-weight="700" fill="#fff7ed" opacity="0.9">ॐ</text>
  `;
}

function svgForBlog(blog, theme) {
  const seed = `${blog.id}-${blog.slug}`;
  const title = escapeXml(blog.title);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="${title}">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="43%" r="75%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.46"/>
      <stop offset="45%" stop-color="${theme.bgB}" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="${theme.bgA}"/>
    </radialGradient>
    <linearGradient id="glassPanel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.58"/>
      <stop offset="42%" stop-color="${theme.accent}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.08"/>
    </linearGradient>
    <radialGradient id="glassOrb" cx="34%" cy="24%" r="68%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.94"/>
      <stop offset="34%" stop-color="${theme.accent}" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="${theme.bgB}" stop-opacity="0.22"/>
    </radialGradient>
    <linearGradient id="glassMountain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.48"/>
      <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0.22"/>
    </linearGradient>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.75 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" seed="${hashText(seed) % 997}"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.075"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <rect width="1600" height="900" fill="url(#bgGlow)"/>
  <g opacity="0.72">${starField(seed, theme)}</g>
  <circle cx="${420 + (hashText(`${seed}-a`) % 100)}" cy="${250 + (hashText(`${seed}-b`) % 80)}" r="230" fill="${theme.accent}" opacity="0.08"/>
  <circle cx="${1080 + (hashText(`${seed}-c`) % 120)}" cy="${625 + (hashText(`${seed}-d`) % 90)}" r="275" fill="${theme.secondary}" opacity="0.08"/>
  <g filter="url(#softGlow)">
    ${motifSvg(theme, seed)}
  </g>
  <g opacity="0.78">
    <rect x="88" y="82" width="1424" height="736" rx="46" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="2"/>
    <path d="M150 150 C320 82 525 78 720 126" stroke="#fff7ed" stroke-opacity="0.44" stroke-width="7" stroke-linecap="round"/>
    <path d="M1332 710 C1215 775 1005 792 855 752" stroke="${theme.accent}" stroke-opacity="0.42" stroke-width="8" stroke-linecap="round"/>
  </g>
  <g transform="translate(126 714)">
    <rect width="420" height="86" rx="28" fill="#ffffff" opacity="0.12"/>
    <rect x="1" y="1" width="418" height="84" rx="27" fill="none" stroke="#ffffff" stroke-opacity="0.22"/>
    <text x="36" y="56" font-family="Georgia, 'Noto Serif Devanagari', serif" font-size="40" font-weight="700" fill="#fff7ed">${escapeXml(theme.symbol)}</text>
    <circle cx="352" cy="43" r="15" fill="${theme.accent}" opacity="0.9"/>
  </g>
  <rect width="1600" height="900" filter="url(#grain)" opacity="0.34"/>
</svg>
`;
}

await mkdir(outDir, { recursive: true });
const files = (await readdir(blogDir)).filter((file) => file.endsWith('.ts')).sort((a, b) => {
  const ai = Number(a.match(/\d+/)?.[0] ?? 0);
  const bi = Number(b.match(/\d+/)?.[0] ?? 0);
  return ai - bi;
});

const manifest = [];

for (const file of files) {
  const filePath = path.join(blogDir, file);
  const source = await readFile(filePath, 'utf8');
  const blog = getBlog(source);
  const theme = getTheme(blog);
  const imagePath = `/dharma-images/${blog.slug}.svg`;
  const updated = source.replace(/imageUrl:\s*"[^"]*"/, `imageUrl: "${imagePath}"`);
  await writeFile(filePath, updated, 'utf8');
  await writeFile(path.join(outDir, `${blog.slug}.svg`), svgForBlog(blog, theme), 'utf8');
  manifest.push({ id: blog.id, slug: blog.slug, title: blog.title, theme: theme.id, imageUrl: imagePath });
}

await writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Generated ${manifest.length} dharma images in ${path.relative(root, outDir)}`);
