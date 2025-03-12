import React, { useState, useEffect } from "react";
import Flashcard from "./Flashcard";
import PrintModal from "./PrintModal";
import "./FlashcardList.css";

const FlashcardList = ({ cards, onDeleteCard, onUpdateCard }) => {
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
      const cards = Object.values(groupedCards[subject]).flat();
      if (cards.length === 0) return { examType: null, examBoard: null };
      
      // Get data directly from the first card
      const firstCard = cards[0];
      
      // Log the complete card to see its structure
      console.log(`CARD DATA FOR ${subject}:`, firstCard);
      
      // Direct access to the most common property names
      let examType = firstCard.examType || firstCard.courseType || firstCard.type || null;
      let examBoard = firstCard.examBoard || firstCard.board || null;
      
      // For debugging specific subjects
      if (subject === 'Environmental Science') {
        console.log('Environmental Science card details:', {
          hasExamType: !!firstCard.examType,
          hasExamBoard: !!firstCard.examBoard,
          firstCard
        });
      }
      
      return { 
        examType,
        examBoard
      };
    } catch (error) {
      console.error("Error in getExamInfo:", error);
      return { examType: null, examBoard: null };
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
        <h3>No Flashcards Found</h3>
        <p>Create new cards or adjust your filters to see cards here.</p>
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
      
      <div className="print-all-container">
        <button className="print-all-btn" onClick={handlePrintAllCards}>
          <span className="print-icon">🖨️</span> Print All Cards
        </button>
      </div>

      {Object.keys(groupedCards).map((subject) => {
        // Get subject color for styling
        const subjectCards = Object.values(groupedCards[subject]).flat();
        const subjectColor = subjectCards[0]?.baseColor || subjectCards[0]?.cardColor || '#e0e0e0';
        const { examType, examBoard } = getExamInfo(subject);
        const textColor = getContrastColor(subjectColor);
        
        // Debug logging
        console.log(`Rendering ${subject} with type=${examType}, board=${examBoard}`);
        
        return (
          <div key={subject} className="subject-column">
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
                  <h2>{subject}</h2>
                  <div className="subject-meta">
                    {examType && <span className="meta-tag exam-type">{examType}</span>}
                    {examBoard && <span className="meta-tag exam-board">{examBoard}</span>}
                  </div>
                </div>
                <span className="card-count">
                  ({Object.values(groupedCards[subject]).flat().length} cards)
                </span>
              </div>
              <button 
                className="print-btn" 
                onClick={(e) => handlePrintSubject(subject, e)}
                style={{ color: textColor }}
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
                        <h3>{topic}</h3>
                        {topicDate && <span className="topic-date">Created: {topicDate}</span>}
                      </div>
                      <span className="card-count">
                        ({groupedCards[subject][topic].length} cards)
                      </span>
                    </div>
                    <button 
                      className="print-btn" 
                      onClick={(e) => handlePrintTopic(subject, topic, e)}
                      style={{ color: textColor }}
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
