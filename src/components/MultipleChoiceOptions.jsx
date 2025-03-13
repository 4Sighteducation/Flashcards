import React from 'react';
import AutoTranslatedText from './AutoTranslatedText';
import './MultipleChoiceOptions.css';

/**
 * Component for rendering multiple choice options
 * @param {Object} props 
 * @param {Array} props.options - Array of option strings
 * @param {boolean} props.disabled - Whether the options are disabled
 * @param {string} props.selectedOption - The currently selected option
 * @param {Function} props.onSelectOption - Function called when an option is selected
 * @param {boolean} props.preview - Whether the component is in preview mode
 * @param {boolean} props.showCorrectAnswer - Whether to show the correct answer
 * @param {string} props.correctAnswer - The correct answer
 */
const MultipleChoiceOptions = ({ 
  options = [], 
  disabled = false, 
  selectedOption = null, 
  onSelectOption = () => {}, 
  preview = false,
  showCorrectAnswer = false,
  correctAnswer = null
}) => {
  console.log('Rendering MultipleChoiceOptions with:', 
    { optionsCount: options?.length, disabled, selectedOption, preview, showCorrectAnswer });
  
  // If no options are provided, return null or a message
  if (!options || options.length === 0) {
    console.error('No options provided to MultipleChoiceOptions component');
    return <div className="no-options-error">No options available</div>;
  }
  
  // Debug information about the options
  console.log('Option details:', options.map((opt, i) => 
    `Option ${i+1}: ${typeof opt === 'string' ? opt.substring(0, 20) : typeof opt}`));
  
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  
  // Format options with letter prefixes (a, b, c, d)
  const renderOption = (option, index) => {
    if (typeof option !== 'string') {
      console.error(`Invalid option type at index ${index}:`, option);
      return null;
    }
    
    const letter = index < letters.length ? letters[index] : index + 1;
    const isCorrect = showCorrectAnswer && option === correctAnswer;
    const isSelected = option === selectedOption;
    
    return (
      <div 
        key={`option-${index}`}
        className={`multiple-choice-option 
          ${disabled ? 'disabled' : ''} 
          ${isSelected ? 'selected' : ''} 
          ${isCorrect ? 'correct' : ''}
          ${isSelected && !isCorrect && showCorrectAnswer ? 'incorrect' : ''}
        `}
        onClick={() => !disabled && onSelectOption(option)}
      >
        <span className="option-letter">{letter})</span>
        <span className="option-text">
          <AutoTranslatedText 
            content={option} 
            className="option-translation"
          />
        </span>
      </div>
    );
  };
  
  return (
    <div className="multiple-choice-options">
      {options.map((option, index) => renderOption(option, index))}
    </div>
  );
};

export default MultipleChoiceOptions; 