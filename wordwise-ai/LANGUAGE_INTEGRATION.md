# 🌐 Language Selector Integration Guide

## Overview

This guide shows how to integrate the new `LanguageSelector` component into your existing WordWiseAI application to enable dynamic language switching for bilingual suggestions.

## Available Languages

The selector includes 15 popular languages for ESL students:

| Language | Flag | Native Name | Code |
|----------|------|-------------|------|
| English | 🇺🇸 | English | en |
| Spanish | 🇪🇸 | Español | es |
| Chinese | 🇨🇳 | 中文 | zh |
| French | 🇫🇷 | Français | fr |
| German | 🇩🇪 | Deutsch | de |
| Japanese | 🇯🇵 | 日本語 | ja |
| Korean | 🇰🇷 | 한국어 | ko |
| Arabic | 🇸🇦 | العربية | ar |
| Portuguese | 🇵🇹 | Português | pt |
| Italian | 🇮🇹 | Italiano | it |
| Russian | 🇷🇺 | Русский | ru |
| Hindi | 🇮🇳 | हिन्दी | hi |
| Turkish | 🇹🇷 | Türkçe | tr |
| Polish | 🇵🇱 | Polski | pl |
| Dutch | 🇳🇱 | Nederlands | nl |

## Integration into TextEditor

### Step 1: Import the Component

```tsx
import LanguageSelector, { POPULAR_LANGUAGES } from './LanguageSelector';
```

### Step 2: Add State Management

```tsx
const [selectedLanguage, setSelectedLanguage] = useState('en');

// Initialize from user profile
useEffect(() => {
  if (userProfile?.nativeLanguage) {
    const language = POPULAR_LANGUAGES.find(lang => 
      lang.name.toLowerCase() === userProfile.nativeLanguage.toLowerCase()
    );
    if (language) {
      setSelectedLanguage(language.code);
    }
  }
}, [userProfile]);
```

### Step 3: Handle Language Changes

```tsx
const handleLanguageChange = (languageCode: string) => {
  setSelectedLanguage(languageCode);
  
  // Update user profile
  if (userProfile) {
    const selectedLang = POPULAR_LANGUAGES.find(lang => lang.code === languageCode);
    const updatedProfile = {
      ...userProfile,
      nativeLanguage: selectedLang?.name || 'English'
    };
    setUserProfile(updatedProfile);
    
    // Trigger re-analysis with new language
    if (currentDocument?.content?.trim().length > 10) {
      performAnalysis(currentDocument.content, updatedProfile);
    }
  }
};
```

### Step 4: Add to UI (Compact Version)

```tsx
// In your toolbar or header area
<div className="flex items-center space-x-3">
  <LanguageSelector
    selectedLanguage={selectedLanguage}
    onLanguageChange={handleLanguageChange}
    compact={true}
    showNativeNames={false}
    className="min-w-[140px]"
  />
  
  {/* Optional: Language status indicator */}
  {selectedLanguageData && (
    <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm">
      <span className="text-lg">{selectedLanguageData.flag}</span>
      <div className="text-xs">
        <div className="font-semibold">
          {selectedLanguage === 'en' ? 'English Only' : 'Bilingual Mode'}
        </div>
        <div className="text-gray-500">
          {selectedLanguage === 'en' ? 'Monolingual' : `EN + ${selectedLanguageData.name}`}
        </div>
      </div>
    </div>
  )}
</div>
```

## Usage Examples

### Full Layout Example

```tsx
// Enhanced stats bar with language selector
<div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200 px-4 py-3">
  <div className="flex items-center justify-between">
    {/* Left: Writing Stats */}
    <div className="flex items-center space-x-4">
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-white px-3 py-2 rounded-md shadow-sm text-center">
          <div className="text-blue-600 font-medium text-xs">Words</div>
          <div className="text-lg font-bold text-blue-800">{wordCount}</div>
        </div>
        {/* ... other stats */}
      </div>
    </div>

    {/* Right: Language Selector */}
    <div className="flex items-center space-x-3">
      <div className="bg-white rounded-md shadow-sm p-2">
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          compact={true}
          showNativeNames={false}
        />
      </div>
    </div>
  </div>
</div>
```

### Suggestions Panel Integration

```tsx
{/* Show bilingual indicator in suggestions */}
{showSuggestions && suggestions.length > 0 && (
  <div className="border-t border-gray-200 bg-gray-50">
    <div className="p-4">
      <h3 className="font-semibold mb-3 flex items-center">
        <span className="mr-2">💡</span>
        Suggestions 
        {selectedLanguage !== 'en' && selectedLanguageData && (
          <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center">
            {selectedLanguageData.flag} Bilingual Mode
          </span>
        )}
      </h3>
      
      {/* Render suggestions with bilingual indicators */}
      {suggestions.map((suggestion, index) => (
        <div key={index} className="bg-white p-3 rounded-md border">
          {/* ... suggestion content ... */}
          
          {suggestion.explanation.includes('|') && selectedLanguageData && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded flex items-center">
              <span className="mr-2">{selectedLanguageData.flag}</span>
              Explanation provided in English + {selectedLanguageData.name}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

## Component Props

### LanguageSelector Props

```tsx
interface LanguageSelectorProps {
  selectedLanguage: string;          // Current language code
  onLanguageChange: (code: string) => void; // Callback when language changes
  showNativeNames?: boolean;         // Show native language names (default: true)
  compact?: boolean;                 // Compact mode for toolbars (default: false)
  className?: string;                // Additional CSS classes
}
```

### Usage Variations

```tsx
// Full version (for settings pages)
<LanguageSelector
  selectedLanguage={language}
  onLanguageChange={setLanguage}
  showNativeNames={true}
  compact={false}
/>

// Compact version (for toolbars)
<LanguageSelector
  selectedLanguage={language}
  onLanguageChange={setLanguage}
  showNativeNames={false}
  compact={true}
  className="min-w-[120px]"
/>
```

## Styling Integration

The component uses Tailwind CSS classes that match your existing design:

- `bg-white` - White background
- `border-gray-300` - Light gray borders
- `focus:ring-blue-500` - Blue focus rings
- `text-gray-600` - Gray text colors
- Responsive design with `w-full` and `w-auto` options

## Dynamic Language Features

### Real-time Language Switching

When a user changes the language:

1. **Immediate UI Update**: Language selector updates immediately
2. **Profile Sync**: User profile is updated with new native language
3. **Re-analysis**: If there's existing text, it's re-analyzed with the new language
4. **Cache Update**: Analysis cache includes language-specific keys

### Bilingual Indicators

- **Dropdown shows flags**: Visual indication of each language
- **Status indicators**: Show current mode (English Only vs Bilingual)
- **Suggestion markers**: Highlight when explanations are bilingual
- **Native names**: Optional display of language names in native script

## Integration Tips

1. **Placement**: Best in toolbars, headers, or settings areas
2. **State Management**: Sync with user profile and analysis system
3. **Performance**: Use compact mode in space-constrained areas
4. **Accessibility**: Component includes proper labels and keyboard navigation
5. **Responsive**: Adapts to different screen sizes

---

**Next Steps**: 
1. Add the LanguageSelector to your main TextEditor component
2. Test with different languages using the BilingualDemo
3. Customize styling to match your app's design system
4. Consider adding language preferences to user settings 