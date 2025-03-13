// TranslationService.js
// A utility for translating text using multiple translation APIs

// LibreTranslate API configuration
const LIBRE_TRANSLATE_API = process.env.REACT_APP_TRANSLATE_API || "https://libretranslate.com/translate";
const LIBRE_TRANSLATE_API_KEY = process.env.REACT_APP_LIBRE_TRANSLATE_API_KEY;

// Welsh Translation API configuration
const WELSH_TRANSLATE_API = process.env.REACT_APP_WELSH_TRANSLATE_API || "http://api.techiaith.org/translate-smt/v1/";
const WELSH_TRANSLATE_API_KEY = process.env.REACT_APP_WELSH_TRANSLATE_API_KEY;
const WELSH_TRANSLATE_ENGINE = process.env.REACT_APP_WELSH_TRANSLATE_ENGINE || "CofnodYCynulliad";

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
    lastRequestTime: 0
  }
};

// Configure translation request throttling
const THROTTLE_DELAY = 500; // ms between requests to avoid rate limiting
let lastRequestTime = Date.now();

/**
 * Translates text using the most appropriate translation API based on the language pair
 * 
 * @param {string} text - The text to translate
 * @param {string} targetLang - The target language code (e.g., 'cy', 'en', 'fr')
 * @param {string} sourceLang - The source language code
 * @returns {Promise<string>} - The translated text
 */
