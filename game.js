const gameArea = document.getElementById('game-area');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const bestScoreEl = document.getElementById('best-score');
const messageEl = document.getElementById('message');
const startButton = document.getElementById('start-button');
const heroEl = document.getElementById('hero');

const keyboardPrompts = [
  { type: 'Ф', label: 'Ф', aliases: ['Ф', 'A'] },
  { type: 'Ы', label: 'Ы', aliases: ['Ы', 'S'] },
  { type: 'В', label: 'В', aliases: ['В', 'D'] },
  { type: 'А', label: 'А', aliases: ['А', 'F'] },
  { type: 'О', label: 'О', aliases: ['О', 'J'] },
  { type: 'Л', label: 'Л', aliases: ['Л', 'K'] },
  { type: 'Д', label: 'Д', aliases: ['Д', 'L'] },
  { type: 'Й', label: 'Й', aliases: ['Й', 'Q'] },
  { type: 'Ц', label: 'Ц', aliases: ['Ц', 'W'] },
  { type: 'У', label: 'У', aliases: ['У', 'E'] },
];
const keyAliases = keyboardPrompts.reduce((map, prompt) => {
  prompt.aliases.forEach((alias) => {
    map[alias] = prompt.type;
  });
  return map;
}, {});
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
let spawnInterval = 0;
let animationId = 0;
let elapsedTime = 0;

bestScoreEl.textContent = bestScore;

document.addEventListener('contextmenu', (event) => {
  if (running) event.preventDefault();
});

startButton.addEventListener('click', startGame);
window.addEventListener('keydown', (event) => {
  if (!running) return;
  const key = event.key.toUpperCase();
  handlePrompt(keyAliases[key] || key);
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
window.addEventListener(
  'wheel',
  () => {
    if (!running) return;
    handlePrompt('wheel');
  },
  { passive: true },
);

function startGame() {
  clearAsteroids();
  score = 0;
  lives = 3;
  spawnTimer = 0;
  spawnInterval = 1450;
  elapsedTime = 0;
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
  elapsedTime += delta;

  spawnTimer += delta;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnAsteroid();
    spawnInterval = Math.max(760, spawnInterval - 10);
  }

  updateAsteroids(delta);
  animationId = requestAnimationFrame(loop);
}

function getSpeedMultiplier() {
  return 1 + Math.min(0.35, elapsedTime / 1000 * 0.01);
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
    prompt = { ...keyboardPrompts[Math.floor(Math.random() * keyboardPrompts.length)] };
    promptEl.textContent = prompt.label;
  }

  asteroid.appendChild(promptEl);
  gameArea.appendChild(asteroid);

  const top = 30 + Math.random() * (gameArea.clientHeight - 150);
  const size = 92 + Math.random() * 46;
  asteroid.style.top = `${top}px`;
  asteroid.style.left = `${gameArea.clientWidth + size}px`;
  asteroid.style.width = `${size}px`;

  asteroids.push({
    element: asteroid,
    prompt,
    x: gameArea.clientWidth + size,
    y: top,
    size,
    baseSpeed: 180 + Math.random() * 70,
  });
}

function updateAsteroids(delta) {
  const heroBox = heroEl.getBoundingClientRect();
  const gameBox = gameArea.getBoundingClientRect();
  const heroFront = heroBox.right - gameBox.left - 12;
  const speedMultiplier = getSpeedMultiplier();

  asteroids = asteroids.filter((asteroid) => {
    asteroid.x -= asteroid.baseSpeed * speedMultiplier * delta / 1000;
    asteroid.element.style.left = `${asteroid.x}px`;

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
