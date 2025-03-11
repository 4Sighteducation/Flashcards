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
  
  // New state for subject and topic selection
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [filteredCards, setFilteredCards] = useState([]);
  
  // Add new state for multiple choice selection
  const [selectedOption, setSelectedOption] = useState(null);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  
  // Add new state for review date checking
  const [showReviewDateMessage, setShowReviewDateMessage] = useState(false);
  const [nextReviewDate, setNextReviewDate] = useState(null);

  // Add state for info modal
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Group cards by subject and topic and filter for review availability
  useEffect(() => {
    if (cards.length > 0) {
      // Extract unique subjects from cards
      const uniqueSubjects = [...new Set(cards.map(card => card.subject || "General"))];
      setSubjects(uniqueSubjects);
      
      // If we have a selected subject, update topics
      if (selectedSubject) {
        const topicsForSubject = [...new Set(
          cards
            .filter(card => (card.subject || "General") === selectedSubject)
            .map(card => card.topic || "General")
        )];
        setTopics(topicsForSubject);
      }
      
      // Filter cards by current box, subject and topic
      let filtered = cards.filter(card => {
        // First check if card is in the current box
        const cardInBox = spacedRepetitionData[`box${currentBox}`]?.some(
          boxItem => String(boxItem) === card.id
        );
        
        // If not in the box, exclude it
        if (!cardInBox) return false;
        
        // If subject filter is active, check subject
        if (selectedSubject && (card.subject || "General") !== selectedSubject) {
          return false;
        }
        
        // If topic filter is active, check topic
        if (selectedTopic && (card.topic || "General") !== selectedTopic) {
          return false;
        }
        
        return true;
      });
      
      console.log(`Filtered cards for box ${currentBox}:`, filtered);
      
      // Check review dates but don't filter out cards that aren't ready
      const today = new Date();
      
      // Since we're only storing IDs, all cards are considered reviewable
      const cardsWithReviewStatus = filtered.map(card => {
        return {
          ...card,
          isReviewable: true
        };
      });
      
      setFilteredCards(cardsWithReviewStatus);
      console.log("Filtered and sorted cards:", cardsWithReviewStatus);
    } else {
      setFilteredCards([]);
    }
  }, [cards, currentBox, selectedSubject, selectedTopic, spacedRepetitionData]);

  // Update current cards - include ALL cards, not just reviewable ones
  useEffect(() => {
    // Reset index when cards change
    setCurrentIndex(0);
    setShowFlipResponse(false);
    setIsFlipped(false);
    setStudyCompleted(false);
    
    // Include all cards, not just reviewable ones
    setCurrentCards(filteredCards);
    console.log("SpacedRepetition - Updated current cards:", filteredCards);
  }, [filteredCards]);

  // When going to a new card, reset the flip state
  useEffect(() => {
    if (currentCards.length === 0) {
      console.log("SpacedRepetition - No cards to study");
      return;
    }
    setIsFlipped(false);
    setShowFlipResponse(false);
    setSelectedOption(null);
    setShowAnswerFeedback(false);
  }, [currentIndex, currentCards]);

  // Check if there are any reviewable cards for the current box
  const hasReviewableCards = filteredCards.some(card => card.isReviewable);

  console.log("SpacedRepetition - Current state:", {
    cards: cards.length,
    filteredCards: filteredCards.length,
    currentCards: currentCards.length,
    currentBox,
    hasReviewableCards,
    isFlipped,
    studyCompleted
  });

  // Handle showing next card
  const handleNextCard = () => {
    if (currentCards.length === 0) {
      console.log("SpacedRepetition - No cards to navigate");
      return;
    }
    
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setStudyCompleted(true);
    }
    setIsFlipped(false);
    setShowFlipResponse(false);
    setSelectedOption(null);
    setShowAnswerFeedback(false);
  };

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
    // Check if the card is reviewable before allowing flip
    if (currentCards.length > 0 && currentIndex < currentCards.length) {
      const currentCard = currentCards[currentIndex];
      
      if (!currentCard.isReviewable) {
        // Since we don't have nextReviewDate anymore, just show a generic message
        setNextReviewDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow as fallback
        setShowReviewDateMessage(true);
        return;
      }
      
      // Proceed with normal flip if reviewable
      setIsFlipped(!isFlipped);
      
      if (!isFlipped) {
        // Set a timeout to show the response buttons after the card is flipped
        setTimeout(() => {
          setShowFlipResponse(true);
        }, 500);
      } else {
        setShowFlipResponse(false);
      }
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

  // Handle subject selection
  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setSelectedTopic(null);
  };

  // Handle topic selection
  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
  };

  // Add a function to toggle the info modal
  const toggleInfoModal = (e) => {
    if (e) e.stopPropagation(); // Prevent card flip
    setShowInfoModal(!showInfoModal);
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

  // Render multiple choice options if applicable
  const renderMultipleChoice = (card) => {
    if (!card.options || !Array.isArray(card.options) || card.options.length === 0) {
      return null;
    }

    return (
      <div className="multiple-choice-options">
        <h4>Options:</h4>
        <ul>
          {card.options.map((option, index) => (
            <li 
              key={index} 
              className={`
                ${isFlipped && option === card.correctAnswer ? "correct-option" : ""}
                ${selectedOption === option ? "selected-option" : ""}
              `}
              onClick={(e) => {
                e.stopPropagation(); // Prevent card flip when clicking option
                if (!isFlipped) {
                  handleOptionClick(option, card);
                }
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  // New function to handle clicking on a multiple choice option
  const handleOptionClick = (option, card) => {
    setSelectedOption(option);
    setIsFlipped(true);
    
    // Check if selected option is correct
    const isCorrect = option === card.correctAnswer;
    setIsCorrectAnswer(isCorrect);
    
    // Show feedback after a short delay
    setTimeout(() => {
      setShowAnswerFeedback(true);
    }, 500);
  };

  // Render the study interface
  return (
    <div className="spaced-repetition">
      <div className="box-info">
        <h2>Spaced Repetition</h2>
        <p>
          You are reviewing cards in Box {currentBox}. {" "}
          {currentBox === 1 && "Review daily."}
          {currentBox === 2 && "Review every 2 days."}
          {currentBox === 3 && "Review every 3 days."}
          {currentBox === 4 && "Review every 7 days."}
          {currentBox === 5 && "These cards are mastered. Occasional review."}
        </p>
      </div>
      
      <div className="box-navigation">
        <button className="return-button" onClick={onReturnToBank}>
          Return to Card Bank
        </button>
        
        <div className="box-buttons">
          {[1, 2, 3, 4, 5].map((box) => (
            <button
              key={box}
              className={`box-button ${currentBox === box ? "active" : ""}`}
              onClick={() => onSelectBox(box)}
            >
              Box {box}
              <span className="card-count">
                ({spacedRepetitionData[`box${box}`]?.length || 0})
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="subject-topic-selection">
        <div className="subject-selector">
          <h3>Filter by Subject</h3>
          <div className="subject-list">
            <div 
              className={`subject-item ${selectedSubject === null ? "selected" : ""}`}
              onClick={() => handleSubjectSelect(null)}
            >
              All Subjects
            </div>
            {subjects.map(subject => (
              <div 
                key={subject}
                className={`subject-item ${selectedSubject === subject ? "selected" : ""}`}
                onClick={() => handleSubjectSelect(subject)}
                style={{
                  backgroundColor: selectedSubject === subject ? 
                    subject === "General" ? "#06206e" : currentCards.find(card => card.subject === subject)?.cardColor || "#06206e" : 
                    "inherit"
                }}
              >
                {subject}
              </div>
            ))}
          </div>
        </div>
        
        {selectedSubject && (
          <div className="topic-selector">
            <h3>Filter by Topic</h3>
            <div className="topic-list">
              <div 
                className={`topic-item ${selectedTopic === null ? "selected" : ""}`}
                onClick={() => handleTopicSelect(null)}
              >
                All Topics
              </div>
              {topics.map(topic => (
                <div 
                  key={topic}
                  className={`topic-item ${selectedTopic === topic ? "selected" : ""}`}
                  onClick={() => handleTopicSelect(topic)}
                >
                  {topic}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {currentCards.length > 0 ? (
        <div className="card-study-area">
          <div
            className={`study-card ${isFlipped ? "flipped" : ""} ${
              !currentCards[currentIndex].isReviewable ? "not-reviewable" : ""
            }`}
            onClick={handleCardFlip}
            style={{
              '--card-color': currentCards[currentIndex].cardColor || '#ffffff'
            }}
          >
            <div className="card-inner">
              <div className="card-front">
                <div className="card-subject-topic">
                  <span className="card-subject">{currentCards[currentIndex].subject || "General"}</span>
                  <span className="card-topic">{currentCards[currentIndex].topic || ""}</span>
                </div>
                {currentCards[currentIndex].additionalInfo && (
                  <button 
                    className="info-btn" 
                    onClick={toggleInfoModal}
                    style={{ position: 'absolute', top: '10px', left: '10px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ℹ️
                  </button>
                )}
                <div
                  className="card-content"
                  dangerouslySetInnerHTML={{
                    __html:
                      currentCards[currentIndex].front ||
                      currentCards[currentIndex].question ||
                      "No question"
                  }}
                />
                {currentCards[currentIndex].questionType === 'multiple_choice' && !isFlipped && renderMultipleChoice(currentCards[currentIndex])}
                
                {!currentCards[currentIndex].isReviewable && (
                  <div className="review-date-overlay">
                    <p>Not yet ready for review</p>
                  </div>
                )}
              </div>
              <div className="card-back">
                <div className="card-subject-topic">
                  <span className="card-subject">{currentCards[currentIndex].subject || "General"}</span>
                  <span className="card-topic">{currentCards[currentIndex].topic || ""}</span>
                </div>
                <div
                  className="card-content"
                  dangerouslySetInnerHTML={{
                    __html:
                      currentCards[currentIndex].back ||
                      currentCards[currentIndex].detailedAnswer ||
                      currentCards[currentIndex].correctAnswer ||
                      "No answer"
                  }}
                />
                {currentCards[currentIndex].questionType === 'multiple_choice' && isFlipped && renderMultipleChoice(currentCards[currentIndex])}
              </div>
            </div>
          </div>

          <div className="card-counter">
            Card {currentIndex + 1} of {currentCards.length}
          </div>

          <div className="card-navigation">
            <button
              className="prev-button"
              onClick={prevCard}
              disabled={currentIndex === 0}
            >
              Previous
            </button>
            <div className="card-index">
              {currentIndex + 1} / {currentCards.length}
            </div>
            <button
              className="next-button"
              onClick={handleNextCard}
              disabled={currentIndex === currentCards.length - 1}
            >
              Next
            </button>
          </div>

          {/* Render different feedback based on question type */}
          {showFlipResponse && !showAnswerFeedback && currentCards[currentIndex].questionType !== 'multiple_choice' && (
            <div className="flip-response">
              <p>Did you know the answer?</p>
              <div className="response-buttons">
                <button className="correct-button" onClick={handleCorrectAnswer}>
                  Correct
                </button>
                <button
                  className="incorrect-button"
                  onClick={handleIncorrectAnswer}
                >
                  Incorrect
                </button>
              </div>
            </div>
          )}
          
          {/* Show feedback for multiple choice answers */}
          {showAnswerFeedback && currentCards[currentIndex].questionType === 'multiple_choice' && (
            <div className={`answer-feedback ${isCorrectAnswer ? 'correct' : 'incorrect'}`}>
              <h3>{isCorrectAnswer ? 'Congratulations!' : 'Unlucky!'}</h3>
              <p>
                {isCorrectAnswer 
                  ? `You got that right! Moving up to Box ${Math.min(currentBox + 1, 5)}.` 
                  : `That's incorrect. The correct answer is: ${currentCards[currentIndex].correctAnswer}`}
              </p>
              <div className="feedback-buttons">
                <button 
                  className={isCorrectAnswer ? "correct-button" : "incorrect-button"} 
                  onClick={() => {
                    // Reset state and process card movement
                    if (isCorrectAnswer) {
                      handleCorrectAnswer();
                    } else {
                      handleIncorrectAnswer();
                    }
                    setSelectedOption(null);
                    setShowAnswerFeedback(false);
                  }}
                >
                  {isCorrectAnswer ? "Continue" : "Move to Box 1"}
                </button>
              </div>
            </div>
          )}
          
          {/* Review date message dialog */}
          {showReviewDateMessage && (
            <div className="review-date-message">
              <h3>Not Ready for Review</h3>
              <p>
                This card has been reviewed already. Please wait until{" "}
                {nextReviewDate ? nextReviewDate.toLocaleDateString() : "later"} before reviewing again.
              </p>
              <div className="review-date-actions">
                <button onClick={() => setShowReviewDateMessage(false)}>OK</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-box">
          <h3>No cards to study</h3>
          <p>
            There are no cards in this box for the selected subject/topic.
            Please select a different box, subject, or topic, or add more cards to your collection.
          </p>
        </div>
      )}

      {showInfoModal && currentCards.length > 0 && (
        <div className="info-modal-overlay" onClick={toggleInfoModal}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="info-modal-header">
              <h3>Additional Information</h3>
              <button className="close-modal-btn" onClick={toggleInfoModal}>✕</button>
            </div>
            <div className="info-modal-content">
              <div dangerouslySetInnerHTML={{ __html: currentCards[currentIndex].additionalInfo || "No additional information available." }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpacedRepetition;
