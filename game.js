let wins = 0, losses = 0, draws = 0;
let totalRounds = 0;
let roundsPlayed = 0;
let gameMode = '';
let currentRoom = '';
let isPlayer1 = false;
let currentUser = null;

// Auth state observer
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
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
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    currentRoom = roomCode;
    isPlayer1 = true;

    // Create room in Firebase
    firebase.database().ref('rooms/' + roomCode).set({
        player1: {
            id: currentUser.uid,
            username: currentUser.displayName,
            ready: false
        },
        gameState: 'waiting',
        rounds: 5,
        currentRound: 0
    });

    // Listen for opponent joining
    firebase.database().ref('rooms/' + roomCode + '/player2').on('value', (snapshot) => {
        if (snapshot.exists()) {
            document.getElementById('playerCount').textContent = '2/2';
            document.getElementById('waitingMessage').textContent = 'Game starting...';
            setTimeout(() => startGame(5), 1500);
        }
    });

    document.getElementById('roomCreation').style.display = 'none';
    document.getElementById('waitingRoom').style.display = 'block';
    document.getElementById('displayRoomCode').textContent = roomCode;
}

function joinRoom() {
    const roomCode = document.getElementById('roomCode').value.toUpperCase();
    
    // Check if room exists
    firebase.database().ref('rooms/' + roomCode).once('value', (snapshot) => {
        if (snapshot.exists() && !snapshot.val().player2) {
            currentRoom = roomCode;
            isPlayer1 = false;

            // Join room
            firebase.database().ref('rooms/' + roomCode + '/player2').set({
                id: currentUser.uid,
                username: currentUser.displayName,
                ready: false
            });

            document.getElementById('roomCreation').style.display = 'none';
            document.getElementById('waitingRoom').style.display = 'block';
            document.getElementById('displayRoomCode').textContent = roomCode;
            
            // Start game
            setTimeout(() => startGame(5), 1500);
        } else {
            alert('Room not found or full');
        }
    });
}

function startGame(rounds) {
    totalRounds = rounds;
    roundsPlayed = 0;
    wins = 0;
    losses = 0;
    draws = 0;
    
    document.getElementById('multiplayerRoom').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    document.getElementById('finalResult').style.display = 'none';
    updateScores();

    if (gameMode === 'multiplayer') {
        // Listen for opponent's moves
        firebase.database().ref('rooms/' + currentRoom + '/moves').on('value', (snapshot) => {
            if (snapshot.exists()) {
                const moves = snapshot.val();
                if (moves.player1 && moves.player2) {
                    processRound(moves);
                }
            }
        });
    }
}

function processRound(moves) {
    const playerMove = isPlayer1 ? moves.player1 : moves.player2;
    const opponentMove = isPlayer1 ? moves.player2 : moves.player1;
    const result = determineWinner(playerMove, opponentMove);

    if (result === "You win!") {
        wins++;
    } else if (result === "Opponent wins!") {
        losses++;
    } else {
        draws++;
    }

    roundsPlayed++;
    updateScores();
    displayResult(playerMove, opponentMove, result);

    // Clear moves for next round
    firebase.database().ref('rooms/' + currentRoom + '/moves').remove().then(() => {
        // Enable choices for next round
        enableChoices();
        
        if (roundsPlayed >= totalRounds) {
            setTimeout(showFinalResult, 1000);
            // Update user stats
            updateUserStats();
        }
    });
}

function updateUserStats() {
    const userRef = firebase.database().ref('users/' + currentUser.uid + '/stats');
    userRef.transaction((stats) => {
        if (stats) {
            stats.gamesPlayed++;
            stats.wins += wins;
            stats.losses += losses;
            stats.draws += draws;
        }
        return stats;
    });
}

function playGame(playerChoice) {
    if (roundsPlayed >= totalRounds) return;

    if (gameMode === 'singleplayer') {
        playSinglePlayer(playerChoice);
    } else {
        playMultiplayer(playerChoice);
    }
}

function playSinglePlayer(playerChoice) {
    const computerChoice = getRandomChoice();
    const result = determineWinner(playerChoice, computerChoice);

    if (result === "You win!") {
        wins++;
    } else if (result === "Computer wins!") {
        losses++;
    } else {
        draws++;
    }

    roundsPlayed++;
    updateScores();
    displayResult(playerChoice, computerChoice, result);

    if (roundsPlayed >= totalRounds) {
        setTimeout(showFinalResult, 1000);
        // Update user stats
        updateUserStats();
    }
}

