const gameArea = document.getElementById('game-area');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const bestScoreEl = document.getElementById('best-score');
const messageEl = document.getElementById('message');
const startButton = document.getElementById('start-button');
const heroEl = document.getElementById('hero');

const keyboardPrompts = ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'Q', 'W', 'E'];
const specialPrompts = [
  { type: 'mouse-left', image: 'mouse1.png', label: 'ЛКМ' },
  { type: 'mouse-right', image: 'mouse2.png', label: 'ПКМ' },
  { type: 'wheel', image: 'mouse3.png', label: 'Колесико' },
];

let asteroids = [];
let score = 0;
let lives = 3;
let bestScore = Number(localStorage.getItem('grisha-best-score') || 0);
let running = false;
let lastTime = 0;
let spawnTimer = 0;
let spawnInterval = 1200;
let animationId = 0;

bestScoreEl.textContent = bestScore;

document.addEventListener('contextmenu', (event) => {
  if (running) event.preventDefault();
});

startButton.addEventListener('click', startGame);
window.addEventListener('keydown', (event) => {
  if (!running) return;
  const key = event.key.toUpperCase();
  handlePrompt(key);
});
window.addEventListener('mousedown', (event) => {
  if (!running) return;
  if (event.button === 0) {
    handlePrompt('mouse-left');
  }
  if (event.button === 2) {
    event.preventDefault();
    handlePrompt('mouse-right');
  }
});
window.addEventListener('wheel', () => {
  if (!running) return;
  handlePrompt('wheel');
}, { passive: true });

function startGame() {
  clearAsteroids();
  score = 0;
  lives = 3;
  spawnTimer = 0;
  spawnInterval = 1250;
  asteroids = [];
  lastTime = 0;
  running = true;
  updateHud();
  messageEl.classList.add('hidden');
  animationId = requestAnimationFrame(loop);
}

function loop(timestamp) {
  if (!running) return;
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  spawnTimer += delta;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnAsteroid();
    spawnInterval = Math.max(580, spawnInterval - 18);
  }

  updateAsteroids(delta);
  animationId = requestAnimationFrame(loop);
}

function spawnAsteroid() {
  const asteroid = document.createElement('div');
  asteroid.className = 'asteroid';

  const promptEl = document.createElement('div');
  promptEl.className = 'prompt';

  const useSpecial = Math.random() < 0.34;
  let prompt;
  if (useSpecial) {
    prompt = { ...specialPrompts[Math.floor(Math.random() * specialPrompts.length)] };
    const image = document.createElement('img');
    image.src = prompt.image;
    image.alt = prompt.label;
    promptEl.appendChild(image);
  } else {
    const value = keyboardPrompts[Math.floor(Math.random() * keyboardPrompts.length)];
    prompt = { type: value, label: value };
    promptEl.textContent = value;
  }

  asteroid.appendChild(promptEl);
  gameArea.appendChild(asteroid);

  const top = 30 + Math.random() * (gameArea.clientHeight - 150);
  const size = 92 + Math.random() * 46;
  asteroid.style.top = `${top}px`;
  asteroid.style.left = `${gameArea.clientWidth + size}px`;
  asteroid.style.width = `${size}px`;
  asteroid.style.transform = `rotate(${Math.random() * 360}deg)`;

  asteroids.push({
    element: asteroid,
    prompt,
    x: gameArea.clientWidth + size,
    y: top,
    size,
    speed: 220 + Math.random() * 130 + score * 2.8,
    rotation: Math.random() * 360,
    rotationSpeed: -100 + Math.random() * 200,
  });
}

function updateAsteroids(delta) {
  const heroBox = heroEl.getBoundingClientRect();
  const gameBox = gameArea.getBoundingClientRect();
  const heroFront = heroBox.right - gameBox.left - 12;

  asteroids = asteroids.filter((asteroid) => {
    asteroid.x -= asteroid.speed * delta / 1000;
    asteroid.rotation += asteroid.rotationSpeed * delta / 1000;
    asteroid.element.style.left = `${asteroid.x}px`;
    asteroid.element.style.transform = `rotate(${asteroid.rotation}deg)`;

    if (asteroid.x < heroFront && asteroid.x + asteroid.size > 48) {
      asteroid.element.remove();
      loseLife(asteroid.y + asteroid.size / 2);
      return false;
    }

    if (asteroid.x + asteroid.size < -40) {
      asteroid.element.remove();
      return false;
    }
    return true;
  });
}

function handlePrompt(input) {
  const matches = asteroids
    .filter((asteroid) => asteroid.prompt.type === input)
    .sort((a, b) => a.x - b.x);

  if (!matches.length) {
    showFloatingText('Мимо!', '#ffadad', 170, 90);
    return;
  }

  const asteroid = matches[0];
  asteroid.element.classList.add('hit');
  setTimeout(() => asteroid.element.remove(), 260);
  asteroids = asteroids.filter((item) => item !== asteroid);

  score += 10;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('grisha-best-score', String(bestScore));
  }
  updateHud();
  showFloatingText('+10', '#fff3b0', asteroid.x, asteroid.y);
}

function loseLife(y) {
  lives -= 1;
  heroEl.classList.add('shake');
  setTimeout(() => heroEl.classList.remove('shake'), 380);
  updateHud();
  showFloatingText('Ой!', '#ff8fab', 110, y);

  if (lives <= 0) {
    endGame();
  }
}

function endGame() {
  running = false;
  cancelAnimationFrame(animationId);
  messageEl.classList.remove('hidden');
  messageEl.innerHTML = `
    <h1>Полет окончен!</h1>
    <p>Гриша набрал <strong>${score}</strong> очков. Попробуй ещё раз и побей рекорд!</p>
    <button id="start-button">Играть снова</button>
  `;
  document.getElementById('start-button').addEventListener('click', startGame);
}

function showFloatingText(text, color, x, y) {
  const note = document.createElement('div');
  note.className = 'floating-text';
  note.textContent = text;
  note.style.color = color;
  note.style.left = `${x}px`;
  note.style.top = `${y}px`;
  gameArea.appendChild(note);
  setTimeout(() => note.remove(), 680);
}

function updateHud() {
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  bestScoreEl.textContent = bestScore;
}

function clearAsteroids() {
  document.querySelectorAll('.asteroid, .floating-text').forEach((node) => node.remove());
}
