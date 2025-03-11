import React, { useState, useEffect } from "react";
import "./AICardGenerator.css";
import Flashcard from './Flashcard';

// Constants for question types and exam boards
const QUESTION_TYPES = [
  { value: "short_answer", label: "Short Answer" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "essay", label: "Essay Style" },
  { value: "acronym", label: "Acronym" }
];

const EXAM_BOARDS = [
  { value: "AQA", label: "AQA" },
  { value: "Edexcel", label: "Edexcel" },
  { value: "OCR", label: "OCR" },
  { value: "WJEC", label: "WJEC" },
  { value: "CCEA", label: "CCEA" },
  { value: "International Baccalaureate", label: "IB" }
];

const EXAM_TYPES = [
  { value: "GCSE", label: "GCSE" },
  { value: "A-Level", label: "A-Level" }
];

// Color palette for cards
const BRIGHT_COLORS = [
  "#e6194b", "#3cb44b", "#ffe119", "#0082c8", "#f58231",
  "#911eb4", "#46f0f0", "#f032e6", "#d2f53c", "#fabebe",
  "#008080", "#e6beff", "#aa6e28", "#fffac8", "#800000",
  "#aaffc3", "#808000", "#ffd8b1", "#000080", "#808080",
  "#FF69B4", "#8B4513", "#00CED1", "#ADFF2F", "#DC143C"
];