function playMultiplayer(playerChoice) {
    const playerPath = isPlayer1 ? 'player1' : 'player2';
    firebase.database().ref('rooms/' + currentRoom + '/moves/' + playerPath).set(playerChoice);
    disableChoices();
}

function updateScores() {
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;
    document.getElementById('draws').textContent = draws;
    document.getElementById('roundsLeft').textContent = totalRounds - roundsPlayed;
}

function getRandomChoice() {
    const choices = ["Rock", "Paper", "Scissors"];
    return choices[Math.floor(Math.random() * choices.length)];
}

function determineWinner(player1Choice, player2Choice) {
    if (player1Choice === player2Choice) {
        return "It's a draw!";
    } else if (
        (player1Choice === "Paper" && player2Choice === "Rock") ||
        (player1Choice === "Rock" && player2Choice === "Scissors") ||
        (player1Choice === "Scissors" && player2Choice === "Paper")
    ) {
        return "You win!";
    } else {
        return "Computer wins!";
    }
}

function showFinalResult() {
    const gameArea = document.getElementById('gameArea');
    const finalResult = document.getElementById('finalResult');
    const finalScore = document.getElementById('finalScore');
    const winnerAnnouncement = document.getElementById('winnerAnnouncement');

    gameArea.style.display = 'none';
    finalResult.style.display = 'block';

    const opponentLabel = gameMode === 'singleplayer' ? 'Computer' : 'Opponent';
    finalScore.innerHTML = `
        <p>Final Score:</p>
        <p>You: ${wins} | ${opponentLabel}: ${losses} | Draws: ${draws}</p>
    `;

    if (wins > losses) {
        winnerAnnouncement.innerHTML = 'YOU WON 🥇';
        winnerAnnouncement.className = 'winner-announcement win';
    } else if (losses > wins) {
        winnerAnnouncement.innerHTML = 'YOU LOST 😞';
        winnerAnnouncement.className = 'winner-announcement lose';
    } else {
        winnerAnnouncement.innerHTML = "IT'S A TIE! 🤝";
        winnerAnnouncement.className = 'winner-announcement';
    }

    // If in multiplayer mode, clean up the room
    if (gameMode === 'multiplayer' && currentRoom) {
        firebase.database().ref('rooms/' + currentRoom).remove();
    }
}

function disableChoices() {
    const buttons = document.querySelectorAll('.choices button');
    buttons.forEach(button => button.disabled = true);
}

function enableChoices() {
    const buttons = document.querySelectorAll('.choices button');
    buttons.forEach(button => button.disabled = false);
}

function displayResult(playerChoice, opponentChoice, result) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.classList.remove('win', 'lose', 'draw');
    
    if (result === "You win!") {
        resultsDiv.classList.add('win');
    } else if (result.includes("wins!")) {
        resultsDiv.classList.add('lose');
    } else {
        resultsDiv.classList.add('draw');
    }

    const opponentLabel = gameMode === 'singleplayer' ? "Computer's" : "Opponent's";
    resultsDiv.innerHTML = `
        <p><strong>Your choice:</strong> ${playerChoice}</p>
        <p><strong>${opponentLabel} choice:</strong> ${opponentChoice}</p>
        <p><strong>Result:</strong> ${result}</p>
    `;
    resultsDiv.classList.add("fade-in");

    setTimeout(() => {
        resultsDiv.classList.remove("fade-in");
    }, 500);
}

function resetGame() {
    if (gameMode === 'multiplayer' && currentRoom) {
        // Clean up Firebase listeners and room
        firebase.database().ref('rooms/' + currentRoom).off();
        firebase.database().ref('rooms/' + currentRoom).remove();
    }
    
    document.getElementById('gameModeSelection').style.display = 'block';
    document.getElementById('gameArea').style.display = 'none';
    document.getElementById('finalResult').style.display = 'none';
    document.getElementById('multiplayerRoom').style.display = 'none';
    
    currentRoom = '';
    gameMode = '';
} 