// script.js — Space War (simples & comentado)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// Jogador
const player = {
  x: W / 2,
  y: H - 60,
  w: 34,
  h: 20,
  speed: 6,
  bullets: []
};

// Inimigos e tiros
let enemies = [];
let enemyBullets = [];
let particles = []; // efeitos simples (explosões)
let score = 0;
let lives = 3;
let running = false;
let lastTime = 0;
let spawnTimer = 0;
let spawnInterval = 1200; // ms
let difficulty = 1.5; // multiplicador

// Config UI
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

function resetGame() {
  player.x = W / 2;
  player.y = H - 60;
  player.bullets = [];
  enemies = [];
  enemyBullets = [];
  particles = [];
  score = 0;
  lives = 3;
  scoreEl.innerText = score;
  livesEl.innerText = lives;
  spawnTimer = 0;
}

// --- utilidades
function rand(min, max) { return Math.random() * (max - min) + min; }
function rectsCollide(a, b) {
  return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

// --- desenho simples da nave do jogador (triângulo)
function drawPlayer() {
  ctx.save();
  ctx.fillStyle = '#4fe0ff';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.h);
  ctx.lineTo(player.x - player.w/2, player.y + player.h/2);
  ctx.lineTo(player.x + player.w/2, player.y + player.h/2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// --- atira do jogador
function playerShoot() {
  const b = {
    x: player.x - 2,
    y: player.y - player.h,
    w: 4,
    h: 8,
    speed: 8
  };
  player.bullets.push(b);
}

// --- spawn de inimigos
function spawnEnemy() {
  const w = 34;
  const h = 18;
  const enemy = {
    x: rand(w, W - w),
    y: -h,
    w,
    h,
    speed: rand(1.2, 2.5) * difficulty,
    hp: 1 + Math.floor(difficulty - 1),
    shootTimer: 0,
    shootInterval: rand(1200, 2200)
  };
  enemies.push(enemy);
}

// --- lógica de inimigos (movimentação e tiro)
function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.y += e.speed * dt/16;
    e.shootTimer += dt;
    // tiro do inimigo
    if (e.shootTimer > e.shootInterval) {
      e.shootTimer = 0;
      enemyBullets.push({
        x: e.x + e.w/2 - 3,
        y: e.y + e.h,
        w: 6,
        h: 10,
        speed: 4 + difficulty
      });
    }
    // saiu da tela
    if (e.y > H + 50) {
      enemies.splice(i, 1);
    }
  }
}

// --- atualização balas jogador
function updatePlayerBullets() {
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    const b = player.bullets[i];
    b.y -= b.speed;
    // colisão com inimigos
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (rectsCollide({ x: b.x, y: b.y, w: b.w, h: b.h }, e)) {
        // acerto
        enemies.splice(j, 1);
        player.bullets.splice(i, 1);
        spawnExplosion(e.x + e.w/2, e.y + e.h/2);
        score += 10;
        scoreEl.innerText = score;
        break;
      }
    }
    // fora da tela
    if (b && b.y < -20) player.bullets.splice(i, 1);
  }
}

// --- atualização balas inimigas
function updateEnemyBullets() {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.y += b.speed;
    // colisão com jogador (simples bounding box)
    if (rectsCollide({ x: b.x, y: b.y, w: b.w, h: b.h }, { x: player.x - player.w/2, y: player.y - player.h, w: player.w, h: player.h*2 })) {
      enemyBullets.splice(i, 1);
      hitPlayer();
      continue;
    }
    if (b.y > H + 20) enemyBullets.splice(i, 1);
  }
}

// --- efeito de explosão simples
function spawnExplosion(x, y) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x,
      y,
      vx: rand(-2.5, 2.5),
      vy: rand(-2.5, 2.5),
      life: rand(300, 700)
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt/16;
    p.y += p.vy * dt/16;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// --- jogador perde vida
function hitPlayer() {
  lives--;
  livesEl.innerText = lives;
  spawnExplosion(player.x, player.y);
  if (lives <= 0) {
    running = false;
    setTimeout(() => { alert('Game Over! Pontuação: ' + score); }, 50);
  }
}

// --- atualiza física e lógica
function update(dt) {
  // spawn de inimigos por timer
  spawnTimer += dt;
  if (spawnTimer > spawnInterval / difficulty) {
    spawnTimer = 0;
    spawnEnemy();
  }

  // atualiza inimigos e balas
  updateEnemies(dt);
  updatePlayerBullets();
  updateEnemyBullets();
  updateParticles(dt);
}

// --- desenha tudo no canvas
function draw() {
  // fundo
  ctx.fillStyle = '#050914';
  ctx.fillRect(0,0,W,H);

  // estrelas de fundo simples
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    const sx = (i * 53) % W;
    const sy = (i * 37) % H;
    ctx.fillRect(sx, sy, 1.2, 1.2);
  }

  // desenha jogador
  drawPlayer();

  // desenha inimigos
  ctx.fillStyle = '#ff6b6b';
  enemies.forEach(e => {
    ctx.fillRect(e.x, e.y, e.w, e.h);
    // pequenos "olhos"
    ctx.fillStyle = '#fff';
    ctx.fillRect(e.x + 6, e.y + 4, 4, 2);
    ctx.fillStyle = '#ff6b6b';
  });

  // desenha balas do jogador
  ctx.fillStyle = '#00f9ff';
  player.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  // desenha balas inimigas
  ctx.fillStyle = '#ffd54d';
  enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  // partículas
  particles.forEach(p => {
    const alpha = Math.max(0, p.life / 700);
    ctx.fillStyle = `rgba(255,200,80,${alpha})`;
    ctx.fillRect(p.x, p.y, 2, 2);
  });
}

// --- game loop com requestAnimationFrame
function loop(ts) {
  if (!lastTime) lastTime = ts;
  const dt = ts - lastTime;
  lastTime = ts;

  if (running) {
    update(dt);
    draw();
  } else {
    // desenha frame estático quando pausado/parado
    draw();
  }

  requestAnimationFrame(loop);
}

// --- entrada do jogador
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ' || e.key === 'Spacebar') {
    // evita scroll
    e.preventDefault();
    playerShoot();
  }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// comportamento de movimento aplicado em cada frame
function handleInput(dt) {
  if (!running) return;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
    player.x -= player.speed * dt/16;
  }
  if (keys['ArrowRight'] || keys['d'] || keys['D']) {
    player.x += player.speed * dt/16;
  }
  // limites da tela
  player.x = Math.max(player.w/2, Math.min(W - player.w/2, player.x));
}

// Integre handleInput na atualização principal
const originalUpdate = update;
update = function(dt) {
  handleInput(dt);
  originalUpdate(dt);
};

// --- UI buttons
document.getElementById('start').addEventListener('click', () => {
  if (!running) {
    running = true;
    lastTime = 0;
  }
});
document.getElementById('pause').addEventListener('click', () => { running = false; });
document.getElementById('restart').addEventListener('click', () => {
  resetGame();
  running = true;
});
document.getElementById('difficulty').addEventListener('change', (e) => {
  difficulty = parseFloat(e.target.value);
});

// inicializa
resetGame();
requestAnimationFrame(loop);
