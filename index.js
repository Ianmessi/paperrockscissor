// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const totalWinsElement = document.getElementById('totalWins');
const totalGamesElement = document.getElementById('totalGames');
const winRateElement = document.getElementById('winRate');

// Update stats when user is authenticated
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Get user stats from Firestore
            const userStatsRef = doc(db, "users", user.uid);
            const userStatsSnap = await getDoc(userStatsRef);
            
            if (userStatsSnap.exists()) {
                const stats = userStatsSnap.data().stats || { 
                    gamesPlayed: 0, 
                    wins: 0, 
                    losses: 0, 
                    draws: 0 
                };
                
                // Calculate statistics
                const totalRounds = stats.wins + stats.losses + stats.draws;
                const winRate = totalRounds > 0 
                    ? Math.round((stats.wins / totalRounds) * 100) 
                    : 0;
                
                // Update UI
                totalWinsElement.textContent = stats.wins;
                totalGamesElement.textContent = stats.gamesPlayed;
                winRateElement.textContent = winRate + '%';
            } else {
                // No stats found, initialize with zeros
                totalWinsElement.textContent = '0';
                totalGamesElement.textContent = '0';
                winRateElement.textContent = '0%';
            }
        } catch (error) {
            console.error("Error fetching user stats:", error);
        }
    } else {
        // User is not logged in, show default values
        totalWinsElement.textContent = '0';
        totalGamesElement.textContent = '0';
        winRateElement.textContent = '0%';
    }
});