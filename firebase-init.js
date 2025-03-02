// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Database structure for user stats
const defaultUserStats = {
    gamesPlayed: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    winRate: 0,
    lastUpdated: null
};

export { app, auth, database, defaultUserStats }; 