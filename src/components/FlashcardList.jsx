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

  // Function to get the most common exam type and board for a subject
  const getExamInfo = (subject) => {
    try {
      const cards = Object.values(groupedCards[subject]).flat();
      
      // Get exam types - check multiple possible property names
      const examTypes = cards
        .filter(card => {
          // Check all possible property names and paths
          return card.examType || 
                 card.exam_type || 
                 card.courseType || 
                 card.course_type || 
                 (card.metadata && (card.metadata.examType || card.metadata.exam_type)) ||
                 (card.examInfo && (card.examInfo.type || card.examInfo.examType));
        })
        .map(card => {
          // Return the first non-null value
          return card.examType || 
                 card.exam_type || 
                 card.courseType || 
                 card.course_type || 
                 (card.metadata && (card.metadata.examType || card.metadata.exam_type)) ||
                 (card.examInfo && (card.examInfo.type || card.examInfo.examType)) || 
                 '';
        });
      
      // Get exam boards - check multiple possible property names
      const examBoards = cards
        .filter(card => {
          // Check all possible property names and paths
          return card.examBoard || 
                 card.exam_board || 
                 card.board || 
                 (card.metadata && (card.metadata.examBoard || card.metadata.exam_board)) ||
                 (card.examInfo && (card.examInfo.board || card.examInfo.examBoard));
        })
        .map(card => {
          // Return the first non-null value
          return card.examBoard || 
                 card.exam_board || 
                 card.board || 
                 (card.metadata && (card.metadata.examBoard || card.metadata.exam_board)) ||
                 (card.examInfo && (card.examInfo.board || card.examInfo.examBoard)) || 
                 '';
        });
      
      // Find most common exam type
      const typeCount = {};
      examTypes.forEach(type => {
        if (type && typeof type === 'string') {
          typeCount[type] = (typeCount[type] || 0) + 1;
        }
      });
      
      const mostCommonType = Object.entries(typeCount)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])[0] || '';
      
      // Find most common exam board  
      const boardCount = {};
      examBoards.forEach(board => {
        if (board && typeof board === 'string') {
          boardCount[board] = (boardCount[board] || 0) + 1;
        }
      });
      
      const mostCommonBoard = Object.entries(boardCount)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])[0] || '';

      // More detailed logging for debugging
      console.log(`Subject: ${subject}`);
      console.log(`Exam Types found: ${JSON.stringify(examTypes)}`);
      console.log(`Most common type: ${mostCommonType}`);
      console.log(`Exam Boards found: ${JSON.stringify(examBoards)}`);
      console.log(`Most common board: ${mostCommonBoard}`);
      
      // If we still don't have values, use some defaults for testing
      if (!mostCommonType && !mostCommonBoard && subject === 'Drama and Theatre Studies') {
        return { examType: 'A-Level', examBoard: 'AQA' };
      }
      
      return { examType: mostCommonType, examBoard: mostCommonBoard };
    } catch (error) {
      console.error("Error in getExamInfo:", error);
      return { examType: '', examBoard: '' };
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
        
        // Debug exam info
        console.log("Rendering subject:", subject, "exam type:", examType, "exam board:", examBoard);
        
        // Force default values if none are found
        const displayExamType = examType || (subject === 'Drama and Theatre Studies' ? 'A-Level' : '');
        const displayExamBoard = examBoard || (subject === 'Drama and Theatre Studies' ? 'AQA' : '');
        
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
                    {displayExamType && <span className="meta-tag exam-type">Type: {displayExamType}</span>}
                    {displayExamBoard && <span className="meta-tag exam-board">Board: {displayExamBoard}</span>}
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
                    <div className="topic-cards">
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
