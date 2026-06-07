// Purpose: Developer utility for checking Firebase user records during local troubleshooting.
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "demo-key",
  projectId: "demo-project",
};

// Since this is likely an emulator environment or a real project, we need the exact config.
// Let's read it from the project.
