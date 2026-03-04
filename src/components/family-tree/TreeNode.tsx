import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { User, ChevronDown, MoreHorizontal, UserPlus } from 'lucide-react';
import { useState } from 'react';
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
   Single person card (used both standalone and inside couple)
──────────────────────────────────────────────────────────── */
const PersonCard = ({
    member,
    showSpouseLine = false,
    onAddRelative,
    onViewProfile,
}: {
    member: FamilyTreeNode;
    showSpouseLine?: boolean;
    onAddRelative: TreeNodeProps['onAddRelative'];
    onViewProfile: TreeNodeProps['onViewProfile'];
}) => {
    const { t } = useLanguage();
    const genName = getGenerationName(member.date_of_birth);

    return (
        <div
            className="relative px-4 py-3 md:px-5 md:py-4 rounded-2xl bg-background border-2 border-border hover:border-saffron/40 transition-all cursor-pointer shadow-soft min-w-[140px] md:min-w-[180px] text-center group"
            onClick={() => onViewProfile(member)}
        >
            {/* Saffron top accent */}
            <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-gradient-saffron opacity-40" />

            {/* Spouse join indicator on right edge */}
            {showSpouseLine && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex items-center">
                    <div className="w-4 h-px bg-rose-300" />
                    <span className="text-[9px] text-rose-400 font-medium px-0.5">♥</span>
                    <div className="w-4 h-px bg-rose-300" />
                </div>
            )}

            {/* More options */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-1 rounded-full hover:bg-muted">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>{t('Actions', 'क्रियाएं')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onAddRelative(member.id, 'parent', member.full_name)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t('Add Parent', 'माता-पिता जोड़ें')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddRelative(member.id, 'spouse', member.full_name)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t('Add Spouse', 'जीवनसाथी जोड़ें')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddRelative(member.id, 'child', member.full_name)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t('Add Child', 'बच्चा जोड़ें')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddRelative(member.id, 'sibling', member.full_name)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t('Add Sibling', 'भाई-बहन जोड़ें')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Avatar */}
            <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${member.gender === 'female' ? 'bg-pink-100' : 'bg-saffron/10'}`}>
                {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                    <User className={`w-5 h-5 ${member.gender === 'female' ? 'text-pink-400' : 'text-saffron'}`} />
                )}
            </div>

            <h4 className="font-display text-sm font-semibold text-foreground leading-tight">
                {t(member.full_name, member.full_name_hi)}
            </h4>

            {genName ? (
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-saffron/10 text-saffron-deep text-[10px] font-medium font-body">
                    {t(genName, genName)}
                </span>
            ) : (
                <div
                    className="inline-flex mt-1.5 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 border border-blue-200/60 hover:bg-blue-100 cursor-pointer items-center justify-center transition-colors shadow-sm"
                    onClick={(e) => { e.stopPropagation(); onViewProfile(member); }}
                >
                    <span className="text-[9.5px] font-semibold font-body whitespace-nowrap">
                        {t('Set up Date of Birth please', 'कृपया जन्म तिथि सेट करें')}
                    </span>
                </div>
            )}

            <p className="font-body text-[10px] text-muted-foreground mt-1">{member.vanshmala_id}</p>
        </div>
    );
};

/* ────────────────────────────────────────────────────────────
   Main TreeNode — renders the primary member (+ spouse inline)
   and their deduplicated children below.
──────────────────────────────────────────────────────────── */
export const TreeNode = ({ member, depth = 0, onAddRelative, onViewProfile }: TreeNodeProps) => {
    const [expanded, setExpanded] = useState(true);

    // The deduplicated children array lives on the PRIMARY parent's node.
    // The spouse node's children array should be empty (cleared in buildFamilyTree).
    const children = member.children || [];
    const hasChildren = children.length > 0;
    const isVirtualRoot = member.id === '__virtual_root__';

    // Virtual root: render top-level nodes side by side
    if (isVirtualRoot && hasChildren) {
        return (
            <div className="flex flex-col md:flex-row gap-8 items-start justify-center flex-wrap">
                {children.map((child) => (
                    <div key={child.id} className="flex flex-col items-center">
                        <TreeNode member={child} depth={depth} onAddRelative={onAddRelative} onViewProfile={onViewProfile} />
                    </div>
                ))}
            </div>
        );
    }

    const spouse = member.spouse as FamilyTreeNode | undefined;
    // Determine render order: father (male) first → already ensured by buildFamilyTree
    // The primary member on this node is already the "male / primary" parent.

    return (
        <div className="flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: depth * 0.1 }}
                className="relative"
            >
                {/* Couple row: primary member + marriage line + spouse */}
                <div className="flex items-center gap-0">
                    <PersonCard
                        member={member}
                        showSpouseLine={!!spouse}
                        onAddRelative={onAddRelative}
                        onViewProfile={onViewProfile}
                    />

                    {spouse && (
                        <>
                            {/* Marriage connector */}
                            <div className="flex flex-col items-center mx-1 z-10">
                                <div className="w-6 h-px bg-rose-300" />
                            </div>
                            <PersonCard
                                member={spouse}
                                onAddRelative={onAddRelative}
                                onViewProfile={onViewProfile}
                            />
                        </>
                    )}
                </div>

                {/* Expand/collapse toggle */}
                {hasChildren && (
                    <div
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-0.5 rounded-full bg-background border border-border cursor-pointer hover:bg-muted transition-colors z-10"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-0' : 'rotate-180'}`}
                        />
                    </div>
                )}
            </motion.div>

            {/* Children */}
            {hasChildren && expanded && (
                <div className="flex flex-col items-center mt-4">
                    {/* Vertical stem from couple midpoint */}
                    <div className="w-px h-6 bg-saffron/20" />

                    <div className="flex flex-col md:flex-row gap-4 relative items-center md:items-start">
                        {/* Horizontal connector line across children */}
                        {children.length > 1 && (
                            <div className="hidden md:block absolute top-0 left-[50%] -translate-x-1/2 h-px bg-saffron/20 w-[calc(100%-4rem)]" />
                        )}

                        {children.map((child) => (
                            <div key={child.id} className="flex flex-col items-center relative">
                                <div className="w-px h-4 bg-saffron/20" />
                                <TreeNode
                                    member={child}
                                    depth={depth + 1}
                                    onAddRelative={onAddRelative}
                                    onViewProfile={onViewProfile}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
