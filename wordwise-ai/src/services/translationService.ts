// Translation service for bilingual suggestions
export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
];

// Grammar and spelling error translations
const GRAMMAR_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Spelling errors
  'Spelling error': {
    es: 'Error de ortografía',
    fr: 'Erreur d\'orthographe',
    de: 'Rechtschreibfehler',
    it: 'Errore di ortografia',
    pt: 'Erro de ortografia',
    zh: '拼写错误',
    ja: 'スペル間違い',
    ko: '철자 오류',
    ar: 'خطأ إملائي',
    ru: 'Орфографическая ошибка',
    hi: 'वर्तनी की त्रुटि',
    nl: 'Spellingsfout',
    sv: 'Stavfel',
    pl: 'Błąd ortograficzny',
    tr: 'Yazım hatası'
  },
  
  // Grammar errors
  'Grammar error': {
    es: 'Error de gramática',
    fr: 'Erreur de grammaire',
    de: 'Grammatikfehler',
    it: 'Errore di grammatica',
    pt: 'Erro de gramática',
    zh: '语法错误',
    ja: '文法エラー',
    ko: '문법 오류',
    ar: 'خطأ نحوي',
    ru: 'Грамматическая ошибка',
    hi: 'व्याकरण की त्रुटि',
    nl: 'Grammaticafout',
    sv: 'Grammatikfel',
    pl: 'Błąd gramatyczny',
    tr: 'Dilbilgisi hatası'
  },
  
  // Specific grammar issues
  'Subject-verb agreement error': {
    es: 'Error de concordancia sujeto-verbo',
    fr: 'Erreur d\'accord sujet-verbe',
    de: 'Subjekt-Verb-Kongruenzfehler',
    it: 'Errore di concordanza soggetto-verbo',
    pt: 'Erro de concordância sujeito-verbo',
    zh: '主谓一致错误',
    ja: '主語と動詞の一致エラー',
    ko: '주어-동사 일치 오류',
    ar: 'خطأ في تطابق الفاعل والفعل',
    ru: 'Ошибка согласования подлежащего и сказуемого',
    hi: 'कर्ता-क्रिया मेल की त्रुटि',
    nl: 'Onderwerp-werkwoord concordantie fout',
    sv: 'Subjekt-verb överensstämmelsefel',
    pl: 'Błąd zgodności podmiotu z orzeczeniem',
    tr: 'Özne-yüklem uyuşmazlığı hatası'
  },
  
  'Missing apostrophe': {
    es: 'Falta apostrofe',
    fr: 'Apostrophe manquante',
    de: 'Fehlender Apostroph',
    it: 'Apostrofo mancante',
    pt: 'Apóstrofo em falta',
    zh: '缺少撇号',
    ja: 'アポストロフィが不足',
    ko: '어포스트로피 누락',
    ar: 'علامة الحذف مفقودة',
    ru: 'Отсутствует апостроф',
    hi: 'एपॉस्ट्रॉफी गुम',
    nl: 'Ontbrekende apostrof',
    sv: 'Saknad apostrof',
    pl: 'Brak apostrofu',
    tr: 'Eksik apostrof'
  },
  
  'Incorrect verb form': {
    es: 'Forma verbal incorrecta',
    fr: 'Forme verbale incorrecte',
    de: 'Falsche Verbform',
    it: 'Forma verbale incorretta',
    pt: 'Forma verbal incorreta',
    zh: '动词形式错误',
    ja: '間違った動詞形',
    ko: '잘못된 동사 형태',
    ar: 'شكل فعل خاطئ',
    ru: 'Неверная форма глагола',
    hi: 'गलत क्रिया रूप',
    nl: 'Onjuiste werkwoordvorm',
    sv: 'Fel verbform',
    pl: 'Nieprawidłowa forma czasownika',
    tr: 'Yanlış fiil formu'
  },
  
  'First letter after period must be capitalized': {
    es: 'La primera letra después del punto debe estar en mayúscula',
    fr: 'La première lettre après le point doit être en majuscule',
    de: 'Der erste Buchstabe nach dem Punkt muss großgeschrieben werden',
    it: 'La prima lettera dopo il punto deve essere maiuscola',
    pt: 'A primeira letra após o ponto deve ser maiúscula',
    zh: '句号后的第一个字母必须大写',
    ja: 'ピリオドの後の最初の文字は大文字でなければなりません',
    ko: '마침표 후 첫 글자는 대문자여야 합니다',
    ar: 'يجب أن يكون الحرف الأول بعد النقطة بحروف كبيرة',
    ru: 'Первая буква после точки должна быть заглавной',
    hi: 'पूर्ण विराम के बाद पहला अक्षर बड़ा होना चाहिए',
    nl: 'De eerste letter na de punt moet een hoofdletter zijn',
    sv: 'Första bokstaven efter punkt måste vara stor',
    pl: 'Pierwsza litera po kropce musi być wielka',
    tr: 'Noktadan sonraki ilk harf büyük olmalıdır'
  },
  
  'First letter of text must be capitalized': {
    es: 'La primera letra del texto debe estar en mayúscula',
    fr: 'La première lettre du texte doit être en majuscule',
    de: 'Der erste Buchstabe des Textes muss großgeschrieben werden',
    it: 'La prima lettera del testo deve essere maiuscola',
    pt: 'A primeira letra do texto deve ser maiúscula',
    zh: '文本的第一个字母必须大写',
    ja: 'テキストの最初の文字は大文字でなければなりません',
    ko: '텍스트의 첫 글자는 대문자여야 합니다',
    ar: 'يجب أن يكون الحرف الأول من النص بحروف كبيرة',
    ru: 'Первая буква текста должна быть заглавной',
    hi: 'पाठ का पहला अक्षर बड़ा होना चाहिए',
    nl: 'De eerste letter van de tekst moet een hoofdletter zijn',
    sv: 'Första bokstaven i texten måste vara stor',
    pl: 'Pierwsza litera tekstu musi być wielka',
    tr: 'Metnin ilk harfi büyük olmalıdır'
  }
};

