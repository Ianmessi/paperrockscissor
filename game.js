// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
let app, auth, database;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getDatabase(app);
    console.log("Firebase initialized successfully");
    
    // Test database connection
    const testRef = ref(database, 'test');
    set(testRef, {
        timestamp: Date.now(),
        message: 'Database connection test'
    })
    .then(() => {
        console.log("Database connection successful");
    })
    .catch((error) => {
        console.error("Database connection error:", error);
        alert("Error connecting to the database. Please check your Firebase configuration.");
    });
} catch (error) {
    console.error("Firebase initialization error:", error);
    alert("Error initializing Firebase. Please check your configuration.");
}

let wins = 0, losses = 0, draws = 0;
let totalRounds = 0;
let roundsPlayed = 0;
let gameMode = '';
let currentRoom = '';
let isPlayer1 = false;
let currentUser = null;
let opponentName = '';

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("User authenticated:", user.displayName || user.email);
        
        // Initialize user stats if they don't exist
        const userStatsRef = ref(database, 'users/' + user.uid + '/stats');
        get(userStatsRef).then((snapshot) => {
            if (!snapshot.exists()) {
                set(userStatsRef, {
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0
                });
            }
        });
    } else {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
    }
});

function selectGameMode(mode) {
    gameMode = mode;
    document.getElementById('gameModeSelection').style.display = 'none';
    
    if (mode === 'singleplayer') {
        document.getElementById('roundsSelection').style.display = 'block';
    } else {
        document.getElementById('multiplayerRoom').style.display = 'block';
    }
}

function createRoom() {
    if (!currentUser) {
        showError('You must be logged in to create a room');
        return;
    }
    
    if (!currentUser.displayName) {
        showError('Your profile is missing a display name. Please contact support.');
        console.error('User missing displayName:', currentUser.uid);
        return;
    }
    
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    currentRoom = roomCode;
    isPlayer1 = true;

    console.log("Creating room with code:", roomCode);
    console.log("Current user:", currentUser.displayName);

    // Create room in Firebase
    const roomRef = ref(database, 'rooms/' + roomCode);
    set(roomRef, {
        player1: {
            id: currentUser.uid,
            username: currentUser.displayName || 'Player 1',
            ready: false
        },
        gameState: 'waiting',
        rounds: 5,
        currentRound: 0,
        createdAt: serverTimestamp()
    })
    .then(() => {
        console.log("Room created successfully:", roomCode);
        
        // Listen for opponent joining
        const player2Ref = ref(database, 'rooms/' + roomCode + '/player2');
        onValue(player2Ref, (snapshot) => {
            if (snapshot.exists()) {
                opponentName = snapshot.val().username;
                document.getElementById('playerCount').textContent = '2/2';
                document.getElementById('waitingMessage').textContent = 'Game starting...';
                setTimeout(() => startGame(5), 1500);
            }
        });

        document.getElementById('roomCreation').style.display = 'none';
        document.getElementById('waitingRoom').style.display = 'block';
        document.getElementById('displayRoomCode').textContent = roomCode;
    })
    .catch((error) => {
        console.error("Error creating room:", error);
        showError('Failed to create room: ' + error.message);
    });
}

function joinRoom() {
    if (!currentUser) {
        showError('You must be logged in to join a room');
        return;
    }
    
    if (!currentUser.displayName) {
        showError('Your profile is missing a display name. Please contact support.');
        console.error('User missing displayName:', currentUser.uid);
        return;
    }
    
    const roomCode = document.getElementById('roomCode').value.toUpperCase();
    if (!roomCode) {
        showError('Please enter a room code');
        return;
    }
    
    console.log("Attempting to join room:", roomCode);
    
    currentRoom = roomCode;
    isPlayer1 = false;

    // Check if room exists
    const roomRef = ref(database, 'rooms/' + roomCode);
    get(roomRef)
        .then((snapshot) => {
            if (snapshot.exists() && snapshot.val().player1 && !snapshot.val().player2) {
                // Store opponent's name
                opponentName = snapshot.val().player1.username;
                console.log("Found room, opponent:", opponentName);
                
                // Join room
                const player2Ref = ref(database, 'rooms/' + roomCode + '/player2');
                return set(player2Ref, {
                    id: currentUser.uid,
                    username: currentUser.displayName || 'Player 2',
                    ready: false
                });
            } else {
                if (!snapshot.exists()) {
                    throw new Error('Room not found');
                } else if (!snapshot.val().player1) {
                    throw new Error('Room is invalid');
                } else {
                    throw new Error('Room is full');
                }
            }
        })
        .then(() => {
            console.log("Successfully joined room:", roomCode);
            document.getElementById('roomCreation').style.display = 'none';
            document.getElementById('waitingRoom').style.display = 'block';
            document.getElementById('displayRoomCode').textContent = roomCode;
            document.getElementById('playerCount').textContent = '2/2';
            document.getElementById('waitingMessage').textContent = 'Game starting...';
            
            setTimeout(() => startGame(5), 1500);
        })
        .catch((error) => {
            console.error("Error joining room:", error);
            showError(error.message || 'Failed to join room');
        });
}

