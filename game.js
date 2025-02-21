let wins = 0, losses = 0, draws = 0;
let totalRounds = 0;
let roundsPlayed = 0;

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

    const resultsDiv = document.getElementById("results");
    
    // Remove any existing result classes
    resultsDiv.classList.remove('win', 'lose', 'draw');
    
    // Add appropriate class based on result
    if (result === "You win!") {
        resultsDiv.classList.add('win');
    } else if (result === "Computer wins!") {
        resultsDiv.classList.add('lose');
    } else {
        resultsDiv.classList.add('draw');
    }

    resultsDiv.innerHTML = `
        <p><strong>Your choice:</strong> ${playerChoice}</p>
        <p><strong>Computer's choice:</strong> ${computerChoice}</p>
        <p><strong>Result:</strong> ${result}</p>
    `;
    resultsDiv.classList.add("fade-in");

    setTimeout(() => {
        resultsDiv.classList.remove("fade-in");
    }, 500);

    if (roundsPlayed >= totalRounds) {
        setTimeout(showFinalResult, 1000);
    }
}

function resetGame() {
    document.getElementById('gameModeSelection').style.display = 'block';
    document.getElementById('finalResult').style.display = 'none';
} 