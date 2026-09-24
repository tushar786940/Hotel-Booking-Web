'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getImageUrl, cn } from '@/lib/utils';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface HotelGalleryProps {
  images: string[];
  hotelName: string;
}

export default function HotelGallery({ images, hotelName }: HotelGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayImages = images.length > 0 ? images : ['placeholder-hotel.jpg'];

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden h-[300px] md:h-[400px]">
        {/* Main Image */}
        <div
          className="md:col-span-2 md:row-span-2 relative cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={getImageUrl(displayImages[0])}
            alt={`${hotelName} - Main`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* Secondary Images */}
        {displayImages.slice(1, 5).map((image, index) => (
          <div
            key={index}
            className={cn(
              'relative cursor-pointer group hidden md:block',
              index === 3 && displayImages.length > 5 && 'relative'
            )}
            onClick={() => openLightbox(index + 1)}
          >
            <Image
              src={getImageUrl(image)}
              alt={`${hotelName} - ${index + 2}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            
            {/* Show more overlay */}
            {index === 3 && displayImages.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  +{displayImages.length - 5} photos
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile - Show all photos button */}
      {displayImages.length > 1 && (
        <button
          onClick={() => openLightbox(0)}
          className="md:hidden mt-2 w-full py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
        >
          View all {displayImages.length} photos
        </button>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/80 text-sm">
            {currentIndex + 1} / {displayImages.length}
          </div>

          {/* Prev Button */}
          <button
            onClick={goToPrev}
            className="absolute left-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <FiChevronLeft size={24} />
          </button>

          {/* Image */}
          <div className="relative w-full h-full max-w-5xl max-h-[80vh] mx-16">
            <Image
              src={getImageUrl(displayImages[currentIndex])}
              alt={`${hotelName} - ${currentIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <FiChevronRight size={24} />
          </button>

          {/* Thumbnails */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-md px-4">
            {displayImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all',
                  currentIndex === index
                    ? 'border-white opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-75'
                )}
              >
                <Image
                  src={getImageUrl(image)}
                  alt=""
                  width={64}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}