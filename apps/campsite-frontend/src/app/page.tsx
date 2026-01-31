import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedCampsites } from '@/components/home/FeaturedCampsites';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { PopularProvinces } from '@/components/home/PopularProvinces';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { NewsletterSection } from '@/components/home/NewsletterSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-background-warm">
      {/* Hero Section - Full width with search */}
      <HeroSection />
      
      {/* Featured Campsites */}
      <FeaturedCampsites />
      
      {/* Categories */}
      <CategoriesSection />
      
      {/* Popular Provinces */}
      <PopularProvinces />
      
      {/* Why Choose Us */}
      <WhyChooseUs />
      
      {/* Newsletter CTA */}
      <NewsletterSection />
    </main>
  );
}
