// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
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
        console.log("Starting to load leaderboard data...");
        
        // Get reference to users
        const usersRef = ref(database, 'users');
        console.log("Fetching users from:", usersRef.toString());
        
        // Get all users first to check if we have data
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) {
            console.log("No users found in database");
            leaderboardList.innerHTML = `
                <div class="no-data">
                    <p>No players found. Be the first to play!</p>
                    <a href="game.html" class="play-now-btn">Play Now</a>
                </div>`;
            return;
        }

        // Convert snapshot to array and filter users with stats
        const users = [];
        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            console.log("Processing user data:", userData);
            
            // Only include users that have stats
            if (userData.stats && userData.stats.totalWins !== undefined) {
                users.push({
                    id: childSnapshot.key,
                    ...userData
                });
            }
        });

        if (users.length === 0) {
            console.log("No users with stats found");
            leaderboardList.innerHTML = `
                <div class="no-data">
                    <p>No game statistics available yet. Start playing to appear on the leaderboard!</p>
                    <a href="game.html" class="play-now-btn">Play Now</a>
                </div>`;
            return;
        }

        // Sort users by total wins (descending)
        users.sort((a, b) => {
            const winsA = (a.stats && a.stats.totalWins) || 0;
            const winsB = (b.stats && b.stats.totalWins) || 0;
            return winsB - winsA;
        });

        // Take only top 10 users
        const topUsers = users.slice(0, 10);
        console.log("Top 10 users:", topUsers);

        // Clear loading spinner
        leaderboardList.innerHTML = '';

        // Create and append entries
        topUsers.forEach((user, index) => {
            const entry = createLeaderboardEntry(index + 1, user, user.id);
            leaderboardList.appendChild(entry);
        });

    } catch (error) {
        console.error("Error loading leaderboard:", error);
        console.error("Error details:", {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        
        leaderboardList.innerHTML = `
            <div class="error">
                <p>Failed to load leaderboard. Error: ${error.message}</p>
                <button onclick="location.reload()" class="retry-btn">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>`;
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