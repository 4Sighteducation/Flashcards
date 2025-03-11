import React from "react";
import Flashcard from "./Flashcard";
import "./FlashcardList.css";

const FlashcardList = ({ cards, onDeleteCard, onUpdateCard }) => {
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
          <div className="subject-header">
            <h2>{subject}</h2>
          </div>

          {Object.keys(groupedCards[subject]).map((topic) => (
            <div key={`${subject}-${topic}`} className="topic-group">
              <div className="topic-header">
                <h3>{topic}</h3>
                <span>({groupedCards[subject][topic].length} cards)</span>
              </div>

              <div className="topic-cards">
                {groupedCards[subject][topic].map((card) => (
                  <Flashcard
                    key={card.id}
                    card={card}
                    onDelete={() => onDeleteCard(card.id)}
                    onUpdate={(updates) => onUpdateCard(card.id, updates)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default FlashcardList;