const AICardGenerator = ({ onAddCard, onClose, subjects = [] }) => {
  // State for wizard steps
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;
  
  // Form state
  const [formData, setFormData] = useState({
    examBoard: "",
    examType: "",
    subject: "",
    newSubject: "",
    topic: "",
    newTopic: "",
    numCards: 5,
    questionType: "short_answer",
    subjectColor: BRIGHT_COLORS[0]
  });
  
  // Generated cards
  const [generatedCards, setGeneratedCards] = useState([]);
  
  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // Available topics based on selected subject
  const [availableTopics, setAvailableTopics] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  
  // New state for hierarchical topics
  const [hierarchicalTopics, setHierarchicalTopics] = useState([]);
  const [savedTopicLists, setSavedTopicLists] = useState([]);
  const [showSaveTopicDialog, setShowSaveTopicDialog] = useState(false);
  const [topicListName, setTopicListName] = useState("");
  
  // API key - in production, this should be in a server environment variable
  // For demo purposes, we're using a placeholder. In a real app, you would get this from your backend.
  const API_KEY = process.env.REACT_APP_OPENAI_KEY || "your-openai-key";

  // Load saved topic lists from localStorage on mount
  useEffect(() => {
    try {
      const savedLists = localStorage.getItem('savedTopicLists');
      if (savedLists) {
        setSavedTopicLists(JSON.parse(savedLists));
      }
    } catch (error) {
      console.error("Error loading saved topic lists:", error);
    }
  }, []);

  // Effect to update available subjects when exam type changes
  useEffect(() => {
    if (formData.examType) {
      // In a real implementation, this would fetch from your backend or a predefined list
      // For demo, we'll use a static mapping
      const examTypeSubjects = {
        "GCSE": [
    "English Language", "English Literature", "Mathematics", "Combined Science", "Double Award Science", "Triple Science",
    "Biology", "Chemistry", "Physics", "Environmental Science", "Religious Studies", "Citizenship", "Modern Studies",
    "History", "Geography", "French", "Spanish", "German", "Italian", "Mandarin Chinese", "Welsh", "Latin",
    "Ancient Greek", "Classical Civilisation", "Art and Design", "Photography", "Design and Technology",
    "Design and Technology - Product Design", "Design and Technology - Resistant Materials",
    "Design and Technology - Food Technology", "Design and Technology - Textiles", "Food Preparation and Nutrition",
    "Music", "Drama", "Dance", "Film Studies", "Computer Science", "Digital Technology", "ICT", "Business Studies",
    "Economics", "Sociology", "Psychology", "Media Studies", "Physical Education", "Health and Social Care",
    "Travel and Tourism", "Journalism", "Enterprise/Entrepreneurship", "Electronics", "General Studies", "International Baccalaureate (MYP)"
  ],
        "A-Level": [
    "Mathematics", "Further Mathematics", "Statistics", "Physics", "Chemistry", "Biology", "Combined Science",
    "Combined Science - Double Award", "Combined Science - Triple Award", "Environmental Science", "Computer Science",
    "Electronics", "English Language", "English Literature", "History", "Geography", "Religious Studies / Theology",
    "Philosophy", "Classics", "Classics - Latin", "Classesics - Ancient Greek", "Classesics - Classical Civilisation",
    "Economics", "Business Studies", "Accounting", "Government and Politics / Politics", "Law", "Psychology",
    "Sociology", "Media Studies", "French", "Spanish", "German", "Italian", "Mandarin Chinese", "Arabic",
    "Japanese", "Russian", "Welsh", "Art and Design", "Design and Technology",
    "Design and Technology - Product Design", "Design and Technology - Textiles",
    "Design and Technology - Resistant Materials", "Design and Technology - Systems and Control",
    "Drama and Theatre Studies", "Film Studies", "Music", "Music Technology", "Dance", "Photography",
    "Fashion", "Physical Education (PE)", "Sport Science", "Health and Social Care (availability varies)",
    "ICT / Information and Communication Technology","International Baccalaureate (DP)"
  ]
      };
      
      setAvailableSubjects(examTypeSubjects[formData.examType] || []);
    } else {
      setAvailableSubjects([]);
    }
  }, [formData.examType]);

  // Effect to update available topics when subject changes
  useEffect(() => {
    // In a real implementation, this would typically be an API call to get topics for the subject
    if (formData.subject && formData.examBoard && formData.examType) {
      setIsGenerating(true);
      generateTopics(formData.examBoard, formData.examType, formData.subject)
        .then(topics => {
          setAvailableTopics(topics);
          setIsGenerating(false);
        })
        .catch(error => {
          console.error("Error generating topics:", error);
          // Fallback to demo topics if generation fails
          const demoTopics = [
            `${formData.subject} - Topic 1`,
            `${formData.subject} - Topic 2`,
            `${formData.subject} - Topic 3`,
            `${formData.subject} - Advanced Concepts`,
            `${formData.subject} - Practical Applications`
          ];
          setAvailableTopics(demoTopics);
          setIsGenerating(false);
        });
    } else {
      setAvailableTopics([]);
    }
  }, [formData.subject, formData.examBoard, formData.examType]);

  // Generate topics using OpenAI API
  const generateTopics = async (examBoard, examType, subject) => {
    try {
      // Create prompt for topic generation with hierarchical structure
      const prompt = `Generate a list of 8-10 specific, real-world topics for ${examBoard} ${examType} ${subject}. 
      These should be actual curriculum topics in this exact subject according to this exam board's specification. 
      Be specific and detailed - for example, if the subject is Chemistry, don't just say "Organic Chemistry" but specific topics like "Addition Reactions of Alkenes" or "Mechanisms of Nucleophilic Substitution".
      
      Each topic should include:
      1. A main topic name
      2. A short description of what this topic covers (2-3 sentences)
      3. 3-5 sub-topics that are specific components or concepts within the main topic
      
      For example, in Chemistry, a topic might be "Organic Reaction Mechanisms" with sub-topics like "Nucleophilic Substitution", "Electrophilic Addition", etc.
      
      Focus on differentiation between ${examType} levels, ensuring appropriate complexity.
      
      Return ONLY a valid JSON array of objects with the format: 
      [
        {
          "topic": "Main Topic Name", 
          "description": "Description of what this topic covers in 2-3 sentences.",
          "subTopics": ["Sub-topic 1", "Sub-topic 2", "Sub-topic 3", "Sub-topic 4"]
        }
      ]
      
      IMPORTANT: Be sure to get the curriculum content right by web searching for the latest ${examBoard} ${examType} ${subject} specification if you're not sure.`;
      
      console.log("Generating topics with prompt:", prompt);
      
      // Make the API call to OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          temperature: 0.3
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Error calling OpenAI API");
      }
      
      // Parse the response
      const content = data.choices[0].message.content;
      console.log("Raw response:", content);
      const cleanedContent = cleanOpenAIResponse(content);
      
      let topicsData;
      try {
        topicsData = JSON.parse(cleanedContent);
        console.log("Parsed topics data:", topicsData);
      } catch (e) {
        console.error("Error parsing OpenAI response for topics:", e);
        console.error("Cleaned content:", cleanedContent);
        throw new Error("Failed to parse AI response for topics. Please try again.");
      }
      
      if (!Array.isArray(topicsData) || topicsData.length === 0) {
        throw new Error("Invalid response format from AI for topics. Please try again.");
      }
      
      // Store the hierarchical topics
      setHierarchicalTopics(topicsData);
      
      // Extract just the topic names for the dropdown
      const topics = topicsData.map(item => item.topic || "");
      console.log("Generated topics:", topics);
      
      return topics;
    } catch (error) {
      console.error("Error generating topics:", error);
      throw error;
    }
  };

  // Save the current topic list
  const saveTopicList = () => {
    if (!topicListName.trim()) {
      setError("Please enter a name for your topic list");
      return;
    }
    
    try {
      const newSavedList = {
        id: Date.now(),
        name: topicListName,
        examBoard: formData.examBoard,
        examType: formData.examType,
        subject: formData.subject || formData.newSubject,
        topics: hierarchicalTopics,
        created: new Date().toISOString()
      };
      
      const updatedLists = [...savedTopicLists, newSavedList];
      setSavedTopicLists(updatedLists);
      
      // Save to localStorage
      localStorage.setItem('savedTopicLists', JSON.stringify(updatedLists));
      
      // Reset dialog
      setShowSaveTopicDialog(false);
      setTopicListName("");
      setError(null);
      
      console.log("Topic list saved:", newSavedList);
    } catch (error) {
      console.error("Error saving topic list:", error);
      setError("Failed to save topic list: " + error.message);
    }
  };
  
  // Load a saved topic list
  const loadTopicList = (listId) => {
    try {
      const list = savedTopicLists.find(list => list.id === listId);
      if (!list) {
        setError("Topic list not found");
        return;
      }
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        examBoard: list.examBoard,
        examType: list.examType,
        subject: list.subject
      }));
      
      // Set topics
      setHierarchicalTopics(list.topics);
      setAvailableTopics(list.topics.map(item => item.topic));
      
      console.log("Loaded topic list:", list);
    } catch (error) {
      console.error("Error loading topic list:", error);
      setError("Failed to load topic list: " + error.message);
    }
  };
  
  // Delete a saved topic list
  const deleteTopicList = (listId) => {
    try {
      const updatedLists = savedTopicLists.filter(list => list.id !== listId);
      setSavedTopicLists(updatedLists);
      
      // Save to localStorage
      localStorage.setItem('savedTopicLists', JSON.stringify(updatedLists));
      
      console.log("Topic list deleted, id:", listId);
    } catch (error) {
      console.error("Error deleting topic list:", error);
      setError("Failed to delete topic list: " + error.message);
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle color selection
  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, subjectColor: color }));
  };

  // Handle next step in wizard
  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step in wizard
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validate current step
  const canProceed = () => {
    switch (currentStep) {
      case 1: // Exam Board
        return !!formData.examBoard;
      case 2: // Exam Type
        return !!formData.examType;
      case 3: // Subject
        return !!(formData.subject || formData.newSubject);
      case 4: // Topic
        return !!(formData.topic || formData.newTopic);
      case 5: // Number of Cards
        return !!formData.numCards && formData.numCards >= 1 && formData.numCards <= 20;
      case 6: // Question Type
        return !!formData.questionType;
      default:
        return true;
    }
  };

  // Generate cards using OpenAI API
  const generateCards = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Determine final subject and topic (use new values if provided)
      const finalSubject = formData.newSubject || formData.subject;
      const finalTopic = formData.newTopic || formData.topic;
      
      // Create prompt based on question type and other parameters
      let prompt;
      
      if (formData.questionType === "acronym") {
        let topicInfo = finalTopic ? ` with focus on ${finalTopic}` : "";
        prompt = `Return only a valid JSON array with no additional text. Please output all mathematical expressions in plain text (avoid markdown or LaTeX formatting). Generate ${formData.numCards} exam-style flashcards for ${formData.examBoard} ${formData.examType} ${finalSubject}${topicInfo}. Create a useful acronym from some essential course knowledge. Be creative and playful. Format exactly as: [{"acronym": "Your acronym", "explanation": "Detailed explanation here"}]`;
      } else {
        // Determine complexity based on exam type
        let complexityInstruction;
        if (formData.examType === "A-Level") {
          complexityInstruction = "Make these appropriate for A-Level students (age 16-18). Questions should be challenging and involve deeper thinking. Include sufficient detail in answers and use appropriate technical language.";
        } else { // GCSE
          complexityInstruction = "Make these appropriate for GCSE students (age 14-16). Questions should be clear but still challenging. Explanations should be thorough but accessible.";
        }
        
        // Base prompt
        prompt = `Return only a valid JSON array with no additional text. Please output all mathematical expressions in plain text (avoid markdown or LaTeX formatting). 
Generate ${formData.numCards} high-quality ${formData.examBoard} ${formData.examType} ${finalSubject} flashcards for the specific topic "${finalTopic}".
${complexityInstruction}

Before generating questions, scrape the latest ${formData.examBoard} ${formData.examType} ${finalSubject} specification to ensure the content matches the current curriculum exactly.

Use this format for different question types:
`;
        
        // Add format based on question type
        if (formData.questionType === "multiple_choice") {
          prompt += `[
  {
    "subject": "${finalSubject}",
    "topic": "${finalTopic}",
    "questionType": "multiple_choice",
    "question": "Clear, focused question based on the curriculum",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The correct option exactly as written in options array",
    "detailedAnswer": "Detailed explanation of why this answer is correct, with key concepts and examples"
  }
]`;
        } else if (formData.questionType === "short_answer") {
          prompt += `[
  {
    "subject": "${finalSubject}",
    "topic": "${finalTopic}",
    "questionType": "short_answer",
    "question": "Clear, focused question from the curriculum",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "detailedAnswer": "Complete and thorough explanation with all necessary information"
  }
]`;
        } else if (formData.questionType === "essay") {
          prompt += `[
  {
    "subject": "${finalSubject}",
    "topic": "${finalTopic}",
    "questionType": "essay",
    "question": "Thought-provoking essay question matching the curriculum",
    "keyPoints": ["Important point 1", "Important point 2", "Important point 3", "Important point 4"],
    "detailedAnswer": "Structured essay plan with introduction, key arguments, and conclusion guidance"
  }
]`;
        }
      }
      
      console.log("Generating cards with prompt:", prompt);
      
      // Make the API call to OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
          temperature: 0.7
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Error calling OpenAI API");
      }
      
      // Parse the response
      const content = data.choices[0].message.content;
      console.log("Raw AI response:", content);
      
      const cleanedContent = cleanOpenAIResponse(content);
      
      let cards;
      try {
        cards = JSON.parse(cleanedContent);
      } catch (e) {
        console.error("Error parsing AI response:", e);
        throw new Error("Failed to parse AI response. Please try again.");
      }
      
      if (!Array.isArray(cards) || cards.length === 0) {
        throw new Error("Invalid response format from AI. Please try again.");
      }
      
      // Process the generated cards
      const processedCards = cards.map((card, index) => {
        // Generate a unique ID
        const id = `card_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Add standard fields
        const baseCard = {
          id,
          subject: finalSubject,
          topic: finalTopic,
          questionType: formData.questionType,
          cardColor: formData.subjectColor,
          baseColor: formData.subjectColor,
          timestamp: new Date().toISOString(),
          boxNum: 1, // Start in box 1
        };
        
        // Process specific question types
        if (formData.questionType === "acronym") {
          return {
            ...baseCard,
            acronym: card.acronym,
            explanation: card.explanation,
            front: `Acronym: ${card.acronym}`,
            back: `Explanation: ${card.explanation}`
          };
        } else if (formData.questionType === "multiple_choice") {
          return {
            ...baseCard,
            question: card.question,
            options: card.options,
            correctAnswer: card.correctAnswer,
            detailedAnswer: card.detailedAnswer,
            front: card.question,
            back: `Correct Answer: ${card.correctAnswer}\n\n${card.detailedAnswer}`
          };
        } else if (formData.questionType === "short_answer" || formData.questionType === "essay") {
          let keyPointsFormatted = "";
          if (card.keyPoints && Array.isArray(card.keyPoints)) {
            keyPointsFormatted = "<ul>" + 
              card.keyPoints.map(point => `<li>${point}</li>`).join("") + 
              "</ul>";
          }
          
          return {
            ...baseCard,
            question: card.question,
            keyPoints: card.keyPoints || [],
            detailedAnswer: card.detailedAnswer,
            front: card.question,
            back: keyPointsFormatted + "<div class='detailed-answer'>" + card.detailedAnswer + "</div>"
          };
        } else {
          return {
            ...baseCard,
            front: card.front || card.question,
            back: card.back || card.answer
          };
        }
      });
      
      setGeneratedCards(processedCards);
      
    } catch (error) {
      console.error("Error generating cards:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Call to generate cards when arriving at the final step
  useEffect(() => {
    if (currentStep === 7 && generatedCards.length === 0 && !isGenerating) {
      generateCards();
    }
  }, [currentStep]);

  // Helper function to clean AI response
  const cleanOpenAIResponse = (text) => {
    return text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
  };

  // Add a single card to the bank
  const handleAddCard = (card) => {
    onAddCard(card);
    // Mark card as added in UI
    setGeneratedCards(prev => 
      prev.map(c => c.id === card.id ? {...c, added: true} : c)
    );
  };

  // Add all cards to the bank
  const handleAddAllCards = () => {
    generatedCards.forEach(card => {
      if (!card.added) {
        onAddCard(card);
      }
    });
    // Mark all cards as added
    setGeneratedCards(prev => prev.map(c => ({...c, added: true})));
  };

  // Generate new batch of cards
  const handleRegenerateCards = () => {
    setGeneratedCards([]);
    generateCards();
  };

  // Helper to get contrast color for text
  const getContrastColor = (hexColor) => {
    // Remove # if present
    if (hexColor.startsWith('#')) {
      hexColor = hexColor.slice(1);
    }
    
    // Convert to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark colors, black for light colors
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Exam Board
        return (
          <div className="step-content">
            <h2>Select Exam Board</h2>
            <div className="form-group">
              <select 
                name="examBoard" 
                value={formData.examBoard} 
                onChange={handleChange}
                required
              >
                <option value="">-- Select Exam Board --</option>
                {EXAM_BOARDS.map(board => (
                  <option key={board.value} value={board.value}>
                    {board.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
        
      case 2: // Exam Type
        return (
          <div className="step-content">
            <h2>Select Exam Type</h2>
            <div className="form-group">
              <select 
                name="examType" 
                value={formData.examType} 
                onChange={handleChange}
                required
              >
                <option value="">-- Select Exam Type --</option>
                {EXAM_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
        
      case 3: // Subject
        return (
          <div className="step-content">
            <h2>Select Subject</h2>
            <div className="form-group">
              <select 
                name="subject" 
                value={formData.subject} 
                onChange={handleChange}
              >
                <option value="">-- Select Subject --</option>
                {availableSubjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              
              <div className="form-divider">
                <span>OR</span>
              </div>
              
              <label>Enter New Subject</label>
              <input 
                type="text" 
                name="newSubject" 
                value={formData.newSubject} 
                onChange={handleChange}
                placeholder="Enter custom subject name" 
              />
            </div>
          </div>
        );
        
      case 4: // Topic
        return (
          <div className="step-content">
            <h2>Select a Topic</h2>
            
            {/* Saved topic lists */}
            {renderSavedTopicLists()}
            
            <div className="form-group">
              <label>Topic</label>
              {isGenerating ? (
                <div className="loading-indicator">
                  <p>Generating topics for {formData.subject}...</p>
                  <div className="spinner"></div>
                </div>
              ) : (
                <>
                  {availableTopics.length > 0 ? (
                    <select
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                    >
                      <option value="">Select a Topic</option>
                      {availableTopics.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="no-topics-message">
                      <p>No topics generated yet. Click "Generate Topics" to continue.</p>
                    </div>
                  )}
                  
                  <button
                    className="generate-button"
                    onClick={async () => {
                      try {
                        setIsGenerating(true);
                        setError(null);
                        const topics = await generateTopics(
                          formData.examBoard,
                          formData.examType,
                          formData.subject || formData.newSubject
                        );
                        setAvailableTopics(topics);
                      } catch (err) {
                        setError(err.message);
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                  >
                    Generate Topics
                  </button>
                  
                  {/* Display hierarchical topics */}
                  {renderHierarchicalTopics()}
                </>
              )}
            </div>
            
            <div className="form-group">
              <label>Or Add New Topic</label>
              <input
                type="text"
                name="newTopic"
                value={formData.newTopic}
                onChange={handleChange}
                placeholder="Enter a new topic name"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
          </div>
        );
        
      case 5: // Number of Cards
        return (
          <div className="step-content">
            <h2>Number of Cards</h2>
            <div className="form-group">
              <input 
                type="number" 
                name="numCards" 
                value={formData.numCards} 
                onChange={handleChange}
                min="1" 
                max="20" 
                required 
              />
              <p className="helper-text">Select between 1 and 20 cards</p>
            </div>
          </div>
        );
        
      case 6: // Question Type
        return (
          <div className="step-content">
            <h2>Select Question Type</h2>
            <div className="question-type-selector">
              {QUESTION_TYPES.map(type => (
                <div key={type.value} className="question-type-option">
                  <input
                    type="radio"
                    id={`question-type-${type.value}`}
                    name="questionType"
                    value={type.value}
                    checked={formData.questionType === type.value}
                    onChange={handleChange}
                  />
                  <label htmlFor={`question-type-${type.value}`}>
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="question-type-description">
              {formData.questionType === "short_answer" && (
                <p>Short answer questions test recall of key facts and concepts.</p>
              )}
              {formData.questionType === "multiple_choice" && (
                <p>Multiple choice questions provide options to choose from, testing recognition.</p>
              )}
              {formData.questionType === "essay" && (
                <p>Essay style questions test deeper understanding and application of knowledge.</p>
              )}
              {formData.questionType === "acronym" && (
                <p>Acronym questions help memorize lists or sequences using memorable letter patterns.</p>
              )}
            </div>
            
            <div className="color-selector-section">
              <h3>Select Card Color</h3>
              <div className="color-grid">
                {BRIGHT_COLORS.map(color => (
                  <div 
                    key={color} 
                    className={`color-swatch ${formData.subjectColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  ></div>
                ))}
              </div>
              <div className="selected-color-preview">
                <span>Selected Color:</span>
                <div 
                  className="color-preview" 
                  style={{ 
                    backgroundColor: formData.subjectColor,
                    color: getContrastColor(formData.subjectColor)
                  }}
                >
                  Sample Text
                </div>
              </div>
            </div>
          </div>
        );
        
      case 7: // Preview Generated Cards
        return (
          <div className="step-content">
            <h2>Generated Flashcards</h2>
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={handleRegenerateCards}>Try Again</button>
              </div>
            )}
            
            {isGenerating ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Generating your flashcards...</p>
              </div>
            ) : (
              <>
                <div className="preview-controls">
                  <button 
                    onClick={handleAddAllCards} 
                    className="primary-button"
                    disabled={generatedCards.every(card => card.added)}
                  >
                    Add All to Bank
                  </button>
                  <button 
                    onClick={handleRegenerateCards} 
                    className="secondary-button"
                  >
                    Generate New Cards
                  </button>
                </div>
                
                <div className="cards-preview">
                  {generatedCards.map(card => (
                    <div key={card.id} className="preview-card-container">
                      <Flashcard 
                        card={card} 
                        showButtons={false} 
                      />
                      
                      {!card.added && (
                        <button 
                          onClick={() => handleAddCard(card)} 
                          className="add-card-button"
                        >
                          Add to Bank
                        </button>
                      )}
                      
                      {card.added && (
                        <div className="card-added-overlay">
                          <span>Added to Bank ✓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  // Render saved topic lists
  const renderSavedTopicLists = () => {
    if (savedTopicLists.length === 0) {
      return (
        <div className="no-saved-topics">
          <p>No saved topic lists yet</p>
        </div>
      );
    }
    
    return (
      <div className="saved-topic-lists">
        <h3>Saved Topic Lists</h3>
        <div className="topic-list-grid">
          {savedTopicLists.map(list => (
            <div key={list.id} className="topic-list-card">
              <h4>{list.name}</h4>
              <div className="topic-list-details">
                <p><strong>Exam:</strong> {list.examBoard} {list.examType}</p>
                <p><strong>Subject:</strong> {list.subject}</p>
                <p><strong>Topics:</strong> {list.topics.length}</p>
                <p className="created-date">Created: {new Date(list.created).toLocaleDateString()}</p>
              </div>
              <div className="topic-list-actions">
                <button onClick={() => loadTopicList(list.id)}>Load</button>
                <button className="delete-button" onClick={() => deleteTopicList(list.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render hierarchical topics
  const renderHierarchicalTopics = () => {
    if (hierarchicalTopics.length === 0) {
      return null;
    }
    
    return (
      <div className="hierarchical-topics">
        <div className="topics-header">
          <h3>Generated Topics</h3>
          <div className="topic-actions">
            <button 
              className="save-topics-button"
              onClick={() => setShowSaveTopicDialog(true)}
            >
              Save Topic List
            </button>
          </div>
        </div>
        
        <div className="topics-list">
          {hierarchicalTopics.map((topicData, index) => (
            <div key={index} className="topic-card">
              <h4>{topicData.topic}</h4>
              <p className="topic-description">{topicData.description}</p>
              {topicData.subTopics && topicData.subTopics.length > 0 && (
                <div className="sub-topics">
                  <h5>Sub-topics:</h5>
                  <ul>
                    {topicData.subTopics.map((subTopic, subIndex) => (
                      <li key={subIndex}>{subTopic}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render topic save dialog
  const renderSaveTopicDialog = () => {
    if (!showSaveTopicDialog) {
      return null;
    }
    
    return (
      <div className="save-topic-overlay">
        <div className="save-topic-dialog">
          <h3>Save Topic List</h3>
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={topicListName} 
              onChange={(e) => setTopicListName(e.target.value)}
              placeholder="Enter a name for this topic list"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="dialog-actions">
            <button className="cancel-button" onClick={() => setShowSaveTopicDialog(false)}>Cancel</button>
            <button className="save-button" onClick={saveTopicList}>Save</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ai-card-generator">
      {renderSaveTopicDialog()}
      
      <div className="generator-header">
        <h1>AI Card Generator</h1>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
      </div>
      
      <div className="progress-bar">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div 
            key={idx} 
            className={`progress-step ${idx + 1 === currentStep ? 'active' : ''} ${idx + 1 < currentStep ? 'completed' : ''}`}
          >
            {idx + 1}
          </div>
        ))}
      </div>
      
      <div className="generator-content">
        {renderStepContent()}
      </div>
      
      <div className="generator-controls">
        {currentStep > 1 && (
          <button 
            onClick={handlePrevStep} 
            className="back-button"
            disabled={isGenerating}
          >
            Back
          </button>
        )}
        
        {currentStep < totalSteps ? (
          <button 
            onClick={handleNextStep} 
            className="next-button"
            disabled={!canProceed() || isGenerating}
          >
            Next
          </button>
        ) : (
          <button 
            onClick={onClose} 
            className="finish-button"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
};

export default AICardGenerator;
