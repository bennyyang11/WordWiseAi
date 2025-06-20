import React from 'react';

export interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

export const POPULAR_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱', nativeName: 'Polski' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱', nativeName: 'Nederlands' }
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  showNativeNames?: boolean;
  compact?: boolean;
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  showNativeNames = true,
  compact = false,
  className = ''
}) => {
  const selectedLang = POPULAR_LANGUAGES.find(lang => lang.code === selectedLanguage) || POPULAR_LANGUAGES[0];

  return (
    <div className={`relative ${className}`}>
      <label className={`block text-sm font-medium mb-2 ${compact ? 'sr-only' : ''}`}>
        🌍 Suggestion Language:
      </label>
      
      <div className="relative">
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className={`
            appearance-none bg-white border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-200
            ${compact ? 'px-3 py-2 pr-8 text-sm' : 'px-4 py-3 pr-10'}
            ${compact ? 'w-auto' : 'w-full'}
          `}
        >
          {POPULAR_LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.flag} {language.name}
              {showNativeNames && language.code !== 'en' ? ` (${language.nativeName})` : ''}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Show current selection with flag */}
      {!compact && (
        <div className="mt-2 text-sm text-gray-600">
          <span className="inline-flex items-center">
            <span className="mr-2 text-lg">{selectedLang.flag}</span>
            {selectedLanguage === 'en' ? (
              <span>Suggestions will be in English only</span>
            ) : (
              <span>
                Suggestions will be in <strong>English + {selectedLang.name}</strong>
                {showNativeNames && ` (${selectedLang.nativeName})`}
              </span>
            )}
          </span>
        </div>
      )}
      
      {selectedLanguage !== 'en' && (
        <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
          💡 Explanations will be provided in both English and {selectedLang.name} to help you learn better!
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 