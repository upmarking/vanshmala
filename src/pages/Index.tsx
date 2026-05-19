import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const Index = () => {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://vanshmala.in/#organization",
      "name": "Vanshmala",
      "url": "https://vanshmala.in/",
      "logo": "https://vanshmala.in/favicon.svg",
      "description": "Connect with your roots using Vanshmala. Create and explore your digital family tree, preserve your lineage, and connect with relatives across generations."
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://vanshmala.in/#website",
      "name": "Vanshmala",
      "url": "https://vanshmala.in/",
      "publisher": {
        "@id": "https://vanshmala.in/#organization"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Vanshmala?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Vanshmala is a digital genealogy platform designed specifically to help families build, preserve, and connect their family lineages across generations. It serves as a modern digital register (Vanshavali) for your family heritage."
          }
        },
        {
          "@type": "Question",
          "name": "How do I create my family tree on Vanshmala?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Once you register, you can start building your family tree by adding members, defining relationships (parents, children, spouses), and uploading photos or life journey events. You can easily drag and expand branches to grow your tree."
          }
        },
        {
          "@type": "Question",
          "name": "Is my family tree data private and secure?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, privacy is our top priority. Your family tree data is controlled by your family admin. You can set visibility options to keep details fully private within the family network, or share read-only public access tokens with trusted relatives."
          }
        },
        {
          "@type": "Question",
          "name": "What is a Vanshmala ID?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A Vanshmala ID is a unique genealogical identifier assigned to each person in the tree. It acts like a digital gotra/lineage marker, allowing relatives to identify and link profiles without duplicate records."
          }
        },
        {
          "@type": "Question",
          "name": "Can I merge my family tree with a relative's tree?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Vanshmala includes a Smart Profile Merging utility. If another relative has built their branch, you can request a merge. Once approved by both admins, the trees seamlessly link together into a single, unified lineage."
          }
        },
        {
          "@type": "Question",
          "name": "Does Vanshmala support Kundali matching and VanshMitra AI?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Vanshmala features a Kundali matching module for astrological relationship insights, and VanshMitra, a friendly voice-enabled AI companion, to help you query family data and ask questions about your genealogy and traditions."
          }
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Vanshmala - वंशमाला | Digital Family Tree & Genealogy"
        description="Connect with your roots using Vanshmala. Create and explore your digital family tree, preserve your lineage, and connect with relatives across generations."
        schemaData={schemas}
        canonical="https://vanshmala.in/"
      />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
