import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { TreePine, Users, Shield, Merge, Globe, History } from 'lucide-react';

const features = [
  {
    icon: TreePine,
    titleEn: 'Interactive Family Tree',
    titleHi: 'इंटरैक्टिव वंशवृक्ष',
    descEn: 'Build beautiful, expandable trees that grow across generations — like branches of a sacred Banyan.',
    descHi: 'पवित्र बरगद की शाखाओं की तरह पीढ़ियों में बढ़ता सुंदर वंशवृक्ष बनाएं।',
    accent: 'saffron',
  },
  {
    icon: Users,
    titleEn: 'Unique Vanshmala ID',
    titleHi: 'अद्वितीय वंशमाला ID',
    descEn: 'Every family member receives a permanent genealogical identifier — their digital gotra mark.',
    descHi: 'हर परिवार के सदस्य को एक स्थायी वंशावली पहचानकर्ता मिलता है — उनका डिजिटल गोत्र चिन्ह।',
    accent: 'gold',
  },
  {
    icon: Merge,
    titleEn: 'Smart Profile Merging',
    titleHi: 'स्मार्ट प्रोफ़ाइल मर्जिंग',
    descEn: 'Detect duplicates, request merges, and unify family data with full audit history.',
    descHi: 'डुप्लिकेट का पता लगाएं, मर्ज अनुरोध करें, और पूरे ऑडिट इतिहास के साथ डेटा एकीकृत करें।',
    accent: 'lotus',
  },
  {
    icon: Shield,
    titleEn: 'Privacy First',
    titleHi: 'गोपनीयता सर्वोपरि',
    descEn: 'Family-controlled access like a private temple — your sacred data stays within your family.',
    descHi: 'एक निजी मंदिर की तरह परिवार द्वारा नियंत्रित — आपका पवित्र डेटा आपके परिवार में ही रहता है।',
    accent: 'temple-red',
  },
  {
    icon: Globe,
    titleEn: 'Bilingual Support',
    titleHi: 'द्विभाषी समर्थन',
    descEn: 'Full English and Hindi interface with natural Hinglish experience.',
    descHi: 'पूर्ण अंग्रेजी और हिंदी इंटरफ़ेस।',
    accent: 'saffron',
  },
  {
    icon: History,
    titleEn: 'Living Legacy',
    titleHi: 'जीवित विरासत',
    descEn: 'Preserve parampara — memories, stories, and traditions passed down through generations.',
    descHi: 'परंपरा को संजोएं — यादें, कहानियां और परंपराएं जो पीढ़ियों से चली आ रही हैं।',
    accent: 'gold',
  },
];

const accentColors: Record<string, string> = {
  saffron: 'bg-saffron/10 text-saffron group-hover:bg-saffron/15',
  gold: 'bg-gold/10 text-gold-dark group-hover:bg-gold/15',
  lotus: 'bg-lotus/10 text-lotus group-hover:bg-lotus/15',
  'temple-red': 'bg-temple-red/10 text-temple-red group-hover:bg-temple-red/15',
};

const FeaturesSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 bg-card relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-saffron opacity-30" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-saffron/50 text-2xl block mb-3">✦</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t('Everything Your Family Needs', 'आपके परिवार को जो चाहिए')}
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            {t(
              'A complete platform to build, manage, and preserve your family lineage — your digital kulvriksha.',
              'अपनी वंशावली को बनाने, प्रबंधित करने और संरक्षित करने के लिए एक पूर्ण मंच — आपका डिजिटल कुलवृक्ष।'
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
              className="group p-6 rounded-2xl bg-background border border-border hover:shadow-elevated hover:border-saffron/20 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${accentColors[feature.accent]}`}>
                <feature.icon className="w-6 h-6" />
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
