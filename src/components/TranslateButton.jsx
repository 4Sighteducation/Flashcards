import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText, getTranslationApiCode } from '../utils/TranslationService';
import './TranslateButton.css';

/**
 * A button component that translates content on demand
 * 
 * @param {Object} props
 * @param {string} props.content - The content to translate
 * @param {string} props.sourceLang - The source language code (optional, defaults to 'en')
 * @param {Function} props.onTranslated - Callback when translation is complete (optional)
 */
const TranslateButton = ({ content, sourceLang = 'en', onTranslated }) => {
  const { t, i18n } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [error, setError] = useState('');
  const [apiLimitReached, setApiLimitReached] = useState(false);
  
  // Don't show the button if already in the content's language
  if (i18n.language === sourceLang) {
    return null;
  }
  
  const handleTranslate = async () => {
    // If we already have a translation, just toggle its visibility
    if (translatedContent) {
      setShowTranslation(!showTranslation);
      return;
    }
    
    setIsTranslating(true);
    setError('');
    setApiLimitReached(false);
    
    try {
      const targetLang = getTranslationApiCode(i18n.language);
      const sourceLanguage = getTranslationApiCode(sourceLang);
      
      const translated = await translateText(content, targetLang, sourceLanguage);
      
      // Check if we got an original text back due to an error
      if (translated === content) {
        // This could be due to API limit or unsupported language
        throw new Error('Translation API may have reached its limit or doesn\'t support this language');
      }
      
      setTranslatedContent(translated);
      setShowTranslation(true);
      
      if (onTranslated) {
        onTranslated(translated);
      }
    } catch (err) {
      console.error('Translation error:', err);
      
      // Check for API limit errors
      if (err.message.includes('limit') || err.message.includes('quota') || 
          err.message.includes('rate') || err.message.includes('429')) {
        setApiLimitReached(true);
        setError(t('translation.apiLimitError'));
      } else {
        setError(t('translation.error'));
      }
    } finally {
      setIsTranslating(false);
    }
  };
  
  return (
    <div className="translate-container">
      <button 
        className={`translate-btn ${showTranslation ? 'active' : ''} ${apiLimitReached ? 'api-limit-reached' : ''}`}
        onClick={handleTranslate}
        disabled={isTranslating || apiLimitReached}
        title={apiLimitReached ? t('translation.apiLimitReached') : t('translation.translateText')}
      >
        {isTranslating ? (
          <span className="translating-indicator">
            <span className="dot-1">.</span>
            <span className="dot-2">.</span>
            <span className="dot-3">.</span>
          </span>
        ) : (
          <>
            <span className="translate-icon">🌐</span>
            <span className="translate-text">
              {apiLimitReached ? t('translation.apiLimitReached') : 
               showTranslation ? t('translation.hideTranslation') : t('translation.translateText')}
            </span>
          </>
        )}
      </button>
      
      {error && <div className="translate-error">{error}</div>}
      
      {showTranslation && translatedContent && (
        <div className="translated-content">
          <div className="translation-label">{t('translation.translatedFrom')} {t(`language.${sourceLang}`)}:</div>
          <div className="translation-text">{translatedContent}</div>
        </div>
      )}
    </div>
  );
};

export default TranslateButton; 