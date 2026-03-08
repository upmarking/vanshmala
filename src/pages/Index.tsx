import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Vanshmala - वंशमाला | Digital Family Tree & Genealogy"
        description="Connect with your roots using Vanshmala. Create and explore your digital family tree, preserve your lineage, and connect with relatives across generations."
      />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default Index;
