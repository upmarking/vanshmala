import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const AppDownload = () => {
    const { t } = useLanguage();

    useEffect(() => {
        window.location.href = 'https://play.google.com/store/apps/details?id=vanshmala.in';
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen p-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">
                    {t('Redirecting to Play Store...', 'प्ले स्टोर पर निर्देशित किया जा रहा है...')}
                </h1>
                <p>
                    {t('If you are not redirected, ', 'यदि आप निर्देशित नहीं होते हैं, तो ')}
                    <a href="https://play.google.com/store/apps/details?id=vanshmala.in" className="text-saffron underline hover:text-saffron-dark">
                        {t('click here', 'यहाँ क्लिक करें')}
                    </a>.
                </p>
            </div>
        </div>
    );
};

export default AppDownload;
