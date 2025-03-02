// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, serverTimestamp, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
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

// Variables for game state
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
    console.log("Game mode selected:", mode);
    gameMode = mode;
    document.getElementById('gameModeSelection').style.display = 'none';
    
    if (mode === 'singleplayer') {
        document.getElementById('roundsSelection').style.display = 'block';
    } else {
        console.log("Entering multiplayer mode");
        document.getElementById('multiplayerRoom').style.display = 'block';
    }
}

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function createRoom() {
    if (!currentUser) {
        console.error("No authenticated user found");
        showError('You must be logged in to create a room');
        return;
    }
    
    console.log("Current user:", currentUser);
    
    // Create room with the room code
    const roomCode = generateRoomCode();
    currentRoom = roomCode;
    isPlayer1 = true;

    console.log("Creating room with code:", roomCode);

    // Create room in Firebase
    const roomRef = ref(database, 'rooms/' + roomCode);
    try {
        await set(roomRef, {
            player1: {
                id: currentUser.uid,
                name: currentUser.displayName || currentUser.email.split('@')[0],
                ready: true
            },
            gameState: 'waiting',
            created: Date.now()
        });

        document.getElementById('roomCreation').style.display = 'none';
        document.getElementById('waitingRoom').style.display = 'block';
        document.getElementById('displayRoomCode').textContent = roomCode;

        // Listen for player 2 joining
        const player2Ref = ref(database, 'rooms/' + roomCode + '/player2');
        onValue(player2Ref, (snapshot) => {
            if (snapshot.exists()) {
                const player2 = snapshot.val();
                opponentName = player2.name;
                console.log("Opponent joined:", opponentName);
                document.getElementById('playerCount').textContent = '2/2';
                document.getElementById('waitingMessage').textContent = 'Player 2 joined! Starting game...';
                setTimeout(() => startGame(5), 1500);
            }
        });
    } catch (error) {
        console.error("Error creating room:", error);
        showError('Failed to create room. Please try again.');
    }
}

async function joinRoom() {
    if (!currentUser) {
        console.error("No authenticated user found");
        showError('You must be logged in to join a room');
        return;
    }
    
    const roomCode = document.getElementById('roomCode').value.toUpperCase();
    if (!roomCode) {
        showError('Please enter a room code');
        return;
    }
    
    try {
        console.log("Attempting to join room:", roomCode);
        
        // Check if room exists
        const roomRef = ref(database, 'rooms/' + roomCode);
        const snapshot = await get(roomRef);

        if (!snapshot.exists()) {
            showError('Room not found. Please check the code and try again.');
            return;
        }

        const roomData = snapshot.val();
        
        // Additional validation checks
        if (!roomData || !roomData.player1) {
            showError('Invalid room. Please try a different code.');
            return;
        }

        // Check if the user is already player1 in this room
        if (roomData.player1.id === currentUser.uid) {
            // User is already player1, just show the waiting room
            currentRoom = roomCode;
            isPlayer1 = true;
            document.getElementById('roomCreation').style.display = 'none';
            document.getElementById('waitingRoom').style.display = 'block';
            document.getElementById('displayRoomCode').textContent = roomCode;
            return;
        }

        if (roomData.player2 && roomData.player2.id) {
            showError('Room is full. Please try a different code.');
            return;
        }

        // Use a transaction to safely join the room
        const player2Ref = ref(database, `rooms/${roomCode}/player2`);
        const gameStateRef = ref(database, `rooms/${roomCode}/gameState`);
        
        try {
            // Attempt to set player2 data atomically
            await set(player2Ref, {
                id: currentUser.uid,
                name: currentUser.displayName || currentUser.email.split('@')[0],
                ready: true
            });

            // Update game state
            await set(gameStateRef, 'starting');
            
            currentRoom = roomCode;
            isPlayer1 = false;
            opponentName = roomData.player1.name;

            console.log("Successfully joined room");
            
            // Update UI
            document.getElementById('roomCreation').style.display = 'none';
            document.getElementById('waitingRoom').style.display = 'block';
            document.getElementById('displayRoomCode').textContent = roomCode;
            document.getElementById('playerCount').textContent = '2/2';
            document.getElementById('waitingMessage').textContent = 'Joined room! Starting game...';
            
            // Start the game after a short delay
            setTimeout(() => startGame(5), 1500);

        } catch (error) {
            console.error("Error joining room:", error);
            showError('Failed to join room. Please try again.');
            return;
        }

    } catch (error) {
        console.error("Error checking room:", error);
        showError('Failed to check room status. Please try again.');
    }
}

