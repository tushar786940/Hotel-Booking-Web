'use client';

import React from 'react';
import Link from 'next/link';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-secondary-900 text-secondary-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <HiOutlineBuildingOffice2 className="text-white text-lg" />
              </div>
              <span className="text-xl font-bold text-white">StayHub</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Discover and book the perfect hotel for your next adventure. From luxury resorts to cozy boutique stays.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                <FaFacebook className="text-sm" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                <FaTwitter className="text-sm" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                <FaInstagram className="text-sm" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                <FaLinkedin className="text-sm" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/search" className="hover:text-white transition-colors">
                  Search Hotels
                </Link>
              </li>
              <li>
                <Link href="/search?sort_by=rating" className="hover:text-white transition-colors">
                  Top Rated
                </Link>
              </li>
              <li>
                <Link href="/search?sort_by=price_asc" className="hover:text-white transition-colors">
                  Best Deals
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-white transition-colors">
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">Help Center</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Cancellation Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <FiMail className="text-primary-400" />
                <a href="mailto:support@stayhub.com" className="hover:text-white transition-colors">
                  support@stayhub.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <FiPhone className="text-primary-400" />
                <a href="tel:+1234567890" className="hover:text-white transition-colors">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-start gap-2">
                <FiMapPin className="text-primary-400 mt-0.5" />
                <span>123 Travel Street, New York, NY 10001</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-secondary-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} StayHub. All rights reserved.</p>
          <p className="text-secondary-500">
            Made with ❤️ for travelers worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}