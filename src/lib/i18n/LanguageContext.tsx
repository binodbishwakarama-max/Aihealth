'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import en from './translations/en';
import hi from './translations/hi';
import bn from './translations/bn';
import ta from './translations/ta';
import te from './translations/te';
import kn from './translations/kn';
import mr from './translations/mr';
import type { TranslationKeys } from './translations/en';

export type SupportedLanguage = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'kn' | 'mr';

export const LANGUAGES: { code: SupportedLanguage; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
];

const translations: Record<SupportedLanguage, TranslationKeys> = {
    en,
    hi: hi as unknown as TranslationKeys,
    bn: bn as unknown as TranslationKeys,
    ta: ta as unknown as TranslationKeys,
    te: te as unknown as TranslationKeys,
    kn: kn as unknown as TranslationKeys,
    mr: mr as unknown as TranslationKeys,
};

// Language name mapping for AI prompts
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English',
    hi: 'Hindi',
    bn: 'Bengali',
    ta: 'Tamil',
    te: 'Telugu',
    kn: 'Kannada',
    mr: 'Marathi',
};

interface LanguageContextType {
    lang: SupportedLanguage;
    setLang: (lang: SupportedLanguage) => void;
    t: TranslationKeys;
    languageName: string;
}

const LanguageContext = createContext<LanguageContextType>({
    lang: 'en',
    setLang: () => { },
    t: en,
    languageName: 'English',
});

const STORAGE_KEY = 'healthlens-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<SupportedLanguage>('en');
    const [mounted, setMounted] = useState(false);

    // Load saved language from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
        const timer = window.setTimeout(() => {
            if (saved && translations[saved]) {
                setLangState(saved);
            }
            setMounted(true);
        }, 0);

        return () => {
            if (timer !== undefined) {
                clearTimeout(timer);
            }
        };
    }, []);

    const setLang = useCallback((newLang: SupportedLanguage) => {
        setLangState(newLang);
        localStorage.setItem(STORAGE_KEY, newLang);
        // Update the html lang attribute
        document.documentElement.lang = newLang;
    }, []);

    const t = translations[lang] || en;
    const languageName = LANGUAGE_NAMES[lang];

    // Prevent hydration mismatch — render with default (en) until client mounts
    if (!mounted) {
        return (
            <LanguageContext.Provider value={{ lang: 'en', setLang, t: en, languageName: 'English' }}>
                {children}
            </LanguageContext.Provider>
        );
    }

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, languageName }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export default LanguageContext;
