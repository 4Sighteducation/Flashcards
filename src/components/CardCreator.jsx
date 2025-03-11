import React, { useState, useEffect } from "react";
import "./CardCreator.css";

const CardCreator = ({
  onAddCard,
  onCancel,
  subjects,
  getTopicsForSubject,
  currentColor,
  onColorChange,
  getColorForSubjectTopic,
  updateColorMapping,
}) => {
  // Card data
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [questionType, setQuestionType] = useState("short_answer");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [detailedAnswer, setDetailedAnswer] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState("");
  const [acronym, setAcronym] = useState("");
  const [explanation, setExplanation] = useState("");

  // New subject/topic fields
  const [newSubject, setNewSubject] = useState("");
  const [newTopic, setNewTopic] = useState("");

  // Available topics based on selected subject
  const [availableTopics, setAvailableTopics] = useState([]);

  // Custom color
  const [cardColor, setCardColor] = useState(currentColor);

  // Update available topics when subject changes
  useEffect(() => {
    if (subject) {
      setAvailableTopics(getTopicsForSubject(subject));
    } else {
      setAvailableTopics([]);
    }
  }, [subject, getTopicsForSubject]);

  // Color palette
  const brightColors = [
    "#e6194b",
    "#3cb44b",
    "#ffe119",
    "#0082c8",
    "#f58231",
    "#911eb4",
    "#46f0f0",
    "#f032e6",
    "#d2f53c",
    "#fabebe",
    "#008080",
    "#e6beff",
    "#aa6e28",
    "#fffac8",
    "#800000",
    "#aaffc3",
    "#808000",
    "#ffd8b1",
    "#000080",
    "#808080",
    "#FF69B4",
    "#8B4513",
    "#00CED1",
    "#ADFF2F",
    "#DC143C",
  ];

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form
    if (!subject) {
      alert("Please select a subject");
      return;
    }

    if (!topic) {
      alert("Please select a topic");
      return;
    }

    if (!question) {
      alert("Please enter a question");
      return;
    }

    if (questionType === "multiple_choice") {
      // Validate multiple choice
      const filledOptions = options.filter((opt) => opt.trim() !== "");
      if (filledOptions.length < 2) {
        alert("Please provide at least 2 options");
        return;
      }
      if (!correctOption) {
        alert("Please select the correct option");
        return;
      }
    } else if (questionType === "acronym") {
      // Validate acronym
      if (!acronym || !explanation) {
        alert("Please provide both acronym and explanation");
        return;
      }
    } else {
      // Validate short answer
      if (!answer) {
        alert("Please provide an answer");
        return;
      }
    }

    // Create card data
    const cardData = {
      subject,
      topic,
      type: questionType,
      question,
      color: cardColor,
    };

    // Add type-specific data
    if (questionType === "multiple_choice") {
      cardData.options = options.filter((opt) => opt.trim() !== "");
      cardData.correctOption = correctOption;
    } else if (questionType === "acronym") {
      cardData.acronym = acronym;
      cardData.explanation = explanation;
    } else {
      cardData.answer = answer;
    }

    // Add optional fields if they exist
    if (keyPoints) cardData.keyPoints = keyPoints;
    if (detailedAnswer) cardData.detailedAnswer = detailedAnswer;
    if (additionalInfo) cardData.additionalInfo = additionalInfo;

    // Add the card
    onAddCard(cardData);

    // Reset form
    setSubject("");
    setTopic("");
    setQuestionType("short_answer");
    setQuestion("");
    setAnswer("");
    setKeyPoints("");
    setDetailedAnswer("");
    setAdditionalInfo("");
    setOptions(["", "", "", ""]);
    setCorrectOption("");
    setAcronym("");
    setExplanation("");
    setCardColor(currentColor);
  };

  // Reset the form
  const resetForm = () => {
    setSubject("");
    setTopic("");
    setQuestionType("short_answer");
    setQuestion("");
    setAnswer("");
    setKeyPoints("");
    setDetailedAnswer("");
    setAdditionalInfo("");
    setOptions(["", "", "", ""]);
    setCorrectOption("");
    setAcronym("");
    setExplanation("");
    setNewSubject("");
    setNewTopic("");
  };

  // Handle option change for multiple choice
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="card-creator">
      <h2>Create New Flashcard</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Card Type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              required
            >
              <option value="short_answer">Short Answer</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="essay">Essay Style</option>
              <option value="acronym">Acronym</option>
            </select>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <label>Or Add New Subject</label>
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="New Subject"
            />
          </div>

          <div className="form-group">
            <label>Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={!subject && !newSubject}
            >
              <option value="">-- Select Topic --</option>
              {availableTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <label>Or Add New Topic</label>
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="New Topic"
              disabled={!subject && !newSubject}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group color-selector">
            <label>Card Color</label>
            <div className="color-grid">
              {brightColors.map((color) => (
                <div
                  key={color}
                  className={`color-swatch ${
                    color === cardColor ? "selected" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setCardColor(color);
                    onColorChange(color);
                    
                    // If we have a subject selected, update its color immediately
                    const currentSubject = newSubject || subject;
                    if (currentSubject) {
                      // Update the subject color in the mapping
                      console.log(`Updating color for subject: ${currentSubject} to ${color}`);
                      updateColorMapping(currentSubject, null, color);
                    }
                  }}
                />
              ))}
            </div>
            
            <div className="color-apply-options">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  id="applyToAllTopics"
                  onChange={(e) => {
                    // If checkbox is checked, update all topic colors for this subject
                    if (e.target.checked) {
                      const subjectToUpdate = newSubject || subject;
                      if (subjectToUpdate) {
                        console.log(`Applying color ${cardColor} to all topics in ${subjectToUpdate}`);
                        updateColorMapping(subjectToUpdate, null, cardColor, true);
                      }
                    }
                  }}
                />
                <span className="checkmark"></span>
                Apply this color to all topics in this subject
              </label>
            </div>
          </div>
        </div>

        {questionType === "acronym" ? (
          <div className="acronym-fields">
            <div className="form-group">
              <label>Acronym</label>
              <input
                type="text"
                value={acronym}
                onChange={(e) => setAcronym(e.target.value)}
                placeholder="Enter acronym"
                required
              />
            </div>
            <div className="form-group">
              <label>Explanation</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Enter explanation"
                required
              />
            </div>
          </div>
        ) : questionType === "multiple_choice" ? (
          <div className="multiple-choice-fields">
            <div className="form-group">
              <label>Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter question"
                required
              />
            </div>

            <div className="form-group">
              <label>Options</label>
              {options.map((option, index) => (
                <div key={index} className="option-row">
                  <span className="option-label">
                    {String.fromCharCode(97 + index)}){" "}
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    required
                  />
                  <input
                    type="radio"
                    name="correctOption"
                    value={option}
                    checked={correctOption === option}
                    onChange={() => setCorrectOption(option)}
                    required
                  />
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Detailed Answer Explanation</label>
              <textarea
                value={detailedAnswer}
                onChange={(e) => setDetailedAnswer(e.target.value)}
                placeholder="Enter detailed explanation"
              />
            </div>
          </div>
        ) : (
          <div className="default-fields">
            <div className="form-group">
              <label>Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter question"
                required
              />
            </div>

            <div className="form-group">
              <label>Key Points (separate with semicolons)</label>
              <textarea
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="Point 1; Point 2; Point 3"
                required
              />
            </div>

            <div className="form-group">
              <label>Detailed Answer</label>
              <textarea
                value={detailedAnswer}
                onChange={(e) => setDetailedAnswer(e.target.value)}
                placeholder="Enter detailed answer"
              />
            </div>

            <div className="form-group">
              <label>Additional Information</label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Provide additional context, examples, or resources that will be shown when the info button is clicked"
              />
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="create-button">
            Create Card
          </button>
        </div>
      </form>
    </div>
  );
};

export default CardCreator;
