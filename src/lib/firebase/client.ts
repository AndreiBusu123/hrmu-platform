/**
 * Firebase Client SDK Initialization
 *
 * This file initializes Firebase services for client-side usage.
 * Used in browser/Next.js client components.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getDatabase, Database } from 'firebase/database';
import { firebaseConfig, validateFirebaseConfig } from './config';

// Initialize Firebase App (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let realtimeDb: Database;

/**
 * Get or initialize Firebase App
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!validateFirebaseConfig()) {
      throw new Error(
        'Firebase configuration is invalid. Please check your environment variables.'
      );
    }

    // Check if an app is already initialized
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
  }

  return app;
}

/**
 * Get Firebase Authentication instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    const app = getFirebaseApp();
    auth = getAuth(app);
  }
  return auth;
}

/**
 * Get Firestore instance
 */
export function getFirebaseFirestore(): Firestore {
  if (!db) {
    const app = getFirebaseApp();
    db = getFirestore(app);
  }
  return db;
}

/**
 * Get Firebase Storage instance
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    const app = getFirebaseApp();
    storage = getStorage(app);
  }
  return storage;
}

/**
 * Get Firebase Realtime Database instance (for location tracking)
 */
export function getFirebaseRealtimeDatabase(): Database {
  if (!realtimeDb) {
    const app = getFirebaseApp();
    realtimeDb = getDatabase(app);
  }
  return realtimeDb;
}

// Export initialized instances
export { app, auth, db, storage, realtimeDb };
