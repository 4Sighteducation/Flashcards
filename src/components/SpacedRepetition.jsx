import React, { useState, useEffect } from "react";
import "./SpacedRepetition.css";

const SpacedRepetition = ({
  cards,
  currentBox,
  spacedRepetitionData,
  onSelectBox,
  onMoveCard,
  onReturnToBank,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCards, setCurrentCards] = useState([]);
  const [showFlipResponse, setShowFlipResponse] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCompleted, setStudyCompleted] = useState(false);

  // Update current cards when box changes
  useEffect(() => {
    setCurrentCards(cards.filter((card) => !card.attempted));
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowFlipResponse(false);
    setStudyCompleted(false);
  }, [cards, currentBox]);

  // Box information text
  const boxInfo = {
    1: {
      title: "Box 1: Everyday",
      explanation:
        "Practice these cards daily. Correct responses move them to Box 2.",
    },
    2: {
      title: "Box 2: Every Other Day",
      explanation:
        "Review these cards every other day. Correct responses move them to Box 3; if missed or answered incorrectly, they return to Box 1.",
    },
    3: {
      title: "Box 3: Every 3 Days",
      explanation:
        "Review these cards every 3 days. Correct responses move them to Box 4; if incorrect or overdue, they return to Box 1.",
    },
    4: {
      title: "Box 4: Every 7 Days",
      explanation:
        "Review these cards weekly. Correct responses move them to Box 5; if incorrect, they return to Box 1.",
    },
    5: {
      title: "Box 5: Mastered",
      explanation:
        "Cards here remain indefinitely unless answered incorrectly, which returns them to Box 1.",
    },
  };

  // Get counts for each box
  const boxCounts = {
    1: spacedRepetitionData.box1?.length || 0,
    2: spacedRepetitionData.box2?.length || 0,
    3: spacedRepetitionData.box3?.length || 0,
    4: spacedRepetitionData.box4?.length || 0,
    5: spacedRepetitionData.box5?.length || 0,
  };

  // When a card is flipped to reveal the answer
  const handleCardFlip = () => {
    if (!isFlipped && currentCards.length > 0) {
      setIsFlipped(true);

      // Show response buttons after a delay
      setTimeout(() => {
        setShowFlipResponse(true);
      }, 1000);
    }
  };

  // When user indicates they got the answer correct
  const handleCorrectAnswer = () => {
    if (currentCards.length === 0) return;

    const card = currentCards[currentIndex];

    // Determine the next box
    let nextBox = Math.min(currentBox + 1, 5);

    // Mark the card as attempted
    onMoveCard(card.id, nextBox);

    // Update the local state
    setCurrentCards((prev) => prev.filter((_, i) => i !== currentIndex));
    setShowFlipResponse(false);
    setIsFlipped(false);

    // Check if we've completed all cards
    if (currentCards.length <= 1) {
      setStudyCompleted(true);
    }
  };

  // When user indicates they got the answer wrong
  const handleIncorrectAnswer = () => {
    if (currentCards.length === 0) return;

    const card = currentCards[currentIndex];

    // Always move back to Box 1 for incorrect answers
    onMoveCard(card.id, 1);

    // Update the local state
    setCurrentCards((prev) => prev.filter((_, i) => i !== currentIndex));
    setShowFlipResponse(false);
    setIsFlipped(false);

    // Check if we've completed all cards
    if (currentCards.length <= 1) {
      setStudyCompleted(true);
    }
  };

  // Move to the next card
  const nextCard = () => {
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowFlipResponse(false);
    }
  };

  // Move to the previous card
  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowFlipResponse(false);
    }
  };

  // Render the completed view when all cards are done
  if (studyCompleted) {
    return (
      <div className="spaced-repetition">
        <div className="box-info">
          <h2>{boxInfo[currentBox]?.title}</h2>
        </div>

        <div className="completion-message">
          <h3>Great job!</h3>
          <p>
            You've completed all cards in this box. Continue studying another
            box or return to your card bank.
          </p>
          <div className="box-selection">
            <h4>Select a box to study:</h4>
            <div className="box-buttons">
              {[1, 2, 3, 4, 5].map((boxNum) => (
                <button
                  key={boxNum}
                  className={`box-button ${
                    boxNum === currentBox ? "active" : ""
                  }`}
                  onClick={() => onSelectBox(boxNum)}
                >
                  Box {boxNum} ({boxCounts[boxNum]})
                </button>
              ))}
            </div>
          </div>
          <button className="return-button" onClick={onReturnToBank}>
            Return to Card Bank
          </button>
        </div>
      </div>
    );
  }

  // Render the study interface
  return (
    <div className="spaced-repetition">
      <div className="box-info">
        <h2>{boxInfo[currentBox]?.title}</h2>
        <p>{boxInfo[currentBox]?.explanation}</p>
      </div>

      <div className="box-navigation">
        <div className="box-buttons">
          {[1, 2, 3, 4, 5].map((boxNum) => (
            <button
              key={boxNum}
              className={`box-button ${boxNum === currentBox ? "active" : ""}`}
              onClick={() => onSelectBox(boxNum)}
            >
              Box {boxNum} ({boxCounts[boxNum]})
            </button>
          ))}
        </div>

        <button className="return-button" onClick={onReturnToBank}>
          Return to Card Bank
        </button>
      </div>

      {currentCards.length > 0 ? (
        <div className="card-study-area">
          <div
            className={`study-card ${isFlipped ? "flipped" : ""}`}
            onClick={handleCardFlip}
          >
            <div className="card-inner">
              <div className="card-front">
                <div
                  className="card-content"
                  dangerouslySetInnerHTML={{
                    __html:
                      currentCards[currentIndex].front ||
                      currentCards[currentIndex].question ||
                      "No question",
                  }}
                />
              </div>
              <div className="card-back">
                <div
                  className="card-content"
                  dangerouslySetInnerHTML={{
                    __html:
                      currentCards[currentIndex].back ||
                      currentCards[currentIndex].detailedAnswer ||
                      "No answer",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="card-navigation">
            <button
              className="prev-button"
              onClick={prevCard}
              disabled={currentIndex === 0}
            >
              Previous
            </button>
            <div className="card-counter">
              {currentIndex + 1} / {currentCards.length}
            </div>
            <button
              className="next-button"
              onClick={nextCard}
              disabled={currentIndex === currentCards.length - 1}
            >
              Next
            </button>
          </div>

          {showFlipResponse && (
            <div className="flip-response">
              <p>Did you know the answer?</p>
              <div className="response-buttons">
                <button
                  className="correct-button"
                  onClick={handleCorrectAnswer}
                >
                  Yes - I got it right
                </button>
                <button
                  className="incorrect-button"
                  onClick={handleIncorrectAnswer}
                >
                  No - Move to Box 1
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-box">
          <h3>No cards to study in this box</h3>
          <p>
            Select another box or return to your card bank to add more cards.
          </p>
        </div>
      )}
    </div>
  );
};

export default SpacedRepetition;
