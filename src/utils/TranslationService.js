// TranslationService.js
// A utility for translating text using multiple translation APIs

import { translateText as azureTranslateText, checkAzureTranslatorAvailability } from './AzureTranslationService';

// LibreTranslate API configuration
const LIBRE_TRANSLATE_API = process.env.REACT_APP_TRANSLATE_API || "https://libretranslate.com/translate";
const LIBRE_TRANSLATE_API_KEY = process.env.REACT_APP_LIBRE_TRANSLATE_API_KEY;

// Welsh Translation API configuration
const WELSH_TRANSLATE_API = process.env.REACT_APP_WELSH_TRANSLATE_API || "http://api.techiaith.org/translate-smt/v1/";
const WELSH_TRANSLATE_API_KEY = process.env.REACT_APP_WELSH_TRANSLATE_API_KEY;
const WELSH_TRANSLATE_ENGINE = process.env.REACT_APP_WELSH_TRANSLATE_ENGINE || "CofnodYCynulliad";

// Server proxy endpoint for Welsh Translation API
const SERVER_PROXY_ENDPOINT = process.env.REACT_APP_SERVER_PROXY || '/api/welsh-translate';

// CORS Proxy options - try these if direct API calls fail
const CORS_PROXIES = [
  "https://cors-anywhere.herokuapp.com/",
  "https://api.allorigins.win/raw?url="
];

// Create a simple in-memory cache for translations to avoid redundant API calls
const translationCache = {};

// Track API rate limits
const rateLimitTracking = {
  libre: {
    isLimited: false,
    resetTime: null,
    remaining: 100, // Initial estimate
    requestsThisMinute: 0,
    lastRequestTime: 0
  },
  welsh: {
    isLimited: false,
    resetTime: null,
    remaining: 100, // Initial estimate
    requestsThisMinute: 0,
    lastRequestTime: 0,
    usingProxy: false,
    proxyIndex: -1
  }
};

// Configure translation request throttling
const THROTTLE_DELAY = 500; // ms between requests to avoid rate limiting
let lastRequestTime = Date.now();

// Track service availability
let azureAvailable = null; // null = not checked yet, true/false after check
let libreAvailable = null;
let welshAvailable = null;

/**
 * Translates text using the most appropriate translation service based on language
 * 
 * @param {string} text - The text to translate
 * @param {string} targetLang - The target language code (e.g., 'cy', 'en', 'fr')
 * @param {string} sourceLang - The source language code (defaults to 'en')
 * @returns {Promise<string>} - The translated text
 */