// Start the game with the specified number of rounds
function startGame(rounds) {
    totalRounds = rounds;
    roundsPlayed = 0;
    wins = 0;
    losses = 0;
    draws = 0;
    
    document.getElementById('roundsSelection').style.display = 'none';
    document.getElementById('multiplayerRoom').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    document.getElementById('roundsLeft').textContent = totalRounds;
    
    // Update UI
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;
    document.getElementById('draws').textContent = draws;
    document.getElementById('results').innerHTML = '';
}

// Play a round of the game
function playGame(playerChoice) {
    if (roundsPlayed >= totalRounds) {
        return;
    }
    
    const choices = ['Rock', 'Paper', 'Scissors'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    
    let result = '';
    
    // Determine the winner
    if (playerChoice === computerChoice) {
        result = 'Draw!';
        draws++;
    } else if (
        (playerChoice === 'Rock' && computerChoice === 'Scissors') ||
        (playerChoice === 'Paper' && computerChoice === 'Rock') ||
        (playerChoice === 'Scissors' && computerChoice === 'Paper')
    ) {
        result = 'You win!';
        wins++;
    } else {
        result = 'You lose!';
        losses++;
    }
    
    roundsPlayed++;
    
    // Update UI
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;
    document.getElementById('draws').textContent = draws;
    document.getElementById('roundsLeft').textContent = totalRounds - roundsPlayed;
    
    // Display result
    const resultDiv = document.getElementById('results');
    resultDiv.innerHTML = `
        <div class="round-result">
            <p>Round ${roundsPlayed}</p>
            <div class="choices-display">
                <div class="choice">
                    <p>You chose:</p>
                    <i class="fas fa-hand-${playerChoice.toLowerCase()}"></i>
                    <p>${playerChoice}</p>
                </div>
                <div class="choice">
                    <p>Computer chose:</p>
                    <i class="fas fa-hand-${computerChoice.toLowerCase()}"></i>
                    <p>${computerChoice}</p>
                </div>
            </div>
            <p class="result-text">${result}</p>
        </div>
    ` + resultDiv.innerHTML;
    
    // Check if game is over
    if (roundsPlayed >= totalRounds) {
        endGame();
    }
}

// End the game and show final results
function endGame() {
    document.getElementById('gameArea').style.display = 'none';
    document.getElementById('finalResult').style.display = 'block';
    
    const finalScore = document.getElementById('finalScore');
    finalScore.innerHTML = `
        <div class="final-score-item">
            <i class="fas fa-trophy"></i> Wins: ${wins}
        </div>
        <div class="final-score-item">
            <i class="fas fa-times"></i> Losses: ${losses}
        </div>
        <div class="final-score-item">
            <i class="fas fa-equals"></i> Draws: ${draws}
        </div>
    `;
    
    const winnerAnnouncement = document.getElementById('winnerAnnouncement');
    let gameResult = '';
    
    if (wins > losses) {
        winnerAnnouncement.innerHTML = '<i class="fas fa-crown"></i> You Win!';
        winnerAnnouncement.className = 'winner-announcement win';
        gameResult = 'win';
    } else if (losses > wins) {
        winnerAnnouncement.innerHTML = '<i class="fas fa-thumbs-down"></i> You Lose!';
        winnerAnnouncement.className = 'winner-announcement lose';
        gameResult = 'loss';
    } else {
        winnerAnnouncement.innerHTML = '<i class="fas fa-handshake"></i> It\'s a Draw!';
        winnerAnnouncement.className = 'winner-announcement draw';
        gameResult = 'draw';
    }
    
    console.log("Game ended with result:", gameResult);
    console.log("Final scores - Wins:", wins, "Losses:", losses, "Draws:", draws);
    
    // Disable navigation buttons until stats are updated
    const playAgainButton = document.querySelector('.play-again-button');
    const homeButton = document.querySelector('.home-button');
    
    if (playAgainButton) playAgainButton.disabled = true;
    if (homeButton) homeButton.disabled = true;
    
    // Update user stats in database if authenticated
    if (currentUser) {
        console.log("Updating stats for user:", currentUser.uid);
        const userStatsRef = ref(database, 'users/' + currentUser.uid + '/stats');
        
        get(userStatsRef).then((snapshot) => {
            console.log("Current stats snapshot exists:", snapshot.exists());
            
            if (snapshot.exists()) {
                const stats = snapshot.val();
                console.log("Current stats in database:", stats);
                
                // Update stats based on game outcome, not individual rounds
                const updatedStats = {
                    gamesPlayed: (stats.gamesPlayed || 0) + 1,
                    wins: (stats.wins || 0) + (gameResult === 'win' ? 1 : 0),
                    losses: (stats.losses || 0) + (gameResult === 'loss' ? 1 : 0),
                    draws: (stats.draws || 0) + (gameResult === 'draw' ? 1 : 0)
                };
                
                // Also track round stats for detailed analytics
                updatedStats.roundsPlayed = (stats.roundsPlayed || 0) + roundsPlayed;
                updatedStats.roundsWon = (stats.roundsWon || 0) + wins;
                updatedStats.roundsLost = (stats.roundsLost || 0) + losses;
                updatedStats.roundsDrawn = (stats.roundsDrawn || 0) + draws;
                
                console.log("Updating user stats to:", updatedStats);
                
                set(userStatsRef, updatedStats)
                    .then(() => {
                        console.log("Stats successfully updated in database");
                        // Re-enable buttons after a short delay to ensure data is properly saved
                        setTimeout(() => {
                            if (playAgainButton) playAgainButton.disabled = false;
                            if (homeButton) homeButton.disabled = false;
                        }, 500);
                    })
                    .catch(error => {
                        console.error("Error setting stats in database:", error);
                        // Re-enable buttons even if there's an error
                        if (playAgainButton) playAgainButton.disabled = false;
                        if (homeButton) homeButton.disabled = false;
                    });
            } else {
                // Create new stats object if none exists
                const newStats = {
                    gamesPlayed: 1,
                    wins: gameResult === 'win' ? 1 : 0,
                    losses: gameResult === 'loss' ? 1 : 0,
                    draws: gameResult === 'draw' ? 1 : 0,
                    roundsPlayed: roundsPlayed,
                    roundsWon: wins,
                    roundsLost: losses,
                    roundsDrawn: draws
                };
                
                console.log("Creating new user stats:", newStats);
                
                set(userStatsRef, newStats)
                    .then(() => {
                        console.log("New stats successfully created in database");
                        // Re-enable buttons after a short delay to ensure data is properly saved
                        setTimeout(() => {
                            if (playAgainButton) playAgainButton.disabled = false;
                            if (homeButton) homeButton.disabled = false;
                        }, 500);
                    })
                    .catch(error => {
                        console.error("Error creating stats in database:", error);
                        // Re-enable buttons even if there's an error
                        if (playAgainButton) playAgainButton.disabled = false;
                        if (homeButton) homeButton.disabled = false;
                    });
            }
        }).catch(error => {
            console.error("Error getting current stats:", error);
            // Re-enable buttons if there's an error
            if (playAgainButton) playAgainButton.disabled = false;
            if (homeButton) homeButton.disabled = false;
        });
    } else {
        console.log("User not authenticated, stats not updated");
        // Re-enable buttons immediately if user is not authenticated
        if (playAgainButton) playAgainButton.disabled = false;
        if (homeButton) homeButton.disabled = false;
    }
}

// Reset the game
function resetGame() {
    document.getElementById('finalResult').style.display = 'none';
    document.getElementById('gameModeSelection').style.display = 'block';
}

// Go back to home page
function goToHomePage() {
    console.log("Navigating back to home page");
    window.location.href = 'index.html';
}

// Helper function to show error messages
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

// Export game functions for use in HTML
const gameModule = {
    selectGameMode,
    createRoom,
    joinRoom,
    startGame,
    playGame,
    resetGame,
    goToHomePage
};

// Make game functions available globally
window.gameModule = gameModule;

// Export for use in other modules
export default gameModule;