// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, get, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
let currentUser = null;

// Check authentication state
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    loadLeaderboard();
  }
});

// Function to load leaderboard
async function loadLeaderboard() {
  try {
    const leaderboardContainer = document.getElementById('leaderboardContainer');
    leaderboardContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading leaderboard...</div>';

    // Get all users from Authentication
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      leaderboardContainer.innerHTML = '<div class="no-data"><p>No players found</p></div>';
      return;
    }

    // Convert to array and filter out invalid data
    const users = [];
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      // Only include users with valid stats
      if (userData && userData.totalGamesPlayed !== undefined && userData.totalWins !== undefined) {
        users.push({
          uid: childSnapshot.key,
          ...userData
        });
      }
    });

    // Sort by wins (descending) and take top 10
    users.sort((a, b) => b.totalWins - a.totalWins);
    const topUsers = users.slice(0, 10);

    // Create leaderboard HTML
    let leaderboardHTML = `
      <div class="leaderboard-header">
        <div class="rank">Rank</div>
        <div class="player-name">Player</div>
        <div class="player-stats">
          <div class="wins">Wins</div>
          <div class="games">Games</div>
          <div class="win-rate">Win Rate</div>
        </div>
      </div>
    `;

    topUsers.forEach((user, index) => {
      const winRate = user.totalGamesPlayed > 0 
        ? ((user.totalWins / user.totalGamesPlayed) * 100).toFixed(1) 
        : '0.0';
      
      const isCurrentUser = currentUser && user.uid === currentUser.uid;
      const username = user.email ? user.email.split('@')[0] : 'Anonymous';
      
      leaderboardHTML += `
        <div class="leaderboard-entry ${isCurrentUser ? 'current-user' : ''}">
          <div class="rank">${index + 1}</div>
          <div class="player-info">
            <div class="player-name">${username}</div>
          </div>
          <div class="player-stats">
            <div class="wins">${user.totalWins}</div>
            <div class="games">${user.totalGamesPlayed}</div>
            <div class="win-rate">${winRate}%</div>
          </div>
        </div>
      `;
    });

    leaderboardContainer.innerHTML = leaderboardHTML;

  } catch (error) {
    console.error('Error loading leaderboard:', error);
    document.getElementById('leaderboardContainer').innerHTML = 
      '<div class="error"><p>Error loading leaderboard. Please try again later.</p></div>';
  }
}

// Function to clean up deleted user data
async function cleanupDeletedUsers() {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) return;

    const cleanupPromises = [];
    snapshot.forEach((childSnapshot) => {
      const uid = childSnapshot.key;
      const userData = childSnapshot.val();
      
      // Check if user data is invalid or missing required fields
      if (!userData || 
          userData.totalGamesPlayed === undefined || 
          userData.totalWins === undefined ||
          !userData.email) {
        cleanupPromises.push(remove(ref(database, `users/${uid}`)));
      }
    });

    if (cleanupPromises.length > 0) {
      await Promise.all(cleanupPromises);
      console.log('Cleanup completed');
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run cleanup when the page loads
document.addEventListener('DOMContentLoaded', () => {
  cleanupDeletedUsers();
  loadLeaderboard();
}); 