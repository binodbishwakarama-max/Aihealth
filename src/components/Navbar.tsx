"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Menu, X, Activity, History, Shield, CalendarPlus, MessageCircle, Globe, Ambulance, Camera } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { useLanguage, LANGUAGES } from "@/lib/i18n";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { lang, setLang, t } = useLanguage();

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLinks = [
    { href: "/checker", label: t.nav.symptomChecker, icon: Activity },
    { href: "/vision", label: t.nav.visionScanner || 'Vision Scan', icon: Camera },
    { href: "/chat", label: t.nav.aiHealthChat, icon: MessageCircle },
    { href: "/book", label: t.nav.bookAppointment, icon: CalendarPlus },
    { href: "/history", label: t.nav.history, icon: History },
    { href: "/emergency", label: t.nav.emergency || 'Emergency', icon: Ambulance, isEmergency: true },
    { href: "/admin", label: t.nav.admin, icon: Shield },
  ];

  const currentLang = LANGUAGES.find(l => l.code === lang);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative">
                <Activity className="h-8 w-8 text-teal-600" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">HealthLens</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-2 lg:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1 transition-colors text-xs lg:text-sm whitespace-nowrap ${link.isEmergency
                  ? "text-red-500 hover:text-red-600 font-medium"
                  : "text-gray-600 hover:text-teal-600"
                  }`}
                title={link.label}
              >
                <link.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{link.label}</span>
              </Link>
            ))}

            {/* Language Selector */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:text-teal-600 border border-gray-200 rounded-lg hover:border-teal-300 transition-all"
                aria-label="Select language"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden lg:inline">{currentLang?.nativeName}</span>
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  {LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => { setLang(language.code); setIsLangOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-teal-50 transition-colors ${lang === language.code ? 'text-teal-600 bg-teal-50 font-medium' : 'text-gray-700'
                        }`}
                    >
                      <span>{language.nativeName}</span>
                      <span className="text-xs text-gray-400">{language.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Section */}
            <SignedOut>
              <SignInButton mode="modal" fallbackRedirectUrl="/">
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all shadow-md shadow-teal-500/25 text-sm font-semibold cursor-pointer whitespace-nowrap">
                  Get Started
                </span>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Language Selector */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="p-2 text-gray-600 hover:text-teal-600"
                aria-label="Select language"
              >
                <Globe className="h-5 w-5" />
              </button>
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  {LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => { setLang(language.code); setIsLangOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-teal-50 transition-colors ${lang === language.code ? 'text-teal-600 bg-teal-50 font-medium' : 'text-gray-700'
                        }`}
                    >
                      <span>{language.nativeName}</span>
                      <span className="text-xs text-gray-400">{language.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${link.isEmergency
                  ? "text-red-600 hover:bg-red-50 font-medium"
                  : "text-gray-600 hover:text-teal-600 hover:bg-teal-50"
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            ))}

            {/* Mobile Auth */}
            <div className="pt-3 border-t border-gray-100 pb-2 px-3">
              <SignedOut>
                <SignInButton mode="modal" fallbackRedirectUrl="/">
                  <div className="w-full text-center px-4 py-3 text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl transition-colors font-semibold shadow-md cursor-pointer">
                    Get Started
                  </div>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="px-3 py-2">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

