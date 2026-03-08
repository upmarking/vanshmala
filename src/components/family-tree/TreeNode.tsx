import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronDown, MoreHorizontal, UserPlus, Heart } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { FamilyTreeNode, getGenerationName } from '@/utils/familyTreeUtils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Database } from "@/integrations/supabase/types";

type RelationshipType = Database['public']['Enums']['relationship_type'];

interface TreeNodeProps {
    member: FamilyTreeNode;
    depth?: number;
    onAddRelative: (memberId: string, type: RelationshipType, name: string) => void;
    onViewProfile: (member: FamilyTreeNode) => void;
}

/* ────────────────────────────────────────────────────────────
   Action dropdown menu (shared between card types)
──────────────────────────────────────────────────────────── */
const ActionsDropdown = ({
    member,
    onAddRelative,
}: {
    member: FamilyTreeNode;
    onAddRelative: TreeNodeProps['onAddRelative'];
}) => {
    const { t } = useLanguage();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                        <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>{t('Actions', 'क्रियाएं')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAddRelative(member.id, 'parent', member.full_name)}>
                    <UserPlus className="w-4 h-4 mr-2" /> {t('Add Parent', 'माता-पिता जोड़ें')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddRelative(member.id, 'spouse', member.full_name)}>
                    <UserPlus className="w-4 h-4 mr-2" /> {t('Add Spouse', 'जीवनसाथी जोड़ें')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddRelative(member.id, 'child', member.full_name)}>
                    <UserPlus className="w-4 h-4 mr-2" /> {t('Add Child', 'बच्चा जोड़ें')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddRelative(member.id, 'sibling', member.full_name)}>
                    <UserPlus className="w-4 h-4 mr-2" /> {t('Add Sibling', 'भाई-बहन जोड़ें')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

/* ────────────────────────────────────────────────────────────
   Single person card (no spouse)
──────────────────────────────────────────────────────────── */
const SinglePersonCard = ({
    member,
    onAddRelative,
    onViewProfile,
}: {
    member: FamilyTreeNode;
    onAddRelative: TreeNodeProps['onAddRelative'];
    onViewProfile: TreeNodeProps['onViewProfile'];
}) => {
    const { t } = useLanguage();
    const genName = getGenerationName(member.date_of_birth);
    const isFemale = member.gender === 'female';

    const borderColor = isFemale
        ? 'border-rose-200 hover:border-rose-400'
        : 'border-amber-200 hover:border-amber-400';
    const accentStrip = isFemale
        ? 'bg-gradient-to-b from-rose-400 to-rose-300'
        : 'bg-gradient-to-b from-amber-500 to-amber-400';
    const avatarBg = isFemale ? 'bg-rose-50' : 'bg-amber-50';
    const avatarIcon = isFemale ? 'text-rose-400' : 'text-amber-600';
    const genBg = isFemale
        ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
        : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';

    return (
        <div
            className={`
                person-card relative rounded-2xl bg-white dark:bg-zinc-900
                border-2 ${borderColor}
                transition-all duration-200 cursor-pointer
                shadow-sm hover:shadow-md
                min-w-[155px] max-w-[190px] w-[175px]
                text-center group overflow-hidden
            `}
            onClick={() => onViewProfile(member)}
        >
            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${accentStrip}`} />
            <ActionsDropdown member={member} onAddRelative={onAddRelative} />

            <div className="px-4 py-3">
                <div className={`w-11 h-11 mx-auto mb-2 rounded-full flex items-center justify-center ${avatarBg} ring-2 ring-white dark:ring-zinc-800 shadow-sm`}>
                    {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className={`w-5 h-5 ${avatarIcon}`} />
                    )}
                </div>

                <h4 className="font-display text-[13px] font-bold text-foreground leading-tight">
                    {t(member.full_name, member.full_name_hi)}
                </h4>

                {genName ? (
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-body ${genBg}`}>
                        {t(genName, genName)}
                    </span>
                ) : (
                    <div
                        className="inline-flex mt-1.5 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 border border-blue-200/60 hover:bg-blue-100 cursor-pointer items-center justify-center transition-colors shadow-sm"
                        onClick={(e) => { e.stopPropagation(); onViewProfile(member); }}
                    >
                        <span className="text-[9px] font-semibold font-body whitespace-nowrap">
                            {t('Set up Date of Birth please', 'कृपया जन्म तिथि सेट करें')}
                        </span>
                    </div>
                )}

                <p className="font-body text-[9px] text-muted-foreground mt-1">{member.vanshmala_id}</p>
            </div>
        </div>
    );
};


