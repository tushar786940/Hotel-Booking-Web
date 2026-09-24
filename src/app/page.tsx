'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Hotel } from '@/types';
import { hotelsApi } from '@/lib/api';
import SearchBar from '@/components/layout/SearchBar';
import HotelCard from '@/components/hotels/HotelCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FiShield, FiStar, FiClock, FiMapPin } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';

const popularDestinations = [
  { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400', count: 245 },
  { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400', count: 189 },
  { name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400', count: 167 },
  { name: 'Tokyo', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400', count: 134 },
  { name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400', count: 112 },
  { name: 'Barcelona', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400', count: 98 },
];

const features = [
  {
    icon: <FiShield className="text-2xl" />,
    title: 'Secure Booking',
    description: 'Your payments are protected with industry-standard encryption.',
  },
  {
    icon: <FiStar className="text-2xl" />,
    title: 'Verified Reviews',
    description: 'Real reviews from real guests who have stayed at the property.',
  },
  {
    icon: <FiClock className="text-2xl" />,
    title: '24/7 Support',
    description: 'Our team is available around the clock to help with your booking.',
  },
  {
    icon: <FiMapPin className="text-2xl" />,
    title: 'Best Locations',
    description: 'Handpicked hotels in the best locations worldwide.',
  },
];

export default function HomePage() {
  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await hotelsApi.list({ per_page: 6, sort_by: 'rating' });
        const hotels = response.data.data || response.data;
        setFeaturedHotels(Array.isArray(hotels) ? hotels : []);
      } catch (error) {
        console.error('Failed to fetch hotels:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%),
                              radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`,
            backgroundSize: '100px 100px',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <HiOutlineSparkles className="text-amber-400" />
              <span className="text-white/90 text-sm font-medium">Discover amazing stays worldwide</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
                Home Away From Home
              </span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Explore thousands of hotels, resorts, and unique stays. Book with confidence and create unforgettable memories.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-5xl mx-auto">
            <SearchBar variant="hero" />
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {[
              { value: '10K+', label: 'Hotels' },
              { value: '50K+', label: 'Happy Guests' },
              { value: '100+', label: 'Cities' },
              { value: '4.8', label: 'Avg Rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="page-container">
        <div className="text-center mb-10">
          <h2 className="section-title">Popular Destinations</h2>
          <p className="section-subtitle">Explore trending cities loved by travelers</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularDestinations.map((dest) => (
            <Link
              key={dest.name}
              href={`/search?city=${dest.name}`}
              className="group relative rounded-2xl overflow-hidden h-48 md:h-56"
            >
              <Image
                src={dest.image}
                alt={dest.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-white font-semibold text-lg">{dest.name}</h3>
                <p className="text-white/70 text-sm">{dest.count} hotels</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="page-container bg-white -mx-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="section-title">Featured Hotels</h2>
              <p className="section-subtitle">Handpicked hotels for exceptional stays</p>
            </div>
            <Link
              href="/search"
              className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              View all hotels →
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" message="Loading hotels..." />
            </div>
          ) : featuredHotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-secondary-500">
              <p className="text-lg">No hotels found. Check back soon!</p>
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              View All Hotels →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-container">
        <div className="text-center mb-10">
          <h2 className="section-title">Why Choose StayHub?</h2>
          <p className="section-subtitle">We make hotel booking simple, secure, and delightful</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 border border-secondary-100 hover:shadow-card transition-shadow text-center"
            >
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-secondary-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-secondary-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="page-container">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready for Your Next Adventure?
          </h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Sign up today and get exclusive access to deals, early bird discounts, and personalized recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-white text-primary-700 rounded-xl font-semibold hover:bg-white/90 transition-colors shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/search"
              className="px-8 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              Browse Hotels
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}