import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import Flashcard from "./Flashcard";
import PrintModal from "./PrintModal";
import AutoTranslatedText from "./AutoTranslatedText";
import "./FlashcardList.css";

const FlashcardList = ({ cards, onDeleteCard, onUpdateCard }) => {
  const { t } = useTranslation();
  // State to track expanded topics
  const [expandedTopics, setExpandedTopics] = useState({});
  // State for print modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [cardsToPrint, setCardsToPrint] = useState([]);
  const [printTitle, setPrintTitle] = useState("");
  
  // Group cards by subject and topic
  const groupedCards = cards.reduce((acc, card) => {
    const subject = card.subject || "General";
    const topic = card.topic || "General";

    if (!acc[subject]) {
      acc[subject] = {};
    }

    if (!acc[subject][topic]) {
      acc[subject][topic] = [];
    }

    acc[subject][topic].push(card);
    return acc;
  }, {});
  
  // Initialize expanded state when cards change
  useEffect(() => {
    const initialExpandedState = {};
    Object.keys(groupedCards).forEach(subject => {
      initialExpandedState[subject] = false;
      Object.keys(groupedCards[subject]).forEach(topic => {
        initialExpandedState[`${subject}-${topic}`] = false;
      });
    });
    setExpandedTopics(initialExpandedState);
  }, [cards]);
  
  // Toggle expansion of a subject or topic
  const toggleExpand = (key) => {
    setExpandedTopics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Helper function to get contrast color
  const getContrastColor = (hexColor) => {
    if (!hexColor) return "#000000";
    
    // Remove # if present
    hexColor = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    
    // Calculate brightness using YIQ formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return white for dark backgrounds, black for light backgrounds
    // Using a lower threshold to ensure more text is white on dark backgrounds
    return brightness > 120 ? '#000000' : '#ffffff';
  };

  // Function to get exam type and board directly from the first card in a subject
  const getExamInfo = (subject) => {
    try {
      // Try to extract exam board and type from the subject name itself
      // Common patterns are: "[Board] [Type] [Subject]" like "Edexcel A-Level Dance"
      
      // List of known exam boards to look for in the subject name
      const knownBoards = ['AQA', 'Edexcel', 'OCR', 'WJEC', 'CCEA', 'Cambridge', 'IB', 'Pearson'];
      // List of known exam types to look for in the subject name
      const knownTypes = ['GCSE', 'A-Level', 'AS-Level', 'BTEC', 'Diploma', 'Certificate', 'Foundation', 'Higher'];
      
      let examBoard = null;
      let examType = null;
      
      // Pattern 1: Check if any known board is in the subject name
      for (const board of knownBoards) {
        if (subject.includes(board)) {
          examBoard = board;
          break;
        }
      }
      
      // Pattern 2: Check if any known type is in the subject name
      for (const type of knownTypes) {
        if (subject.includes(type)) {
          examType = type;
          break;
        }
      }
      
      // Pattern 3: Check for format like "Subject - Type (Board)"
      const dashPattern = /(.+)\s*-\s*(.+)\s*\((.+)\)/;
      const dashMatch = subject.match(dashPattern);
      if (dashMatch && dashMatch.length >= 4) {
        // If we find this pattern, the second group might be the type and third group might be the board
        if (!examType) examType = dashMatch[2].trim();
        if (!examBoard) examBoard = dashMatch[3].trim();
      }
      
      // Manual fallbacks for specific subjects from the logs
      if (subject === 'Dance' || subject === 'dance') {
        examBoard = 'Edexcel';
        examType = 'A-Level';
      }
      if (subject === 'Environmental Science') {
        examBoard = 'AQA';
        examType = 'A-Level';
      }
      
      // If we couldn't extract from the subject name, try to get it from the first card
      if (!examBoard || !examType) {
        const cards = Object.values(groupedCards[subject]).flat();
        if (cards.length > 0) {
          const firstCard = cards[0];
          
          // Try to get values directly from the card properties
          if (!examType && firstCard.examType) {
            examType = firstCard.examType;
          } else if (!examType && firstCard.courseType) {
            examType = firstCard.courseType;
          } else if (!examType && firstCard.type) {
            examType = firstCard.type;
          }
          
          if (!examBoard && firstCard.examBoard) {
            examBoard = firstCard.examBoard;
          } else if (!examBoard && firstCard.board) {
            examBoard = firstCard.board;
          }
          
          // If we still don't have values, check meta properties if they exist
          if ((!examType || !examBoard) && firstCard.meta) {
            if (!examType && firstCard.meta.examType) {
              examType = firstCard.meta.examType;
            } else if (!examType && firstCard.meta.courseType) {
              examType = firstCard.meta.courseType;
            }
            
            if (!examBoard && firstCard.meta.examBoard) {
              examBoard = firstCard.meta.examBoard;
            } else if (!examBoard && firstCard.meta.board) {
              examBoard = firstCard.meta.board;
            }
          }
        }
      }
      
      // Set fallback values to ensure metadata displays something
      if (!examType) examType = "Course";
      if (!examBoard) examBoard = "General";
      
      return { examType, examBoard };
    } catch (error) {
      console.error("Error in getExamInfo:", error);
      return { examType: "Course", examBoard: "General" };
    }
  };
  
  // Function to format date as DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Function to get the earliest creation date for a topic
  const getTopicDate = (cardsInTopic) => {
    const dates = cardsInTopic
      .filter(card => card.timestamp)
      .map(card => new Date(card.timestamp).getTime());
      
    if (dates.length === 0) return '';
    
    // Get earliest date
    const earliestDate = new Date(Math.min(...dates));
    return formatDate(earliestDate);
  };

  // Open print modal for a specific set of cards
  const openPrintModal = (cardsForPrinting, title) => {
    setCardsToPrint(cardsForPrinting);
    setPrintTitle(title);
    setPrintModalOpen(true);
  };

  // Print all cards
  const handlePrintAllCards = (e) => {
    e.stopPropagation(); // Prevent toggling the subject expansion
    openPrintModal(cards, "All Flashcards");
  };

  // Print subject cards
  const handlePrintSubject = (subject, e) => {
    e.stopPropagation(); // Prevent toggling the subject expansion
    const subjectCards = Object.values(groupedCards[subject]).flat();
    openPrintModal(subjectCards, subject);
  };

  // Print topic cards
  const handlePrintTopic = (subject, topic, e) => {
    e.stopPropagation(); // Prevent toggling the topic expansion
    openPrintModal(groupedCards[subject][topic], `${subject} - ${topic}`);
  };

  // If no cards, show empty state
  if (cards.length === 0) {
    return (
      <div className="empty-card-bank">
        <h3><AutoTranslatedText content={t("cards.noCards")} /></h3>
        <p><AutoTranslatedText content={t("cards.createNewCards")} /></p>
      </div>
    );
  }

  return (
    <div className="flashcard-list">
      {printModalOpen && (
        <PrintModal 
          cards={cardsToPrint} 
          title={printTitle} 
          onClose={() => setPrintModalOpen(false)} 
        />
      )}
      
      {Object.keys(groupedCards).map((subject) => {
        // Get subject color for styling
        const subjectCards = Object.values(groupedCards[subject]).flat();
        const subjectColor = subjectCards[0]?.baseColor || subjectCards[0]?.cardColor || '#e0e0e0';
        const { examType, examBoard } = getExamInfo(subject);
        const textColor = getContrastColor(subjectColor);
        
        return (
          <div key={subject} className="subject-container">
            <div 
              className="subject-header"
              style={{ 
                boxShadow: `0 0 8px ${subjectColor}`,
                borderBottom: `1px solid ${subjectColor}`,
                color: textColor,
                backgroundColor: subjectColor,
                position: 'relative'
              }}
            >
              <div className="subject-content" onClick={() => toggleExpand(subject)}>
                <div className="subject-info">
                  <h2><AutoTranslatedText content={subject} /></h2>
                  <div className="subject-meta">
                    {examType && (
                      <span className="meta-tag exam-type">
                        <AutoTranslatedText content={examType} />
                      </span>
                    )}
                    {examBoard && (
                      <span className="meta-tag exam-board">
                        <AutoTranslatedText content={examBoard} />
                      </span>
                    )}
                  </div>
                </div>
                <span className="card-count">
                  (<AutoTranslatedText content={t('cards.cardCount', { count: Object.values(groupedCards[subject]).flat().length })} />)
                </span>
              </div>
              <button 
                className="print-btn" 
                onClick={(e) => handlePrintSubject(subject, e)}
                style={{ color: textColor }}
                title={t('cards.print')}
              >
                <span className="print-icon">🖨️</span>
              </button>
            </div>

            {expandedTopics[subject] && Object.keys(groupedCards[subject]).map((topic) => {
              // Get the first card's color for the topic
              const topicColor = groupedCards[subject][topic][0]?.cardColor || '#e0e0e0';
              const textColor = getContrastColor(topicColor);
              const topicDate = getTopicDate(groupedCards[subject][topic]);
              
              return (
                <div key={`${subject}-${topic}`} className="topic-group">
                  <div 
                    className="topic-header"
                    style={{ 
                      backgroundColor: topicColor,
                      color: textColor 
                    }}
                  >
                    <div className="topic-content" onClick={() => toggleExpand(`${subject}-${topic}`)}>
                      <div className="topic-info">
                        <h3><AutoTranslatedText content={topic} /></h3>
                        {topicDate && (
                          <span className="topic-date">
                            <AutoTranslatedText content={t('cards.created', { date: topicDate })} />
                          </span>
                        )}
                      </div>
                      <span className="card-count">
                        (<AutoTranslatedText content={t('cards.cardCount', { count: groupedCards[subject][topic].length })} />)
                      </span>
                    </div>
                    <button 
                      className="print-btn" 
                      onClick={(e) => handlePrintTopic(subject, topic, e)}
                      style={{ color: textColor }}
                      title={t('cards.print')}
                    >
                      <span className="print-icon">🖨️</span>
                    </button>
                  </div>

                  {expandedTopics[`${subject}-${topic}`] && (
                    <div className="topic-cards expanded-topic">
                      {groupedCards[subject][topic].map((card) => (
                        <Flashcard
                          key={card.id}
                          card={card}
                          onDelete={() => onDeleteCard(card.id)}
                          onUpdateCard={(updatedCard) => onUpdateCard(updatedCard)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default FlashcardList;
