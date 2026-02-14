import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { User, ChevronDown, MoreHorizontal, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { FamilyTreeNode } from '@/utils/familyTreeUtils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Database } from "@/integrations/supabase/types";

// Enum values for reference
type RelationshipType = Database['public']['Enums']['relationship_type'];

interface TreeNodeProps {
    member: FamilyTreeNode;
    depth?: number;
    onAddRelative: (memberId: string, type: RelationshipType, name: string) => void;
    onViewProfile: (member: FamilyTreeNode) => void;
}

export const TreeNode = ({ member, depth = 0, onAddRelative, onViewProfile }: TreeNodeProps) => {
    const { t } = useLanguage();
    const [expanded, setExpanded] = useState(true);
    const hasChildren = member.children && member.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: depth * 0.1 }}
                className="relative group"
            >
                <div
                    className="relative px-5 py-4 rounded-2xl bg-background border-2 border-border hover:border-saffron/40 transition-all cursor-pointer shadow-soft min-w-[180px] text-center"
                    onClick={() => onViewProfile(member)}
                >
                    {/* Saffron top accent line */}
                    <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-gradient-saffron opacity-40" />

                    {/* More Options Button (Visible on Hover/Focus) */}
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
                                {t('Add Parents', 'माता-पिता जोड़ें')}
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

                    <div
                        className="w-10 h-10 mx-auto mb-2 rounded-full bg-saffron/10 flex items-center justify-center"
                        onClick={(e) => {
                            e.stopPropagation(); // Don't trigger onViewProfile
                            // Maybe open profile?
                        }}
                    >
                        {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-saffron" />
                        )}
                    </div>
                    <h4 className="font-display text-sm font-semibold text-foreground">
                        {t(member.full_name, member.full_name_hi)}
                    </h4>
                    {member.spouse && (
                        <p className="font-body text-xs text-gold-dark mt-0.5">
                            & {t(member.spouse.full_name, member.spouse.full_name_hi)}
                        </p>
                    )}
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-saffron/10 text-saffron-deep text-[10px] font-medium font-body">
                        Gen {member.generation_level}
                    </span>
                    <p className="font-body text-[10px] text-muted-foreground mt-1">{member.vanshmala_id}</p>

                    {hasChildren && (
                        <div
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-0.5 rounded-full bg-background border border-border cursor-pointer hover:bg-muted transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}
                        >
                            <ChevronDown
                                className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-0' : 'rotate-180'
                                    }`}
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            {hasChildren && expanded && (
                <div className="flex flex-col items-center mt-4">
                    <div className="w-px h-6 bg-saffron/20" />
                    <div className="flex gap-4 relative">
                        {/* Horizontal connector line for children */}
                        {member.children!.length > 1 && (
                            <div className="absolute top-0 left-[50%] -translate-x-1/2 h-px bg-saffron/20 w-[calc(100%-4rem)]" />
                        )}

                        {member.children!.map((child) => (
                            <div key={child.id} className="flex flex-col items-center relative">
                                <div className="w-px h-4 bg-saffron/20" />
                                <TreeNode member={child} depth={depth + 1} onAddRelative={onAddRelative} onViewProfile={onViewProfile} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
