import React, { useState, useEffect, useRef } from 'react';
import './Flashcard.css';
import TranslateButton from './TranslateButton';
import { getContrastColor } from '../utils/colorUtils';
import ScaledText from './ScaledText';
import MultipleChoiceOptions from './MultipleChoiceOptions';
import AutoTranslatedText from './AutoTranslatedText';
import { useTranslation } from 'react-i18next';

const Flashcard = ({ card, onDelete, onFlip, onUpdateCard, showButtons = true, preview = false, style = {} }) => {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const cardRef = useRef(null);
  
  // Apply card styles based on card data
  const cardStyle = {
    backgroundColor: card.cardColor || '#3cb44b',
    borderColor: card.boxNum === 5 ? 'gold' : 'transparent', // Gold border for mastered cards
    boxShadow: card.boxNum === 5 ? '0 0 10px rgba(255, 215, 0, 0.5)' : undefined,
    ...style // Apply any additional styles passed in
  };
  
  // Get contrast color for text based on background
  const textColor = getContrastColor(card.cardColor || '#3cb44b');
  
  // Handle card flipping
  const handleFlip = (e) => {
    // Don't flip if clicking on buttons or controls
    if (
      e.target.closest('.delete-btn') || 
      e.target.closest('.color-btn') || 
      e.target.closest('.info-btn') || 
      e.target.closest('.delete-confirm') || 
      e.target.closest('.color-picker-container')
    ) {
      return;
    }
    
    setIsFlipped(!isFlipped);
    if (onFlip) onFlip(card, !isFlipped);
  };
  
  // Handle delete confirmation
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setConfirmDelete(true);
  };
  
  // Cancel delete
  const cancelDelete = (e) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };
  
  // Confirm delete
  const confirmDeleteCard = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(card.id);
  };
  
  // Toggle color picker
  const toggleColorPicker = (e) => {
    e.stopPropagation();
    setShowColorPicker(!showColorPicker);
  };
  
  // Toggle info modal
  const toggleInfoModal = (e) => {
    e.stopPropagation();
    setShowInfoModal(!showInfoModal);
  };
  
  // Close info modal
  const closeInfoModal = () => {
    setShowInfoModal(false);
  };
  
  // Handle color change
  const handleColorChange = (color) => {
    if (onUpdateCard) {
      onUpdateCard({
        ...card,
        cardColor: color,
        baseColor: color
      });
    }
    setShowColorPicker(false);
  };
  
  // Bright colors for the color picker
  const colorOptions = [
    "#e6194b", "#3cb44b", "#ffe119", "#0082c8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#d2f53c", "#fabebe",
    "#008080", "#e6beff", "#aa6e28", "#fffac8", "#800000"
  ];
  
  // Gets the correct answer for multiple choice questions
  const getCorrectAnswer = () => {
    if (!isMultipleChoice) return '';
    
    // For cards with correctAnswer property
    if (card.correctAnswer) {
      return card.correctAnswer;
    }
    
    // For cards with correctOptionIndex property (0-based index)
    if (card.correctOptionIndex !== undefined && card.options) {
      const index = parseInt(card.correctOptionIndex);
      if (!isNaN(index) && index >= 0 && index < card.options.length) {
        return card.options[index];
      }
    }
    
    // For cards with answer property that might match one of the options
    if (card.answer && card.options) {
      // Try to find the option that matches the answer
      const matchingOption = card.options.find(option => 
        option.toLowerCase().trim() === card.answer.toLowerCase().trim()
      );
      
      if (matchingOption) {
        return matchingOption;
      }
      
      // If no direct match, return the answer
      return card.answer;
    }
    
    return t('cards.noCorrectAnswer');
  };
  
  // Determine if this is a multiple choice card
  const isMultipleChoice = card.questionType === 'multiple_choice' && Array.isArray(card.options) && card.options.length > 0;
  
  // Log for debugging
  if (isMultipleChoice) {
    console.log(`Multiple choice card: ${card.id}, options:`, card.options);
  }
  
  // Check if card has additional information
  const hasAdditionalInfo = card.additionalInfo || card.detailedAnswer;
  
  return (
    <>
      <div 
        ref={cardRef}
        className={`flashcard ${isFlipped ? 'flipped' : ''} ${card.boxNum === 5 ? 'mastered' : ''} ${preview ? 'preview-card' : ''}`}
        onClick={handleFlip}
        style={cardStyle}
      >
        {showButtons && !preview && (
          <>
            {confirmDelete ? (
              <div className="delete-confirm">
                <span style={{ color: textColor }}>
                  <AutoTranslatedText content={t('cards.deleteConfirm')} />
                </span>
                <button onClick={confirmDeleteCard} className="confirm-btn">
                  <AutoTranslatedText content={t('common.yes')} />
                </button>
                <button onClick={cancelDelete} className="cancel-btn">
                  <AutoTranslatedText content={t('common.no')} />
                </button>
              </div>
            ) : (
              <>
                <button 
                  className="delete-btn" 
                  onClick={handleDeleteClick}
                  title={t('cards.deleteCard')}
                >
                  ✕
                </button>
                
                <button 
                  className="color-btn" 
                  onClick={toggleColorPicker}
                  title={t('cards.changeColor')}
                >
                  🎨
                </button>
                
                {hasAdditionalInfo && (
                  <button 
                    className="info-btn" 
                    onClick={toggleInfoModal}
                    title={t('cards.viewInfo')}
                  >
                    ℹ️
                  </button>
                )}
              </>
            )}
            
            {showColorPicker && (
              <div className="color-picker-container" onClick={(e) => e.stopPropagation()}>
                <div className="color-options">
                  {colorOptions.map((color) => (
                    <div 
                      key={color}
                      className="color-option"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        <div className="flashcard-inner">
          <div className="flashcard-front" style={{ color: textColor }}>
            {isMultipleChoice ? (
              <>
                <ScaledText className="question-title" maxFontSize={16}>
                  <AutoTranslatedText content={card.front || card.question} html={true} />
                </ScaledText>
                <div className="multiple-choice-container" style={{ overflow: 'auto', maxHeight: '60%' }}>
                  {card.options && card.options.length > 0 ? (
                    <MultipleChoiceOptions 
                      options={card.options} 
                      preview={preview} 
                      disabled={true}
                    />
                  ) : (
                    <div className="missing-options-error" style={{ color: textColor }}>
                      <AutoTranslatedText content={t('cards.noOptionsError')} />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <ScaledText maxFontSize={16}>
                <AutoTranslatedText content={card.front || card.question || t('cards.noQuestion')} html={true} />
              </ScaledText>
            )}
          </div>
          
          <div className="flashcard-back" style={{ color: textColor }}>
            {isFlipped && (
              <>
                {isMultipleChoice ? (
                  <>
                    <h4 className="answer-heading" style={{ color: textColor }}>
                      <AutoTranslatedText content={t('cards.correctAnswer')} />:
                    </h4>
                    <ScaledText maxFontSize={16}>
                      <AutoTranslatedText 
                        content={getCorrectAnswer()} 
                        html={true} 
                      />
                    </ScaledText>
                  </>
                ) : (
                  <ScaledText maxFontSize={16}>
                    <AutoTranslatedText 
                      content={card.back || card.answer || t('cards.noAnswer')} 
                      html={true} 
                    />
                  </ScaledText>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Information Modal */}
      {showInfoModal && (
        <div className="info-modal-overlay" onClick={closeInfoModal}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="info-modal-header">
              <h3><AutoTranslatedText content={t('cards.additionalInfo')} /></h3>
              <button className="close-modal-btn" onClick={closeInfoModal}>✕</button>
            </div>
            <div className="info-modal-content">
              <div dangerouslySetInnerHTML={{ __html: card.additionalInfo || card.detailedAnswer || t('cards.noAdditionalInfo') }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Flashcard;
