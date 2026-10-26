// ── Asteroids (HTML5 Canvas) ──────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');

const W = 800, H = 600;

function rand(min, max) { return Math.random() * (max - min) + min; }
function dist(a,b)      { const dx=a.x-b.x, dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }
function wrap(v, max)   { if (v < 0) return v + max; if (v >= max) return v - max; return v; }

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = new Set();
const justPressed = new Set();

window.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') e.preventDefault();
  if (!keys.has(e.code)) justPressed.add(e.code);
  keys.add(e.code);
});

window.addEventListener('keyup', e => keys.delete(e.code));

function pressed(code) {
  if (justPressed.has(code)) { justPressed.delete(code); return true; }
  return false;
}
function down(code) { return keys.has(code); }

// ── Skins ─────────────────────────────────────────────────────────────────────
const SKIN_KEY = 'asteroids.skin';

const SKINS = [
  {
    name: 'Clásica',
    color: '#fff',
    boost: '#00e5ff',
    flame: 'rgba(255, 130, 0, 0.85)',
    shapes: [{ closed: true, points: [[20, 0], [-12, -9], [-7, 0], [-12, 9]] }],
  },
  {
    name: 'Interceptor',
    color: '#7df9ff',
    boost: '#00e5ff',
    flame: 'rgba(125, 249, 255, 0.85)',
    shapes: [{ closed: true, points: [[22, 0], [-4, -4], [-10, -12], [-6, 0], [-10, 12], [-4, 4]] }],
  },
  {
    name: 'Fantasma',
    color: '#7CFFB2',
    boost: '#00e5ff',
    flame: 'rgba(124, 255, 178, 0.85)',
    lineWidth: 1.2,
    lineDash: [4, 4],
    shapes: [{ closed: true, points: [[19, 0], [6, -8], [-8, -11], [-12, 0], [-8, 11], [6, 8]] }],
  },
  {
    name: 'Daga',
    color: '#ff7de9',
    boost: '#00e5ff',
    flame: 'rgba(255, 125, 233, 0.85)',
    shapes: [
      { closed: true, points: [[23, 0], [-6, -4], [-12, -8], [-9, 0], [-12, 8], [-6, 4]] },
      { closed: false, points: [[12, 0], [3, -1.5]] },
    ],
  },
];

function loadSkin() {
  try {
    const i = Number(localStorage.getItem(SKIN_KEY));
    return Number.isInteger(i) && i >= 0 && i < SKINS.length ? i : 0;
  } catch {
    return 0;
  }
}

let skinIndex = loadSkin();

function saveSkin() {
  try { localStorage.setItem(SKIN_KEY, String(skinIndex)); } catch { /* storage no disponible */ }
}

function traceShipShape(ctx, skin) {
  for (const { points, closed } of skin.shapes) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++)
      ctx.lineTo(points[i][0], points[i][1]);
    if (closed) ctx.closePath();
    ctx.stroke();
  }
}

