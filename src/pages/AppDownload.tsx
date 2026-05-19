import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import SEO from '@/components/SEO';

const AppDownload = () => {
    const { t } = useLanguage();

    useEffect(() => {
        window.location.href = 'https://play.google.com/store/apps/details?id=vanshmala.in';
    }, []);

    const appBreadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://vanshmala.in/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Download App",
                "item": "https://vanshmala.in/app"
            }
        ]
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-8">
            <SEO
                title="Download Vanshmala App | Your Family Tree on Mobile"
                description="Download the Vanshmala app to access your digital family tree anytime, anywhere. Connect with relatives and explore your lineage on the go."
                schemaData={appBreadcrumbSchema}
                canonical="https://vanshmala.in/app"
            />
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
