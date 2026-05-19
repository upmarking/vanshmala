import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogType?: string;
    twitterCard?: string;
    twitterSite?: string;
    twitterImage?: string;
    canonical?: string;
    noindex?: boolean;
    schemaData?: Record<string, any> | Record<string, any>[];
}

const SEO: React.FC<SEOProps> = ({
    title = "Vanshmala - वंशमाला | Connect your family lineage digitally",
    description = "Connect with your roots using Vanshmala. Create and explore your digital family tree, preserve your lineage, and connect with relatives across generations.",
    keywords = "family tree, genealogy, lineage, digital family tree, vanshmala, family history, heritage",
    ogTitle,
    ogDescription,
    ogImage = "https://lovable.dev/opengraph-image-p98pqg.png", // Keeping default for now, can be updated later
    ogType = "website",
    twitterCard = "summary_large_image",
    twitterSite = "@Vanshmala",
    twitterImage,
    canonical,
    noindex = false,
    schemaData,
}) => {
    const siteTitle = title.includes("Vanshmala") ? title : `${title} | Vanshmala`;

    return (
        <Helmet>
            {/* Standard metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Robots controls */}
            {noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow" />
            )}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:title" content={ogTitle || siteTitle} />
            <meta property="og:description" content={ogDescription || description} />
            <meta property="og:image" content={ogImage} />

            {/* Twitter */}
            <meta name="twitter:card" content={twitterCard} />
            <meta name="twitter:site" content={twitterSite} />
            <meta name="twitter:title" content={ogTitle || siteTitle} />
            <meta name="twitter:description" content={ogDescription || description} />
            <meta name="twitter:image" content={twitterImage || ogImage} />

            {/* JSON-LD Structured Data */}
            {schemaData && (
                <script type="application/ld+json">
                    {JSON.stringify(schemaData)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
