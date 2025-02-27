let wins = 0, losses = 0, draws = 0;
let totalRounds = 0;
let roundsPlayed = 0;
let gameMode = '';
let socket;
let currentRoom = '';
let isPlayer1 = false;

function selectGameMode(mode) {
    gameMode = mode;
    document.getElementById('gameModeSelection').style.display = 'none';
    
    if (mode === 'singleplayer') {
        document.getElementById('roundsSelection').style.display = 'block';
    } else {
        document.getElementById('multiplayerRoom').style.display = 'block';
        initializeMultiplayer();
    }
}

function initializeMultiplayer() {
    socket = io();

    socket.on('roomCreated', (roomCode) => {
        currentRoom = roomCode;
        document.getElementById('roomCreation').style.display = 'none';
        document.getElementById('waitingRoom').style.display = 'block';
        document.getElementById('displayRoomCode').textContent = roomCode;
        isPlayer1 = true;
    });

    socket.on('joinedRoom', (roomCode) => {
        currentRoom = roomCode;
        document.getElementById('roomCreation').style.display = 'none';
        document.getElementById('waitingRoom').style.display = 'block';
        document.getElementById('displayRoomCode').textContent = roomCode;
        isPlayer1 = false;
    });

    socket.on('gameReady', () => {
        document.getElementById('playerCount').textContent = '2/2';
        document.getElementById('waitingMessage').textContent = 'Game starting...';
        setTimeout(() => startGame(5), 1500);
    });

    socket.on('roundResult', ({ moves, result }) => {
        const [player1Move, player2Move] = moves;
        const playerMove = isPlayer1 ? player1Move : player2Move;
        const opponentMove = isPlayer1 ? player2Move : player1Move;
        
        updateMultiplayerResult(playerMove, opponentMove, result);
    });

    socket.on('playerLeft', () => {
        alert('Your opponent has left the game');
        resetGame();
    });
}

function createRoom() {
    socket.emit('createRoom');
}

function joinRoom() {
    const roomCode = document.getElementById('roomCode').value.toUpperCase();
    socket.emit('joinRoom', roomCode);
}

function startGame(rounds) {
    totalRounds = rounds;
    roundsPlayed = 0;
    wins = 0;
    losses = 0;
    draws = 0;
    
    document.getElementById('gameModeSelection').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    document.getElementById('finalResult').style.display = 'none';
    updateScores();
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

    finalScore.innerHTML = `
        <p>Final Score:</p>
        <p>You: ${wins} | Computer: ${losses} | Draws: ${draws}</p>
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
    }
}

function playMultiplayer(playerChoice) {
    socket.emit('move', { roomCode: currentRoom, move: playerChoice });
    disableChoices();
}

function updateMultiplayerResult(playerMove, opponentMove, result) {
    let displayResult;
    if (result === 'draw') {
        draws++;
        displayResult = "It's a draw!";
    } else if ((result === 'player1' && isPlayer1) || (result === 'player2' && !isPlayer1)) {
        wins++;
        displayResult = "You win!";
    } else {
        losses++;
        displayResult = "Opponent wins!";
    }

    roundsPlayed++;
    updateScores();
    displayResult(playerMove, opponentMove, displayResult);
    enableChoices();

    if (roundsPlayed >= totalRounds) {
        setTimeout(showFinalResult, 1000);
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
    document.getElementById('gameModeSelection').style.display = 'block';
    document.getElementById('finalResult').style.display = 'none';
} 