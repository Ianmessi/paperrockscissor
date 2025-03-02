// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get, query, orderByChild } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
let app, auth, database;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getDatabase(app);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
    showError('Error initializing Firebase. Please try refreshing the page.');
}

// Function to show error messages
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// Function to create a leaderboard entry element
function createLeaderboardEntry(rank, playerData, userId) {
    const entry = document.createElement('div');
    entry.className = 'leaderboard-entry';
    if (auth.currentUser && auth.currentUser.uid === userId) {
        entry.classList.add('current-user');
    }

    // Add rank medal for top 3
    let rankDisplay = rank;
    if (rank <= 3) {
        const medals = ['🥇', '🥈', '🥉'];
        rankDisplay = medals[rank - 1];
    }

    entry.innerHTML = `
        <div class="rank ${rank <= 3 ? 'top-' + rank : ''}">${rankDisplay}</div>
        <div class="player-info">
            <span class="player-name">${playerData.username || 'Anonymous'}</span>
        </div>
        <div class="player-stats">
            <div class="wins">${playerData.stats.totalWins || 0}</div>
            <div class="games">${playerData.stats.gamesPlayed || 0}</div>
            <div class="win-rate">${playerData.stats.winRate || 0}%</div>
        </div>
    `;

    return entry;
}

// Function to load and display leaderboard
async function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading leaderboard...</div>';

    try {
        // Get all users
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);

        if (!snapshot.exists()) {
            leaderboardList.innerHTML = '<div class="no-data">No players found</div>';
            return;
        }

        // Convert snapshot to array and sort by wins
        const users = [];
        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            users.push({
                id: childSnapshot.key,
                ...userData
            });
        });

        // Sort users by total wins (descending)
        users.sort((a, b) => {
            const winsA = (a.stats && a.stats.totalWins) || 0;
            const winsB = (b.stats && b.stats.totalWins) || 0;
            return winsB - winsA;
        });

        // Clear loading spinner
        leaderboardList.innerHTML = '';

        // Create and append entries
        users.forEach((user, index) => {
            const entry = createLeaderboardEntry(index + 1, user, user.id);
            leaderboardList.appendChild(entry);
        });

    } catch (error) {
        console.error("Error loading leaderboard:", error);
        showError('Failed to load leaderboard. Please try again.');
        leaderboardList.innerHTML = '<div class="error">Failed to load leaderboard</div>';
    }
}

// Load leaderboard when auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadLeaderboard();
    } else {
        // Still load leaderboard for non-authenticated users
        loadLeaderboard();
    }
}); 