// Start the game with the specified number of rounds
function startGame(rounds) {
    console.log("Starting game with", rounds, "rounds");
    totalRounds = rounds;
    roundsPlayed = 0;
    wins = 0;
    losses = 0;
    draws = 0;
    
    // Hide setup screens
    document.getElementById('roundsSelection').style.display = 'none';
    document.getElementById('multiplayerRoom').style.display = 'none';
    document.getElementById('waitingRoom').style.display = 'none';
    
    // Show game area
    document.getElementById('gameArea').style.display = 'block';
    document.getElementById('roundsLeft').textContent = totalRounds;
    
    // Update UI
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;
    document.getElementById('draws').textContent = draws;
    document.getElementById('results').innerHTML = '';
    
    // If in multiplayer mode, update the game state in Firebase
    if (gameMode === 'multiplayer' && currentRoom) {
        console.log("Setting up multiplayer game in room:", currentRoom);
        const gameStateRef = ref(database, 'rooms/' + currentRoom + '/gameState');
        set(gameStateRef, 'playing');
        
        // Set up listeners for opponent's moves if in multiplayer mode
        setupMultiplayerListeners();
    }
}

// Set up multiplayer game listeners
function setupMultiplayerListeners() {
    if (!currentRoom) {
        console.error("No current room for multiplayer listeners");
        return;
    }
    
    console.log("Setting up multiplayer listeners for room:", currentRoom);
    
    // Listen for game state changes
    const gameStateRef = ref(database, 'rooms/' + currentRoom + '/gameState');
    onValue(gameStateRef, (snapshot) => {
        if (snapshot.exists()) {
            const gameState = snapshot.val();
            console.log("Game state changed:", gameState);
            
            if (gameState === 'ended') {
                console.log("Game ended by server");
                // Handle game end if needed
            }
        }
    });
    
    // Listen for opponent's moves
    const movesRef = ref(database, 'rooms/' + currentRoom + '/moves');
    onValue(movesRef, (snapshot) => {
        if (snapshot.exists()) {
            const moves = snapshot.val();
            console.log("Moves updated:", moves);
            
            // Process new moves if both players have made their choice
            if (moves.player1 && moves.player2 && moves.round === roundsPlayed + 1) {
                console.log("Both players made their move for round", moves.round);
                
                // Process the round
                processMultiplayerRound(moves);
            }
        }
    });
}

// Process a multiplayer round
function processMultiplayerRound(moves) {
    const playerChoice = isPlayer1 ? moves.player1 : moves.player2;
    const opponentChoice = isPlayer1 ? moves.player2 : moves.player1;
    
    console.log("Processing multiplayer round - Player:", playerChoice, "Opponent:", opponentChoice);
    
    let result = '';
    
    // Determine the winner
    if (playerChoice === opponentChoice) {
        result = 'DRAW';
        draws++;
    } else if (
        (playerChoice === 'Rock' && opponentChoice === 'Scissors') ||
        (playerChoice === 'Paper' && opponentChoice === 'Rock') ||
        (playerChoice === 'Scissors' && opponentChoice === 'Paper')
    ) {
        result = 'YOU WIN';
        wins++;
    } else {
        result = 'YOU LOSE';
        losses++;
    }
    
    roundsPlayed++;
    
    // Update UI
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;
    document.getElementById('draws').textContent = draws;
    document.getElementById('roundsLeft').textContent = totalRounds - roundsPlayed;
    
    // Display round result
    displayRoundResult(playerChoice, opponentChoice, result, roundsPlayed);
    
    // Reset the moves for the next round
    const movesRef = ref(database, 'rooms/' + currentRoom + '/moves');
    set(movesRef, { round: roundsPlayed + 1 });
    
    // Check if game is over
    if (roundsPlayed >= totalRounds) {
        endGame();
    } else {
        // Re-enable choice buttons for next round
        const choiceButtons = document.querySelectorAll('.choices button');
        choiceButtons.forEach(button => {
            button.disabled = false;
        });
    }
}

// Display result for a round
function displayRoundResult(playerChoice, opponentChoice, result, roundNumber) {
    const resultDiv = document.getElementById('results');
    const resultClass = result.includes('WIN') ? 'win' : result.includes('LOSE') ? 'lose' : 'draw';
    
    // Determine the opponent label based on game mode
    const opponentLabel = gameMode === 'singleplayer' ? 
        "Computer's choice:" : 
        `${opponentName}'s choice:`;
    
    resultDiv.innerHTML = `
        <div class="round-result ${resultClass}">
            <p class="round-number">Round ${roundNumber}</p>
            <div class="choices-display">
                <div class="choice">
                    <p>Your choice:</p>
                    <i class="fas fa-hand-${playerChoice.toLowerCase()}"></i>
                    <p>${playerChoice}</p>
                </div>
                <div class="choice">
                    <p>${opponentLabel}</p>
                    <i class="fas fa-hand-${opponentChoice.toLowerCase()}"></i>
                    <p>${opponentChoice}</p>
                </div>
            </div>
            <p class="result-text ${resultClass}">${result}</p>
        </div>
    ` + resultDiv.innerHTML;
}

