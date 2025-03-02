// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
const totalWinsElement = document.getElementById('totalWins');
const totalGamesElement = document.getElementById('totalGames');
const winRateElement = document.getElementById('winRate');

// Update stats when user is authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        try {
            // Get user stats from Realtime Database
            const userStatsRef = ref(database, 'users/' + user.uid + '/stats');
            get(userStatsRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const stats = snapshot.val() || { 
                        gamesPlayed: 0, 
                        wins: 0, 
                        losses: 0, 
                        draws: 0 
                    };
                    
                    // Calculate game-based statistics
                    // A game is won if the player has more wins than losses in that game
                    const gamesPlayed = stats.gamesPlayed || 0;
                    const gamesWon = stats.wins || 0; // This is now tracking games won, not rounds
                    
                    // Calculate win rate based on games won vs games played
                    const winRate = gamesPlayed > 0 
                        ? Math.round((gamesWon / gamesPlayed) * 100) 
                        : 0;
                    
                    // Update UI
                    totalWinsElement.textContent = gamesWon;
                    totalGamesElement.textContent = gamesPlayed;
                    winRateElement.textContent = winRate + '%';
                    
                    console.log("User stats loaded:", stats);
                } else {
                    // No stats found, initialize with zeros
                    totalWinsElement.textContent = '0';
                    totalGamesElement.textContent = '0';
                    winRateElement.textContent = '0%';
                    console.log("No user stats found");
                }
            }).catch(error => {
                console.error("Error fetching user stats:", error);
                // Show default values on error
                totalWinsElement.textContent = '0';
                totalGamesElement.textContent = '0';
                winRateElement.textContent = '0%';
            });
        } catch (error) {
            console.error("Error in stats calculation:", error);
        }
    } else {
        // User is not logged in, show default values
        totalWinsElement.textContent = '0';
        totalGamesElement.textContent = '0';
        winRateElement.textContent = '0%';
    }
});

// Add a welcome message with the user's name
onAuthStateChanged(auth, (user) => {
    const welcomeElement = document.getElementById('userWelcome');
    if (welcomeElement && user) {
        welcomeElement.textContent = `Welcome, ${user.displayName || user.email.split('@')[0]}!`;
    }
});