export const translateText = async (text, targetLang, sourceLang = 'en') => {
  if (!text || text.trim() === '') return '';
  
  // IMPORTANT: Throttle requests to avoid rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < THROTTLE_DELAY) {
    await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
  
  console.log(`TranslationService: Translating from ${sourceLang} to ${targetLang}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
  
  // Create cache key for this translation request
  const cacheKey = `${text}_${sourceLang}_${targetLang}`;
  
  // Check if we have a cached result
  if (translationCache[cacheKey]) {
    console.log('Using cached translation');
    return translationCache[cacheKey];
  }
  
  // Use Welsh API for Welsh <-> English translations
  if ((targetLang === 'cy' && sourceLang === 'en') || 
      (targetLang === 'en' && sourceLang === 'cy')) {
    
    // Check if Welsh API is rate limited
    if (rateLimitTracking.welsh.isLimited) {
      console.log('Welsh API is rate limited, falling back to LibreTranslate');
      return translateWithLibreTranslate(text, targetLang, sourceLang);
    }
    
    // Check if API key is properly configured
    if (!WELSH_TRANSLATE_API_KEY || WELSH_TRANSLATE_API_KEY === 'your_actual_welsh_translate_api_key') {
      console.warn('Welsh Translation API key is not properly configured, falling back to LibreTranslate');
      return translateWithLibreTranslate(text, targetLang, sourceLang);
    }
    
    console.log('TranslationService: Using Welsh API');
    try {
      const result = await translateWithWelshAPI(text, targetLang, sourceLang);
      // Cache successful result
      translationCache[cacheKey] = result;
      return result;
    } catch (error) {
      console.error('Welsh translation failed, falling back to LibreTranslate:', error);
      
      // If it's a network error, mark as temporarily unavailable to avoid retrying too soon
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('Network'))) {
        console.warn('Welsh API appears to be unavailable, will temporarily use LibreTranslate');
        rateLimitTracking.welsh.isLimited = true;
        
        // Try again after 30 seconds
        setTimeout(() => {
          rateLimitTracking.welsh.isLimited = false;
        }, 30000);
      }
      
      // Try LibreTranslate instead
      return translateWithLibreTranslate(text, targetLang, sourceLang);
    }
  } else {
    // Check if LibreTranslate is rate limited
    if (rateLimitTracking.libre.isLimited) {
      console.log('LibreTranslate is rate limited, returning original text');
      return text;
    }
    
    // Use LibreTranslate for all other language pairs
    console.log('TranslationService: Using LibreTranslate API');
    return translateWithLibreTranslate(text, targetLang, sourceLang);
  }
};

/**
 * Translates text using the Welsh Translation API
 * 
 * @param {string} text - The text to translate
 * @param {string} targetLang - The target language code ('cy' or 'en')
 * @param {string} sourceLang - The source language code ('cy' or 'en')
 * @returns {Promise<string>} - The translated text
 */
const translateWithWelshAPI = async (text, targetLang, sourceLang) => {
  try {
    // Check if API key is available
    if (!WELSH_TRANSLATE_API_KEY) {
      console.error('Welsh Translation API key not found');
      throw new Error('Welsh Translation API key not found');
    }
    
    // Update rate limit tracking
    rateLimitTracking.welsh.requestsThisMinute++;
    rateLimitTracking.welsh.lastRequestTime = Date.now();
    
    console.log(`Welsh API call: ${WELSH_TRANSLATE_API}?api_key=***&q=${encodeURIComponent(text.substring(0, 20))}...`);
    
    // Construct the API URL with query parameters
    const url = new URL(WELSH_TRANSLATE_API);
    url.searchParams.append('api_key', WELSH_TRANSLATE_API_KEY);
    url.searchParams.append('q', text);
    url.searchParams.append('engine', WELSH_TRANSLATE_ENGINE);
    url.searchParams.append('source', sourceLang);
    url.searchParams.append('target', targetLang);
    
    // Make the API request with additional options
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      // Add credentials to handle CORS properly
      credentials: 'omit',
      // Longer timeout for potentially slow API
      timeout: 10000,
      // Indicate we can accept compressed responses
      compress: true,
      // Don't follow redirects automatically
      redirect: 'follow',
      // Set mode to cors to handle cross-origin requests
      mode: 'cors'
    });
    
    console.log('Welsh API response status:', response.status);
    
    // Check for rate limiting
    if (response.status === 429) {
      console.error('Welsh API rate limit reached');
      rateLimitTracking.welsh.isLimited = true;
      
      // Reset rate limit status after 60 seconds
      setTimeout(() => {
        rateLimitTracking.welsh.isLimited = false;
        rateLimitTracking.welsh.requestsThisMinute = 0;
      }, 60000);
      
      throw new Error('Welsh translation API rate limit reached');
    }
    
    // Get the response as text first for debugging
    const responseText = await response.text();
    console.log('Welsh API response:', responseText);
    
    // Parse the JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Welsh API response as JSON:', parseError);
      throw new Error(`Welsh translation failed: Invalid response format`);
    }
    
    if (!response.ok) {
      console.error('Welsh translation error:', data);
      throw new Error(`Welsh translation failed: ${data.errors ? data.errors[0] : 'Unknown error'}`);
    }
    
    if (!data.success) {
      throw new Error(`Welsh translation failed: ${data.errors ? data.errors[0] : 'Unknown error'}`);
    }
    
    console.log('Welsh translation result:', data.translations[0].translatedText);
    return data.translations[0].translatedText;
  } catch (error) {
    console.error('Welsh translation request failed:', error);
    throw error; // Let the caller handle the fallback
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
    const actualSourceLang = sourceLang === 'auto' ? 'auto' : getLibreTranslateCode(sourceLang);
    const actualTargetLang = getLibreTranslateCode(targetLang);
    
    // Update rate limit tracking
    rateLimitTracking.libre.requestsThisMinute++;
    rateLimitTracking.libre.lastRequestTime = Date.now();
    
    console.log(`LibreTranslate API call: source=${actualSourceLang}, target=${actualTargetLang}`);
    
    const requestBody = {
      q: text,
      source: actualSourceLang,
      target: actualTargetLang,
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
    
    console.log('LibreTranslate response status:', response.status);
    
    // Check for rate limiting
    if (response.status === 429) {
      console.error('LibreTranslate rate limit reached');
      rateLimitTracking.libre.isLimited = true;
      
      // Reset rate limit status after 60 seconds
      setTimeout(() => {
        rateLimitTracking.libre.isLimited = false;
        rateLimitTracking.libre.requestsThisMinute = 0;
      }, 60000);
      
      return text; // Return original text when rate limited
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      
      console.error('LibreTranslate error:', errorData);
      
      // Check for rate limiting in error message
      if (errorText.includes('Too many request') || errorText.includes('rate limit')) {
        rateLimitTracking.libre.isLimited = true;
        
        // Reset rate limit status after 60 seconds
        setTimeout(() => {
          rateLimitTracking.libre.isLimited = false;
          rateLimitTracking.libre.requestsThisMinute = 0;
        }, 60000);
      }
      
      throw new Error(`LibreTranslate failed: ${errorData.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('LibreTranslate result:', data.translatedText.substring(0, 50));
    return data.translatedText;
  } catch (error) {
    console.error('LibreTranslate request failed:', error);
    // Return original text if translation fails
    return text;
  }
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
      
      const response = await fetch(testUrl.toString());
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