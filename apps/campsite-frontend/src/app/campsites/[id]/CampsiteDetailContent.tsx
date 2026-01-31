'use client';

import { useState } from 'react';
import type { CampsiteDetail } from '@campsite/shared';
import { HeroSection } from '@/components/campsite/HeroSection';
import { DescriptionSection } from '@/components/campsite/DescriptionSection';
import { AmenitiesSection } from '@/components/campsite/AmenitiesSection';
import { LocationSection } from '@/components/campsite/LocationSection';
import { ContactSection } from '@/components/campsite/ContactSection';
import { BookingSidebar } from '@/components/campsite/BookingSidebar';
import { CampsiteGallery } from '@/components/campsite/CampsiteGallery';
import { GalleryLightbox } from '@/components/campsite/GalleryLightbox';
import { AccommodationSection } from '@/components/campsite/AccommodationSection';
import { AttractionsSection } from '@/components/campsite/AttractionsSection';
import { MobileBookingBar } from '@/components/campsite/MobileBookingBar';
import { InlineShareButtons } from '@/components/campsite/ShareButtons';
import { InquiryDialog } from '@/components/inquiry';
import { ReviewsSection } from '@/components/reviews';

interface CampsiteDetailContentProps {
  campsite: CampsiteDetail;
}

export function CampsiteDetailContent({ campsite }: CampsiteDetailContentProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  const handleShare = () => {
    // Native share will be handled by ShareButtons component
  };

  const handleWishlist = async () => {
    setIsWishlisted(!isWishlisted);
    // TODO: Implement actual wishlist API call
  };

  const handleInquiry = () => {
    setIsInquiryOpen(true);
  };

  return (
    <div className="min-h-screen bg-background-warm">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 lg:py-8">
        {/* Hero Section with Gallery Preview */}
        <HeroSection
          campsite={campsite}
          onOpenGallery={() => setIsGalleryOpen(true)}
          onShare={handleShare}
          onWishlist={handleWishlist}
          isWishlisted={isWishlisted}
        />

        {/* Two Column Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Section */}
            <DescriptionSection campsite={campsite} />

            {/* Photo Gallery (full view) */}
            {campsite.photos.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 text-brand-text">รูปภาพ</h2>
                <CampsiteGallery
                  photos={campsite.photos}
                  campsiteName={campsite.name}
                />
              </section>
            )}

            {/* Amenities Section */}
            <AmenitiesSection amenities={campsite.amenities} />

            {/* Location Section */}
            <LocationSection campsite={campsite} />

            {/* Accommodation Section */}
            <AccommodationSection
              accommodations={campsite.accommodation_types}
              bookingUrl={campsite.booking_url}
            />

            {/* Nearby Attractions */}
            <AttractionsSection
              campsiteId={campsite.id}
              campsiteLocation={{
                lat: campsite.latitude,
                lng: campsite.longitude,
              }}
            />

            {/* Contact Section */}
            <ContactSection campsite={campsite} />

            {/* Reviews Section */}
            <ReviewsSection
              campsiteId={campsite.id}
              summary={campsite.review_summary}
              initialReviews={campsite.recent_reviews}
              totalReviews={campsite.review_count}
            />

            {/* Share Section */}
            <section className="py-4 border-t">
              <InlineShareButtons
                title={campsite.name}
                description={campsite.description || `Check out ${campsite.name} on Camping Thailand`}
              />
            </section>
          </div>

          {/* Sidebar Column (Desktop) */}
          <div className="hidden lg:block">
            <BookingSidebar campsite={campsite} onInquiry={handleInquiry} />
          </div>
        </div>
      </main>

      {/* Mobile Booking Bar (Fixed Bottom) */}
      <MobileBookingBar campsite={campsite} onInquiry={handleInquiry} />

      {/* Gallery Lightbox */}
      <GalleryLightbox
        photos={campsite.photos}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        campsiteName={campsite.name}
      />

      {/* Inquiry Dialog */}
      <InquiryDialog
        campsiteId={campsite.id}
        campsiteName={campsite.name}
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
      />
    </div>
  );
}
