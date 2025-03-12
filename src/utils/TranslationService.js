// TranslationService.js
// A simple utility for translating text using the LibreTranslate API (free and open source)

// Default free LibreTranslate public instance - for production, consider setting up your own instance
// or using a paid service with better reliability
const LIBRE_TRANSLATE_API = process.env.REACT_APP_TRANSLATE_API || "https://libretranslate.de/translate";
const LIBRE_TRANSLATE_API_KEY = process.env.REACT_APP_LIBRE_TRANSLATE_API_KEY;

/**
 * Translates text using the LibreTranslate API
 * @param {string} text - The text to translate
 * @param {string} targetLang - The target language code (e.g., 'es', 'fr')
 * @param {string} sourceLang - The source language code (defaults to 'auto' for auto-detection)
 * @returns {Promise<string>} - The translated text
 */
export const translateText = async (text, targetLang, sourceLang = 'auto') => {
  if (!text || text.trim() === '') return '';
  
  try {
    const requestBody = {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text',
    };
    
    // Add API key if available
    if (LIBRE_TRANSLATE_API_KEY) {
      requestBody.api_key = LIBRE_TRANSLATE_API_KEY;
    }
    
    const response = await fetch(LIBRE_TRANSLATE_API, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Translation error:', errorData);
      throw new Error(`Translation failed: ${errorData.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Translation request failed:', error);
    // Return original text if translation fails
    return text;
  }
};

/**
 * Checks if the translation API is available
 * @returns {Promise<boolean>} - True if the API is available
 */
export const checkTranslationApiAvailability = async () => {
  try {
    // Construct URL for languages endpoint
    const languagesEndpoint = LIBRE_TRANSLATE_API.replace('/translate', '/languages');
    
    // Add API key as query parameter if available
    let url = languagesEndpoint;
    if (LIBRE_TRANSLATE_API_KEY) {
      url = `${languagesEndpoint}?api_key=${encodeURIComponent(LIBRE_TRANSLATE_API_KEY)}`;
    }
    
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    console.error('Translation API check failed:', error);
    return false;
  }
};

/**
 * Map between i18next language codes and LibreTranslate language codes
 * This is necessary because some language codes differ between the two systems
 */
export const languageCodeMap = {
  'en': 'en', // English
  'cy': 'cy', // Welsh - may not be supported by all translation APIs
  'ar': 'ar', // Arabic
  'es': 'es', // Spanish
  'it': 'it', // Italian
  'fr': 'fr', // French
  'ja': 'ja', // Japanese
  'vi': 'vi', // Vietnamese
  'zh': 'zh', // Chinese (Simplified)
  
  // Fallbacks if specific codes aren't supported
  'cy': 'en', // Fallback for Welsh if not supported
  'ja': 'zh', // Fallback for Japanese if not supported
};

/**
 * Get the corresponding translation API language code for an i18next language code
 * @param {string} i18nCode - The i18next language code
 * @returns {string} - The translation API language code
 */
export const getTranslationApiCode = (i18nCode) => {
  return languageCodeMap[i18nCode] || 'en'; // Default to English if not found
}; 