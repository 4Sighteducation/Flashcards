import React, { useState, useEffect, useRef } from 'react';
import './Flashcard.css';

// Helper function to determine text color based on background color brightness
const getContrastColor = (hexColor) => {
  if (!hexColor) return '#000000';
  
  // Remove # if present
  hexColor = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // Calculate brightness using YIQ formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return white for dark backgrounds, black for light backgrounds
  return brightness >= 128 ? '#000000' : '#ffffff';
};

const ScaledText = ({ children, minFontSize = 6, maxFontSize = 16, className = '' }) => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Initial render - wait for next frame for proper sizes
    const timer = requestAnimationFrame(() => {
      adjustTextSize();
    });
    
    return () => cancelAnimationFrame(timer);
  }, [children]);
  
  // Add resize listener
  useEffect(() => {
    window.addEventListener('resize', adjustTextSize);
    return () => window.removeEventListener('resize', adjustTextSize);
  }, []);
  
  const adjustTextSize = () => {
    if (!textRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const text = textRef.current;
    
    // Reset font size to maximum to measure properly
    text.style.fontSize = `${maxFontSize}px`;
    
    // Check if overflowing (both width and height)
    if (text.scrollHeight > container.clientHeight || text.scrollWidth > container.clientWidth) {
      // Binary search to find the right size
      let min = minFontSize;
      let max = maxFontSize;
      
      while (min <= max) {
        const mid = Math.floor((min + max) / 2);
        text.style.fontSize = `${mid}px`;
        
        if (text.scrollHeight <= container.clientHeight && text.scrollWidth <= container.clientWidth) {
          min = mid + 1;
        } else {
          max = mid - 1;
        }
      }
      
      // Final adjustment
      text.style.fontSize = `${max}px`;
      
      // If still overflowing at minimum size, add ellipsis
      if (max <= minFontSize && (text.scrollHeight > container.clientHeight || text.scrollWidth > container.clientWidth)) {
        text.style.overflow = 'hidden';
        text.style.textOverflow = 'ellipsis';
      }
    }
  };
  
  return (
    <div ref={containerRef} className={`text-container ${className}`}>
      <div ref={textRef} className="scaled-text">
        {children}
      </div>
    </div>
  );
};

// Component for multiple choice options with scaling
const MultipleChoiceOptions = ({ options }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    adjustOptionsFontSize();
    window.addEventListener('resize', adjustOptionsFontSize);
    return () => window.removeEventListener('resize', adjustOptionsFontSize);
  }, [options]);
  
  const adjustOptionsFontSize = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const items = container.querySelectorAll('li');
    
    // Start with a reasonable font size
    let fontSize = 14;
    
    // Reduce font size if any item overflows
    let overflow = false;
    do {
      overflow = false;
      items.forEach(item => {
        item.style.fontSize = `${fontSize}px`;
        // Check both width and height overflow
        if (item.scrollWidth > item.clientWidth || 
            container.scrollHeight > container.clientHeight) {
          overflow = true;
        }
      });
      
      if (overflow && fontSize > 6) {
        fontSize -= 1;
      } else {
        break;
      }
    } while (fontSize > 6);
    
    // Final check for container overflow
    if (container.scrollHeight > container.clientHeight && fontSize > 6) {
      // Further reduce font size if the entire list is too tall
      do {
        fontSize -= 1;
        items.forEach(item => {
          item.style.fontSize = `${fontSize}px`;
        });
      } while (container.scrollHeight > container.clientHeight && fontSize > 6);
    }
  };
  
  return (
    <div className="options-container" ref={containerRef}>
      <ol type="a">
        {options.map((option, index) => (
          <li key={index}>
            {option.replace(/^[a-d]\)\s*/i, '')}
          </li>
        ))}
      </ol>
    </div>
  );
};

const Flashcard = ({ card, onDelete, onFlip, onUpdateCard, showButtons = true }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const cardRef = useRef(null);
  
  // Apply card styles based on card data
  const cardStyle = {
    backgroundColor: card.cardColor || '#3cb44b',
    borderColor: card.boxNum === 5 ? 'gold' : 'transparent', // Gold border for mastered cards
    boxShadow: card.boxNum === 5 ? '0 0 10px rgba(255, 215, 0, 0.5)' : undefined
  };
  
  // Get contrast color for text based on background
  const textColor = getContrastColor(card.cardColor || '#3cb44b');
  
  // Handle card flipping
  const handleFlip = (e) => {
    // Don't flip if clicking on buttons
    if (e.target.closest('.card-controls') || e.target.closest('.color-picker-container') || e.target.closest('.info-btn')) return;
    
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
  
  // Determine if this is a multiple choice card
  const isMultipleChoice = card.questionType === 'multiple_choice' && Array.isArray(card.options);
  
  // Check if card has additional information
  const hasAdditionalInfo = card.additionalInfo || card.detailedAnswer;
  
  return (
    <>
      <div 
        ref={cardRef}
        className={`flashcard ${isFlipped ? 'flipped' : ''} ${card.boxNum === 5 ? 'mastered' : ''}`}
        onClick={handleFlip}
        style={cardStyle}
      >
        {showButtons && (
          <div className="card-controls">
            {confirmDelete ? (
              <div className="delete-confirm">
                <span style={{ color: textColor }}>Delete?</span>
                <button onClick={confirmDeleteCard} className="confirm-btn">Yes</button>
                <button onClick={cancelDelete} className="cancel-btn">No</button>
              </div>
            ) : (
              <>
                <button 
                  className="delete-btn" 
                  onClick={handleDeleteClick}
                  style={{ color: textColor }}
                >
                  ✕
                </button>
                <button 
                  className="color-btn" 
                  onClick={toggleColorPicker}
                  style={{ color: textColor }}
                >
                  🎨
                </button>
                {hasAdditionalInfo && (
                  <button 
                    className="info-btn" 
                    onClick={toggleInfoModal}
                    style={{ color: textColor }}
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
          </div>
        )}
        
        <div className="flashcard-inner">
          <div className="flashcard-front" style={{ color: textColor }}>
            {isMultipleChoice ? (
              <>
                <ScaledText className="question-title" maxFontSize={16}>
                  {card.front || card.question}
                </ScaledText>
                <MultipleChoiceOptions options={card.options} />
              </>
            ) : (
              <ScaledText maxFontSize={16}>
                <div dangerouslySetInnerHTML={{ __html: card.front || card.question || "No question" }} />
              </ScaledText>
            )}
            
            {hasAdditionalInfo && (
              <button 
                className="info-btn card-front-info" 
                onClick={toggleInfoModal}
                style={{ color: textColor }}
              >
                ℹ️
              </button>
            )}
          </div>
          
          <div className="flashcard-back">
            <ScaledText maxFontSize={14}>
              <div dangerouslySetInnerHTML={{ __html: card.back || card.detailedAnswer || "No answer" }} />
            </ScaledText>
            
            {hasAdditionalInfo && (
              <button 
                className="info-btn card-back-info" 
                onClick={toggleInfoModal}
                style={{ color: textColor }}
              >
                ℹ️
              </button>
            )}
            
            {card.boxNum !== undefined && (
              <div className="box-indicator">
                Box {card.boxNum}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Information Modal */}
      {showInfoModal && (
        <div className="info-modal-overlay" onClick={closeInfoModal}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="info-modal-header">
              <h3>Additional Information</h3>
              <button className="close-modal-btn" onClick={closeInfoModal}>✕</button>
            </div>
            <div className="info-modal-content">
              <div dangerouslySetInnerHTML={{ __html: card.additionalInfo || card.detailedAnswer || "No additional information available." }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Flashcard;
