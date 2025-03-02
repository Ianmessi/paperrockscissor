// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// DOM Elements
const totalWinsElement = document.getElementById('totalWins');
const totalGamesElement = document.getElementById('totalGames');
const winRateElement = document.getElementById('winRate');
const userWelcome = document.getElementById('userWelcome');

console.log("index.js loaded - DOM Elements:", {
    totalWinsElement,
    totalGamesElement,
    winRateElement,
    userWelcome
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
    
    console.log("Raw stats from Firebase:", stats);
    
    // Get values from stats, ensuring we handle both direct values and nested objects
    const gamesPlayed = typeof stats.gamesPlayed === 'number' ? stats.gamesPlayed : 0;
    const totalWins = typeof stats.totalWins === 'number' ? stats.totalWins : 0;
    
    // Calculate win rate
    const winRate = gamesPlayed > 0 
        ? Math.round((totalWins / gamesPlayed) * 100) 
        : 0;
    
    console.log("Processing stats:", {
        gamesPlayed,
        totalWins,
        calculatedWinRate: winRate + '%'
    });
    
    // Update UI with strict type checking
    if (totalWinsElement) totalWinsElement.textContent = String(totalWins);
    if (totalGamesElement) totalGamesElement.textContent = String(gamesPlayed);
    if (winRateElement) winRateElement.textContent = winRate + '%';
    
    // Add color classes based on win rate
    if (winRateElement) {
        winRateElement.className = 'stat-value';
        if (winRate >= 60) {
            winRateElement.classList.add('high-rate');
        } else if (winRate >= 40) {
            winRateElement.classList.add('medium-rate');
        } else {
            winRateElement.classList.add('low-rate');
        }
    }
    
    console.log("UI updated with stats");
}

// Update stats when user is authenticated
onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? `User logged in: ${user.email}` : "User logged out");
    
    if (user) {
        console.log('User is signed in:', user.uid);
        userWelcome.textContent = `Welcome, ${user.displayName || user.email}!`;
        
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