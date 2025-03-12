import React, { useState, useEffect } from "react";
import Flashcard from "./Flashcard";
import "./FlashcardList.css";

const FlashcardList = ({ cards, onDeleteCard, onUpdateCard }) => {
  // State to track expanded topics
  const [expandedTopics, setExpandedTopics] = useState({});
  
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
    return brightness >= 128 ? '#000000' : '#ffffff';
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
      {Object.keys(groupedCards).map((subject) => (
        <div key={subject} className="subject-column">
          <div 
            className="subject-header"
            onClick={() => toggleExpand(subject)}
          >
            <h2>{subject}</h2>
            <span className="card-count">
              ({Object.values(groupedCards[subject]).flat().length} cards)
            </span>
            <span className="expand-icon">
              {expandedTopics[subject] ? '▼' : '▶'}
            </span>
          </div>

          {expandedTopics[subject] && Object.keys(groupedCards[subject]).map((topic) => {
            // Get the first card's color for the topic
            const topicColor = groupedCards[subject][topic][0]?.cardColor || '#e0e0e0';
            const textColor = getContrastColor(topicColor);
            
            return (
              <div key={`${subject}-${topic}`} className="topic-group">
                <div 
                  className="topic-header"
                  style={{ 
                    backgroundColor: topicColor,
                    color: textColor 
                  }}
                  onClick={() => toggleExpand(`${subject}-${topic}`)}
                >
                  <h3>{topic}</h3>
                  <span className="card-count">
                    ({groupedCards[subject][topic].length} cards)
                  </span>
                  <span className="expand-icon">
                    {expandedTopics[`${subject}-${topic}`] ? '▼' : '▶'}
                  </span>
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
      ))}
    </div>
  );
};

export default FlashcardList;
