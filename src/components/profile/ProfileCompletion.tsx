import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileCompletionProps {
    member: any;
    onCompleteClick?: () => void;
}

export const ProfileCompletion = ({ member, onCompleteClick }: ProfileCompletionProps) => {
    const { t } = useLanguage();

    if (!member) return null;

    // Calculate completion percentage based on gamified weights
    const calcCompletion = () => {
        let score = 0;
        const checks = [
            { field: member.full_name, weight: 15, label: t('Full Name', 'पूरा नाम') },
            { field: member.date_of_birth, weight: 15, label: t('Date of Birth', 'जन्म तिथि') },
            { field: member.gender, weight: 10, label: t('Gender', 'लिंग') },
            { field: member.avatar_url, weight: 10, label: t('Profile Picture', 'प्रोफ़ाइल चित्र') },
            { field: member.bio, weight: 10, label: t('Bio', 'जीवनी') },
            { field: member.place_of_birth, weight: 10, label: t('Place of Birth', 'जन्म स्थान') },
            { field: member.blood_group, weight: 10, label: t('Blood Group', 'रक्त समूह') },
            { field: member.mool_niwas || member.kuldevi, weight: 20, label: t('Ancestral Roots', 'पैतृक मूल') },
        ];

        const completedDocs = [];
        const missingDocs = [];

        checks.forEach(check => {
            // Very basic check for presence of data
            const isComplete = check.field && typeof check.field === 'string' ? check.field.trim() !== '' : !!check.field;

            if (isComplete) {
                score += check.weight;
                completedDocs.push(check.label);
            } else {
                missingDocs.push(check.label);
            }
        });

        return { score: Math.min(score, 100), completedDocs, missingDocs };
    };

    const { score, completedDocs, missingDocs } = calcCompletion();

    // Determine messaging based on score
    let message = t('Let\'s complete your profile!', 'आइए अपनी प्रोफ़ाइल पूरी करें!');
    let trophyColor = 'text-saffron-300';

    if (score === 100) {
        message = t('Awesome! Your profile is 100% complete.', 'बहुत बढ़िया! आपकी प्रोफ़ाइल 100% पूर्ण है।');
        trophyColor = 'text-yellow-500';
    } else if (score >= 75) {
        message = t('Almost there! Just a few more details to go.', 'लगभग हो गया! बस कुछ और विवरण।');
        trophyColor = 'text-saffron-500';
    } else if (score >= 50) {
        message = t('Halfway there! Keep going.', 'आधे रास्ते! चलते रहें।');
        trophyColor = 'text-orange-400';
    }

    return (
        <Card className="bg-gradient-to-br from-saffron/5 to-transparent border-saffron/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy className="w-24 h-24" />
            </div>
            <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 bg-background rounded-full shadow-sm ${trophyColor}`}>
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-lg text-foreground">
                                {t('Profile Strength', 'प्रोफ़ाइल शक्ति')}
                            </h3>
                            <p className="text-sm text-muted-foreground">{message}</p>
                        </div>
                    </div>
                    <div className="text-2xl font-display font-bold text-saffron-600">
                        {score}%
                    </div>
                </div>

                <Progress value={score} className="h-2 mb-6" indicatorClassName="bg-gradient-saffron" />

                {score < 100 && (
                    <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {t('Missing Information', 'अनुपलब्ध जानकारी')}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {missingDocs.slice(0, 4).map((label, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-foreground/80">
                                    <Circle className="w-3.5 h-3.5 text-muted-foreground/50" />
                                    <span className="truncate">{label}</span>
                                </div>
                            ))}
                            {missingDocs.length > 4 && (
                                <div className="flex items-center gap-2 text-sm text-saffron-600 font-medium">
                                    +{missingDocs.length - 4} {t('more', 'और')}
                                </div>
                            )}
                        </div>

                        {onCompleteClick && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onCompleteClick}
                                className="w-full mt-4 py-2 px-4 bg-white border border-saffron/30 hover:bg-saffron/5 text-saffron-700 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                {t('Complete Profile Now', 'प्रोफ़ाइल अभी पूरी करें')}
                            </motion.button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