// Vocabulary suggestions
const VOCABULARY_TRANSLATIONS: Record<string, Record<string, string>> = {
  'Consider using more precise academic vocabulary': {
    es: 'Considera usar vocabulario académico más preciso',
    fr: 'Considérez utiliser un vocabulaire académique plus précis',
    de: 'Verwenden Sie präziseres akademisches Vokabular',
    it: 'Considera l\'uso di un vocabolario accademico più preciso',
    pt: 'Considere usar vocabulário acadêmico mais preciso',
    zh: '考虑使用更精确的学术词汇',
    ja: 'より正確な学術語彙の使用を検討してください',
    ko: '더 정확한 학술 어휘 사용을 고려하세요',
    ar: 'فكر في استخدام مفردات أكاديمية أكثر دقة',
    ru: 'Рассмотрите использование более точной академической лексики',
    hi: 'अधिक सटीक शैक्षणिक शब्दावली का उपयोग करने पर विचार करें',
    nl: 'Overweeg het gebruik van meer nauwkeurige academische woordenschat',
    sv: 'Överväg att använda mer precis akademisk vokabulär',
    pl: 'Rozważ użycie bardziej precyzyjnego słownictwa akademickiego',
    tr: 'Daha kesin akademik kelime dağarcığı kullanmayı düşünün'
  },
  
  'Consider using more formal academic language': {
    es: 'Considera usar un lenguaje académico más formal',
    fr: 'Considérez utiliser un langage académique plus formel',
    de: 'Verwenden Sie formalere akademische Sprache',
    it: 'Considera l\'uso di un linguaggio accademico più formale',
    pt: 'Considere usar linguagem acadêmica mais formal',
    zh: '考虑使用更正式的学术语言',
    ja: 'より正式な学術言語の使用を検討してください',
    ko: '더 공식적인 학술 언어 사용을 고려하세요',
    ar: 'فكر في استخدام لغة أكاديمية أكثر رسمية',
    ru: 'Рассмотрите использование более формального академического языка',
    hi: 'अधिक औपचारिक शैक्षणिक भाषा का उपयोग करने पर विचार करें',
    nl: 'Overweeg het gebruik van meer formele academische taal',
    sv: 'Överväg att använda mer formellt akademiskt språk',
    pl: 'Rozważ użycie bardziej formalnego języka akademickiego',
    tr: 'Daha resmi akademik dil kullanmayı düşünün'
  }
};

class TranslationService {
  /**
   * Create a bilingual message combining English and the selected language
   */
  createBilingualMessage(englishMessage: string, languageCode?: string): string {
    if (!languageCode || languageCode.toLowerCase() === 'english' || languageCode === 'en') {
      return englishMessage;
    }
    
    // First try exact match in translations
    const translation = this.getTranslation(englishMessage, languageCode);
    if (translation) {
      return `${englishMessage} | ${translation}`;
    }
    
    // If no exact translation found, return English only with language name
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode || lang.name.toLowerCase() === languageCode.toLowerCase());
    if (language) {
      return `${englishMessage} | [${language.nativeName}]`;
    }
    
    return englishMessage;
  }
  
  /**
   * Get direct translation for a message
   */
  getTranslation(englishMessage: string, languageCode: string): string | null {
    const code = this.getLanguageCode(languageCode);
    if (!code) return null;
    
    // Check grammar translations
    if (GRAMMAR_TRANSLATIONS[englishMessage] && GRAMMAR_TRANSLATIONS[englishMessage][code]) {
      return GRAMMAR_TRANSLATIONS[englishMessage][code];
    }
    
    // Check vocabulary translations
    if (VOCABULARY_TRANSLATIONS[englishMessage] && VOCABULARY_TRANSLATIONS[englishMessage][code]) {
      return VOCABULARY_TRANSLATIONS[englishMessage][code];
    }
    
    return null;
  }
  
  /**
   * Convert language name to language code
   */
  getLanguageCode(languageInput: string): string | null {
    const input = languageInput.toLowerCase();
    
    // Check if it's already a code
    if (SUPPORTED_LANGUAGES.some(lang => lang.code === input)) {
      return input;
    }
    
    // Check if it's a language name
    const language = SUPPORTED_LANGUAGES.find(lang => 
      lang.name.toLowerCase() === input || 
      lang.nativeName.toLowerCase() === input
    );
    
    return language ? language.code : null;
  }
  
  /**
   * Get all supported languages for UI selection
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return SUPPORTED_LANGUAGES;
  }
  
  /**
   * Get language display name
   */
  getLanguageDisplayName(languageCode: string): string {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    return language ? `${language.name} (${language.nativeName})` : languageCode;
  }
}

export const translationService = new TranslationService(); 