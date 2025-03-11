import React, { useState, useEffect } from "react";
import "./AICardGenerator.css";
import Flashcard from './Flashcard';
import { generateTopicPrompt } from '../prompts/topicListPrompt';

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

// API keys - in production, these should be in server environment variables
const API_KEY = process.env.REACT_APP_OPENAI_KEY || "your-openai-key";
const KNACK_APP_ID = process.env.REACT_APP_KNACK_APP_ID || "64fc50bc3cd0ac00254bb62b";
const KNACK_API_KEY = process.env.REACT_APP_KNACK_API_KEY || "knack-api-key";

const AICardGenerator = ({ onAddCard, onClose, subjects = [], auth, userId }) => {
  // Step management state
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(7);
  
  // Form data state
  const [formData, setFormData] = useState({
    examBoard: "",
    examType: "",
    subject: "",
    newSubject: "",
    topic: "",
    newTopic: "",
    numCards: 5,
    questionType: "multiple_choice",
    subjectColor: BRIGHT_COLORS[0]
  });
  
  // Processing states
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // Results states
  const [generatedCards, setGeneratedCards] = useState([]);
  
  // Progress tracking
  const [completedSteps, setCompletedSteps] = useState({});
  
  // New states for hierarchical topics and saved topic lists
  const [hierarchicalTopics, setHierarchicalTopics] = useState([]);
  const [savedTopicLists, setSavedTopicLists] = useState([]);
  const [showSaveTopicDialog, setShowSaveTopicDialog] = useState(false);
  const [topicListName, setTopicListName] = useState("");
  
  // State for available subjects and topics based on selection
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);

  // Load saved topic lists from both localStorage and Knack on mount
  useEffect(() => {
    // Load from localStorage
    const storedLists = localStorage.getItem('savedTopicLists');
    const localLists = storedLists ? JSON.parse(storedLists) : [];
    
    // Only load from Knack if authenticated
    if (auth && userId) {
      // First set the local lists
      setSavedTopicLists(localLists);
      
      // Then load from Knack and merge with local lists
      loadTopicListsFromKnack()
        .then(knackLists => {
          if (knackLists && knackLists.length > 0) {
            // Merge lists, avoiding duplicates by ID
            const mergedLists = [...localLists];
            knackLists.forEach(knackList => {
              const existingIndex = mergedLists.findIndex(local => local.id === knackList.id);
              if (existingIndex > -1) {
                mergedLists[existingIndex] = knackList; // Replace with Knack version
              } else {
                mergedLists.push(knackList); // Add new list
              }
            });
            
            setSavedTopicLists(mergedLists);
          }
        })
        .catch(error => {
          console.error("Error loading topic lists from Knack:", error);
        });
    } else {
      // Just use localStorage if not authenticated
      setSavedTopicLists(localLists);
    }
    
    // Initialize available subjects and topics
    const examTypes = formData.examType ? ["GCSE", "A-Level"] : [];
    setAvailableSubjects(subjects.filter(s => examTypes.includes(s.examType)));
  }, [auth, userId]);

  // Load saved topic lists from Knack
  const loadTopicListsFromKnack = async () => {
    try {
      // Check if we're authenticated or have a user ID
      const authData = localStorage.getItem('authData');
      if (!authData) {
        console.log("No authentication data, skipping Knack load");
        return [];
      }
      
      const auth = JSON.parse(authData);
      if (!auth.id) {
        console.log("No user ID found, skipping Knack load");
        return [];
      }
      
      console.log("Loading topic lists from Knack...");
      
      // Get topic lists from Knack
      const getUrl = `https://api.knack.com/v1/objects/object_102/records/${auth.id}`;
      const getResponse = await fetch(getUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Knack-Application-ID": KNACK_APP_ID,
          "X-Knack-REST-API-Key": KNACK_API_KEY
        }
      });
      
      if (!getResponse.ok) {
        console.error("Failed to get Knack record:", await getResponse.json());
        return [];
      }
      
      const userData = await getResponse.json();
      
      // Parse topic lists from Knack
      if (userData.field_3011) {
        try {
          const knackTopicLists = JSON.parse(userData.field_3011);
          if (Array.isArray(knackTopicLists) && knackTopicLists.length > 0) {
            console.log("Loaded topic lists from Knack:", knackTopicLists);
            
            // Merge with local lists
            const localLists = JSON.parse(localStorage.getItem('savedTopicLists') || "[]");
            
            // Create a map of existing IDs
            const existingIds = new Map();
            localLists.forEach(list => existingIds.set(list.id, true));
            
            // Only add Knack lists that don't exist locally
            const newLists = knackTopicLists.filter(list => !existingIds.has(list.id));
            
            if (newLists.length > 0) {
              const mergedLists = [...localLists, ...newLists];
              setSavedTopicLists(mergedLists);
              localStorage.setItem('savedTopicLists', JSON.stringify(mergedLists));
              console.log("Merged topic lists from Knack with local lists");
            }
          }
        } catch (e) {
          console.error("Error parsing Knack topic lists:", e);
        }
      }
    } catch (error) {
      console.error("Error loading topic lists from Knack:", error);
    }
  };

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
      
      if (examTypeSubjects[formData.examType]) {
        // If using subjects from props, combine with predefined list
        const combinedSubjects = [...new Set([
          ...(subjects || []),
          ...examTypeSubjects[formData.examType]
        ])].sort();
        
        setAvailableSubjects(combinedSubjects);
      }
    } else {
      setAvailableSubjects(subjects || []);
    }
  }, [formData.examType, subjects]);

  // Effect to generate topics when subject changes
  useEffect(() => {
    // Reset topics when subject changes
    setAvailableTopics([]);
    
    // Auto-generate topics if subject is selected
    if (formData.subject || formData.newSubject) {
      if (!isGenerating && currentStep === 3 && formData.examBoard && formData.examType) {
        console.log("Auto-generating topics for subject:", formData.subject || formData.newSubject);
        // Uncomment to auto-generate topics
        // generateTopics(formData.examBoard, formData.examType, formData.subject || formData.newSubject)
        //   .then(topics => setAvailableTopics(topics))
        //   .catch(e => console.error("Error auto-generating topics:", e));
      }
    } else {
      setAvailableTopics([]);
    }
  }, [formData.subject, formData.examBoard, formData.examType]);

  // Generate topics using AI
  const generateTopics = async (examBoard, examType, subject) => {
    try {
      if (!examBoard || !examType || !subject) {
        throw new Error("Missing required parameters");
      }
      
      console.log("Generating topics for:", examBoard, examType, subject);
      
      // Get the prompt from our new prompt file
      const prompt = generateTopicPrompt(examBoard, examType, subject);
      
      // Make API call to OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800,
          temperature: 0.5
        })
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error("No content returned from API");
      }
      
      // Extract and clean the content
      let content = data.choices[0].message.content;
      content = content.replace(/```json|```/g, '').trim();
      console.log("Raw topic response:", content);
      
      // Try to parse as JSON
      let topics;
      try {
        topics = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse topic response as JSON:", e);
        // Fall back to text processing if JSON parsing fails
        topics = content.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^[-*•]\s*/, '').trim());
      }
      
      // Ensure we have an array
      if (!Array.isArray(topics)) {
        console.error("Unexpected response format:", topics);
        throw new Error("Invalid topic format received");
      }
      
      console.log("Generated topics:", topics);
      return topics;
    } catch (error) {
      console.error("Error generating topics:", error);
      throw new Error(`Failed to generate topics: ${error.message}`);
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
        id: generateId('topiclist'),
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
      
      // Also save to Knack if authenticated
      if (auth && userId) {
        saveTopicListToKnack(newSavedList);
      }
      
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
  
  // Generate a unique ID
  const generateId = (prefix = 'topic') => {
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `${prefix}_${timestamp}_${randomStr}`;
  };
  
  // Save topic list to Knack
  const saveTopicListToKnack = async (topicList) => {
    try {
      // Check if we're authenticated or have a user ID
      const authData = localStorage.getItem('authData');
      if (!authData) {
        console.log("No authentication data, skipping Knack save");
        return;
      }
      
      const auth = JSON.parse(authData);
      if (!auth.id) {
        console.log("No user ID found, skipping Knack save");
        return;
      }
      
      console.log("Saving topic list to Knack...");
      
      // Get existing topic lists from Knack
      const getUrl = `https://api.knack.com/v1/objects/object_102/records/${auth.id}`;
      const getResponse = await fetch(getUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Knack-Application-ID": KNACK_APP_ID,
          "X-Knack-REST-API-Key": KNACK_API_KEY
        }
      });
      
      if (!getResponse.ok) {
        console.error("Failed to get Knack record:", await getResponse.json());
        return;
      }
      
      const userData = await getResponse.json();
      console.log("Retrieved user data from Knack:", userData);
      
      // Combine existing topic lists with the new one
      let existingKnackTopicLists = [];
      if (userData.field_3011) {
        try {
          existingKnackTopicLists = JSON.parse(userData.field_3011);
          if (!Array.isArray(existingKnackTopicLists)) {
            existingKnackTopicLists = [];
          }
        } catch (e) {
          console.error("Error parsing existing Knack topic lists:", e);
          existingKnackTopicLists = [];
        }
      }
      
      const combinedTopicLists = [...existingKnackTopicLists, topicList];
      
      // Update Knack record
      const updateUrl = `https://api.knack.com/v1/objects/object_102/records/${auth.id}`;
      const updateResponse = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Knack-Application-ID": KNACK_APP_ID,
          "X-Knack-REST-API-Key": KNACK_API_KEY
        },
        body: JSON.stringify({
          field_3011: JSON.stringify(combinedTopicLists)
        })
      });
      
      if (updateResponse.ok) {
        console.log("Topic list saved to Knack successfully");
      } else {
        console.error("Failed to save topic list to Knack:", await updateResponse.json());
      }
    } catch (error) {
      console.error("Error saving topic list to Knack:", error);
    }
  };
  
  // Load a saved topic list
  const loadTopicList = (listId) => {
    const list = savedTopicLists.find(list => list.id === listId);
    if (!list) {
      setError("Topic list not found");
      return;
    }
    
    // Update the form data with values from the saved list
    setFormData(prev => ({
      ...prev,
      examBoard: list.examBoard,
      examType: list.examType,
      subject: list.subject,
      topic: '', // Clear any existing topic
      newSubject: '',
      newTopic: ''
    }));
    
    // Set the hierarchical topics
    setHierarchicalTopics(list.topics);
    
    // Move to step 4 (topic step) 
    setCurrentStep(4);
    
    console.log(`Loaded topic list: ${list.name}`);
  };
  
  // Delete a topic list
  const deleteTopicList = (listId) => {
    // Remove from state
    setSavedTopicLists(prev => prev.filter(list => list.id !== listId));
    
    // Remove from localStorage
    const storedLists = JSON.parse(localStorage.getItem('savedTopicLists') || '[]');
    const updatedLists = storedLists.filter(list => list.id !== listId);
    localStorage.setItem('savedTopicLists', JSON.stringify(updatedLists));
    
    // Delete from Knack if authenticated
    if (auth && userId) {
      deleteTopicListFromKnack(listId);
    }
    
    console.log(`Deleted topic list with ID: ${listId}`);
  };
  
  // Delete topic list from Knack
  const deleteTopicListFromKnack = async (listId) => {
    try {
      // Check if we're authenticated or have a user ID
      const authData = localStorage.getItem('authData');
      if (!authData) {
        console.log("No authentication data, skipping Knack delete");
        return;
      }
      
      const auth = JSON.parse(authData);
      if (!auth.id) {
        console.log("No user ID found, skipping Knack delete");
        return;
      }
      
      console.log("Deleting topic list from Knack...");
      
      // Get existing topic lists from Knack
      const getUrl = `https://api.knack.com/v1/objects/object_102/records/${auth.id}`;
      const getResponse = await fetch(getUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Knack-Application-ID": KNACK_APP_ID,
          "X-Knack-REST-API-Key": KNACK_API_KEY
        }
      });
      
      if (!getResponse.ok) {
        console.error("Failed to get Knack record:", await getResponse.json());
        return;
      }
      
      const userData = await getResponse.json();
      
      // Filter out the deleted list
      if (userData.field_3011) {
        try {
          let knackTopicLists = JSON.parse(userData.field_3011);
          if (Array.isArray(knackTopicLists)) {
            knackTopicLists = knackTopicLists.filter(list => list.id !== listId);
            
            // Update Knack record
            const updateUrl = `https://api.knack.com/v1/objects/object_102/records/${auth.id}`;
            const updateResponse = await fetch(updateUrl, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "X-Knack-Application-ID": KNACK_APP_ID,
                "X-Knack-REST-API-Key": KNACK_API_KEY
              },
              body: JSON.stringify({
                field_3011: JSON.stringify(knackTopicLists)
              })
            });
            
            if (updateResponse.ok) {
              console.log("Topic list deleted from Knack successfully");
            } else {
              console.error("Failed to delete topic list from Knack:", await updateResponse.json());
            }
          }
        } catch (e) {
          console.error("Error parsing Knack topic lists:", e);
        }
      }
    } catch (error) {
      console.error("Error deleting topic list from Knack:", error);
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
          {hierarchicalTopics.map((topicData, index) => {
            // Check if it's a main topic or subtopic
            const isSubtopic = topicData.topic.includes(":");
            const mainTopic = isSubtopic ? topicData.topic.split(":")[0].trim() : topicData.topic;
            const subtopic = isSubtopic ? topicData.topic.split(":")[1].trim() : null;
            
            return (
              <div key={index} className={`topic-card ${isSubtopic ? 'subtopic' : 'main-topic'}`}>
                <h4>{topicData.topic}</h4>
              </div>
            );
          })}
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
      case 1: // Exam Type
        return !!formData.examType;
      case 2: // Exam Board
        return !!formData.examBoard;
      case 3: // Subject
        return !!(formData.subject || formData.newSubject);
      case 4: // Topic
        return !!(formData.topic || formData.newTopic);
      case 5: // Number of Cards
        return formData.numCards > 0 && formData.numCards <= 20;
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
      case 1: // Exam Type
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
        
      case 2: // Exam Board
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
              {renderTopicSelectionUI()}
            </div>
            
            {/* Display hierarchical topics */}
            {!isGenerating && hierarchicalTopics.length > 0 && renderHierarchicalTopics()}
            
            <div className="form-group">
              <label>Or Add New Topic</label>
              <input
                type="text"
                name="newTopic"
                value={formData.newTopic}
                onChange={handleChange}
                placeholder="Enter a new topic"
              />
            </div>
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
        
      case 7: // Confirmation
        return renderConfirmation();
        
      default:
        return <div>Unknown step</div>;
    }
  };

  // Render topic selection UI with loading indicator
  const renderTopicSelectionUI = () => {
    return (
      <div className="topic-selection-container">
        {isGenerating ? (
          <div className="loading-indicator">
            <p>Generating topics for {formData.subject || formData.newSubject}...</p>
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
          </>
        )}
      </div>
    );
  };

  // Effect to update the progress based on steps completed
  useEffect(() => {
    // Update progress steps completion status
    const newCompletedSteps = {};
    
    // Mark previous steps as completed
    for (let i = 1; i < currentStep; i++) {
      newCompletedSteps[i] = true;
    }
    
    // Check if current step is complete
    newCompletedSteps[currentStep] = canProceed();
    
    setCompletedSteps(newCompletedSteps);
  }, [currentStep, formData]);

  // Step 7: Confirmation Step
  const renderConfirmation = () => {
    return (
      <div className="step-content confirmation-step">
        <h2>Confirm Your Selections</h2>
        
        <div className="confirmation-details">
          <div className="confirmation-item">
            <span className="label">Exam Type:</span>
            <span className="value">{formData.examType}</span>
          </div>
          
          <div className="confirmation-item">
            <span className="label">Exam Board:</span>
            <span className="value">{formData.examBoard}</span>
          </div>
          
          <div className="confirmation-item">
            <span className="label">Subject:</span>
            <span className="value">{formData.newSubject || formData.subject}</span>
          </div>
          
          <div className="confirmation-item">
            <span className="label">Topic:</span>
            <span className="value">{formData.newTopic || formData.topic}</span>
          </div>
          
          <div className="confirmation-item">
            <span className="label">Number of Cards:</span>
            <span className="value">{formData.numCards}</span>
          </div>
          
          <div className="confirmation-item">
            <span className="label">Question Type:</span>
            <span className="value">
              {QUESTION_TYPES.find(t => t.value === formData.questionType)?.label || formData.questionType}
            </span>
          </div>
          
          <div className="confirmation-item">
            <span className="label">Card Color:</span>
            <span className="value color-preview" style={{
              backgroundColor: formData.subjectColor,
              color: getContrastColor(formData.subjectColor)
            }}>
              {formData.subjectColor}
            </span>
          </div>
        </div>
        
        <div className="confirmation-actions">
          <button 
            className="generate-button"
            onClick={generateCards}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Cards"}
          </button>
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
        {/* Render saved topic lists before the step content if on step 1 */}
        {currentStep === 1 && renderSavedTopicLists()}
        
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
