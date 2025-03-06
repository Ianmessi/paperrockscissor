// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
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

// Auth state observer
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const authButton = document.getElementById('authButton');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    if (user) {
        // Get user data from database
        const userRef = ref(database, `users/${user.uid}`);
        get(userRef).then((snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                userName.textContent = userData.username || 'Anonymous User';
                userEmail.textContent = user.email;
            }
        });

        authButton.style.display = 'none';
        userProfile.style.display = 'flex';
        document.getElementById('gameContainer').style.display = 'block';
        document.getElementById('loginPrompt').style.display = 'none';
        loadUserStats();
    } else {
        authButton.style.display = 'block';
        userProfile.style.display = 'none';
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('loginPrompt').style.display = 'block';
    }
});

// Profile click handler
document.getElementById('userProfile').addEventListener('click', function() {
    const userEmail = document.getElementById('userEmail');
    userEmail.style.display = userEmail.style.display === 'none' ? 'block' : 'none';
});