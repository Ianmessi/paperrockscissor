const Choice = {
  PAPER: "Paper",
  ROCK: "Rock",
  SCISSORS: "Scissors"
};

let wins = 0, losses = 0, draws = 0;

function updateScoreBoard() {
  document.getElementById('wins').textContent = wins;
  document.getElementById('losses').textContent = losses;
  document.getElementById('draws').textContent = draws;
}

function getRandomChoice() {
  const choices = [Choice.PAPER, Choice.ROCK, Choice.SCISSORS];
  return choices[Math.floor(Math.random() * choices.length)];
}

function determineWinner(player1Choice, player2Choice) {
  if (player1Choice === player2Choice) {
      return "It's a draw!";
  } else if (
      (player1Choice === Choice.PAPER && player2Choice === Choice.ROCK) ||
      (player1Choice === Choice.ROCK && player2Choice === Choice.SCISSORS) ||
      (player1Choice === Choice.SCISSORS && player2Choice === Choice.PAPER)
  ) {
      return "You win!";
  } else {
      return "Computer wins!";
  }
}

function playSound(file) {
  const audio = new Audio(file);
  audio.volume = 0.5;
  audio.play().catch(error => console.log("Audio play failed:", error));
}

function animateResult(result) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.style.animation = 'none';
  resultsDiv.offsetHeight; // Trigger reflow
  resultsDiv.style.animation = null;
  
  let backgroundColor;
  if (result === "You win!") {
      backgroundColor = 'rgba(76, 175, 80, 0.2)';
  } else if (result === "Computer wins!") {
      backgroundColor = 'rgba(244, 67, 54, 0.2)';
  } else {
      backgroundColor = 'rgba(255, 255, 255, 0.2)';
  }
  
  resultsDiv.style.backgroundColor = backgroundColor;
}

function playGame(playerChoice) {
  // Play click sound
  playSound('click.mp3');

  const computerChoice = getRandomChoice();
  const result = determineWinner(playerChoice, computerChoice);

  // Update scores
  if (result === "You win!") {
      wins++;
      playSound('win.mp3');
  } else if (result === "Computer wins!") {
      losses++;
      playSound('lose.mp3');
  } else {
      draws++;
      playSound('draw.mp3');
  }

  updateScoreBoard();

  // Create result HTML with icons
  const getIcon = (choice) => {
      const icons = {
          'Paper': 'far fa-hand-paper',
          'Rock': 'far fa-hand-rock',
          'Scissors': 'far fa-hand-scissors'
      };
      return icons[choice];
  };

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
      <p><i class="${getIcon(playerChoice)}"></i> Your choice: ${playerChoice}</p>
      <p><i class="${getIcon(computerChoice)}"></i> Computer's choice: ${computerChoice}</p>
      <p class="result-text"><strong>${result}</strong></p>
      <p>Wins: ${wins} | Losses: ${losses} | Draws: ${draws}</p>
  `;

  // Animate the result
  animateResult(result);
  resultsDiv.classList.add("fade-in");

  setTimeout(() => {
      resultsDiv.classList.remove("fade-in");
  }, 500);
}

// Initialize score board on load
document.addEventListener('DOMContentLoaded', updateScoreBoard);