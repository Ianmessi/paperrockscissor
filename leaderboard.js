// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import firebaseConfig from './firebase-config.js';
import { getAllUserProfiles, getUserProfile, ACHIEVEMENTS, TITLES } from './user-profile.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
const leaderboardList = document.getElementById('leaderboardList');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorContainer = document.getElementById('errorContainer');

async function loadLeaderboard() {
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

    try {
        // Get all user profiles first
        const userProfiles = await getAllUserProfiles();
        
        // Get users data from game database
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) {
            loadingSpinner.style.display = 'none';
            errorContainer.textContent = 'No leaderboard data available';
            errorContainer.style.display = 'block';
            return;
        }

        // Convert to array and sort by wins
        const users = [];
        const currentUser = auth.currentUser;
        
        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            const userId = childSnapshot.key;
            const userProfile = userProfiles[userId] || {};
            
            if (userData.stats) {
                const winRate = userData.stats.gamesPlayed ? 
                    ((userData.stats.totalWins / userData.stats.gamesPlayed) * 100).toFixed(1) : 
                    '0.0';
                    
                users.push({
                    username: userProfile.username || userId.split('@')[0],
                    games: userData.stats.gamesPlayed || 0,
                    wins: userData.stats.totalWins || 0,
                    winRate: winRate,
                    isCurrentUser: userId === currentUser?.uid,
                    title: userProfile.title || 'Rookie',
                    achievements: userProfile.achievements || [],
                    status: userProfile.status || 'offline'
                });
            }
        });

        // Sort by wins (descending) and then by win rate (descending) if wins are equal
        users.sort((a, b) => {
            if (b.wins !== a.wins) {
                return b.wins - a.wins;
            }
            return parseFloat(b.winRate) - parseFloat(a.winRate);
        });

        // Clear existing rows
        tbody.innerHTML = '';

        // Add users to table
        users.forEach((user, index) => {
            const row = document.createElement('tr');
            const rank = index + 1;
            const rankDisplay = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
            
            if (user.isCurrentUser) {
                row.classList.add('current-user');
            }

            // Create achievement tooltips
            const achievementsHtml = user.achievements.length > 0 
                ? `<div class="achievements-tooltip">
                    ${user.achievements.map(a => `<span class="achievement">🏆 ${a}</span>`).join('')}
                   </div>`
                : '';
            
            // Status indicator
            const statusIcon = user.status === 'online' ? '🟢' : '⚪';
            
            row.innerHTML = `
                <td>${rankDisplay}</td>
                <td>
                    ${statusIcon} 
                    <span class="username">${user.username}</span>
                    <span class="title">${user.title}</span>
                    ${achievementsHtml}
                </td>
                <td style="color: #4CAF50;">${user.wins}</td>
                <td style="color: #2196F3;">${user.games}</td>
                <td style="color: #FFD700;">${user.winRate}%</td>
            `;
            tbody.appendChild(row);
        });

        loadingSpinner.style.display = 'none';
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        loadingSpinner.style.display = 'none';
        errorContainer.textContent = 'Error loading leaderboard: ' + error.message;
        errorContainer.style.display = 'block';
    }
}

// Load leaderboard when auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Save user profile when they log in
        const { saveUserProfile } = await import('./user-profile.js');
        await saveUserProfile(user.uid, user.email);
    }
    loadLeaderboard();
});

// Initial load
loadLeaderboard(); 