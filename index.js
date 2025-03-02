// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, get, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// DOM Elements
const totalWinsElement = document.getElementById('totalWins');
const totalGamesElement = document.getElementById('totalGames');
const winRateElement = document.getElementById('winRate');
const welcomeMessage = document.getElementById('welcomeMessage');

console.log("index.js loaded - DOM Elements:", {
    totalWinsElement,
    totalGamesElement,
    winRateElement,
    welcomeMessage
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
    
    // Add color classes based on win rate
    winRateElement.className = 'stat-value';
    if (winRate >= 60) {
        winRateElement.classList.add('high-rate');
    } else if (winRate >= 40) {
        winRateElement.classList.add('medium-rate');
    } else {
        winRateElement.classList.add('low-rate');
    }
    
    console.log("UI updated with stats");
}

// Update stats when user is authenticated
onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? `User logged in: ${user.email}` : "User logged out");
    
    if (user) {
        console.log('User is signed in:', user.uid);
        welcomeMessage.textContent = `Welcome, ${user.displayName || user.email}!`;
        loadUserStats(user.uid);
    } else {
        console.log('No user signed in');
        window.location.href = 'login.html';
    }
});

function loadUserStats(userId) {
    console.log('Loading stats for user:', userId);
    const userStatsRef = ref(database, 'users/' + userId + '/stats');
    
    onValue(userStatsRef, (snapshot) => {
        if (snapshot.exists()) {
            const stats = snapshot.val();
            console.log('User stats:', stats);
            
            // Update UI with stats
            totalGamesElement.textContent = stats.gamesPlayed || 0;
            totalWinsElement.textContent = stats.gamesWon || 0;
            
            // Calculate win rate based on games won vs games played
            const winRate = stats.gamesPlayed > 0 
                ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
                : 0;
            
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
        } else {
            console.log('No stats found for user');
            totalGamesElement.textContent = '0';
            totalWinsElement.textContent = '0';
            winRateElement.textContent = '0%';
        }
    });
}