export const translateText = async (text, targetLang, sourceLang = 'en') => {
  if (!text || text.trim() === '') return '';
  
  // Create cache key for this translation request
  const cacheKey = `${text}_${sourceLang}_${targetLang}`;
  
  // Check if we have a cached result
  if (translationCache[cacheKey]) {
    console.log('Using cached translation');
    return translationCache[cacheKey];
  }
  
  // IMPORTANT: Throttle requests to avoid rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < THROTTLE_DELAY) {
    await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
  
  console.log(`Translating from ${sourceLang} to ${targetLang}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
  
  try {
    let translatedText;
    
    // For Welsh translations, try Azure first, then Welsh API
    if (targetLang === 'cy' || sourceLang === 'cy') {
      // Check if Azure is available (only once)
      if (azureAvailable === null) {
        azureAvailable = await checkAzureTranslatorAvailability();
        console.log(`Azure Translator available: ${azureAvailable}`);
      }
      
      // Try Azure Translator first if available
      if (azureAvailable) {
        try {
          translatedText = await azureTranslateText(text, targetLang, sourceLang);
          console.log('Azure translation successful');
          
          // Cache the result
          translationCache[cacheKey] = translatedText;
          return translatedText;
        } catch (error) {
          console.error('Azure translation failed, falling back to Welsh API:', error);
          // Continue to Welsh API
        }
      }
      
      // Try Welsh API as fallback for Welsh translations
      if (targetLang === 'cy' && sourceLang === 'en') {
        translatedText = await translateWithWelshAPI(text);
      } else if (targetLang === 'en' && sourceLang === 'cy') {
        translatedText = await translateWithWelshAPI(text, true); // Reverse translation
      }
    } else {
      // For non-Welsh translations, try Azure first, then LibreTranslate
      if (azureAvailable === null) {
        azureAvailable = await checkAzureTranslatorAvailability();
        console.log(`Azure Translator available: ${azureAvailable}`);
      }
      
      if (azureAvailable) {
        try {
          translatedText = await azureTranslateText(text, targetLang, sourceLang);
          console.log('Azure translation successful');
          
          // Cache the result
          translationCache[cacheKey] = translatedText;
          return translatedText;
        } catch (error) {
          console.error('Azure translation failed, falling back to LibreTranslate:', error);
          // Continue to LibreTranslate
        }
      }
      
      // Use LibreTranslate as fallback
      translatedText = await translateWithLibreTranslate(text, targetLang, sourceLang);
    }
    
    // Cache the result
    translationCache[cacheKey] = translatedText;
    
    return translatedText;
  } catch (error) {
    console.error('Translation request failed:', error);
    return text; // Return original text on failure
  }
};

/**
 * Translates text using the Welsh Translation API
 * 
 * @param {string} text - The text to translate
 * @param {boolean} reverse - Whether to translate from Welsh to English (default is English to Welsh)
 * @returns {Promise<string>} - The translated text
 */
const translateWithWelshAPI = async (text, reverse = false) => {
  try {
    // Check if Welsh API is available (only once)
    if (welshAvailable === null) {
      try {
        const testResponse = await fetch(`${WELSH_TRANSLATE_API}`, {
          method: 'HEAD',
        });
        welshAvailable = testResponse.ok;
        console.log(`Welsh API available: ${welshAvailable}`);
      } catch (error) {
        welshAvailable = false;
        console.error('Welsh API availability check failed:', error);
      }
    }
    
    if (!welshAvailable) {
      throw new Error('Welsh Translation API is not available');
    }
    
    if (!WELSH_TRANSLATE_API_KEY) {
      console.error('Welsh Translation API key not found');
      throw new Error('Welsh Translation API key not found');
    }
    
    const direction = reverse ? 'cy-en' : 'en-cy';
    const url = `${WELSH_TRANSLATE_API}?lang=${direction}&api_key=${WELSH_TRANSLATE_API_KEY}&engine=${WELSH_TRANSLATE_ENGINE}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `text=${encodeURIComponent(text)}`,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Welsh Translation API error:', errorText);
      throw new Error(`Welsh Translation API failed: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.translation) {
      throw new Error('Invalid response from Welsh Translation API');
    }
    
    return data.translation;
  } catch (error) {
    console.error('Welsh translation request failed:', error);
    throw error;
  }
};

/**
 * Translates text using the LibreTranslate API
 * 
 * @param {string} text - The text to translate
 * @param {string} targetLang - The target language code
 * @param {string} sourceLang - The source language code
 * @returns {Promise<string>} - The translated text
 */
const translateWithLibreTranslate = async (text, targetLang, sourceLang) => {
  try {
    // Check if LibreTranslate is available (only once)
    if (libreAvailable === null) {
      try {
        const testResponse = await fetch(`${LIBRE_TRANSLATE_API}`, {
          method: 'HEAD',
        });
        libreAvailable = testResponse.ok;
        console.log(`LibreTranslate available: ${libreAvailable}`);
      } catch (error) {
        libreAvailable = false;
        console.error('LibreTranslate availability check failed:', error);
      }
    }
    
    if (!libreAvailable) {
      throw new Error('LibreTranslate API is not available');
    }
    
    const requestBody = {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: "text",
    };
    
    if (LIBRE_TRANSLATE_API_KEY) {
      requestBody.api_key = LIBRE_TRANSLATE_API_KEY;
    }
    
    const response = await fetch(LIBRE_TRANSLATE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('LibreTranslate error:', errorText);
      throw new Error(`LibreTranslate failed: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.translatedText) {
      throw new Error('Invalid response from LibreTranslate');
    }
    
    return data.translatedText;
  } catch (error) {
    console.error('LibreTranslate request failed:', error);
    throw error;
  }
};

