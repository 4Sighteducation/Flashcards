import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../utils/TranslationService';
import './AutoTranslatedText.css';

/**
 * Component for automatically translating text content based on the current language
 * Handles both plain text and HTML content
 */
const AutoTranslatedText = ({ content, html = false, className = '', disabled = false }) => {
  const { i18n } = useTranslation();
  const [translatedContent, setTranslatedContent] = useState(content);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;
  const mountedRef = useRef(true);
  
  // Cache to store translations locally to avoid unnecessary API calls
  const translationCache = useRef({});
  const cacheKey = `${content}_${i18n.language}`;
  
  // Translate content when language changes or content changes
  useEffect(() => {
    // Don't translate if disabled or content is empty
    if (disabled || !content || content.trim() === '') {
      setTranslatedContent(content);
      return;
    }
    
    // Helper function to actually perform the translation
    const performTranslation = async () => {
      // Skip translation for English content when language is English
      if (i18n.language === 'en') {
        if (mountedRef.current) {
          setTranslatedContent(content);
          setIsTranslating(false);
        }
        return;
      }
      
      try {
        // Check if translation is already in cache
        if (translationCache.current[cacheKey]) {
          console.log('Using cached translation for:', content.substring(0, 30));
          if (mountedRef.current) {
            setTranslatedContent(translationCache.current[cacheKey]);
            setIsTranslating(false);
            setTranslationError(null);
          }
          return;
        }
        
        console.log(`Translating to ${i18n.language}:`, content.substring(0, 30));
        setIsTranslating(true);
        setTranslationError(null);
        
        const translated = await translateText(content, i18n.language, 'en');
        
        // Only update state if component is still mounted
        if (mountedRef.current) {
          // Don't update if translation failed (returned original text)
          if (translated && translated !== content) {
            console.log('Translation result:', translated.substring(0, 30));
            setTranslatedContent(translated);
            
            // Cache the successful translation
            translationCache.current[cacheKey] = translated;
          } else {
            // If translation returned same text, it might have failed silently
            console.warn('Translation may have failed - returned original text');
            setTranslatedContent(content);
          }
          
          setIsTranslating(false);
        }
      } catch (error) {
        console.error('Translation error:', error);
        
        if (mountedRef.current) {
          setTranslationError(error.message || 'Translation failed');
          setIsTranslating(false);
          
          // Retry up to maxRetries times with exponential backoff
          if (retryCount < maxRetries) {
            const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
            console.log(`Retrying translation in ${backoffTime}ms (attempt ${retryCount + 1}/${maxRetries})`);
            
            setTimeout(() => {
              if (mountedRef.current) {
                setRetryCount(prevCount => prevCount + 1);
                performTranslation();
              }
            }, backoffTime);
          } else {
            // Max retries reached, use original content
            setTranslatedContent(content);
          }
        }
      }
    };
    
    // Debounce translation requests to avoid too many API calls
    const timeoutId = setTimeout(() => {
      performTranslation();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [content, i18n.language, disabled, cacheKey, retryCount]);
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Render the content with loading/error indicators
  if (html) {
    return (
      <div className={`auto-translated-html ${className} ${isTranslating ? 'translating' : ''}`}>
        {isTranslating && <span className="translating-indicator">...</span>}
        <div dangerouslySetInnerHTML={{ __html: translatedContent || content }} />
        {translationError && <div className="translation-error">{translationError}</div>}
      </div>
    );
  }
  
  return (
    <span className={`auto-translated ${className} ${isTranslating ? 'translating' : ''}`}>
      {isTranslating && <span className="translating-indicator">...</span>}
      {translatedContent || content}
      {translationError && <div className="translation-error">{translationError}</div>}
    </span>
  );
};

export default AutoTranslatedText; 