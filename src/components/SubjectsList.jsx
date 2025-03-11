import React from "react";
import "./SubjectsList.css";

const SubjectsList = ({
  subjects,
  selectedSubject,
  onSelectSubject,
  getColorForSubject,
}) => {
  if (subjects.length === 0) {
    return (
      <div className="subjects-list empty">
        <h3>No Subjects</h3>
        <p>Create cards to see subjects here</p>
      </div>
    );
  }

  return (
    <div className="subjects-list">
      <h3>Subjects</h3>
      <div className="subjects-container">
        <button
          className={`subject-button ${
            selectedSubject === null ? "active" : ""
          }`}
          onClick={() => onSelectSubject(null)}
        >
          All Subjects
        </button>

        {subjects.map((subject) => (
          <button
            key={subject}
            className={`subject-button ${
              selectedSubject === subject ? "active" : ""
            }`}
            style={{
              backgroundColor: getColorForSubject(subject),
              color: getContrastColor(getColorForSubject(subject)),
            }}
            onClick={() => onSelectSubject(subject)}
          >
            {subject}
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

export default SubjectsList;