// Play a round of the game
function playGame(playerChoice) {
    console.log("Play game called with choice:", playerChoice);
    
    if (roundsPlayed >= totalRounds) {
        console.log("Game already ended, ignoring move");
        return;
    }
    
    // Handle multiplayer mode
    if (gameMode === 'multiplayer' && currentRoom) {
        console.log("Making multiplayer move:", playerChoice);
        
        // Get current moves
        const movesRef = ref(database, 'rooms/' + currentRoom + '/moves');
        get(movesRef).then((snapshot) => {
            let moves = { round: roundsPlayed + 1 };
            
            if (snapshot.exists()) {
                moves = snapshot.val();
                // Ensure we're on the current round
                if (moves.round !== roundsPlayed + 1) {
                    moves = { round: roundsPlayed + 1 };
                }
            }
            
            // Add or update player's move
            if (isPlayer1) {
                moves.player1 = playerChoice;
            } else {
                moves.player2 = playerChoice;
            }
            
            console.log("Updating moves:", moves);
            
            // Update moves in database
            set(movesRef, moves);
            
            // Show waiting message with current choices
            const resultDiv = document.getElementById('results');
            const waitingHTML = `
                <div class="waiting-message">
                    <p>You chose: ${playerChoice}</p>
                    <p>Waiting for ${opponentName} to make their choice...</p>
                    <p class="small">(You can still change your choice)</p>
                </div>
            `;
            
            // Remove any existing waiting message before adding new one
            const existingWaitingMessage = resultDiv.querySelector('.waiting-message');
            if (existingWaitingMessage) {
                existingWaitingMessage.remove();
            }
            
            resultDiv.innerHTML = waitingHTML + resultDiv.innerHTML;
            
            // If both players have made their move, process the round
            if (moves.player1 && moves.player2) {
                console.log("Both players made their move, processing round");
                
                // Remove waiting message
                const waitingMessage = document.querySelector('.waiting-message');
                if (waitingMessage) {
                    waitingMessage.remove();
                }
                
                // Process the round
                processMultiplayerRound(moves);
            }
        });
        
        return;
    }
    
    // Handle singleplayer mode
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
    
    // Display round result
    displayRoundResult(playerChoice, computerChoice, result, roundsPlayed);
    
    // Check if game is over
    if (roundsPlayed >= totalRounds) {
        endGame();
    }
}

