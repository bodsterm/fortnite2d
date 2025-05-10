const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    speed: 5,
    health: 100,
    coins: 0,
    score: 0
};
let enemies = [];
let bullets = [];
let walls = [];
let storm = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: Math.min(canvas.width, canvas.height) * 0.8,
    shrinkSpeed: 0.02
};
let keys = {};

// DOM elements
const healthDisplay = document.getElementById('health');
const coinsDisplay = document.getElementById('coins');
const scoreDisplay = document.getElementById('score');

// Event listeners
document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('click', shoot);
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'b') buildWall();
    if (e.key.toLowerCase() === 'c') addFreeCoins();
});

// Spawn enemies
function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.max(canvas.width, canvas.height);
    enemies.push({
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        size: 15,
        speed: 2,
        health: 50
    });
}

// Shoot bullets
function shoot(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 10,
        vy: Math.sin(angle) * 10,
        size: 5
    });
}

// Build walls
function buildWall() {
    if (player.coins >= 10) {
        player.coins -= 10;
        walls.push({
            x: player.x + 30,
            y: player.y,
            width: 40,
            height: 40,
            health: 100
        });
        updateUI();
    }
}

// Add free coins (modded balance)
function addFreeCoins() {
    player.coins += 100;
    updateUI();
}

// Update UI
function updateUI() {
    healthDisplay.textContent = player.health;
    coinsDisplay.textContent = player.coins;
    scoreDisplay.textContent = player.score;
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update player
    if (keys['w'] && player.y > player.size) player.y -= player.speed;
    if (keys['s'] && player.y < canvas.height - player.size) player.y += player.speed;
    if (keys['a'] && player.x > player.size) player.x -= player.speed;
    if (keys['d'] && player.x < canvas.width - player.size) player.x += player.speed;

    // Update storm
    storm.radius -= storm.shrinkSpeed;
    if (storm.radius < 50) storm.radius = 50;

    // Check if player is outside storm
    const dx = player.x - storm.x;
    const dy = player.y - storm.y;
    if (Math.sqrt(dx * dx + dy * dy) > storm.radius) {
        player.health -= 0.1;
    }

    // Update enemies
    enemies.forEach((enemy, i) => {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        // Enemy collision with player
        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.size + enemy.size) {
            player.health -= 0.5;
        }

        // Enemy collision with walls
        walls.forEach((wall) => {
            if (enemy.x > wall.x && enemy.x < wall.x + wall.width &&
                enemy.y > wall.y && enemy.y < wall.y + wall.height) {
                enemy.health -= 10;
                wall.health -= 10;
            }
        });

        if (enemy.health <= 0) enemies.splice(i, 1);
    });

    // Update bullets
    bullets.forEach((bullet, i) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Bullet collision with enemies
        enemies.forEach((enemy, j) => {
            if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < bullet.size + enemy.size) {
                enemy.health -= 20;
                bullets.splice(i, 1);
                player.score += 10;
                if (enemy.health <= 0) {
                    enemies.splice(j, 1);
                    player.score += 50;
                }
            }
        });

        // Bullet collision with walls
        walls.forEach((wall, j) => {
            if (bullet.x > wall.x && bullet.x < wall.x + wall.width &&
                bullet.y > wall.y && bullet.y < wall.y + wall.height) {
                bullets.splice(i, 1);
                wall.health -= 20;
            }
        });

        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
        }
    });

    // Update walls
    walls = walls.filter(wall => wall.health > 0);

    // Draw storm
    ctx.beginPath();
    ctx.arc(storm.x, storm.y, storm.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Draw player
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw enemies
    ctx.fillStyle = 'red';
    enemies.forEach(enemy => {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw bullets
    ctx.fillStyle = 'black';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw walls
    ctx.fillStyle = 'gray';
    walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });

    // Spawn enemies periodically
    if (Math.random() < 0.02) spawnEnemy();

    // Update UI
    updateUI();

    // Check game over
    if (player.health <= 0) {
        ctx.fillStyle = 'red';
        ctx.font = '48px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        return;
    }

    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();