/* ────────────────────────────────────────────────────────────
   3D Stacked Couple Card
   —  Primary member in front, spouse card "behind" with a
      3D stacking effect. Front card shows combined names.
──────────────────────────────────────────────────────────── */
const CoupleCard = ({
    member,
    spouse,
    onAddRelative,
    onViewProfile,
}: {
    member: FamilyTreeNode;
    spouse: FamilyTreeNode;
    onAddRelative: TreeNodeProps['onAddRelative'];
    onViewProfile: TreeNodeProps['onViewProfile'];
}) => {
    const { t } = useLanguage();
    const [hovered, setHovered] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const isMemberFemale = member.gender === 'female';
    const isSpouseFemale = spouse.gender === 'female';

    // Front card uses primary member's gender for theming
    const frontBorder = isMemberFemale
        ? 'border-rose-200 hover:border-rose-400'
        : 'border-amber-200 hover:border-amber-400';
    const frontAccent = isMemberFemale
        ? 'bg-gradient-to-b from-rose-400 to-rose-300'
        : 'bg-gradient-to-b from-amber-500 to-amber-400';
    const frontAvatarBg = isMemberFemale ? 'bg-rose-50' : 'bg-amber-50';
    const frontAvatarIcon = isMemberFemale ? 'text-rose-400' : 'text-amber-600';

    // Back card uses spouse's gender for theming
    const backBorder = isSpouseFemale
        ? 'border-rose-200'
        : 'border-amber-200';
    const backBg = isSpouseFemale
        ? 'bg-rose-50/80 dark:bg-rose-950/40'
        : 'bg-amber-50/80 dark:bg-amber-950/40';

    const genName = getGenerationName(member.date_of_birth);
    const genBg = isMemberFemale
        ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
        : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';

    /* ── Expanded: two side-by-side person cards ──────────── */
    if (expanded) {
        return (
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-0">
                    <SinglePersonCard
                        member={member}
                        onAddRelative={onAddRelative}
                        onViewProfile={onViewProfile}
                    />

                    {/* Marriage connector — click heart to merge back */}
                    <div className="flex items-center mx-0.5 shrink-0">
                        <div className="w-3 h-[2px] bg-rose-300" />
                        <div
                            className="w-7 h-7 rounded-full bg-white dark:bg-zinc-900 border-2 border-rose-300 flex items-center justify-center shadow-sm cursor-pointer hover:bg-rose-50 hover:scale-110 transition-all"
                            onClick={() => setExpanded(false)}
                            title={t('Merge cards', 'कार्ड मर्ज करें')}
                        >
                            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                        </div>
                        <div className="w-3 h-[2px] bg-rose-300" />
                    </div>

                    <SinglePersonCard
                        member={spouse}
                        onAddRelative={onAddRelative}
                        onViewProfile={onViewProfile}
                    />
                </div>
            </div>
        );
    }

    /* ── Collapsed: 3D stacked merged card ──────────────── */
    return (
        <div
            className="relative group"
            style={{ width: 185, minHeight: 130 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* ── Back card (spouse) ─ peeking behind ───────── */}
            <div
                className={`
                    absolute rounded-2xl border-2 ${backBorder} ${backBg}
                    shadow-sm transition-all duration-300 ease-out
                    w-full overflow-hidden
                `}
                style={{
                    top: hovered ? -6 : 6,
                    left: hovered ? 8 : 6,
                    right: hovered ? -8 : -6,
                    bottom: hovered ? 6 : -2,
                    transform: hovered ? 'rotate(3deg) scale(0.97)' : 'rotate(2deg) scale(0.97)',
                    zIndex: 1,
                }}
            >
                {/* Spouse accent strip */}
                <div className={`absolute right-0 top-3 bottom-3 w-1 rounded-l-full ${isSpouseFemale ? 'bg-gradient-to-b from-rose-400 to-rose-300' : 'bg-gradient-to-b from-amber-500 to-amber-400'}`} />
            </div>

            {/* ── Front card (primary member + combined name) ──── */}
            <div
                className={`
                    relative rounded-2xl bg-white dark:bg-zinc-900
                    border-2 ${frontBorder}
                    transition-all duration-200 cursor-pointer
                    shadow-md hover:shadow-lg
                    w-full text-center overflow-hidden
                `}
                style={{ zIndex: 2 }}
                onClick={() => setExpanded(true)}
            >
                <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${frontAccent}`} />
                <ActionsDropdown member={member} onAddRelative={onAddRelative} />

                <div className="px-4 py-3">
                    {/* Dual avatars stacked */}
                    <div className="flex justify-center items-end mb-2">
                        {/* Primary avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${frontAvatarBg} ring-2 ring-white dark:ring-zinc-800 shadow-sm z-[2]`}>
                            {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className={`w-5 h-5 ${frontAvatarIcon}`} />
                            )}
                        </div>
                        {/* Heart badge between */}
                        <div className="w-5 h-5 -ml-2 -mr-2 rounded-full bg-rose-100 dark:bg-rose-900/40 border-2 border-white dark:border-zinc-800 flex items-center justify-center z-[3] shadow-sm">
                            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                        </div>
                        {/* Spouse avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSpouseFemale ? 'bg-rose-50' : 'bg-amber-50'} ring-2 ring-white dark:ring-zinc-800 shadow-sm z-[1]`}>
                            {spouse.avatar_url ? (
                                <img src={spouse.avatar_url} alt={spouse.full_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className={`w-5 h-5 ${isSpouseFemale ? 'text-rose-400' : 'text-amber-600'}`} />
                            )}
                        </div>
                    </div>

                    {/* Combined name */}
                    <h4 className="font-display text-[12.5px] font-bold text-foreground leading-tight">
                        {t(member.full_name, member.full_name_hi)}
                    </h4>
                    <p className="text-[10.5px] text-muted-foreground font-medium leading-tight mt-0.5">
                        &amp; {t(spouse.full_name, spouse.full_name_hi)}
                    </p>

                    {/* Generation badge / DOB prompt */}
                    {genName ? (
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-body ${genBg}`}>
                            {t(genName, genName)}
                        </span>
                    ) : (
                        <div
                            className="inline-flex mt-1.5 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 border border-blue-200/60 hover:bg-blue-100 cursor-pointer items-center justify-center transition-colors shadow-sm"
                            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                        >
                            <span className="text-[9px] font-semibold font-body whitespace-nowrap">
                                {t('Set up Date of Birth please', 'कृपया जन्म तिथि सेट करें')}
                            </span>
                        </div>
                    )}

                    <p className="font-body text-[9px] text-muted-foreground mt-1">{member.vanshmala_id}</p>
                </div>
            </div>
        </div>
    );
};


/* ────────────────────────────────────────────────────────────
   SVG Connector Lines between couple and children
──────────────────────────────────────────────────────────── */
const ChildConnectors = ({
    childCount,
    containerRef,
    childRefs,
}: {
    childCount: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    childRefs: React.RefObject<(HTMLDivElement | null)[]>;
}) => {
    const [lines, setLines] = useState<{ x: number }[]>([]);
    const [railWidth, setRailWidth] = useState(0);
    const [railLeft, setRailLeft] = useState(0);
    const [centerX, setCenterX] = useState(0);

    const compute = useCallback(() => {
        if (!containerRef.current || !childRefs.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerCenterX = containerRect.width / 2;
        setCenterX(containerCenterX);

        const positions: { x: number }[] = [];
        childRefs.current.forEach((ref) => {
            if (!ref) return;
            const childRect = ref.getBoundingClientRect();
            const childCenterX = childRect.left - containerRect.left + childRect.width / 2;
            positions.push({ x: childCenterX });
        });

        setLines(positions);
        if (positions.length > 1) {
            setRailLeft(positions[0].x);
            setRailWidth(positions[positions.length - 1].x - positions[0].x);
        }
    }, [containerRef, childRefs]);

    useEffect(() => {
        const timer = setTimeout(compute, 80);
        window.addEventListener('resize', compute);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', compute);
        };
    }, [childCount, compute]);

    if (childCount === 0) return null;

    const STEM_HEIGHT = 28;
    const RAIL_Y = STEM_HEIGHT;
    const DROP_HEIGHT = 20;
    const SVG_HEIGHT = STEM_HEIGHT + DROP_HEIGHT + 2;

    return (
        <svg className="w-full block" style={{ height: SVG_HEIGHT }} preserveAspectRatio="none">
            {/* Vertical stem from couple center */}
            <line
                x1={centerX} y1={0} x2={centerX} y2={RAIL_Y}
                stroke="url(#stemGrad)" strokeWidth="2" strokeLinecap="round"
            />
            {/* Horizontal rail */}
            {childCount > 1 && (
                <line
                    x1={railLeft} y1={RAIL_Y} x2={railLeft + railWidth} y2={RAIL_Y}
                    stroke="url(#railGrad)" strokeWidth="2" strokeLinecap="round"
                />
            )}
            {/* Drop lines to each child */}
            {lines.map((line, i) => (
                <line
                    key={i}
                    x1={line.x} y1={RAIL_Y} x2={line.x} y2={RAIL_Y + DROP_HEIGHT}
                    stroke="url(#stemGrad)" strokeWidth="2" strokeLinecap="round"
                />
            ))}
            {/* Small circle at each junction */}
            {lines.map((line, i) => (
                <circle key={`dot-${i}`} cx={line.x} cy={RAIL_Y} r="2.5" fill="#f59e0b" opacity="0.4" />
            ))}
            <defs>
                <linearGradient id="stemGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="railGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.25" />
                </linearGradient>
            </defs>
        </svg>
    );
};


/* ────────────────────────────────────────────────────────────
   Main TreeNode — 3D stacked couple-unit based rendering
──────────────────────────────────────────────────────────── */
export const TreeNode = ({ member, depth = 0, onAddRelative, onViewProfile }: TreeNodeProps) => {
    const [expanded, setExpanded] = useState(true);

    const spouse = member.spouse as FamilyTreeNode | undefined;

    // Combine children from both member and spouse, deduplicating
    const combinedChildrenMap = new Map<string, FamilyTreeNode>();
    (member.children || []).forEach(child => combinedChildrenMap.set(child.id, child));
    if (spouse?.children) {
        spouse.children.forEach(child => combinedChildrenMap.set(child.id, child));
    }

    const children = Array.from(combinedChildrenMap.values());
    const hasChildren = children.length > 0;
    const isVirtualRoot = member.id === '__virtual_root__';

    // Refs for SVG connector positioning
    const connectorContainerRef = useRef<HTMLDivElement>(null);
    const childRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        childRefs.current = childRefs.current.slice(0, children.length);
    }, [children.length]);

    // Virtual root: render disconnected subtrees side by side
    if (isVirtualRoot && hasChildren) {
        return (
            <div className="flex flex-col md:flex-row gap-10 items-start justify-center flex-wrap">
                {children.map((child) => (
                    <div key={child.id} className="flex flex-col items-center">
                        <TreeNode member={child} depth={depth} onAddRelative={onAddRelative} onViewProfile={onViewProfile} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center" ref={connectorContainerRef}>
            {/* ─── Node Card ──────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: depth * 0.07, duration: 0.28, ease: 'easeOut' }}
                className="relative"
            >
                {spouse ? (
                    <CoupleCard
                        member={member}
                        spouse={spouse}
                        onAddRelative={onAddRelative}
                        onViewProfile={onViewProfile}
                    />
                ) : (
                    <SinglePersonCard
                        member={member}
                        onAddRelative={onAddRelative}
                        onViewProfile={onViewProfile}
                    />
                )}

                {/* Expand/collapse toggle */}
                {hasChildren && (
                    <div
                        className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-20 cursor-pointer"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-700 shadow-sm hover:shadow-md hover:border-amber-400 transition-all">
                            <ChevronDown
                                className={`w-3.5 h-3.5 text-amber-600 transition-transform duration-200 ${expanded ? 'rotate-0' : 'rotate-180'}`}
                            />
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                {children.length}
                            </span>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ─── Children ────────────────────────────────── */}
            <AnimatePresence>
                {hasChildren && expanded && (
                    <motion.div
                        className="flex flex-col items-center w-full"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                        {/* SVG connector lines */}
                        <div className="w-full mt-4">
                            <ChildConnectors
                                childCount={children.length}
                                containerRef={connectorContainerRef}
                                childRefs={childRefs}
                            />
                        </div>

                        {/* Children row */}
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
                            {children.map((child, idx) => (
                                <div
                                    key={child.id}
                                    ref={(el) => { childRefs.current[idx] = el; }}
                                    className="flex flex-col items-center"
                                >
                                    <TreeNode
                                        member={child}
                                        depth={depth + 1}
                                        onAddRelative={onAddRelative}
                                        onViewProfile={onViewProfile}
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
