import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { checkTranslationApiAvailability } from '../utils/TranslationService';
import './GlobalTranslationWrapper.css';

/**
 * A wrapper component that provides an overlay for translating the entire page
 * and displays translation status
 */
const GlobalTranslationWrapper = ({ children }) => {
  const { i18n } = useTranslation();
  const [translationApiStatus, setTranslationApiStatus] = useState({
    libre: false,
    welsh: false,
    checking: true
  });
  const [showStatusBar, setShowStatusBar] = useState(false);

  // Check API availability on mount and when language changes
  useEffect(() => {
    const checkApis = async () => {
      try {
        const status = await checkTranslationApiAvailability();
        setTranslationApiStatus({
          ...status,
          checking: false
        });
        
        // Show status bar if we have a non-English language selected
        if (i18n.language !== 'en') {
          setShowStatusBar(true);
        }
      } catch (error) {
        console.error('Error checking translation APIs:', error);
        setTranslationApiStatus({
          libre: false,
          welsh: false,
          checking: false
        });
      }
    };

    checkApis();
  }, [i18n.language]);

  // Show status bar when language changes
  useEffect(() => {
    if (i18n.language !== 'en') {
      setShowStatusBar(true);
      
      // Hide status bar after 5 seconds
      const timer = setTimeout(() => {
        setShowStatusBar(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowStatusBar(false);
    }
  }, [i18n.language]);

  // Determine which translation API is active
  const getActiveApi = () => {
    if (i18n.language === 'cy' && translationApiStatus.welsh) {
      return 'Welsh Translation API';
    } else if (translationApiStatus.libre) {
      return 'LibreTranslate API';
    } else {
      return 'None';
    }
  };

  return (
    <div className="global-translation-wrapper">
      {children}
      
      {/* Translation status bar */}
      {showStatusBar && (
        <div 
          className="translation-status-bar"
          onClick={() => setShowStatusBar(false)}
        >
          <div className="translation-status-content">
            {translationApiStatus.checking ? (
              <span>Checking translation service availability...</span>
            ) : (
              <>
                <span>
                  {i18n.language === 'en' ? 
                    'Translation disabled (English)' : 
                    `Translating content to ${i18n.options.supportedLngs.find(lng => lng === i18n.language)}`
                  }
                </span>
                <span className="api-status">
                  Active API: {getActiveApi()}
                </span>
                {(!translationApiStatus.libre && !translationApiStatus.welsh) && (
                  <span className="translation-warning">
                    Warning: Translation APIs unavailable. Using fallback translations.
                  </span>
                )}
              </>
            )}
          </div>
          <button className="close-status" aria-label="Close translation status">×</button>
        </div>
      )}
    </div>
  );
};

export default GlobalTranslationWrapper; 