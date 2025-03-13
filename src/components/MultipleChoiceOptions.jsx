import React from 'react';
import AutoTranslatedText from './AutoTranslatedText';
import './MultipleChoiceOptions.css';

/**
 * Component for rendering multiple choice options with automatic translation
 * @param {Object} props
 * @param {Array} props.options - Array of option strings
 * @param {string} props.selectedOption - Currently selected option
 * @param {Function} props.onSelectOption - Function to call when an option is selected
 * @param {boolean} props.disabled - Whether the options are disabled
 * @param {boolean} props.preview - Whether this is in preview mode
 */
const MultipleChoiceOptions = ({ 
  options = [], 
  selectedOption, 
  onSelectOption, 
  disabled = false,
  preview = false 
}) => {
  if (!options || options.length === 0) {
    return null;
  }

  // Function to format options with letter prefixes (a, b, c, d)
  const formatOptions = (options) => {
    return options.map((option, index) => {
      // Check if the option already has a letter prefix
      const hasPrefix = /^[a-d]\)\s+/i.test(option);
      
      if (hasPrefix) {
        return option;
      }
      
      // Add letter prefix (a, b, c, d)
      const letter = String.fromCharCode(97 + index);
      return `${letter}) ${option}`;
    });
  };

  const formattedOptions = formatOptions(options);

  return (
    <div className="options-container">
      <ol type="a">
        {formattedOptions.map((option, index) => (
          <li 
            key={index}
            className={`
              option-item 
              ${selectedOption === option ? 'selected' : ''} 
              ${preview ? 'preview' : ''}
            `}
            onClick={!disabled && onSelectOption ? () => onSelectOption(option) : undefined}
          >
            <AutoTranslatedText content={option} />
          </li>
        ))}
      </ol>
    </div>
  );
};

export default MultipleChoiceOptions; 