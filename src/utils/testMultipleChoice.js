// Test utility for multiple choice and translation functionality
import { translateText } from './TranslationService';

/**
 * Test the rendering and translation of multiple choice options
 * This can be called from the browser console to test functionality
 * @param {Object} options - Configuration options
 * @param {boolean} options.testWelsh - Whether to test Welsh translation
 * @param {boolean} options.testOptions - Whether to test multiple choice options
 */
export const testMultipleChoiceAndTranslation = async (options = {}) => {
  console.group('🧪 Testing Multiple Choice and Translation Functionality');
  
  const { testWelsh = true, testOptions = true } = options;
  
  // Test Welsh translation API
  if (testWelsh) {
    console.log('Testing Welsh Translation API...');
    try {
      const testText = "This is a test of the Welsh translation API.";
      console.log(`Translating: "${testText}"`);
      
      const translated = await translateText(testText, 'cy', 'en');
      console.log(`Welsh translation result: "${translated}"`);
      
      if (translated && translated !== testText) {
        console.log('✅ Welsh translation successful!');
      } else {
        console.warn('⚠️ Welsh translation might have failed - returned same text');
      }
    } catch (error) {
      console.error('❌ Welsh translation test failed:', error);
    }
  }
  
  // Test multiple choice options
  if (testOptions) {
    console.log('Testing Multiple Choice Options...');
    
    // Find examples of multiple choice cards in the DOM
    const multipleChoiceCards = document.querySelectorAll('.multiple-choice-container');
    console.log(`Found ${multipleChoiceCards.length} multiple choice cards in the DOM`);
    
    if (multipleChoiceCards.length > 0) {
      console.log('✅ Multiple choice rendering confirmed');
      
      // Check for options within these cards
      let optionsFound = 0;
      multipleChoiceCards.forEach((container, i) => {
        const options = container.querySelectorAll('.multiple-choice-option');
        console.log(`Card ${i+1}: ${options.length} options found`);
        optionsFound += options.length;
      });
      
      if (optionsFound > 0) {
        console.log('✅ Multiple choice options rendering correctly');
      } else {
        console.warn('⚠️ No multiple choice options found within containers');
      }
    } else {
      console.warn('⚠️ No multiple choice cards found in the DOM');
      console.log('Possible causes:');
      console.log('1. No multiple choice cards exist in the current view');
      console.log('2. Cards are not properly marked as multiple choice type');
      console.log('3. Cards do not have options arrays or options are empty');
    }
  }
  
  // Test translation rate limiting
  console.log('Testing translation rate limiting prevention...');
  const results = [];
  
  console.log('Attempting 5 quick translations to test throttling...');
  const testPhrase = "Testing translation throttling";
  
  const startTime = Date.now();
  for (let i = 0; i < 5; i++) {
    try {
      const startRequest = Date.now();
      await translateText(`${testPhrase} ${i+1}`, 'cy', 'en');
      const endRequest = Date.now();
      results.push({
        index: i,
        time: endRequest - startRequest,
        success: true
      });
    } catch (error) {
      results.push({
        index: i,
        error: error.message,
        success: false
      });
    }
  }
  const endTime = Date.now();
  
  console.log('Translation throttling results:', results);
  console.log(`Total time for 5 translations: ${endTime - startTime}ms`);
  
  if (endTime - startTime > 2000) {
    console.log('✅ Throttling appears to be working (translations took significant time)');
  } else {
    console.warn('⚠️ Throttling might not be effective (translations completed too quickly)');
  }
  
  console.groupEnd();
  return {
    welshTranslationTested: testWelsh,
    multipleChoiceTested: testOptions,
    throttlingResults: results
  };
};

// Make the test function available in the global scope for console testing
if (typeof window !== 'undefined') {
  window.testMultipleChoiceAndTranslation = testMultipleChoiceAndTranslation;
}

export default testMultipleChoiceAndTranslation; 