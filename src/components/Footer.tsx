'use client';

import { Activity } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

interface FooterProps {
  appName?: string;
  primaryColor?: string;
}

export function Footer({ appName = 'HealthLens', primaryColor = '#0d9488' }: FooterProps) {
  const { t } = useLanguage();

  return (
    <footer className="bg-teal-50 border-t border-teal-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-6 w-6" style={{ color: primaryColor }} />
              <span className="font-bold text-lg text-gray-900">{appName}</span>
            </div>
            <p className="text-sm text-gray-600 max-w-md">
              {t.footer.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                  {t.footer.home}
                </Link>
              </li>
              <li>
                <Link href="/checker" className="text-sm text-gray-600 hover:text-gray-900">
                  {t.footer.symptomChecker}
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-sm text-gray-600 hover:text-gray-900">
                  {t.footer.myHistory}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t.footer.legal}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
                  {t.footer.medicalDisclaimer}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-xs text-gray-500 mb-2">
            {t.footer.educationalOnly}
          </p>
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {appName}. {t.footer.copyright.replace('© {year} {appName}. ', '')}
          </p>
        </div>
      </div>
    </footer>
  );
}

