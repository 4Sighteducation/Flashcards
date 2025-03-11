import React from "react";
import "./TopicsList.css";

const TopicsList = ({
  topics,
  selectedTopic,
  onSelectTopic,
  getColorForTopic,
}) => {
  if (topics.length === 0) {
    return (
      <div className="topics-list empty">
        <h3>No Topics</h3>
        <p>Create cards to see topics here</p>
      </div>
    );
  }

  return (
    <div className="topics-list">
      <h3>Topics</h3>
      <div className="topics-container">
        <button
          className={`topic-button ${selectedTopic === null ? "active" : ""}`}
          onClick={() => onSelectTopic(null)}
        >
          All Topics
        </button>

        {topics.map((topic) => (
          <button
            key={topic}
            className={`topic-button ${
              selectedTopic === topic ? "active" : ""
            }`}
            style={{
              backgroundColor: getColorForTopic(topic),
              color: getContrastColor(getColorForTopic(topic)),
            }}
            onClick={() => onSelectTopic(topic)}
          >
            {topic}
          </button>
        ))}
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

export default TopicsList;
