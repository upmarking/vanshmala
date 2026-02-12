import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { User, Plus, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FamilyMember {
  id: string;
  name: string;
  nameHi: string;
  relation: string;
  relationHi: string;
  generation: number;
  children?: FamilyMember[];
  spouse?: { name: string; nameHi: string };
}

const sampleTree: FamilyMember = {
  id: 'VM-001',
  name: 'Raghunath Sharma',
  nameHi: 'रघुनाथ शर्मा',
  relation: 'Great Grandfather',
  relationHi: 'परदादा',
  generation: 1,
  spouse: { name: 'Savitri Devi', nameHi: 'सावित्री देवी' },
  children: [
    {
      id: 'VM-002',
      name: 'Ramesh Sharma',
      nameHi: 'रमेश शर्मा',
      relation: 'Grandfather',
      relationHi: 'दादा',
      generation: 2,
      spouse: { name: 'Kamla Devi', nameHi: 'कमला देवी' },
      children: [
        {
          id: 'VM-004',
          name: 'Suresh Sharma',
          nameHi: 'सुरेश शर्मा',
          relation: 'Father',
          relationHi: 'पिता',
          generation: 3,
          spouse: { name: 'Meena Sharma', nameHi: 'मीना शर्मा' },
          children: [
            {
              id: 'VM-007',
              name: 'Arjun Sharma',
              nameHi: 'अर्जुन शर्मा',
              relation: 'You',
              relationHi: 'आप',
              generation: 4,
            },
            {
              id: 'VM-008',
              name: 'Priya Sharma',
              nameHi: 'प्रिया शर्मा',
              relation: 'Sister',
              relationHi: 'बहन',
              generation: 4,
            },
          ],
        },
        {
          id: 'VM-005',
          name: 'Dinesh Sharma',
          nameHi: 'दिनेश शर्मा',
          relation: 'Uncle',
          relationHi: 'चाचा',
          generation: 3,
        },
      ],
    },
    {
      id: 'VM-003',
      name: 'Mahesh Sharma',
      nameHi: 'महेश शर्मा',
      relation: 'Grand Uncle',
      relationHi: 'दादा के भाई',
      generation: 2,
    },
  ],
};

const TreeNode = ({ member, depth = 0 }: { member: FamilyMember; depth?: number }) => {
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
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          {/* Saffron top accent line */}
          <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-gradient-saffron opacity-40" />

          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-saffron/10 flex items-center justify-center">
            <User className="w-5 h-5 text-saffron" />
          </div>
          <h4 className="font-display text-sm font-semibold text-foreground">
            {t(member.name, member.nameHi)}
          </h4>
          {member.spouse && (
            <p className="font-body text-xs text-gold-dark mt-0.5">
              & {t(member.spouse.name, member.spouse.nameHi)}
            </p>
          )}
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-saffron/10 text-saffron-deep text-[10px] font-medium font-body">
            {t(member.relation, member.relationHi)}
          </span>
          <p className="font-body text-[10px] text-muted-foreground mt-1">{member.id}</p>

          {hasChildren && (
            <ChevronDown
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 text-muted-foreground transition-transform ${
                expanded ? 'rotate-0' : 'rotate-180'
              }`}
            />
          )}
        </div>
      </motion.div>

      {hasChildren && expanded && (
        <div className="flex flex-col items-center mt-2">
          <div className="w-px h-6 bg-saffron/20" />
          <div className="flex gap-4">
            {member.children!.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-4 bg-saffron/20" />
                <TreeNode member={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FamilyTree = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-saffron/40 text-2xl block mb-2">🕉</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">
              {t('Family Tree', 'वंशवृक्ष')}
            </h1>
            <p className="font-body text-muted-foreground text-lg">
              {t('Sharma Family — Demo Kulvriksha', 'शर्मा परिवार — डेमो कुलवृक्ष')}
            </p>
          </div>

          <div className="overflow-x-auto pb-8">
            <div className="flex justify-center min-w-[700px]">
              <TreeNode member={sampleTree} />
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-saffron/20 text-muted-foreground hover:border-saffron hover:text-saffron transition-colors font-body">
              <Plus className="w-5 h-5" />
              {t('Add Family Member', 'परिवार का सदस्य जोड़ें')}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FamilyTree;
