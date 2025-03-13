// AzureTranslationService.js
// A utility for translating text using Azure Cognitive Services Translator

// Create a simple in-memory cache for translations to avoid redundant API calls
const translationCache = {};

// Configure translation request throttling
const THROTTLE_DELAY = 500; // ms between requests to avoid rate limiting
let lastRequestTime = Date.now();

/**
 * Translates text using Azure Cognitive Services Translator
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
  
  console.log(`AzureTranslationService: Translating from ${sourceLang} to ${targetLang}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
  
  // For tiny texts (under 5 chars), just use built-in translations where possible
  if (text.length < 5) {
    // Try to return from built-in dictionary for common short words
    const commonWord = getCommonWordTranslation(text, targetLang);
    if (commonWord) {
      translationCache[cacheKey] = commonWord;
      return commonWord;
    }
  }
  
  try {
    // Get Azure Translator key and endpoint from environment variables
    const key = process.env.REACT_APP_AZURE_TRANSLATOR_KEY;
    const endpoint = process.env.REACT_APP_AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
    const region = process.env.REACT_APP_AZURE_TRANSLATOR_REGION || 'uksouth';
    
    if (!key) {
      console.error('Azure Translator API key not found');
      throw new Error('Azure Translator API key not found');
    }
    
    // Map language codes to Azure Translator format if needed
    const azureSourceLang = getAzureLanguageCode(sourceLang);
    const azureTargetLang = getAzureLanguageCode(targetLang);
    
    // Construct the API URL
    const url = `${endpoint}/translate?api-version=3.0&from=${azureSourceLang}&to=${azureTargetLang}`;
    
    // Make the API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': region,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ text }])
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Translator error:', errorText);
      throw new Error(`Azure Translator failed: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !data[0] || !data[0].translations || !data[0].translations[0]) {
      throw new Error('Invalid response from Azure Translator');
    }
    
    const translatedText = data[0].translations[0].text;
    console.log('Azure translation result:', translatedText.substring(0, 50));
    
    // Cache the result
    translationCache[cacheKey] = translatedText;
    
    return translatedText;
  } catch (error) {
    console.error('Azure translation request failed:', error);
    
    // As a last resort, try to use a dictionary translation
    const dictionaryTranslation = getDictionaryTranslation(text, targetLang, sourceLang);
    if (dictionaryTranslation) {
      console.log('Using dictionary translation:', dictionaryTranslation);
      translationCache[cacheKey] = dictionaryTranslation;
      return dictionaryTranslation;
    }
    
    // If all else fails, return the original text
    return text;
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
 * Map between i18next language codes and Azure Translator language codes
 * This is necessary because some language codes differ between the two systems
 */
const azureLanguageCodeMap = {
  'en': 'en', // English
  'cy': 'cy', // Welsh
  'ar': 'ar', // Arabic
  'es': 'es', // Spanish
  'it': 'it', // Italian
  'fr': 'fr', // French
  'ja': 'ja', // Japanese
  'vi': 'vi', // Vietnamese
  'zh': 'zh-Hans', // Chinese (Simplified)
};

/**
 * Get the corresponding Azure Translator language code
 * @param {string} languageCode - The i18next language code
 * @returns {string} - The Azure Translator language code
 */
const getAzureLanguageCode = (languageCode) => {
  return azureLanguageCodeMap[languageCode] || languageCode; // Return as-is if not found
};

/**
 * Checks if the Azure Translator API is available
 * @returns {Promise<boolean>} - Whether the API is available
 */
export const checkAzureTranslatorAvailability = async () => {
  try {
    const key = process.env.REACT_APP_AZURE_TRANSLATOR_KEY;
    const endpoint = process.env.REACT_APP_AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
    const region = process.env.REACT_APP_AZURE_TRANSLATOR_REGION || 'uksouth';
    
    if (!key) {
      console.error('Azure Translator API key not found');
      return false;
    }
    
    // Make a simple request to check if the API is available
    const url = `${endpoint}/languages?api-version=3.0`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': region
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Azure Translator API check failed:', error);
    return false;
  }
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