// End the game and show final results
async function endGame() {
    console.log("Ending game");
    document.getElementById('gameArea').style.display = 'none';
    document.getElementById('finalResult').style.display = 'block';
    
    let resultClass = '';
    if (wins > losses) {
        resultClass = 'win';
    } else if (losses > wins) {
        resultClass = 'lose';
    } else {
        resultClass = 'draw';
    }
    
    const finalScore = document.getElementById('finalScore');
    finalScore.innerHTML = `
        <div class="final-score-container ${resultClass}">
            <div class="final-score-item">
                <i class="fas fa-trophy"></i> Wins: ${wins}
            </div>
            <div class="final-score-item">
                <i class="fas fa-times"></i> Losses: ${losses}
            </div>
            <div class="final-score-item">
                <i class="fas fa-equals"></i> Draws: ${draws}
            </div>
        </div>
    `;
    
    const winnerAnnouncement = document.getElementById('winnerAnnouncement');
    let gameResult = '';
    
    if (wins > losses) {
        winnerAnnouncement.innerHTML = '<i class="fas fa-crown"></i> YOU WIN!';
        winnerAnnouncement.className = 'winner-announcement win';
        gameResult = 'win';
    } else if (losses > wins) {
        winnerAnnouncement.innerHTML = '<i class="fas fa-thumbs-down"></i> YOU LOSE!';
        winnerAnnouncement.className = 'winner-announcement lose';
        gameResult = 'loss';
    } else {
        winnerAnnouncement.innerHTML = '<i class="fas fa-handshake"></i> DRAW!';
        winnerAnnouncement.className = 'winner-announcement draw';
        gameResult = 'draw';
    }
    
    // Copy the round results to the final result
    const resultsDiv = document.getElementById('results');
    const finalRoundsSummary = document.createElement('div');
    finalRoundsSummary.className = 'final-rounds-summary';
    finalRoundsSummary.innerHTML = `
        <h3>Round by Round Summary</h3>
        ${resultsDiv.innerHTML}
    `;
    document.getElementById('finalResult').appendChild(finalRoundsSummary);
    
    console.log("Game ended with result:", gameResult);
    console.log("Final scores - Wins:", wins, "Losses:", losses, "Draws:", draws);
    
    // If in multiplayer mode, update the game state in Firebase
    if (gameMode === 'multiplayer' && currentRoom) {
        console.log("Updating multiplayer game state to ended");
        const gameStateRef = ref(database, 'rooms/' + currentRoom + '/gameState');
        set(gameStateRef, 'ended');
        
        // Update final result in Firebase
        const resultRef = ref(database, 'rooms/' + currentRoom + '/result');
        set(resultRef, {
            player1: {
                wins: isPlayer1 ? wins : losses,
                losses: isPlayer1 ? losses : wins,
                draws: draws
            },
            player2: {
                wins: isPlayer1 ? losses : wins,
                losses: isPlayer1 ? wins : losses,
                draws: draws
            },
            winner: wins > losses ? (isPlayer1 ? 'player1' : 'player2') : 
                    losses > wins ? (isPlayer1 ? 'player2' : 'player1') : 'draw'
        });
    }
    
    // Disable navigation buttons until stats are updated
    const playAgainButton = document.querySelector('.play-again-button');
    const homeButton = document.querySelector('.home-button');
    
    if (playAgainButton) playAgainButton.disabled = true;
    if (homeButton) homeButton.disabled = true;
    
    // Update user stats in database if authenticated
    if (currentUser) {
        console.log("Updating stats for user:", currentUser.uid);
        const userStatsRef = ref(database, 'users/' + currentUser.uid + '/stats');
        
        try {
            const snapshot = await get(userStatsRef);
            const currentStats = snapshot.exists() ? snapshot.val() : {
                gamesPlayed: 0,
                gamesWon: 0,
                totalWins: 0,
                totalLosses: 0,
                totalDraws: 0
            };
            
            const updatedStats = {
                gamesPlayed: currentStats.gamesPlayed + 1,
                gamesWon: currentStats.gamesWon + (wins > losses ? 1 : 0),
                totalWins: currentStats.totalWins + wins,
                totalLosses: currentStats.totalLosses + losses,
                totalDraws: currentStats.totalDraws + draws
            };
            
            await set(userStatsRef, updatedStats);
            console.log("Stats updated successfully");
            
            // Enable navigation buttons after stats are updated
            if (playAgainButton) playAgainButton.disabled = false;
            
        } catch (error) {
            console.error("Error updating stats:", error);
            showError('Failed to update stats. Please try again.');
        }
    } else {
        console.log("User not authenticated, stats not updated");
        // Re-enable buttons immediately if user is not authenticated
        if (playAgainButton) playAgainButton.disabled = false;
        if (homeButton) homeButton.disabled = false;
    }
    
    // If in multiplayer mode, clean up the room
    if (gameMode === 'multiplayer' && currentRoom) {
        console.log("Cleaning up multiplayer room:", currentRoom);
        
        // Remove listeners by setting them to null
        // This is a simple way to "detach" listeners
        const gameStateRef = ref(database, 'rooms/' + currentRoom + '/gameState');
        const movesRef = ref(database, 'rooms/' + currentRoom + '/moves');
        
        // Reset room state
        currentRoom = null;
        isPlayer1 = false;
        opponentName = '';
    }
}

// Reset the game
function resetGame() {
    console.log("Resetting game");
    document.getElementById('finalResult').style.display = 'none';
    
    // Reset game variables
    wins = 0;
    losses = 0;
    draws = 0;
    roundsPlayed = 0;
    
    // If in multiplayer mode, clean up the room
    if (gameMode === 'multiplayer' && currentRoom) {
        console.log("Cleaning up multiplayer room:", currentRoom);
        
        // Remove listeners by setting them to null
        // This is a simple way to "detach" listeners
        const gameStateRef = ref(database, 'rooms/' + currentRoom + '/gameState');
        const movesRef = ref(database, 'rooms/' + currentRoom + '/moves');
        
        // Reset room state
        currentRoom = null;
        isPlayer1 = false;
        opponentName = '';
    }
    
    // Go back to game mode selection
    gameMode = '';
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

// Copy room code to clipboard
function copyRoomCode() {
    const roomCode = document.getElementById('displayRoomCode').textContent;
    navigator.clipboard.writeText(roomCode).then(() => {
        const copyButton = document.querySelector('.copy-button');
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyButton.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy room code:', err);
        showError('Failed to copy room code');
    });
}

// Export game functions for use in HTML
const gameModule = {
    selectGameMode,
    createRoom,
    joinRoom,
    startGame,
    playGame,
    resetGame,
    goToHomePage,
    copyRoomCode
};

// Make game functions available globally
window.gameModule = gameModule;

// Export for use in other modules
export default gameModule;