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
const totalWinsElement = document.getElementById('totalWins');
const totalGamesElement = document.getElementById('totalGames');
const totalLossesElement = document.getElementById('winRate'); // Reuse winRate element for losses
const calculatedWinRateElement = document.getElementById('calculatedWinRate');
const userWelcome = document.getElementById('userWelcome');

console.log("index.js loaded - DOM Elements:", {
    totalWinsElement,
    totalGamesElement,
    totalLossesElement,
    calculatedWinRateElement,
    userWelcome
});

// Function to calculate win rate
function calculateWinRate(wins, totalGames) {
    if (totalGames === 0) return 0;
    // Calculate win rate with 2 decimal places
    return Math.round((wins / totalGames) * 100 * 100) / 100;
}

// Function to update the UI with stats
function updateStatsUI(stats) {
    console.log("Updating UI with stats:", stats);
    
    if (!stats) {
        console.log("No stats provided, using defaults");
        if (totalWinsElement) totalWinsElement.textContent = '0';
        if (totalGamesElement) totalGamesElement.textContent = '0';
        if (totalLossesElement) totalLossesElement.textContent = '0';
        if (calculatedWinRateElement) calculatedWinRateElement.textContent = '0%';
        return;
    }
    
    // Get values from stats, ensuring we use complete game stats
    const gamesPlayed = stats.gamesPlayed || 0;
    const totalWins = stats.totalWins || 0;
    const totalLosses = stats.totalLosses || 0;
    
    // Calculate win rate
    const winRate = calculateWinRate(totalWins, gamesPlayed);
    
    console.log("Processing stats for display:", {
        gamesPlayed,
        totalWins,
        totalLosses,
        winRate
    });
    
    // Update UI elements if they exist
    if (totalWinsElement) totalWinsElement.textContent = String(totalWins);
    if (totalGamesElement) totalGamesElement.textContent = String(gamesPlayed);
    if (totalLossesElement) {
        totalLossesElement.textContent = String(totalLosses);
        totalLossesElement.className = 'stat-value'; // Reset classes
    }
    if (calculatedWinRateElement) {
        calculatedWinRateElement.textContent = winRate + '%';
        // Add color classes based on win rate
        calculatedWinRateElement.className = 'stat-value';
        if (winRate >= 60) {
            calculatedWinRateElement.classList.add('high-rate');
        } else if (winRate >= 40) {
            calculatedWinRateElement.classList.add('medium-rate');
        } else {
            calculatedWinRateElement.classList.add('low-rate');
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