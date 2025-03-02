// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// DOM Elements
const roundWinsElement = document.getElementById('roundWins');
const gamesWonElement = document.getElementById('gamesWon');
const totalGamesElement = document.getElementById('totalGames');
const winRateElement = document.getElementById('winRate');
const userWelcome = document.getElementById('userWelcome');

console.log("index.js loaded - DOM Elements:", {
    roundWinsElement,
    gamesWonElement,
    totalGamesElement,
    winRateElement,
    userWelcome
});

// Function to update the UI with stats
function updateStatsUI(stats) {
    console.log("Updating UI with stats:", stats);
    
    if (!stats) {
        console.log("No stats provided, using defaults");
        if (roundWinsElement) roundWinsElement.textContent = '0';
        if (gamesWonElement) gamesWonElement.textContent = '0';
        if (totalGamesElement) totalGamesElement.textContent = '0';
        if (winRateElement) winRateElement.textContent = '0%';
        return;
    }
    
    // Get values from stats
    const gamesPlayed = stats.gamesPlayed || 0;
    const roundWins = stats.totalWins || 0;  // This is total round wins
    const gamesWon = stats.gamesWon || 0;    // This is complete game wins
    const winRate = stats.winRate || 0;      // Using the pre-calculated win rate
    
    console.log("Processing stats for display:", {
        gamesPlayed,
        roundWins,
        gamesWon,
        winRate
    });
    
    // Update UI elements if they exist
    if (roundWinsElement) roundWinsElement.textContent = String(roundWins);
    if (gamesWonElement) gamesWonElement.textContent = String(gamesWon);
    if (totalGamesElement) totalGamesElement.textContent = String(gamesPlayed);
    if (winRateElement) {
        winRateElement.textContent = winRate + '%';
        
        // Add color classes based on win rate
        winRateElement.className = 'stat-value';
        if (winRate >= 60) {
            winRateElement.classList.add('high-rate');
        } else if (winRate >= 40) {
            winRateElement.classList.add('medium-rate');
        } else {
            winRateElement.classList.add('low-rate');
        }
    }
}

// Update stats when user is authenticated
onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? `User logged in: ${user.email}` : "User logged out");
    
    if (user) {
        console.log('User is signed in:', user.uid);
        if (userWelcome) {
            userWelcome.textContent = `Welcome, ${user.displayName || user.email}!`;
            userWelcome.style.color = '#000000'; // Make welcome message black
        }
        
        // Set up real-time listener for user stats
        const userStatsRef = ref(database, 'users/' + user.uid + '/stats');
        onValue(userStatsRef, (snapshot) => {
            if (snapshot.exists()) {
                const stats = snapshot.val();
                console.log('Received user stats:', stats);
                updateStatsUI(stats);
            } else {
                console.log('No stats found for user');
                updateStatsUI(null);
            }
        }, (error) => {
            console.error('Error loading stats:', error);
            updateStatsUI(null);
        });
    } else {
        console.log('No user signed in');
        window.location.href = 'login.html';
    }
});