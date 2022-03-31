// Initialize the default app
import * as admin from "firebase-admin";

const defaultApp = admin.initializeApp();

// Ottieni il database
export const db = defaultApp.database();
