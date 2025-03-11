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

    // Use new subject/topic if entered
    const finalSubject = newSubject || subject || "General";
    const finalTopic = newTopic || topic || "General";

    // Create different card types based on questionType
    let cardData = {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      subject: finalSubject,
      topic: finalTopic,
      questionType: questionType,
      timestamp: new Date().toISOString(),
      cardColor: cardColor,
      baseColor: cardColor,
    };

    // Add specific fields based on question type
    switch (questionType) {
      case "multiple_choice":
        cardData = {
          ...cardData,
          question: question,
          options: options,
          correctAnswer: correctOption,
          detailedAnswer: detailedAnswer,
        };
        break;
      case "short_answer":
        cardData = {
          ...cardData,
          question: question,
          keyPoints: keyPoints
            .split(";")
            .map((point) => point.trim())
            .filter((point) => point),
          detailedAnswer: detailedAnswer,
        };
        break;
      case "essay":
        cardData = {
          ...cardData,
          question: question,
          keyPoints: keyPoints
            .split(";")
            .map((point) => point.trim())
            .filter((point) => point),
          detailedAnswer: detailedAnswer,
        };
        break;
      case "acronym":
        cardData = {
          ...cardData,
          acronym: acronym,
          explanation: explanation,
        };
        break;
      default:
        cardData = {
          ...cardData,
          front: question,
          back: answer,
        };
    }

    // Also add front/back fields for consistent rendering
    if (!cardData.front) {
      cardData.front =
        questionType === "acronym" ? `Acronym: ${acronym}` : question;
    }

    if (!cardData.back) {
      if (questionType === "acronym") {
        cardData.back = `Explanation: ${explanation}`;
      } else if (questionType === "multiple_choice") {
        cardData.back = `Correct Answer: ${correctOption}`;
      } else {
        let keyPointsHtml = "";
        if (keyPoints && keyPoints.length > 0) {
          keyPointsHtml =
            "<ul>" +
            keyPoints
              .split(";")
              .map((point) => point.trim())
              .filter((point) => point)
              .map((point) => `<li>${point}</li>`)
              .join("") +
            "</ul>";
        }
        cardData.back = keyPointsHtml;
      }
    }

    // Update color mapping
    updateColorMapping(finalSubject, finalTopic, cardColor);

    // Add the card
    onAddCard(cardData);

    // Reset form
    resetForm();
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
                  }}
                />
              ))}
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
