import React, { useState } from "react";
import "./Flashcard.css";

const Flashcard = ({ card, onDelete, onUpdate }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Handle card flip
  const handleFlip = (e) => {
    // Don't flip if clicking on buttons
    if (e.target.closest(".card-controls")) return;
    setIsFlipped(!isFlipped);
  };

  // Start delete confirmation
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
    onDelete();
    setConfirmDelete(false);
  };

  // Show card info in popup
  const showInfo = (e) => {
    e.stopPropagation();

    // Gather card metadata
    const infoText = `
      Subject: ${card.subject || "General"}
      Topic: ${card.topic || "General"}
      Box Number: ${card.boxNum || 1}
      Created: ${new Date(card.timestamp || Date.now()).toLocaleString()}
      Card ID: ${card.id}
    `;

    alert(infoText);
  };

  // Determine styles based on card data
  const cardStyles = {
    backgroundColor: card.cardColor || "#e6194b",
    color: getContrastColor(card.cardColor || "#e6194b"),
    borderColor: card.boxNum === 5 ? "gold" : "transparent", // Gold border for mastered cards
  };

  // Determine front and back content
  const frontContent = card.front || card.question || "No question";
  const backContent = card.back || card.detailedAnswer || "No answer";

  // Check if the card is a multiple choice question
  const isMultipleChoice =
    card.questionType === "multiple_choice" && Array.isArray(card.options);

  return (
    <div
      className={`flashcard ${isFlipped ? "flipped" : ""} ${
        card.boxNum === 5 ? "mastered" : ""
      }`}
      onClick={handleFlip}
      style={cardStyles}
    >
      <div className="card-controls">
        {confirmDelete ? (
          <div className="delete-confirm">
            <span>Delete?</span>
            <button onClick={confirmDeleteCard}>Yes</button>
            <button onClick={cancelDelete}>No</button>
          </div>
        ) : (
          <>
            <button className="delete-btn" onClick={handleDeleteClick}>
              ✕
            </button>
            <button className="info-btn" onClick={showInfo}>
              i
            </button>
          </>
        )}
      </div>

      <div className="flashcard-inner">
        <div className="flashcard-front">
          {isMultipleChoice ? (
            <>
              <div className="question-title">{frontContent}</div>
              <ol className="options-list" type="a">
                {card.options.map((option, index) => (
                  <li key={index}>{option.replace(/^[a-d]\)\s*/, "")}</li>
                ))}
              </ol>
            </>
          ) : (
            <div
              className="question-content"
              dangerouslySetInnerHTML={{ __html: frontContent }}
            />
          )}
        </div>

        <div className="flashcard-back">
          {isMultipleChoice ? (
            <div className="answer-content">
              <strong>Correct Answer:</strong>{" "}
              {card.correctAnswer?.replace(/^[a-d]\)\s*/, "")}
              {card.detailedAnswer && (
                <div className="detailed-answer">
                  <p>
                    <strong>Explanation:</strong>
                  </p>
                  <div
                    dangerouslySetInnerHTML={{ __html: card.detailedAnswer }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              className="answer-content"
              dangerouslySetInnerHTML={{ __html: backContent }}
            />
          )}

          {/* Display box number for spaced repetition */}
          {card.boxNum && (
            <div className="box-indicator">Box {card.boxNum}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to determine text color based on background color brightness
const getContrastColor = (hexColor) => {
  // Default to black if no color provided
  if (!hexColor) return "#000000";

  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate brightness (YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return white for dark backgrounds, black for light backgrounds
  return brightness >= 128 ? "#000000" : "#ffffff";
};

export default Flashcard;
