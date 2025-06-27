
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage'; // Import Firebase Storage
// import { getAuth } from 'firebase/auth'; // Will be used later for Firebase Auth

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: "https://highclass-d5aac-default-rtdb.firebaseio.com/",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Check for missing essential Firebase config variables
const essentialConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'databaseURL',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

let configError = false;
for (const key of essentialConfigKeys) {
  if (!firebaseConfig[key]) {
    console.warn(`Firebase config key "${key}" (derived from NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}) is missing or undefined. Please check your environment variables.`);
    configError = true;
  }
}

if (configError) {
  console.error("Essential Firebase configuration is missing. Firebase services may not work correctly. Please ensure all NEXT_PUBLIC_FIREBASE_... environment variables are set.");
}


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized with projectId:', firebaseConfig.projectId);
  console.log('Firebase Realtime Database URL:', firebaseConfig.databaseURL);
} else {
  app = getApp();
  // console.log('Firebase app already initialized, using existing projectId:', app.options.projectId);
}

const database = getDatabase(app);
const storage = getStorage(app); // Initialize Firebase Storage
// const auth = getAuth(app); // Will be used later

console.log('Firebase initialized with Realtime Database only. Firestore is disabled.');

// Note: Firebase Realtime Database has built-in offline capabilities
// No additional configuration needed like Firestore's enableIndexedDbPersistence

export { app, database, storage /*, auth */ };

