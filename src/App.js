import React, { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import FlashcardList from "./components/FlashcardList";
import SubjectsList from "./components/SubjectsList";
import TopicsList from "./components/TopicsList";
import CardCreator from "./components/CardCreator";
import SpacedRepetition from "./components/SpacedRepetition";
import LoadingSpinner from "./components/LoadingSpinner";
import Header from "./components/Header";
import AICardGenerator from './components/AICardGenerator';
import { getContrastColor, formatDate, calculateNextReviewDate, isCardDueForReview } from './helper';

// API Keys and constants
const KNACK_APP_ID = process.env.REACT_APP_KNACK_APP_ID || "64fc50bc3cd0ac00254bb62b";
const KNACK_API_KEY = process.env.REACT_APP_KNACK_API_KEY || "knack-api-key";

// Box descriptions
const BOX_DESCRIPTIONS = {
  1: "New cards start here. Review these daily. When answered correctly, they move to Box 2; otherwise they stay here.",
  2: "Review these cards every other day. Correct responses move them to Box 3; if missed or answered incorrectly, they return to Box 1.",
  3: "Review these cards every 3 days. Correct responses move them to Box 4; if incorrect or overdue, they return to Box 1.",
  4: "Review these cards weekly. Correct responses move them to Box 5; if incorrect, they return to Box 1.",
  5: "Cards here remain indefinitely unless answered incorrectly, which returns them to Box 1."
};

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
        // Store just the card ID as a string
        newSpacedRepetitionData[`box${boxNum}`].push(card.id);
      }
    });

    setSpacedRepetitionData(newSpacedRepetitionData);
  }, []);

  // Generate a shade of a base color
  const generateShade = useCallback((baseColor, shadeIndex, totalShades) => {
    // Convert hex to RGB
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    
    // Calculate lightness adjustment based on shade index
    // Using a range from -20% (darker) to +30% (lighter)
    const adjustment = -20 + (50 * (shadeIndex / (totalShades - 1)));
    
    // Apply adjustment to RGB values
    let adjustedR = Math.min(255, Math.max(0, r * (1 + adjustment/100)));
    let adjustedG = Math.min(255, Math.max(0, g * (1 + adjustment/100)));
    let adjustedB = Math.min(255, Math.max(0, b * (1 + adjustment/100)));
    
    // Convert back to hex
    const adjustedHex = '#' + 
      Math.round(adjustedR).toString(16).padStart(2, '0') +
      Math.round(adjustedG).toString(16).padStart(2, '0') +
      Math.round(adjustedB).toString(16).padStart(2, '0');
    
    return adjustedHex;
  }, []);

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

  // Update color mappings - independent of other functions
  const updateColorMapping = useCallback(
    (subject, topic, color, updateTopics = false) => {
      setSubjectColorMapping((prevMapping) => {
        const newMapping = { ...prevMapping };

        // Create subject entry if it doesn't exist
        if (!newMapping[subject]) {
          newMapping[subject] = { base: color, topics: {} };
        }

        // If it's a subject-level color update
        if (!topic || updateTopics) {
          // Update the base subject color
          newMapping[subject].base = color;
          
          // If we should update topic colors automatically
          if (updateTopics) {
            console.log(`Updating all topic colors for subject ${subject} based on ${color}`);
            
            // Get all topics for this subject from current cards
            const topicsForSubject = allCards
              .filter(card => (card.subject || "General") === subject)
              .map(card => card.topic || "General");
            
            // Remove duplicates and sort
            const uniqueTopics = [...new Set(topicsForSubject)].sort();
            
            console.log(`Found topics for subject ${subject}:`, uniqueTopics);
            
            // Generate a color for each topic
            if (uniqueTopics.length > 0) {
              uniqueTopics.forEach((topicName, index) => {
                // Skip the "General" topic as it should use the base color
                if (topicName === "General") return;
                
                // Generate a shade of the base color for this topic
                const topicColor = generateShade(color, index, uniqueTopics.length);
                console.log(`Generated color for ${topicName}: ${topicColor}`);
                
                // Ensure the topics object exists
                if (!newMapping[subject].topics) {
                  newMapping[subject].topics = {};
                }
                
                // Update the topic color
                newMapping[subject].topics[topicName] = topicColor;
              });
            }
          }
        } 
        // If it's a topic-level color update
        else if (topic) {
          // Ensure the topics object exists
          if (!newMapping[subject].topics) {
            newMapping[subject].topics = {};
          }
          // Update the specified topic color
          newMapping[subject].topics[topic] = color;
        }
        
        return newMapping;
      });
    },
    [allCards, generateShade]
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

  // Move a card to a specific box in spaced repetition
  const moveCardToBox = useCallback(
    (cardId, box) => {
      console.log(`Moving card ${cardId} to box ${box}`);

      // Calculate the next review date based on the box number
      const calculateNextReviewDate = (boxNumber) => {
        const today = new Date();
        let nextDate = new Date(today);
        
        switch (boxNumber) {
          case 1: // Review next day
            nextDate.setDate(today.getDate() + 1);
            break;
          case 2: // Every 2 days
            nextDate.setDate(today.getDate() + 2);
            break;
          case 3: // Every 3 days
            nextDate.setDate(today.getDate() + 3);
            break;
          case 4: // Every 7 days
            nextDate.setDate(today.getDate() + 7);
            break;
          case 5: // Retired, but check after 21 days
            nextDate.setDate(today.getDate() + 21);
            break;
          default:
            nextDate.setDate(today.getDate() + 1);
        }
        
        return nextDate.toISOString();
      };

      // Ensure cardId is a string
      const stringCardId = String(cardId).trim();
      
      setSpacedRepetitionData((prevData) => {
        // Create a new object to avoid direct state mutation
        const newData = { ...prevData };

        // Remove the card from its current box (if it exists)
        for (let i = 1; i <= 5; i++) {
          newData[`box${i}`] = newData[`box${i}`].filter(
            (item) => String(item) !== stringCardId
          );
        }

        // Add the card to the new box - store as string ID only
        const targetBox = `box${box}`;
        newData[targetBox].push(stringCardId);

        // Update the Knack notification fields on the next save
        setKnackFieldsNeedUpdate(true);
        
        return newData;
      });
      
      // Save the updated data
      setTimeout(() => saveData(), 100);
      console.log(`Card ${cardId} moved to box ${box}`);
    },
    [saveData]
  );

  // Add state to track if Knack fields need updating
  const [knackFieldsNeedUpdate, setKnackFieldsNeedUpdate] = useState(false);

  // Update Knack boolean fields for box notifications
  const updateKnackBoxNotifications = useCallback(async () => {
    if (!auth || !knackFieldsNeedUpdate) return;
    
    try {
      console.log("Updating Knack box notification fields...");
      
      // Check if there are cards ready for review in each box
      const today = new Date();
      
      // Prepare box status data
      const boxStatus = {
        field_2991: false, // Box 1
        field_2992: false, // Box 2
        field_2993: false, // Box 3
        field_2994: false, // Box 4
        field_2995: false  // Box 5
      };
      
      // Check each box for cards ready for review
      for (let i = 1; i <= 5; i++) {
        const boxKey = `box${i}`;
        const fieldKey = `field_299${i}`;
        
        // Box is ready if any card's next review date is today or earlier
        boxStatus[fieldKey] = spacedRepetitionData[boxKey].some(card => {
          const nextReviewDate = new Date(card.nextReviewDate);
          return nextReviewDate <= today;
        });
        
        // Special case for Box 5 - only if cards have been there for 3+ weeks
        if (i === 5) {
          boxStatus.field_2995 = spacedRepetitionData.box5.some(card => {
            const lastReviewed = new Date(card.lastReviewed);
            const threeWeeksAgo = new Date(today);
            threeWeeksAgo.setDate(today.getDate() - 21);
            return lastReviewed <= threeWeeksAgo;
          });
        }
      }
      
      // Update Knack object with box status
      if (auth.id) {
        const updateUrl = `https://api.knack.com/v1/objects/object_102/records/${auth.id}`;
        const response = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Knack-Application-ID": KNACK_APP_ID,
            "X-Knack-REST-API-Key": KNACK_API_KEY
          },
          body: JSON.stringify(boxStatus)
        });
        
        if (response.ok) {
          console.log("Knack box notification fields updated successfully");
          setKnackFieldsNeedUpdate(false);
        } else {
          console.error("Failed to update Knack box notification fields:", await response.json());
        }
      }
    } catch (error) {
      console.error("Error updating Knack box notifications:", error);
    }
  }, [auth, knackFieldsNeedUpdate, spacedRepetitionData]);

  // Update Knack box notification fields when needed
  useEffect(() => {
    if (knackFieldsNeedUpdate && auth) {
      updateKnackBoxNotifications();
    }
  }, [knackFieldsNeedUpdate, auth, updateKnackBoxNotifications]);

  // Get cards for the current box in spaced repetition mode
  const getCardsForCurrentBox = useCallback(() => {
    // Get the array of card IDs for the current box
    const boxKey = `box${currentBox}`;
    const boxItems = spacedRepetitionData[boxKey] || [];
    console.log(`Getting cards for box ${currentBox}:`, boxKey, boxItems);
    
    const cardIds = boxItems.map(item => item.cardId);
    console.log(`Card IDs in box ${currentBox}:`, cardIds);
    console.log("All available cards:", allCards.map(card => ({ id: card.id, subject: card.subject, topic: card.topic })));
    
    if (cardIds.length === 0) {
      console.log(`No cards found in box ${currentBox}`);
      return [];
    }
    
    // Map the IDs to the actual card objects
    const cardsForBox = cardIds
      .map(cardId => {
        const stringCardId = String(cardId).trim();
        const card = allCards.find(card => String(card.id).trim() === stringCardId);
        
        if (!card) {
          console.warn(`Card with ID ${cardId} not found in allCards`);
        } else {
          console.log(`Found card for ID ${cardId}:`, card);
        }
        
        return card;
      })
      .filter(card => card !== undefined);
    
    console.log(`Found ${cardsForBox.length} valid cards for box ${currentBox}:`, cardsForBox);
    
    // If we found cards, return them
    if (cardsForBox.length > 0) {
      return cardsForBox;
    }
    
    // If we still don't have cards, try a more exhaustive approach
    console.log("Trying more exhaustive matching for card IDs");
    
    const exhaustiveCards = [];
    for (const boxItem of boxItems) {
      for (const card of allCards) {
        // Try multiple ways of comparing
        if (
          String(boxItem.cardId).trim() === String(card.id).trim() ||
          boxItem.cardId === card.id ||
          (typeof boxItem.cardId === 'object' && boxItem.cardId.cardId === card.id)
        ) {
          console.log(`Exhaustive matching found card:`, card);
          exhaustiveCards.push(card);
          break;
        }
      }
    }
    
    console.log(`Exhaustive matching found ${exhaustiveCards.length} cards:`, exhaustiveCards);
    return exhaustiveCards;
  }, [currentBox, spacedRepetitionData, allCards]);

  // Extract unique subjects from all cards
  const getSubjects = useCallback(() => {
    const subjects = [
      ...new Set(allCards.map((card) => card.subject || "General")),
    ];
    return subjects.sort();
  }, [allCards]);

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
                updateColorMapping={updateColorMapping}
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
