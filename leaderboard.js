// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
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

    // Safely access nested properties
    const stats = playerData.stats || {};
    const totalWins = typeof stats.totalWins === 'number' ? stats.totalWins : 0;
    const gamesPlayed = typeof stats.gamesPlayed === 'number' ? stats.gamesPlayed : 0;
    const winRate = gamesPlayed > 0 ? Math.round((totalWins / gamesPlayed) * 100) : 0;

    entry.innerHTML = `
        <div class="rank ${rank <= 3 ? 'top-' + rank : ''}">${rankDisplay}</div>
        <div class="player-info">
            <span class="player-name">${playerData.email || 'Anonymous'}</span>
        </div>
        <div class="player-stats">
            <div class="wins">${totalWins}</div>
            <div class="games">${gamesPlayed}</div>
            <div class="win-rate">${winRate}%</div>
        </div>
    `;

    return entry;
}

// Function to load and display leaderboard
async function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) {
        console.error("Leaderboard list element not found");
        return;
    }

    leaderboardList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading leaderboard...</div>';

    try {
        console.log("Starting to load leaderboard data...");
        
        // Check if user is authenticated
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.log("No authenticated user");
            leaderboardList.innerHTML = `
                <div class="no-data">
                    <p>Please log in to view the leaderboard.</p>
                    <a href="login.html" class="play-now-btn">Login</a>
                </div>`;
            return;
        }

        // Get reference to users
        const usersRef = ref(database, 'users');
        console.log("Fetching users from database...");
        
        // Get all users
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
            const userStats = userData.stats || {};
            
            // Only include users that have played games
            if (userStats && typeof userStats.totalWins === 'number') {
                users.push({
                    id: childSnapshot.key,
                    email: userData.email,
                    stats: userStats
                });
            }
        });

        console.log("Processed users:", users);

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
            const winsA = a.stats.totalWins || 0;
            const winsB = b.stats.totalWins || 0;
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
        
        if (error.message.includes("Permission denied")) {
            leaderboardList.innerHTML = `
                <div class="error">
                    <p>Access denied. Please make sure you are logged in and have permission to view the leaderboard.</p>
                    <a href="login.html" class="retry-btn">Login</a>
                </div>`;
        } else {
            leaderboardList.innerHTML = `
                <div class="error">
                    <p>Failed to load leaderboard. Please try again.</p>
                    <button onclick="location.reload()" class="retry-btn">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>`;
        }
    }
}

// Load leaderboard when auth state changes
onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed, loading leaderboard...");
    loadLeaderboard();
}); 