// Dictionary of common Welsh-English translations for small words
const welshDictionary = {
  // Common Welsh words with English translations
  'a': 'and',
  'ac': 'and',
  'i': 'to',
  'y': 'the',
  'yr': 'the',
  'yn': 'in',
  'ar': 'on',
  'o': 'from',
  'am': 'for',
  'gan': 'by',
  'ei': 'his/her',
  'eu': 'their',
  'mae': 'is',
  'sydd': 'is',
  'yw': 'is',
  'oedd': 'was',
  'roedd': 'was',
  'bydd': 'will be',
  'fydd': 'will be',
  'wedi': 'after',
  'cyn': 'before',
  'gyda': 'with',
  'heb': 'without',
  'dros': 'over',
  'dan': 'under',
  'trwy': 'through',
  'fel': 'like',
  'felly': 'so',
  'ond': 'but',
  'hefyd': 'also',
  'nawr': 'now',
  'rwan': 'now',
  'yma': 'here',
  'yna': 'there',
  'acw': 'yonder',
  'hwn': 'this',
  'hon': 'this',
  'hyn': 'this',
  'hwnnw': 'that',
  'honno': 'that',
  'hynny': 'that',
  'pwy': 'who',
  'beth': 'what',
  'ble': 'where',
  'pryd': 'when',
  'sut': 'how',
  'pam': 'why',
  'faint': 'how much',
  'sawl': 'how many',
  'pa': 'which',
  'dim': 'no',
  'ddim': 'not',
  'ie': 'yes',
  'nage': 'no',
  'na': 'no',
  'un': 'one',
  'dau': 'two',
  'dwy': 'two',
  'tri': 'three',
  'tair': 'three',
  'pedwar': 'four',
  'pedair': 'four',
  'pump': 'five',
  
  // Common English words with Welsh translations
  'the': 'y',
  'a': 'un',
  'an': 'un',
  'and': 'a',
  'or': 'neu',
  'but': 'ond',
  'if': 'os',
  'of': 'o',
  'in': 'yn',
  'on': 'ar',
  'at': 'yn',
  'to': 'i',
  'for': 'ar gyfer',
  'with': 'gyda',
  'by': 'gan',
  'from': 'o',
  'up': 'i fyny',
  'down': 'i lawr',
  'over': 'dros',
  'under': 'o dan',
  'yes': 'ie',
  'no': 'na',
  'one': 'un',
  'two': 'dau',
  'three': 'tri',
  'four': 'pedwar',
  'five': 'pump',
};

/**
 * Get a translation from the dictionary for common words
 * @param {string} text - The text to translate
 * @param {string} targetLang - The target language
 * @param {string} sourceLang - The source language
 * @returns {string|null} - The translation or null if not found
 */
const getDictionaryTranslation = (text, targetLang, sourceLang) => {
  if (targetLang === 'cy' && sourceLang === 'en') {
    return welshDictionary[text.toLowerCase()] || null;
  } else if (targetLang === 'en' && sourceLang === 'cy') {
    // Find the key in the dictionary where the value matches the text
    for (const [key, value] of Object.entries(welshDictionary)) {
      if (value.toLowerCase() === text.toLowerCase()) {
        return key;
      }
    }
  }
  return null;
};

/**
 * Get a translation for a common word or short phrase
 * @param {string} text - The text to translate
 * @param {string} targetLang - The target language
 * @returns {string|null} - The translation or null if not found
 */
const getCommonWordTranslation = (text, targetLang) => {
  const lowerText = text.toLowerCase();
  if (targetLang === 'cy') {
    // English to Welsh
    const commonEnglishToWelsh = {
      'the': 'y',
      'a': 'un',
      'an': 'un',
      'and': 'a',
      'or': 'neu',
      'but': 'ond',
      'if': 'os',
      'of': 'o',
      'in': 'yn',
      'on': 'ar',
      'at': 'yn',
      'to': 'i',
      'for': 'ar gyfer',
      'with': 'gyda',
      'by': 'gan',
      'from': 'o',
      'up': 'i fyny',
      'down': 'i lawr',
      'over': 'dros',
      'under': 'o dan',
      'yes': 'ie',
      'no': 'na',
      'one': 'un',
      'two': 'dau',
      'three': 'tri',
      'four': 'pedwar',
      'five': 'pump',
      'cards': 'cardiau',
      'card': 'cerdyn',
      'created': 'wedi\'i greu',
      'course': 'cwrs',
      'general': 'cyffredinol',
      'level': 'lefel',
      'exam': 'arholiad',
      'board': 'bwrdd',
      'type': 'math',
      'print': 'argraffu',
      'edit': 'golygu',
      'delete': 'dileu',
    };
    return commonEnglishToWelsh[lowerText] || null;
  } else if (targetLang === 'en') {
    // Welsh to English
    const commonWelshToEnglish = {
      'y': 'the',
      'yr': 'the',
      'a': 'and',
      'ac': 'and',
      'i': 'to',
      'yn': 'in',
      'ar': 'on',
      'o': 'from',
      'am': 'for',
      'gan': 'by',
      'gyda': 'with',
      'heb': 'without',
      'fel': 'like',
      'ond': 'but',
      'neu': 'or',
      'ie': 'yes',
      'na': 'no',
      'un': 'one',
      'dau': 'two',
      'tri': 'three',
      'pedwar': 'four',
      'pump': 'five',
      'cardiau': 'cards',
      'cerdyn': 'card',
      'cwrs': 'course',
      'cyffredinol': 'general',
      'lefel': 'level',
      'arholiad': 'exam',
      'bwrdd': 'board',
      'math': 'type',
      'argraffu': 'print',
      'golygu': 'edit',
      'dileu': 'delete',
    };
    return commonWelshToEnglish[lowerText] || null;
  }
  return null;
};

