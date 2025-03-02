// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
const leaderboardList = document.getElementById('leaderboardList');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorContainer = document.getElementById('errorContainer');

function createLeaderboardEntry(userData, rank, currentUserId) {
    const entry = document.createElement('div');
    entry.className = 'leaderboard-entry';
    if (userData.uid === currentUserId) {
        entry.classList.add('current-user');
    }

    // Add rank with special styling for top 3
    const rankSpan = document.createElement('span');
    rankSpan.className = `rank rank-${rank}`;
    rankSpan.textContent = `#${rank}`;
    
    // Add username
    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'username';
    usernameSpan.textContent = userData.username;
    
    // Add stats
    const statsSpan = document.createElement('span');
    statsSpan.className = 'stats';
    statsSpan.innerHTML = `
        <span class="wins">Wins: ${userData.stats.totalWins}</span>
        <span class="games">Games: ${userData.stats.gamesPlayed}</span>
        <span class="win-rate">Win Rate: ${userData.stats.winRate}%</span>
    `;
    
    entry.appendChild(rankSpan);
    entry.appendChild(usernameSpan);
    entry.appendChild(statsSpan);
    
    return entry;
}

async function loadLeaderboard() {
    try {
        loadingSpinner.style.display = 'block';
        errorContainer.style.display = 'none';
        leaderboardList.innerHTML = '';
        
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) {
            throw new Error('No users found');
        }
        
        // Convert snapshot to array and sort by total wins
        const users = [];
        snapshot.forEach((childSnapshot) => {
            users.push({
                uid: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        // Sort by total wins (descending)
        users.sort((a, b) => (b.stats?.totalWins || 0) - (a.stats?.totalWins || 0));
        
        // Get current user ID
        const currentUser = auth.currentUser;
        
        // Display top players
        users.forEach((user, index) => {
            const rank = index + 1;
            const entry = createLeaderboardEntry(user, rank, currentUser?.uid);
            leaderboardList.appendChild(entry);
        });
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        errorContainer.textContent = 'Error loading leaderboard. Please try again later.';
        errorContainer.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Load leaderboard when auth state changes
onAuthStateChanged(auth, (user) => {
    loadLeaderboard();
});

// Initial load
loadLeaderboard(); 