import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { TreePine, Users, Shield, Merge, Globe, History } from 'lucide-react';

const features = [
  {
    icon: TreePine,
    titleEn: 'Interactive Family Tree',
    titleHi: 'इंटरैक्टिव वंशवृक्ष',
    descEn: 'Build beautiful, expandable trees that grow across generations — vertically and horizontally.',
    descHi: 'सुंदर, विस्तारित वंशवृक्ष बनाएं जो पीढ़ियों में बढ़ता है।',
  },
  {
    icon: Users,
    titleEn: 'Unique Vanshmala ID',
    titleHi: 'अद्वितीय वंशमाला ID',
    descEn: 'Every family member gets a permanent genealogical identifier for easy linking.',
    descHi: 'हर परिवार के सदस्य को एक स्थायी वंशावली पहचानकर्ता मिलता है।',
  },
  {
    icon: Merge,
    titleEn: 'Smart Profile Merging',
    titleHi: 'स्मार्ट प्रोफ़ाइल मर्जिंग',
    descEn: 'Detect duplicates, request merges, and unify family data with full audit history.',
    descHi: 'डुप्लिकेट का पता लगाएं, मर्ज अनुरोध करें, और पूरे ऑडिट इतिहास के साथ डेटा एकीकृत करें।',
  },
  {
    icon: Shield,
    titleEn: 'Privacy First',
    titleHi: 'गोपनीयता सर्वोपरि',
    descEn: 'Strictly family-controlled access. Your data stays within your family.',
    descHi: 'परिवार द्वारा नियंत्रित पहुंच। आपका डेटा आपके परिवार में ही रहता है।',
  },
  {
    icon: Globe,
    titleEn: 'Bilingual Support',
    titleHi: 'द्विभाषी समर्थन',
    descEn: 'Full English and Hindi interface with natural Hinglish experience.',
    descHi: 'पूर्ण अंग्रेजी और हिंदी इंटरफ़ेस।',
  },
  {
    icon: History,
    titleEn: 'Living Legacy',
    titleHi: 'जीवित विरासत',
    descEn: 'Preserve memories, coordinate as a community, and pass down stories.',
    descHi: 'यादें संजोएं, समुदाय के रूप में समन्वय करें, और कहानियां आगे बढ़ाएं।',
  },
];

const FeaturesSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t('Everything Your Family Needs', 'आपके परिवार को जो चाहिए')}
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            {t(
              'A complete platform to build, manage, and preserve your family lineage.',
              'अपनी वंशावली को बनाने, प्रबंधित करने और संरक्षित करने के लिए एक पूर्ण मंच।'
            )}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl bg-background border border-border hover:shadow-elevated transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {t(feature.titleEn, feature.titleHi)}
              </h3>
              <p className="font-body text-muted-foreground leading-relaxed">
                {t(feature.descEn, feature.descHi)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
