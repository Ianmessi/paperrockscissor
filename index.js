// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAjm0fBJkYtQZz_vUh6XVE5VKHBqLZuWwE",
    authDomain: "rock-paper-scissors-d0f48.firebaseapp.com",
    projectId: "rock-paper-scissors-d0f48",
    storageBucket: "rock-paper-scissors-d0f48.appspot.com",
    messagingSenderId: "1096965280560",
    appId: "1:1096965280560:web:c0c2c0e1d5e10c9c7c2c0c",
    databaseURL: "https://rock-paper-scissors-d0f48-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const welcomeMessage = document.getElementById('welcomeMessage');
const totalWinsElement = document.getElementById('totalWins');
const totalGamesElement = document.getElementById('totalGames');
const winRateElement = document.getElementById('winRate');

console.log("index.js loaded - DOM Elements:", {
    totalWinsElement,
    totalGamesElement,
    winRateElement,
    welcomeMessage
});

// Function to update stats UI
function updateStatsUI(stats) {
    if (!stats) {
        totalWinsElement.textContent = '0';
        totalGamesElement.textContent = '0';
        winRateElement.textContent = '0%';
        return;
    }

    const { totalWins = 0, gamesPlayed = 0 } = stats;
    const winRate = gamesPlayed > 0 ? ((totalWins / gamesPlayed) * 100).toFixed(1) : 0;

    totalWinsElement.textContent = totalWins;
    totalGamesElement.textContent = gamesPlayed;
    winRateElement.textContent = `${winRate}%`;

    // Add color classes based on win rate
    if (winRate >= 60) {
        winRateElement.style.color = '#4CAF50'; // Green for high win rate
    } else if (winRate >= 40) {
        winRateElement.style.color = '#FFC107'; // Yellow for medium win rate
    } else {
        winRateElement.style.color = '#F44336'; // Red for low win rate
    }
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        welcomeMessage.textContent = `Welcome, ${user.email}!`;
        
        // Set up real-time listener for user stats
        const userStatsRef = ref(db, `users/${user.uid}/stats`);
        onValue(userStatsRef, (snapshot) => {
            const stats = snapshot.val();
            updateStatsUI(stats);
        }, (error) => {
            console.error('Error fetching stats:', error);
            updateStatsUI(null);
        });
    } else {
        // Redirect to login page if not authenticated
        window.location.href = 'login.html';
    }
});