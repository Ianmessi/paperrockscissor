// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
const totalWinsElement = document.getElementById('totalWins');
const totalGamesElement = document.getElementById('totalGames');
const winRateElement = document.getElementById('winRate');

console.log("index.js loaded - DOM Elements:", {
    totalWinsElement,
    totalGamesElement,
    winRateElement
});

// Function to update the UI with stats
function updateStatsUI(stats) {
    if (!stats) {
        console.log("No stats provided, using defaults");
        totalWinsElement.textContent = '0';
        totalGamesElement.textContent = '0';
        winRateElement.textContent = '0%';
        return;
    }
    
    console.log("Updating UI with stats:", stats);
    
    // Calculate game-based statistics
    const gamesPlayed = stats.gamesPlayed || 0;
    const gamesWon = stats.wins || 0;
    
    // Calculate win rate based on games won vs games played
    const winRate = gamesPlayed > 0 
        ? Math.round((gamesWon / gamesPlayed) * 100) 
        : 0;
    
    console.log("Calculated stats:", {
        gamesPlayed,
        gamesWon,
        winRate: winRate + '%'
    });
    
    // Update UI
    totalWinsElement.textContent = gamesWon;
    totalGamesElement.textContent = gamesPlayed;
    winRateElement.textContent = winRate + '%';
    
    console.log("UI updated with stats");
}

// Update stats when user is authenticated
onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? `User logged in: ${user.email}` : "User logged out");
    
    if (user) {
        try {
            console.log("Setting up real-time listener for user stats:", user.uid);
            
            // Get user stats from Realtime Database with a real-time listener
            const userStatsRef = ref(database, 'users/' + user.uid + '/stats');
            
            // First get the current value
            get(userStatsRef).then((snapshot) => {
                console.log("Initial stats snapshot exists:", snapshot.exists());
                
                if (snapshot.exists()) {
                    const stats = snapshot.val();
                    console.log("Initial stats from database:", stats);
                    updateStatsUI(stats);
                } else {
                    console.log("No initial stats found, initializing with zeros");
                    updateStatsUI(null);
                }
            }).catch(error => {
                console.error("Error fetching initial user stats:", error);
                updateStatsUI(null);
            });
            
            // Then set up a listener for real-time updates
            onValue(userStatsRef, (snapshot) => {
                console.log("Real-time stats update received");
                
                if (snapshot.exists()) {
                    const stats = snapshot.val();
                    console.log("Updated stats from database:", stats);
                    updateStatsUI(stats);
                } else {
                    console.log("No stats found in real-time update");
                    updateStatsUI(null);
                }
            }, (error) => {
                console.error("Error in real-time stats listener:", error);
            });
            
        } catch (error) {
            console.error("Error setting up stats listeners:", error);
            updateStatsUI(null);
        }
    } else {
        // User is not logged in, show default values
        console.log("User not logged in, showing default values");
        updateStatsUI(null);
    }
});

// Add a welcome message with the user's name
onAuthStateChanged(auth, (user) => {
    const welcomeElement = document.getElementById('userWelcome');
    if (welcomeElement && user) {
        welcomeElement.textContent = `Welcome, ${user.displayName || user.email.split('@')[0]}!`;
        console.log("Welcome message updated for user:", user.displayName || user.email.split('@')[0]);
    }
});