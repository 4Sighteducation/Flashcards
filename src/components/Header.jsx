import React from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import "./Header.css";

const Header = ({ userInfo, currentView, onViewChange, onSave, isSaving }) => {
  const { t } = useTranslation();
  
  return (
    <header className="app-header">
      <div className="header-logo">
        <img
          src="https://www.vespa.academy/assets/images/full-trimmed-transparent-customcolor-1-832x947.png"
          alt="Vespa Academy Logo"
          className="logo"
        />
        <h1>{t('app.title')}</h1>
      </div>

      <div className="header-nav">
        <button
          className={`nav-button ${currentView === "cardBank" ? "active" : ""}`}
          onClick={() => onViewChange("cardBank")}
        >
          {t('app.cardBank')}
        </button>
        <button
          className={`nav-button ${
            currentView === "createCard" ? "active" : ""
          }`}
          onClick={() => onViewChange("createCard")}
        >
          {t('navigation.createCard')}
        </button>
        <button
          className={`nav-button ${
            currentView === "spacedRepetition" ? "active" : ""
          }`}
          onClick={() => onViewChange("spacedRepetition")}
        >
          {t('app.spacedRepetition')}
        </button>
      </div>

      <div className="header-actions">
        <LanguageSelector />
        
        <button className="save-button" onClick={onSave} disabled={isSaving}>
          {isSaving ? t('app.loading') : t('cardCreation.saveCard')}
        </button>

        {userInfo.email && (
          <div className="user-info">
            <span className="user-email">{userInfo.email}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
