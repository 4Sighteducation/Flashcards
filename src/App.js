import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import FlashcardList from "./components/FlashcardList";
import SubjectsList from "./components/SubjectsList";
import TopicsList from "./components/TopicsList";
import CardCreator from "./components/CardCreator";
import SpacedRepetition from "./components/SpacedRepetition";
import LoadingSpinner from "./components/LoadingSpinner";
import Header from "./components/Header";
import AICardGenerator from './components/AICardGenerator';

function App() {
  // Authentication and user state
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [error, setError] = useState(null);
  const [recordId, setRecordId] = useState(null);

  // App view state
  const [view, setView] = useState("cardBank"); // cardBank, createCard, spacedRepetition

  // Flashcard data
  const [allCards, setAllCards] = useState([]);
  const [subjectColorMapping, setSubjectColorMapping] = useState({});
  const [currentSubjectColor, setCurrentSubjectColor] = useState("#e6194b");

  // Filters and selections
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Spaced repetition state
  const [currentBox, setCurrentBox] = useState(1);
  const [spacedRepetitionData, setSpacedRepetitionData] = useState({
    box1: [],
    box2: [],
    box3: [],
    box4: [],
    box5: [],
  });

  // Status messages
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // User information
  const getUserInfo = useCallback(() => {
    return {
      id: auth?.id || "",
      email: auth?.email || "",
      name: auth?.name || "",
    };
  }, [auth]);

  // Define helper functions first, without dependencies on other functions
  const showStatus = useCallback((message, duration = 3000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), duration);
  }, []);

  // Update spaced repetition data
  const updateSpacedRepetitionData = useCallback((cards) => {
    const newSpacedRepetitionData = {
      box1: [],
      box2: [],
      box3: [],
      box4: [],
      box5: [],
    };

    cards.forEach((card) => {
      const boxNum = card.boxNum || 1;
      if (boxNum >= 1 && boxNum <= 5) {
        newSpacedRepetitionData[`box${boxNum}`].push(card.id);
      }
    });

    setSpacedRepetitionData(newSpacedRepetitionData);
  }, []);

  // Update color mappings - independent of other functions
  const updateColorMapping = useCallback(
    (subject, topic, color) => {
      setSubjectColorMapping((prevMapping) => {
        const newMapping = { ...prevMapping };

        // Create subject entry if it doesn't exist
        if (!newMapping[subject]) {
          newMapping[subject] = { base: color, topics: {} };
        }

        // If a topic is provided, update the topic color
        if (topic) {
          if (!newMapping[subject].topics) {
            newMapping[subject].topics = {};
          }
          newMapping[subject].topics[topic] = color;
        } else {
          // Otherwise just update the base subject color
          newMapping[subject].base = color;
        }
        
        return newMapping;
      });
    },
    []
  );

  // Save data to localStorage fallback - dependent on state only
  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem('flashcards', JSON.stringify(allCards));
      localStorage.setItem('colorMapping', JSON.stringify(subjectColorMapping));
      localStorage.setItem('spacedRepetition', JSON.stringify(spacedRepetitionData));
      console.log("Saved data to localStorage");
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [allCards, subjectColorMapping, spacedRepetitionData]);

  // Save data to Knack - depends on saveToLocalStorage and showStatus
  const saveData = useCallback(() => {
    if (!auth) return;

    setIsSaving(true);

    try {
      // Send data to parent window for saving to Knack
      if (window.parent !== window) {
        window.parent.postMessage(
          {
            type: "SAVE_DATA",
            data: {
              recordId: recordId,
              cards: allCards,
              colorMapping: subjectColorMapping,
              spacedRepetition: spacedRepetitionData,
            },
          },
          "*"
        );

        showStatus("Saving your flashcards...");
      }
      
      // Always save to localStorage as fallback
      saveToLocalStorage();
      
      // If we're in standalone mode, mark as saved
      if (window.parent === window) {
        setIsSaving(false);
        showStatus("Saved successfully!");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      setIsSaving(false);
      showStatus("Error saving data");
    }
  }, [auth, allCards, subjectColorMapping, spacedRepetitionData, showStatus, saveToLocalStorage, recordId]);

  // Cards and data operations - these depend on the above functions
  // Load data from localStorage fallback
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedCards = localStorage.getItem('flashcards');
      const savedColorMapping = localStorage.getItem('colorMapping');
      const savedSpacedRepetition = localStorage.getItem('spacedRepetition');
      
      if (savedCards) {
        const parsedCards = JSON.parse(savedCards);
        setAllCards(parsedCards);
        updateSpacedRepetitionData(parsedCards);
      }
      
      if (savedColorMapping) {
        setSubjectColorMapping(JSON.parse(savedColorMapping));
      }
      
      if (savedSpacedRepetition) {
        setSpacedRepetitionData(JSON.parse(savedSpacedRepetition));
      }
      
      console.log("Loaded data from localStorage");
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
  }, [updateSpacedRepetitionData]);

  // Load data from Knack
  const loadData = useCallback(async () => {
    if (!auth) return;

    setLoadingMessage("Loading your flashcards...");
    setLoading(true);

    try {
      // Data will be loaded through the Knack integration script
      // We just wait for messages from the parent window
      
      // Load from localStorage as fallback
      loadFromLocalStorage();
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load your flashcards. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [auth, loadFromLocalStorage]);

  // Functions for card operations - defined after their dependencies
  // Add a new card
  const addCard = useCallback(
    (card) => {
      setAllCards((prevCards) => {
        const newCards = [...prevCards, card];
        updateSpacedRepetitionData(newCards);
        return newCards;
      });
      
      // Update color mapping if needed
      if (card.subject && card.cardColor) {
        updateColorMapping(card.subject, card.topic, card.cardColor);
      }
      
      // Save the changes after state updates have completed
      setTimeout(() => saveData(), 100);
      showStatus("Card added successfully!");
    },
    [updateSpacedRepetitionData, updateColorMapping, saveData, showStatus]
  );

  // Delete a card
  const deleteCard = useCallback(
    (cardId) => {
      setAllCards((prevCards) => {
        const newCards = prevCards.filter((card) => card.id !== cardId);
        updateSpacedRepetitionData(newCards);
        return newCards;
      });
      
      // Save the changes after state updates have completed
      setTimeout(() => saveData(), 100);
      showStatus("Card deleted");
    },
    [updateSpacedRepetitionData, saveData, showStatus]
  );

  // Update card properties
  const updateCard = useCallback(
    (updatedCard) => {
      setAllCards((prevCards) => {
        const updatedCards = prevCards.map((card) =>
          card.id === updatedCard.id ? { ...card, ...updatedCard } : card
        );
        updateSpacedRepetitionData(updatedCards);
        return updatedCards;
      });
      
      // Update color mapping if color changed
      if (updatedCard.subject && updatedCard.cardColor) {
        updateColorMapping(updatedCard.subject, updatedCard.topic, updatedCard.cardColor);
      }
      
      // Save the changes after state updates have completed
      setTimeout(() => saveData(), 100);
      showStatus("Card updated");
    },
    [updateSpacedRepetitionData, updateColorMapping, saveData, showStatus]
  );

  // Move card between spaced repetition boxes
  const moveCardToBox = useCallback(
    (cardId, targetBox) => {
      setAllCards((prevCards) => {
        const updatedCards = prevCards.map((card) => {
          if (card.id === cardId) {
            return {
              ...card,
              boxNum: targetBox,
              SRFlag: true,
              timestamp: new Date().toISOString(),
            };
          }
          return card;
        });

        updateSpacedRepetitionData(updatedCards);
        return updatedCards;
      });
      
      // Save the changes after state updates have completed
      setTimeout(() => saveData(), 500);
    },
    [updateSpacedRepetitionData, saveData]
  );

  // Get cards for the current box in spaced repetition mode
  const getCardsForCurrentBox = useCallback(() => {
    // Get the array of card IDs for the current box
    let cardIds = [];
    switch (currentBox) {
      case 1:
        cardIds = spacedRepetitionData.box1 || [];
        break;
      case 2:
        cardIds = spacedRepetitionData.box2 || [];
        break;
      case 3:
        cardIds = spacedRepetitionData.box3 || [];
        break;
      case 4:
        cardIds = spacedRepetitionData.box4 || [];
        break;
      case 5:
        cardIds = spacedRepetitionData.box5 || [];
        break;
      default:
        cardIds = [];
    }
    
    console.log(`Getting cards for box ${currentBox}: IDs`, cardIds);
    
    // Map the IDs to the actual card objects
    const cardsForBox = cardIds.map(cardId => 
      allCards.find(card => card.id === cardId)
    ).filter(card => card !== undefined);
    
    console.log(`Found ${cardsForBox.length} valid cards for box ${currentBox}`, cardsForBox);
    
    return cardsForBox;
  }, [currentBox, spacedRepetitionData, allCards]);

  // Extract unique subjects from all cards
  const getSubjects = useCallback(() => {
    const subjects = [
      ...new Set(allCards.map((card) => card.subject || "General")),
    ];
    return subjects.sort();
  }, [allCards]);

  // Extract unique topics for a selected subject
  const getTopicsForSubject = useCallback(
    (subject) => {
      if (!subject) return [];
      const topics = [
        ...new Set(
          allCards
            .filter((card) => (card.subject || "General") === subject)
            .map((card) => card.topic || "General")
        ),
      ];
      return topics.sort();
    },
    [allCards]
  );

  // Filter cards by subject and topic
  const getFilteredCards = useCallback(() => {
    let filtered = [...allCards];

    if (selectedSubject) {
      filtered = filtered.filter(
        (card) => (card.subject || "General") === selectedSubject
      );
    }

    if (selectedTopic) {
      filtered = filtered.filter(
        (card) => (card.topic || "General") === selectedTopic
      );
    }

    return filtered;
  }, [allCards, selectedSubject, selectedTopic]);

  // Generate a color for a subject or topic
  const getColorForSubjectTopic = useCallback(
    (subject, topic) => {
      // Default color if nothing else works
      const defaultColor = currentSubjectColor;

      // Check if we have a color mapping for this subject
      if (subjectColorMapping[subject]) {
        // If there's a topic, try to get its specific color
        if (
          topic &&
          subjectColorMapping[subject].topics &&
          subjectColorMapping[subject].topics[topic]
        ) {
          return subjectColorMapping[subject].topics[topic];
        }

        // Otherwise return the base subject color
        return subjectColorMapping[subject].base;
      }

      return defaultColor;
    },
    [subjectColorMapping, currentSubjectColor]
  );

  // Auto-save periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (auth && allCards.length > 0) {
        console.log("Auto-saving data...");
        saveData();
      }
    }, 60000); // Every minute

    return () => clearInterval(intervalId);
  }, [auth, allCards, saveData]);

  // Initialize communication with parent window (Knack)
  useEffect(() => {
    const handleMessage = (event) => {
      console.log("Message received from parent:", event.data);

      if (event.data && event.data.type) {
        switch (event.data.type) {
          case "KNACK_USER_INFO":
            console.log("Received user info from Knack", event.data.data);
            setAuth(event.data.data);

            // If user data was included, process it
            if (event.data.data?.userData) {
              const userData = event.data.data.userData;

              // Store the recordId if available
              if (userData.recordId) {
                setRecordId(userData.recordId);
                console.log("Stored recordId:", userData.recordId);
              }

              // Process cards
              if (userData.cards && Array.isArray(userData.cards)) {
                setAllCards(userData.cards);
                updateSpacedRepetitionData(userData.cards);
              }

              // Process color mapping
              if (userData.colorMapping) {
                setSubjectColorMapping(userData.colorMapping);
              }

              // Process spaced repetition data if separate
              if (userData.spacedRepetition) {
                setSpacedRepetitionData(userData.spacedRepetition);
              }
            } else {
              // If no user data was provided, load from localStorage as fallback
              loadFromLocalStorage();
            }

            setLoading(false);

            // Confirm receipt of auth info
            if (window.parent !== window) {
              window.parent.postMessage({ type: "AUTH_CONFIRMED" }, "*");
            }
            break;

          case "SAVE_RESULT":
            setIsSaving(false);
            showStatus(
              event.data.success ? "Saved successfully!" : "Error saving data"
            );
            break;

          case "LOAD_SAVED_DATA":
            console.log("Received updated data from Knack", event.data.data);

            if (event.data.data) {
              // Process cards
              if (
                event.data.data.cards &&
                Array.isArray(event.data.data.cards)
              ) {
                setAllCards(event.data.data.cards);
                updateSpacedRepetitionData(event.data.data.cards);
              }

              // Process color mapping
              if (event.data.data.colorMapping) {
                setSubjectColorMapping(event.data.data.colorMapping);
              }

              // Process spaced repetition data if separate
              if (event.data.data.spacedRepetition) {
                setSpacedRepetitionData(event.data.data.spacedRepetition);
              }
            }

            showStatus("Updated with latest data from server");
            break;
        }
      }
    };

    // Set up message listener for communication with the parent window
    window.addEventListener("message", handleMessage);

    // Signal to parent that we're ready for auth info
    if (window.parent !== window) {
      console.log("App loaded - sending ready message to parent");
      window.parent.postMessage({ type: "APP_READY" }, "*");
    } else {
      // For standalone testing without Knack
      console.log("App running in standalone mode - using local storage");
      setAuth({
        id: "test-user",
        email: "test@example.com",
        name: "Test User",
      });
      loadFromLocalStorage();
      setLoading(false);
    }

    // Cleanup
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [updateSpacedRepetitionData, showStatus, loadFromLocalStorage]);

  // Show loading state
  if (loading) {
    return <LoadingSpinner message={loadingMessage} />;
  }

  // Show error state
  if (error) {
    return (
      <div className="app error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        userInfo={getUserInfo()}
        currentView={view}
        onViewChange={setView}
        onSave={saveData}
        isSaving={isSaving}
      />

      {statusMessage && <div className="status-message">{statusMessage}</div>}

      {view === "cardBank" && (
        <div className="card-bank-view">
          <div className="bank-controls">
            <button
              className="primary-button"
              onClick={() => setView("createCard")}
            >
              Create New Card
            </button>
            <button
              className="secondary-button"
              onClick={() => setView("spacedRepetition")}
            >
              Start Spaced Repetition
            </button>
          </div>

          <div className="bank-container">
            <div className="bank-sidebar">
              <SubjectsList
                subjects={getSubjects()}
                selectedSubject={selectedSubject}
                onSelectSubject={setSelectedSubject}
                getColorForSubject={(subject) =>
                  getColorForSubjectTopic(subject)
                }
              />

              {selectedSubject && (
                <TopicsList
                  topics={getTopicsForSubject(selectedSubject)}
                  selectedTopic={selectedTopic}
                  onSelectTopic={setSelectedTopic}
                  getColorForTopic={(topic) =>
                    getColorForSubjectTopic(selectedSubject, topic)
                  }
                />
              )}
            </div>

            <div className="bank-content">
              <FlashcardList
                cards={getFilteredCards()}
                onDeleteCard={deleteCard}
                onUpdateCard={updateCard}
              />
            </div>
          </div>
        </div>
      )}

      {view === "createCard" && (
  <>
    <div className="create-card-options">
      <button 
        className="primary-button"
        onClick={() => setView("aiGenerator")}
      >
        Generate Cards with AI
      </button>
      <span className="or-divider">OR</span>
      <button 
        className="secondary-button"
        onClick={() => setView("manualCreate")}
      >
        Create Cards Manually
      </button>
    </div>
  </>
)}

{view === "aiGenerator" && (
  <AICardGenerator
    onAddCard={addCard}
    onClose={() => setView("cardBank")}
    subjects={getSubjects()}
  />
)}

{view === "manualCreate" && (
  <CardCreator
    onAddCard={addCard}
    onCancel={() => setView("cardBank")}
    subjects={getSubjects()}
    getTopicsForSubject={getTopicsForSubject}
    currentColor={currentSubjectColor}
    onColorChange={setCurrentSubjectColor}
    getColorForSubjectTopic={getColorForSubjectTopic}
    updateColorMapping={updateColorMapping}
  />
)}

      {view === "spacedRepetition" && (
        <SpacedRepetition
          cards={getCardsForCurrentBox()}
          currentBox={currentBox}
          spacedRepetitionData={spacedRepetitionData}
          onSelectBox={setCurrentBox}
          onMoveCard={moveCardToBox}
          onReturnToBank={() => setView("cardBank")}
        />
      )}
    </div>
  );
}

export default App;
