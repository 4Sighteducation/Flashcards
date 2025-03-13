import React from 'react';
import { printDoubleSidedCards, printCardFronts, printCardBacks } from '../utils/PrintUtils';
import { useTranslation } from 'react-i18next';
import AutoTranslatedText from './AutoTranslatedText';
import './PrintModal.css';

const PrintModal = ({ cards, title, onClose }) => {
  const { t } = useTranslation();
  
  const handlePrintDoubleSided = () => {
    printDoubleSidedCards(cards, title);
    onClose();
  };

  const handlePrintFronts = () => {
    printCardFronts(cards, title);
    onClose();
  };

  const handlePrintBacks = () => {
    printCardBacks(cards, title);
    onClose();
  };

  return (
    <div className="print-modal-overlay" onClick={onClose}>
      <div className="print-modal" onClick={(e) => e.stopPropagation()}>
        <div className="print-modal-header">
          <button className="close-modal-btn" onClick={onClose}>✕</button>
        </div>
        <div className="print-modal-content">
          <p>
            <AutoTranslatedText 
              content={t('print.selectFormat', { count: cards.length })} 
            />
          </p>
          
          <div className="print-options">
            <div className="print-option" onClick={handlePrintDoubleSided}>
              <div className="print-option-icon">📄</div>
              <div className="print-option-label">
                <AutoTranslatedText content={t('print.fullCards')} />
              </div>
              <div className="print-option-desc">
                <AutoTranslatedText content={t('print.fullCardsDesc')} />
              </div>
            </div>
            
            <div className="print-option" onClick={handlePrintFronts}>
              <div className="print-option-icon">🔍</div>
              <div className="print-option-label">
                <AutoTranslatedText content={t('print.cardFronts')} />
              </div>
              <div className="print-option-desc">
                <AutoTranslatedText content={t('print.cardFrontsDesc')} />
              </div>
            </div>
            
            <div className="print-option" onClick={handlePrintBacks}>
              <div className="print-option-icon">💡</div>
              <div className="print-option-label">
                <AutoTranslatedText content={t('print.cardBacks')} />
              </div>
              <div className="print-option-desc">
                <AutoTranslatedText content={t('print.cardBacksDesc')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintModal; 