import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languageNames } from '../i18n';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentLanguage = i18n.language;

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setDropdownOpen(false);
  };

  // Handle rtl for Arabic
  React.useEffect(() => {
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  }, [currentLanguage]);

  return (
    <div className="language-selector">
      <button 
        className="language-selector-btn"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-expanded={dropdownOpen}
      >
        <span className="language-icon">🌐</span>
        <span className="current-language">{languageNames[currentLanguage]}</span>
      </button>
      
      {dropdownOpen && (
        <div className="language-dropdown">
          <div className="language-dropdown-header">
            {t('language.selectLanguage')}
          </div>
          <div className="language-options">
            {Object.keys(languageNames).map((code) => (
              <button
                key={code}
                className={`language-option ${code === currentLanguage ? 'active' : ''}`}
                onClick={() => changeLanguage(code)}
              >
                {languageNames[code]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 