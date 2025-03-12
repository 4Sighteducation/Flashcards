// Mock Firebase implementation for build purposes
// This file is used to satisfy imports but doesn't actually connect to Firebase

// Mock Firestore database
export const db = {
  // Add any mock methods needed here
};

// Mock Firebase auth
export const auth = {
  // Add any mock methods needed here
};

// Mock Firebase functions
export const firebaseFunctions = {
  // Add any mock functions needed here
};

// Create a named object before exporting
const firebase = {
  db,
  auth,
  firebaseFunctions
};

// Export the named object
export default firebase; 