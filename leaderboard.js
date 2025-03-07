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

function loadLeaderboard() {
    // Clear previous content and show loading
    leaderboardList.innerHTML = '';
    loadingSpinner.style.display = 'block';
    errorContainer.style.display = 'none';

    // Create table structure
    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    
    // Add table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Rank</th>
        <th>Username</th>
        <th>Wins</th>
        <th>Games</th>
        <th>Win Rate</th>
    `;
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Add table body
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    leaderboardList.appendChild(table);

    // Get users data using the modular SDK
    const usersRef = ref(database, 'users');
    get(usersRef)
        .then((snapshot) => {
            loadingSpinner.style.display = 'none';
            
            if (!snapshot.exists()) {
                errorContainer.textContent = 'No leaderboard data available';
                errorContainer.style.display = 'block';
                return;
            }

            // Convert to array and sort by wins
            const users = [];
            const currentUser = auth.currentUser;
            const currentUserEmail = currentUser ? currentUser.email : '';
            
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                console.log('User data:', userData); // Debug log
                if (userData.stats) {
                    // Use the current user's email if this is their entry
                    const email = childSnapshot.key === currentUser?.uid ? currentUserEmail : userData.email || '';
                    console.log('Email found:', email); // Debug log
                    const username = email.split('@')[0];
                    console.log('Username extracted:', username); // Debug log
                    
                    users.push({
                        username: username || 'Unknown',
                        games: userData.stats.gamesPlayed || 0,
                        wins: userData.stats.totalWins || 0,
                        winRate: userData.stats.gamesPlayed ? 
                            ((userData.stats.totalWins / userData.stats.gamesPlayed) * 100).toFixed(1) : 
                            '0.0'
                    });
                }
            });

            // Sort by wins (descending)
            users.sort((a, b) => b.wins - a.wins);

            // Clear existing rows
            tbody.innerHTML = '';

            // Add users to table
            users.forEach((user, index) => {
                const row = document.createElement('tr');
                const rank = index + 1;
                const rankDisplay = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
                
                row.innerHTML = `
                    <td>${rankDisplay}</td>
                    <td>${user.username}</td>
                    <td style="color: #4CAF50;">${user.wins}</td>
                    <td style="color: #2196F3;">${user.games}</td>
                    <td style="color: #FFD700;">${user.winRate}%</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch((error) => {
            loadingSpinner.style.display = 'none';
            errorContainer.textContent = 'Error loading leaderboard: ' + error.message;
            errorContainer.style.display = 'block';
        });
}

// Load leaderboard when auth state changes
onAuthStateChanged(auth, (user) => {
    loadLeaderboard();
});

// Initial load
loadLeaderboard(); 