// ── Balas ─────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x; this.y = y;
    const speed = 520;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 2;
    this.life = 1.2;
    this.ttl  = this.life;
    this.dead = false;
  }
  update(dt) {
    this.x    = wrap(this.x + this.vx * dt, W);
    this.y    = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
  draw() {
    const alpha = Math.min(1, this.ttl / 0.25);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroides ────────────────────────────────────────────────────────────────
const RADII  = [0, 12, 22, 36]; // 1 pequeño, 2 mediano, 3 grande
const SPEEDS = [0,  90, 70,  50];
const POINTS = [0, 100,  50,  20];
const FUGAZ_SCORE_MULT = 2;

class Asteroid {
  constructor(x, y, size, fugaz = false) {
    this.x = x; this.y = y;
    this.size  = size; // 1-3
    this.fugaz = fugaz;
    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] * rand(0.8, 1.2) * (fugaz ? 1.6 : 1);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius   = RADII[size];
    this.rot      = rand(0, Math.PI * 2);
    this.rotSpeed = rand(-1.2, 1.2);
    this.dead     = false;
    this.points   = this.makeShape();
  }

  makeShape() {
    const n = 10 + Math.floor(rand(0, 4));
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.7, 1.0);
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return pts;
  }

  update(dt) {
    this.x    = wrap(this.x + this.vx * dt, W);
    this.y    = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.fugaz ? '#ffd93b' : '#fff';
    ctx.lineWidth   = 1.4;
    ctx.beginPath();
    const p0 = this.points[0];
    ctx.moveTo(p0[0], p0[1]);
    for (let i = 1; i < this.points.length; i++) ctx.lineTo(this.points[i][0], this.points[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  split() {
    if (this.size <= 1) return [];
    const out = [];
    for (let i = 0; i < 2; i++) out.push(new Asteroid(this.x, this.y, this.size - 1, this.fugaz));
    return out;
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
const TRIPLE_SPREAD = 0.15; // rad

const SHIELD_DURATION            = 8;
const SHIELD_RADIUS              = 22;
const SHIELD_BREAK_INVINCIBILITY = 1.2;
const SHIELD_COLOR               = '#4ade80';
const SHIELD_PARTICLE_COLOR      = '74,222,128';

class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x = W/2; this.y = H/2;
    this.vx = 0; this.vy = 0;
    this.angle = -Math.PI / 2;
    this.radius = 14;
    this.thrusting = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.tripleShot    = 0;
    this.shield        = 0;
    this.shieldPhase   = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;
    if (this.tripleShot    > 0) this.tripleShot    -= dt;
    if (this.shield        > 0) {
      this.shield -= dt;
      this.shieldPhase += dt;
      if (this.shield < 0) this.shield = 0;
    }

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const MAX_V  = 320;
    const FRICTION = 0.98;

    if (down('ArrowLeft'))  this.angle -= ROT * dt;
    if (down('ArrowRight')) this.angle += ROT * dt;

    this.thrusting = down('ArrowUp');
    if (this.thrusting) {
      const t = THRUST * (this.speedBoost > 0 ? 1.6 : 1);
      this.vx += Math.cos(this.angle) * t * dt;
      this.vy += Math.sin(this.angle) * t * dt;
    }

    this.vx *= Math.pow(FRICTION, dt * 60);
    this.vy *= Math.pow(FRICTION, dt * 60);

    const spd = Math.hypot(this.vx, this.vy);
    if (spd > MAX_V) { const s = MAX_V/spd; this.vx*=s; this.vy*=s; }

    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);

    if (pressed('Space') && this.shootCooldown <= 0) {
      bullets.push(...this.shoot());
      this.shootCooldown = 0.16;
    }
  }

  shoot() {
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot <= 0) return [new Bullet(ox, oy, this.angle)];
    return [-TRIPLE_SPREAD, 0, TRIPLE_SPREAD].map(offset =>
      new Bullet(ox, oy, this.angle + offset));
  }

  applyPowerUp(type) {
    if (type === 'speed')  this.speedBoost = POWERUP_DURATION;
    if (type === 'triple') this.tripleShot  = POWERUP_DURATION;
    if (type === 'shield') this.shield      = SHIELD_DURATION;
  }

  absorbHit() {
    this.shield = 0;
    this.invincible = SHIELD_BREAK_INVINCIBILITY;
  }

  draw() {
    if (this.dead) return;

    if (this.shield > 0) this.drawShield();

    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[skinIndex];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    if (this.speedBoost > 0) {
      ctx.strokeStyle = skin.boost;
    } else if (this.tripleShot > 0) {
      ctx.strokeStyle = '#7cff6b';
    } else {
      ctx.strokeStyle = skin.color;
    }
    ctx.lineWidth   = skin.lineWidth ?? 1.5;
    ctx.lineJoin    = 'round';
    ctx.setLineDash(skin.lineDash ?? []);

    traceShipShape(ctx, skin);

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawShield() {
    // Parpadea cuando está a punto de expirar
    if (this.shield < 1.5 && Math.floor(this.shield * 8) % 2 === 0) return;

    const radius = SHIELD_RADIUS + Math.sin(this.shieldPhase * 6) * 1.5;
    ctx.save();
    ctx.strokeStyle = SHIELD_COLOR;
    ctx.lineWidth   = 2;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = SHIELD_COLOR;
    ctx.fill();
    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color = '255,255,255') {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.color = color;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(${this.color},${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── PowerUp ───────────────────────────────────────────────────────────────────
const POWERUP_RADIUS      = 10;
const POWERUP_TTL         = 12;
const POWERUP_DURATION    = 5;
const POWERUP_DROP_CHANCE = 0.15;
const POWERUP_COLORS      = { speed: '#00e5ff', triple: '#7cff6b', shield: SHIELD_COLOR };

class PowerUp {
  constructor(x, y, type = null) {
    this.x = x;
    this.y = y;
    if (type === null) {
      const r = Math.random();
      if (r < 1/3) this.type = 'speed';
      else if (r < 2/3) this.type = 'triple';
      else this.type = 'shield';
    } else {
      this.type = type;
    }
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 45);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius   = POWERUP_RADIUS;
    this.rotSpeed = rand(-2, 2);
    this.rot      = 0;
    this.ttl      = POWERUP_TTL;
    this.dead     = false;
  }

  update(dt) {
    this.x    = wrap(this.x + this.vx * dt, W);
    this.y    = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadea cuando está a punto de desaparecer
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = POWERUP_COLORS[this.type] || '#00e5ff';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    if (this.type === 'speed') this.drawSpeedIcon();
    else if (this.type === 'triple') this.drawTripleIcon();
    else if (this.type === 'shield') this.drawShieldIcon();
    ctx.restore();
  }

  drawSpeedIcon() {
    ctx.beginPath();
    ctx.moveTo( 2, -9);   // rayo
    ctx.lineTo(-5,  1);
    ctx.lineTo(-1,  1);
    ctx.lineTo(-2,  9);
    ctx.lineTo( 6, -2);
    ctx.lineTo( 1, -2);
    ctx.closePath();
    ctx.stroke();
  }

  drawTripleIcon() {
    ctx.beginPath();
    for (const y of [-7, 0, 7]) {   // tres trazos en abanico
      ctx.moveTo(-5, y * 0.35);
      ctx.lineTo( 6, y);
    }
    ctx.stroke();
  }

  drawShieldIcon() {
    const RADIUS = 8;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * RADIUS;
      const y = Math.sin(angle) * RADIUS;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score = 0, lives = 3, level = 1;
let state = 'playing'; // 'playing' | 'dead' | 'gameover'

function initGame() {
  ship = new Ship();
  bullets = [];
  asteroids = [];
  particles = [];
  powerups = [];
  score = 0; lives = 3; level = 1;
  state = 'playing';
  spawnAsteroids(4);
}

function spawnAsteroids(n) {
  for (let i = 0; i < n; i++) {
    let x,y;
    do { x = rand(0,W); y = rand(0,H); } while (dist({x,y}, ship) < 160);
    const fugaz = Math.random() < 0.12;
    asteroids.push(new Asteroid(x,y,3,fugaz));
  }
}

function nextLevel() {
  level++;
  bullets = [];
  powerups = [];
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8, color = '255,255,255') {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function killShip() {
  if (ship.dead) return;
  ship.dead = true;
  explode(ship.x, ship.y, 16);
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state = 'dead';
    setTimeout(() => respawn(), 1200);
  }
}

function respawn() {
  ship.reset();
  bullets = [];
  // Limpiar asteroides demasiado cerca
  asteroids = asteroids.filter(a => dist(a, ship) >= 140);
  state = 'playing';
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (pressed('KeyC')) {
    skinIndex = (skinIndex + 1) % SKINS.length;
    saveSkin();
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);
  asteroids = asteroids.filter(a => !a.dead);

  // Colisiones bala-asteroide
  for (const b of bullets) {
    if (b.dead) continue;
    for (const a of asteroids) {
      if (a.dead) continue;
      if (dist(b,a) < b.radius + a.radius * 0.9) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size] * (a.fugaz ? FUGAZ_SCORE_MULT : 1);
        explode(a.x, a.y, a.size * (a.fugaz ? 10 : 5));
        newAsteroids.push(...a.split());
        if (Math.random() < POWERUP_DROP_CHANCE) {
          const type = Math.random() < 0.5 ? 'shield' : (Math.random() < 0.5 ? 'speed' : 'triple');
          powerups.push(new PowerUp(a.x, a.y, type));
        }
      }
    }
  }
  bullets = bullets.filter(b => !b.dead);
  asteroids = asteroids.filter(a => !a.dead);

  // Fusionar nuevos asteroides
  for (const na of newAsteroids) asteroids.push(na);
  newAsteroids.length = 0;

  // Colisiones powerup-nave
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      ship.applyPowerUp(p.type);
      const color = p.type === 'shield' ? SHIELD_PARTICLE_COLOR : (p.type === 'triple' ? '124,255,107' : '0,229,255');
      explode(p.x, p.y, 6, color);
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Colisiones nave-asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shield > 0) {
          a.dead = true;
          explode(a.x, a.y, a.size * 5, SHIELD_PARTICLE_COLOR);
          ship.absorbHit();
        } else {
          killShip();
        }
        break;
      }
    }
    asteroids = asteroids.filter(a => !a.dead);
  }

  // Nivel completado
  if (asteroids.length === 0 && state === 'playing') {
    nextLevel();
  }
}

const newAsteroids = [];

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[skinIndex];
  const SCALE = 0.45;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(SCALE, SCALE);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = (skin.lineWidth ?? 1.5) * 0.8 / SCALE;
  ctx.lineJoin    = 'round';
  ctx.setLineDash((skin.lineDash ?? []).map(v => v / SCALE));
  traceShipShape(ctx, skin);
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  let hudY = 46;
  if (!ship.dead && ship.speedBoost > 0) {
    ctx.fillStyle = POWERUP_COLORS.speed;
    ctx.fillText(`VELOCIDAD ${ship.speedBoost.toFixed(1)}s`, 14, hudY);
    hudY += 20;
  }

  if (!ship.dead && ship.tripleShot > 0) {
    ctx.fillStyle = POWERUP_COLORS.triple;
    ctx.fillText(`TRIPLE ${ship.tripleShot.toFixed(1)}s`, 14, hudY);
    hudY += 20;
  }

  if (!ship.dead && ship.shield > 0) {
    ctx.fillStyle = SHIELD_COLOR;
    ctx.fillText(`ESCUDO ${ship.shield.toFixed(1)}s`, 14, hudY);
  }
  ctx.fillStyle = '#fff';

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font      = '13px monospace';
  ctx.fillText(`C  SKIN: ${SKINS[skinIndex].name}`, 14, H - 14);
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover') {
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font      = '14px monospace';
    ctx.fillText(`C: CAMBIAR SKIN (${SKINS[skinIndex].name})`, W / 2, H / 2 + 52);
  }
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
