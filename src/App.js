import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import FlashcardList from "./components/FlashcardList";
import SubjectsList from "./components/SubjectsList";
import TopicsList from "./components/TopicsList";
import CardCreator from "./components/CardCreator";
import SpacedRepetition from "./components/SpacedRepetition";
import LoadingSpinner from "./components/LoadingSpinner";
import Header from "./components/Header";

function App() {
  // Authentication and user state
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [error, setError] = useState(null);

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

  // Show temporary status message
  const showStatus = useCallback((message, duration = 3000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), duration);
  }, []);

  // Load data from Knack
  const loadData = useCallback(async () => {
    if (!auth) return;

    setLoadingMessage("Loading your flashcards...");
    setLoading(true);

    try {
      // Data will be loaded through the Knack integration script
      // We just wait for messages from the parent window
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load your flashcards. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [auth]);

  // Save data to Knack
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
              cards: allCards,
              colorMapping: subjectColorMapping,
              spacedRepetition: spacedRepetitionData,
            },
          },
          "*"
        );

        showStatus("Saving your flashcards...");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      showStatus("Error saving your flashcards. Please try again.");
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  }, [allCards, subjectColorMapping, spacedRepetitionData, auth, showStatus]);

  // Add new card to collection
  const addCard = useCallback(
    (newCard) => {
      setAllCards((prevCards) => {
        const updatedCards = [
          ...prevCards,
          {
            ...newCard,
            id:
              newCard.id ||
              `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            boxNum: newCard.boxNum || 1,
            SRFlag:
              typeof newCard.SRFlag !== "undefined" ? newCard.SRFlag : false,
          },
        ];

        // Schedule a save after adding
        setTimeout(() => saveData(), 500);

        return updatedCards;
      });

      showStatus("Card added successfully!");
    },
    [saveData, showStatus]
  );

  // Delete card from collection
  const deleteCard = useCallback(
    (cardId) => {
      setAllCards((prevCards) => {
        const updatedCards = prevCards.filter((card) => card.id !== cardId);

        // Schedule a save after deleting
        setTimeout(() => saveData(), 500);

        return updatedCards;
      });

      showStatus("Card deleted!");
    },
    [saveData, showStatus]
  );

  // Update card properties
  const updateCard = useCallback(
    (cardId, updates) => {
      setAllCards((prevCards) => {
        const updatedCards = prevCards.map((card) =>
          card.id === cardId ? { ...card, ...updates } : card
        );

        // Schedule a save after updating
        setTimeout(() => saveData(), 500);

        return updatedCards;
      });
    },
    [saveData]
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

        // Update spaced repetition data accordingly
        updateSpacedRepetitionData(updatedCards);

        // Schedule a save
        setTimeout(() => saveData(), 500);

        return updatedCards;
      });
    },
    [saveData]
  );

  // Organize cards into boxes for spaced repetition
  const updateSpacedRepetitionData = useCallback((cards) => {
    const newData = {
      box1: cards.filter((card) => card.boxNum === 1),
      box2: cards.filter((card) => card.boxNum === 2),
      box3: cards.filter((card) => card.boxNum === 3),
      box4: cards.filter((card) => card.boxNum === 4),
      box5: cards.filter((card) => card.boxNum === 5),
    };

    setSpacedRepetitionData(newData);
  }, []);

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
      setAuth({
        id: "test-user",
        email: "test@example.com",
        name: "Test User",
      });
      setLoading(false);
    }

    // Cleanup
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [updateSpacedRepetitionData, showStatus]);

  // Get cards for the current box in spaced repetition mode
  const getCardsForCurrentBox = useCallback(() => {
    switch (currentBox) {
      case 1:
        return spacedRepetitionData.box1;
      case 2:
        return spacedRepetitionData.box2;
      case 3:
        return spacedRepetitionData.box3;
      case 4:
        return spacedRepetitionData.box4;
      case 5:
        return spacedRepetitionData.box5;
      default:
        return [];
    }
  }, [currentBox, spacedRepetitionData]);

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

  // Update color mappings
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
          // Otherwise update the base subject color
          newMapping[subject].base = color;
        }

        // Schedule a save
        setTimeout(() => saveData(), 500);

        return newMapping;
      });
    },
    [saveData]
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
