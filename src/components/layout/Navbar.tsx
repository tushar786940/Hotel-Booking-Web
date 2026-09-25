"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { API_ORIGIN } from "@/lib/config";
import {
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiCalendar,
  FiChevronDown,
  FiShield,
  FiExternalLink,
} from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

export default function Navbar() {
  const { user, isAuthenticated, logout, isHotelOwner } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsProfileDropdownOpen(false);
    router.push("/");
  };

  const isActive = (path: string) => pathname === path;

  // The API returns Spatie role names as plain strings: ["guest"],
  // ["hotel-owner"], ["admin"] — see AuthController@login.
  const isAdmin = isHotelOwner;
  const filamentUrl = `${API_ORIGIN}/admin`;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-secondary-100 shadow-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <HiOutlineBuildingOffice2 className="text-white text-lg" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              StayHub
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive("/")
                  ? "text-primary-600 bg-primary-50"
                  : "text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50",
              )}
            >
              Home
            </Link>
            <Link
              href="/search"
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive("/search")
                  ? "text-primary-600 bg-primary-50"
                  : "text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50",
              )}
            >
              Search Hotels
            </Link>
            {isAuthenticated && (
              <Link
                href="/bookings"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive("/bookings")
                    ? "text-primary-600 bg-primary-50"
                    : "text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50",
                )}
              >
                My Bookings
              </Link>
            )}
          </div>

          {/* Desktop Auth & Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-secondary-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-secondary-700 max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <FiChevronDown
                    className={cn(
                      "text-secondary-400 transition-transform duration-200",
                      isProfileDropdownOpen && "rotate-180",
                    )}
                  />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-secondary-100 py-2 animate-slide-down">
                    <div className="px-4 py-2 border-b border-secondary-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-secondary-900">
                          {user?.name}
                        </p>
                        {isAdmin && (
                          <span className="text-[10px] bg-primary-100 text-primary-700 font-bold px-1.5 py-0.5 rounded uppercase">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary-500 truncate">
                        {user?.email}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                    >
                      <FiUser className="text-secondary-400" />
                      Profile
                    </Link>
                    <Link
                      href="/bookings"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                    >
                      <FiCalendar className="text-secondary-400" />
                      My Bookings
                    </Link>

                    {/* Admin Links Section */}
                    {isAdmin && (
                      <>
                        <hr className="my-1 border-secondary-100" />
                        {/* <Link
                          href="/admin"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                        >
                          <HiOutlineBuildingOffice2 className="text-secondary-400 text-base" />
                          Web Dashboard
                        </Link> */}
                        {/* Filament Backend Link */}
                        <a
                          href={filamentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50 font-medium transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FiShield className="text-primary-500" />
                            Filament Admin Panel
                          </div>
                          <FiExternalLink className="text-xs text-primary-400" />
                        </a>
                      </>
                    )}

                    <hr className="my-1 border-secondary-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors w-full"
                    >
                      <FiLogOut className="text-danger-400" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-secondary-700 hover:text-secondary-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm hover:shadow-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-secondary-600 hover:bg-secondary-50 transition-colors"
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-secondary-100 animate-slide-down">
          <div className="px-4 py-4 space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive("/")
                  ? "text-primary-600 bg-primary-50"
                  : "text-secondary-600 hover:bg-secondary-50",
              )}
            >
              Home
            </Link>
            <Link
              href="/search"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive("/search")
                  ? "text-primary-600 bg-primary-50"
                  : "text-secondary-600 hover:bg-secondary-50",
              )}
            >
              Search Hotels
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/bookings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-secondary-600 hover:bg-secondary-50"
                >
                  My Bookings
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-secondary-600 hover:bg-secondary-50"
                >
                  Profile
                </Link>

                {/* Mobile Admin Links */}
                {isAdmin && (
                  <div className="pt-2 border-t border-secondary-100 mt-2 space-y-1">
                    {/* <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-medium text-secondary-700 hover:bg-secondary-50"
                    >
                      Web Dashboard
                    </Link> */}
                    <a
                      href={filamentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-primary-600 bg-primary-50/60 hover:bg-primary-100/60"
                    >
                      <span>Filament Admin Panel</span>
                      <FiExternalLink size={16} />
                    </a>
                  </div>
                )}

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-danger-600 hover:bg-danger-50"
                >
                  Sign Out
                </button>
              </>
            )}
            {!isAuthenticated && (
              <div className="pt-2 flex gap-3">
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center px-4 py-3 rounded-xl text-sm font-medium border-2 border-primary-600 text-primary-600 hover:bg-primary-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center px-4 py-3 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