/**
 * Map between i18next language codes and LibreTranslate language codes
 */
const libreTranslateLanguageMap = {
  'en': 'en', // English
  'cy': 'en', // Welsh - not supported by LibreTranslate, fallback to English
  'ar': 'ar', // Arabic
  'es': 'es', // Spanish
  'it': 'it', // Italian
  'fr': 'fr', // French
  'ja': 'zh', // Japanese - fallback to Chinese if not supported
  'vi': 'vi', // Vietnamese
  'zh': 'zh', // Chinese (Simplified)
};

/**
 * Get the corresponding LibreTranslate language code
 * @param {string} languageCode - The i18next language code
 * @returns {string} - The LibreTranslate language code
 */
const getLibreTranslateCode = (languageCode) => {
  return libreTranslateLanguageMap[languageCode] || 'en'; // Default to English if not found
};

/**
 * Checks if the translation APIs are available
 * @returns {Promise<{libre: boolean, welsh: boolean}>} - Availability status of translation APIs
 */
export const checkTranslationApiAvailability = async () => {
  const result = {
    libre: false,
    welsh: false
  };
  
  // Check LibreTranslate API
  try {
    const languagesEndpoint = LIBRE_TRANSLATE_API.replace('/translate', '/languages');
    
    let url = languagesEndpoint;
    if (LIBRE_TRANSLATE_API_KEY) {
      url = `${languagesEndpoint}?api_key=${encodeURIComponent(LIBRE_TRANSLATE_API_KEY)}`;
    }
    
    const response = await fetch(url);
    result.libre = response.ok;
  } catch (error) {
    console.error('LibreTranslate API check failed:', error);
  }
  
  // Check Welsh Translation API
  try {
    if (WELSH_TRANSLATE_API_KEY) {
      const testUrl = new URL(WELSH_TRANSLATE_API);
      testUrl.searchParams.append('api_key', WELSH_TRANSLATE_API_KEY);
      testUrl.searchParams.append('q', 'test');
      testUrl.searchParams.append('engine', WELSH_TRANSLATE_ENGINE);
      testUrl.searchParams.append('source', 'en');
      testUrl.searchParams.append('target', 'cy');
      
      const response = await fetch(testUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      result.welsh = response.ok;
    }
  } catch (error) {
    console.error('Welsh Translation API check failed:', error);
  }
  
  return result;
};

/**
 * Automatically translates text if the current language differs from the source language
 * @param {string} text - The text to translate
 * @param {string} sourceLang - The source language of the text
 * @param {string} currentLang - The current UI language
 * @returns {Promise<string>} - The translated text or original text if languages match
 */
export const autoTranslateText = async (text, sourceLang = 'en', currentLang) => {
  // Don't translate if the text is empty
  if (!text || text.trim() === '') {
    return text;
  }
  
  // Don't translate if the current language is the same as the source language
  if (currentLang === sourceLang) {
    return text;
  }
  
  // Create a cache key
  const cacheKey = `${text}|${sourceLang}|${currentLang}`;
  
  // Check if we have a cached translation
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }
  
  try {
    console.log(`AutoTranslate: Translating from ${sourceLang} to ${currentLang}`);
    const translatedText = await translateText(text, currentLang, sourceLang);
    
    // Cache the result
    translationCache[cacheKey] = translatedText;
    
    return translatedText;
  } catch (error) {
    console.error('Auto-translation failed:', error);
    return text; // Return original text on failure
  }
};

/**
 * Map between i18next language codes and LibreTranslate language codes
 * This is necessary because some language codes differ between the two systems
 */
export const languageCodeMap = {
  'en': 'en', // English
  'cy': 'en', // Welsh - may not be supported by all translation APIs, fallback to English
  'ar': 'ar', // Arabic
  'es': 'es', // Spanish
  'it': 'it', // Italian
  'fr': 'fr', // French
  'ja': 'zh', // Japanese - fallback to Chinese if not supported
  'vi': 'vi', // Vietnamese
  'zh': 'zh', // Chinese (Simplified)
};

/**
 * Get the corresponding translation API language code for an i18next language code
 * @param {string} i18nCode - The i18next language code
 * @returns {string} - The translation API language code
 */
export const getTranslationApiCode = (i18nCode) => {
  return languageCodeMap[i18nCode] || 'en'; // Default to English if not found
}; 