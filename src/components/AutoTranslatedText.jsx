import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { autoTranslateText } from '../utils/TranslationService';
import './AutoTranslatedText.css';

/**
 * Component that automatically translates text when the language changes
 * @param {Object} props
 * @param {string} props.content - The text content to translate
 * @param {string} props.sourceLang - The source language of the content (defaults to 'en')
 * @param {boolean} props.html - Whether the content is HTML (defaults to false)
 */
const AutoTranslatedText = ({ content, sourceLang = 'en', html = false }) => {
  const { i18n } = useTranslation();
  const [translatedContent, setTranslatedContent] = useState(content);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Translate the content when the language changes or content changes
  useEffect(() => {
    const translateContent = async () => {
      // If the content is empty or the language is the same as the source, don't translate
      if (!content || i18n.language === sourceLang) {
        setTranslatedContent(content);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const translated = await autoTranslateText(content, sourceLang, i18n.language);
        setTranslatedContent(translated);
      } catch (err) {
        console.error('Error translating content:', err);
        setError(err.message);
        // Fallback to original content on error
        setTranslatedContent(content);
      } finally {
        setIsLoading(false);
      }
    };

    translateContent();
  }, [content, i18n.language, sourceLang]);

  // If the content is HTML, render it as such
  if (html) {
    return (
      <>
        {isLoading ? (
          <div className="translating-indicator">
            <span className="dot-1">.</span>
            <span className="dot-2">.</span>
            <span className="dot-3">.</span>
          </div>
        ) : error ? (
          <div>
            <div dangerouslySetInnerHTML={{ __html: content }} />
            <div className="translation-error">{error}</div>
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: translatedContent }} />
        )}
      </>
    );
  }

  // Otherwise render as plain text
  return (
    <>
      {isLoading ? (
        <div className="translating-indicator">
          <span className="dot-1">.</span>
          <span className="dot-2">.</span>
          <span className="dot-3">.</span>
        </div>
      ) : error ? (
        <div>
          {content}
          <div className="translation-error">{error}</div>
        </div>
      ) : (
        translatedContent
      )}
    </>
  );
};

export default AutoTranslatedText; 