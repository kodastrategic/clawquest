// --- Motor de Áudio Pro (Síntese Avançada) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bgmInstance = null;

function playBGM() { 
    if (bgmInstance) return; 
    bgmInstance = new Audio(CONFIG.AUDIO.PATH); 
    bgmInstance.loop = CONFIG.AUDIO.LOOP; 
    bgmInstance.volume = CONFIG.AUDIO.VOL; 
    bgmInstance.play().catch(e => console.log("Waiting interaction...")); 
}

function playSound(type, volume = 0.05) { 
    if (audioCtx.state === 'suspended' || !gameActive) return; 
    
    const now = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);

    if (type === 'shoot') {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        osc.start(); osc.stop(now + 0.15);
    } 
    else if (type === 'mg-shoot') {
        const osc = audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        osc.start(); osc.stop(now + 0.05);
    }
    else if (type === 'laser-beam') {
        const osc = audioCtx.createOscillator();
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.4);
        lfo.frequency.value = 30; 
        lfoGain.gain.value = 50;
        lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.connect(gain);
        lfo.start(); osc.start();
        lfo.stop(now + 0.4); osc.stop(now + 0.4);
    }
    else if (type === 'alien-voice') {
        const osc = audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(20, now + 0.6);
        const lfo = audioCtx.createOscillator();
        lfo.frequency.value = 25;
        const lfoG = audioCtx.createGain(); lfoG.gain.value = 40;
        lfo.connect(lfoG); lfoG.connect(osc.frequency);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.connect(gain);
        lfo.start(); osc.start();
        lfo.stop(now + 0.6); osc.stop(now + 0.6);
    }
    else if (type === 'explode') {
        const bufSize = audioCtx.sampleRate * 0.4;
        const buffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        noise.connect(filter); filter.connect(gain);
        noise.start(); noise.stop(now + 0.4);
    }
    else if (type === 'upgrade') {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.connect(gain);
        osc.start(); osc.stop(now + 0.3);
    }
    else if (type === 'hit') {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(10, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.connect(gain);
        osc.start(); osc.stop(now + 0.1);
    }
}

// --- Core Engine ---
const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
const radarCanvas = document.getElementById('radarCanvas'), rtx = radarCanvas.getContext('2d');
const mainMenu = document.getElementById('mainMenu'), ui = document.getElementById('ui'), staminaArea = document.getElementById('staminaArea'), mainHUD = document.getElementById('mainHUD'), radarContainer = document.getElementById('radarContainer'), pemHUD = document.getElementById('pemHUD'), boostHUD = document.getElementById('boostHUD');
const killEl = document.getElementById('killVal'), ammoEl = document.getElementById('ammoVal'), shieldEl = document.getElementById('shieldVal'), interactHint = document.getElementById('interactHint'), hpFill = document.getElementById('hpFill');
const inpSpeed = document.getElementById('inpSpeed'), inpSpawn = document.getElementById('inpSpawn');

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();

let player, camera, mouse = {x:0, y:0, down:false}, enemies, bullets, powerups, particles, trail, enemyBullets, chests, poeira, nebulosas, orbes, shocks;
let meteoros, estrelasCadentes, obstaculos;
let kills, bestKills = localStorage.getItem('clawQuest_bestKills') || 0, gameActive = false, keys = {}, lastSpawnTime, spawnInterval, lastChestSpawn, startTime, frameCount, screenShake = 0, isTraining = false;
let chestInterval, chestMax;
const GRID_SIZE = 100;

const meteorSprites = {};
const enemySprites = {};
const itemSprites = {};
const chestSprites = {};
const playerSprite = new Image();

let currentSkinIndex = 0;

function loadSprites() {
    updateSkin();
    CONFIG.AMBIENTE.METEORO_TYPES.forEach(t => {
        const img = new Image();
        img.src = t.src;
        meteorSprites[t.id] = img;
    });
    
    enemySprites.normal = new Image(); enemySprites.normal.src = CONFIG.INIMIGOS.NORMAL.src;
    enemySprites.interceptor = new Image(); enemySprites.interceptor.src = CONFIG.INIMIGOS.INTERCEPTOR.src;
    enemySprites.scout = new Image(); enemySprites.scout.src = CONFIG.INIMIGOS.SCOUT.src;

    itemSprites.ammo = new Image(); itemSprites.ammo.src = CONFIG.ITENS.AMMO.src;
    itemSprites.boost = new Image(); itemSprites.boost.src = CONFIG.EQUIPAMENTOS.BOOST.src;
    itemSprites.stamina_bar = new Image(); itemSprites.stamina_bar.src = CONFIG.ITENS.STAMINA_BAR.src;
    itemSprites.shield = new Image(); itemSprites.shield.src = CONFIG.ITENS.SHIELD.src;
    itemSprites.health = new Image(); itemSprites.health.src = CONFIG.ITENS.HEALTH.src;
    itemSprites.pem = new Image(); itemSprites.pem.src = CONFIG.EQUIPAMENTOS.PEM.src;
    itemSprites.mg = new Image(); itemSprites.mg.src = 'assets/sprites/itens/mg.png';

    chestSprites.ammo = new Image(); chestSprites.ammo.src = CONFIG.ITENS.BAU_AMMO.src;
    chestSprites.health = new Image(); chestSprites.health.src = CONFIG.ITENS.BAU_HEALTH.src;
    chestSprites.normal = new Image(); chestSprites.normal.src = CONFIG.ITENS.BAU_BLACK.src;
    chestSprites.gold = new Image(); chestSprites.gold.src = CONFIG.ITENS.BAU_GOLD.src;
}
loadSprites();

window.addEventListener('keydown', e => { 
    keys[e.code] = true; 
    if (e.code === 'Escape' && gameActive) endGame(); 
    if (e.code === 'KeyI' && gameActive && isTraining) toggleInventory(); 
    if (e.code === 'KeyE' && gameActive) tryInteract(); 
    if (e.code === 'Space' && gameActive) dispararPEM();
    if (e.code === 'KeyF' && gameActive) usarBoost(); 
    if (e.code === 'Digit1') switchWeapon('single'); 
    if (e.code === 'Digit2' && (player.hasMachineGun || isTraining)) switchWeapon('mg'); 
});
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mousedown', () => { 
    mouse.down = true; 
    if (audioCtx.state === 'suspended') audioCtx.resume(); 
    if(gameActive && document.getElementById('inventory').style.display !== 'block') {
        if (player.weapon === 'single') shoot();
    }
});
window.addEventListener('mouseup', () => { mouse.down = false; });

function toggleInventory() { const inv = document.getElementById('inventory'); inv.style.display = inv.style.display === 'block' ? 'none' : 'block'; }
function spawnDebugItem(type) { 
    if (type === 'orbe') { orbes.push({ angle: Math.random() * Math.PI * 2, x: 0, y: 0 }); playSound('upgrade'); } 
    else if (type === 'pem') { player.cargasPEM = Math.min(CONFIG.EQUIPAMENTOS.PEM.CARGAS_MAX, player.cargasPEM + 1); updatePEMHUD(); playSound('upgrade'); } 
    else if (type === 'boost') { player.cargasBoost = Math.min(CONFIG.EQUIPAMENTOS.BOOST.CARGAS_MAX, player.cargasBoost + 1); updateBoostHUD(); playSound('upgrade'); }
    else { spawnLoot(player.x, player.y - 50, type); } 
    toggleInventory(); 
}

function changeSkin(dir) {
    currentSkinIndex += dir;
    if (currentSkinIndex < 0) currentSkinIndex = CONFIG.PLAYER.SKINS.length - 1;
    if (currentSkinIndex >= CONFIG.PLAYER.SKINS.length) currentSkinIndex = 0;
    updateSkin();
}

function updateSkin() {
    const skinPath = CONFIG.PLAYER.SKINS[currentSkinIndex];
    playerSprite.src = skinPath;
    const previewEl = document.getElementById('skinPreview');
    if (previewEl) previewEl.src = skinPath;
}

function createMeteoroData(size) {
    const points = [];
    const numPoints = 8 + Math.floor(Math.random() * 5);
    for(let p=0; p<numPoints; p++) {
        const a = (p / numPoints) * Math.PI * 2;
        const r = (size/2) * (0.8 + Math.random() * 0.4);
        points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    const craters = [];
    for(let c=0; c<3; c++) {
        craters.push({ 
            x: (Math.random()-0.5)*size*0.4, 
            y: (Math.random()-0.5)*size*0.4, 
            r: Math.random()*size*0.15 
        });
    }
    return { points, craters };
}

function startGame(tm) {
    playBGM(); isTraining = tm; frameCount = 0; let bv = parseFloat(inpSpeed.value);
    player = { 
        x: 0, y: 0, vx: 0, vy: 0, 
        size: CONFIG.PLAYER.SIZE_FISICO, 
        color: '#fff', 
        accel: CONFIG.PLAYER.ACCEL, 
        friction: CONFIG.PLAYER.FRICTION, 
        walkSpeed: bv, sprintSpeed: bv * 2.2, 
        stamina: 100, extraBars: 0, hasShield: false, angle: 0, lastShot: 0, 
        ammo: CONFIG.GAMEPLAY.AMMO_INICIAL, scrap: 0, cargasPEM: 1, cargasBoost: 1, 
        weapon: 'single', hasMachineGun: false, currentSpendingBar: 0, 
        hp: CONFIG.GAMEPLAY.VIDA_INICIAL, maxHp: CONFIG.GAMEPLAY.VIDA_INICIAL, 
        flashTime: 0, trailAlpha: 0 
    };
    camera = { x: 0, y: 0 }; enemies = []; bullets = []; powerups = []; particles = []; trail = []; enemyBullets = []; chests = []; kills = 0; startTime = Date.now(); lastSpawnTime = 0; lastChestSpawn = Date.now(); orbes = []; shocks = [];
    
    updateSkin();
    updateScrapUI();

    meteoros = [];
    for(let i=0; i<CONFIG.AMBIENTE.METEOROS_QTD; i++) {
        const type = CONFIG.AMBIENTE.METEORO_TYPES[Math.floor(Math.random()*CONFIG.AMBIENTE.METEORO_TYPES.length)];
        const size = 150 + Math.random() * 200;
        const data = createMeteoroData(size);
        meteoros.push({
            x: Math.random() * 4000 - 2000,
            y: Math.random() * 4000 - 2000,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size, typeId: type.id, ...data,
            angle: Math.random() * Math.PI * 2,
            rotSpd: (Math.random() - 0.5) * 0.04
        });
    }

    obstaculos = [];
    for(let i=0; i<CONFIG.AMBIENTE.OBSTACULOS_QTD; i++) {
        const type = CONFIG.AMBIENTE.METEORO_TYPES[Math.floor(Math.random()*CONFIG.AMBIENTE.METEORO_TYPES.length)];
        const size = 50 + Math.random() * 80;
        const data = createMeteoroData(size);
        obstaculos.push({
            x: Math.random() * 8000 - 4000,
            y: Math.random() * 8000 - 4000,
            vx: (Math.random() - 0.5) * 1.0,
            vy: (Math.random() - 0.5) * 1.0,
            size, typeId: type.id, ...data,
            angle: Math.random() * Math.PI * 2,
            rotSpd: (Math.random() - 0.5) * 0.03
        });
    }

    estrelasCadentes = [];
    const lootMult = parseInt(document.getElementById('inpLoot').value);
    spawnInterval = 2200 / parseInt(inpSpawn.value);
    chestInterval = CONFIG.GAMEPLAY.CHEST_INTERVAL / lootMult;
    chestMax = CONFIG.GAMEPLAY.CHEST_MAX * lootMult;

    poeira = []; for(let i=0; i<CONFIG.AMBIENTE.POEIRA_QTD; i++) poeira.push({ x: Math.random()*2000-1000, y: Math.random()*2000-1000, vx: (Math.random()-0.5)*CONFIG.AMBIENTE.POEIRA_VEL_MAX, vy: (Math.random()-0.5)*CONFIG.AMBIENTE.POEIRA_VEL_MAX, size: Math.random()*2+0.5 });
    
    nebulosas = []; 
    for(let i=0; i<CONFIG.AMBIENTE.NEBULOSA_QTD; i++) {
        nebulosas.push({ 
            x: Math.random()*8000-4000, 
            y: Math.random()*8000-4000, 
            size: 400 + Math.random()*800,
            color: CONFIG.AMBIENTE.NEBULOSA_CORES[Math.floor(Math.random()*CONFIG.AMBIENTE.NEBULOSA_CORES.length)],
            driftX: (Math.random() - 0.5) * 0.2,
            driftY: (Math.random() - 0.5) * 0.2,
            pulseSpd: 0.005 + Math.random() * 0.01,
            pulseOffset: Math.random() * Math.PI * 2
        });
    }
    
    gameActive = true; 
    mainMenu.style.display = 'none'; 
    document.getElementById('gameOver').style.display = 'none';
    canvas.style.display = 'block'; 
    canvas.style.filter = 'none'; 
    ui.style.display = 'flex'; 
    mainHUD.style.display = 'flex'; 
    radarContainer.style.display = 'block';

    // Ativa controles mobile se for touch
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.getElementById('mobileControls').style.display = 'block';
        initMobileControls();
    }

    updateStaminaUI(); updateHPUI(); updatePEMHUD(); updateBoostHUD();
}

let moveJoy = { x: 0, y: 0, active: false }, shootJoy = { x: 0, y: 0, active: false };

function initMobileControls() {
    const joyM = document.getElementById('joystickMove'), stickM = joyM.querySelector('.joystick-stick');
    const joyS = document.getElementById('joystickShoot'), stickS = joyS.querySelector('.joystick-stick');

    const handleJoy = (e, joy, stick, isMove) => {
        const rect = joy.getBoundingClientRect();
        const touch = Array.from(e.touches).find(t => 
            t.clientX >= rect.left && t.clientX <= rect.right &&
            t.clientY >= rect.top && t.clientY <= rect.bottom
        );
        if (!touch) return;

        const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
        let dx = touch.clientX - centerX, dy = touch.clientY - centerY;
        const dist = Math.hypot(dx, dy), max = rect.width / 2;
        
        if (dist > max) { dx *= max/dist; dy *= max/dist; }
        
        stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        joy.x = dx / max; joy.y = dy / max; joy.active = true;
    };

    const resetJoy = (joy, stick) => {
        stick.style.transform = 'translate(-50%, -50%)';
        joy.x = 0; joy.y = 0; joy.active = false;
    };

    window.addEventListener('touchstart', e => { 
        handleJoy(e, moveJoy, stickM, true); 
        handleJoy(e, shootJoy, stickS, false); 
    });
    window.addEventListener('touchmove', e => { 
        handleJoy(e, moveJoy, stickM, true); 
        handleJoy(e, shootJoy, stickS, false); 
    });
    window.addEventListener('touchend', e => {
        // Verifica qual toque saiu
        const touches = Array.from(e.touches);
        if (!touches.some(t => t.clientX < window.innerWidth/2)) resetJoy(moveJoy, stickM);
        if (!touches.some(t => t.clientX >= window.innerWidth/2)) resetJoy(shootJoy, stickS);
    });

    document.getElementById('btnPemMobile').onclick = dispararPEM;
    document.getElementById('btnBoostMobile').onclick = usarBoost;
}

function updateScrapUI() { const scrapEl = document.getElementById('scrapVal'); if (scrapEl) scrapEl.innerText = player.scrap || 0; }
function updatePEMHUD() { pemHUD.innerHTML = ''; for(let i=0; i<CONFIG.EQUIPAMENTOS.PEM.CARGAS_MAX; i++) { let s = document.createElement('div'); s.className = 'slot pem' + (i < player.cargasPEM ? ' active' : ''); pemHUD.appendChild(s); } }
function updateBoostHUD() { boostHUD.innerHTML = ''; for(let i=0; i<CONFIG.EQUIPAMENTOS.BOOST.CARGAS_MAX; i++) { let s = document.createElement('div'); s.className = 'slot stamina' + (i < player.cargasBoost ? ' active' : ''); boostHUD.appendChild(s); } }

function updateRadar() { rtx.clearRect(0, 0, 150, 150); const s = CONFIG.GAMEPLAY.RADAR_ZOOM; rtx.strokeStyle = 'rgba(0, 255, 0, 0.2)'; rtx.beginPath(); rtx.arc(75, 75, 35, 0, Math.PI*2); rtx.stroke(); rtx.beginPath(); rtx.arc(75, 75, 70, 0, Math.PI*2); rtx.stroke(); const sw = (Date.now()/1000)%(Math.PI*2); rtx.fillStyle = 'rgba(0, 255, 0, 0.05)'; rtx.beginPath(); rtx.moveTo(75, 75); rtx.arc(75, 75, 75, sw, sw+0.5); rtx.fill(); enemies.forEach(e => { const dx = (e.x-player.x)*s, dy = (e.y-player.y)*s; if (Math.hypot(dx,dy)<70) { rtx.fillStyle=e.type==='BOSS'?'#ff00ff':'#ff0000'; rtx.fillRect(75+dx-2, 75+dy-2, 4, 4); } }); chests.forEach(c => { const dx = (c.x-player.x)*s, dy = (c.y-player.y)*s; if (Math.hypot(dx,dy)<70) { rtx.fillStyle=c.color; rtx.beginPath(); rtx.arc(75+dx, 75+dy, 3, 0, Math.PI*2); rtx.fill(); } }); rtx.fillStyle = '#00ff00'; rtx.fillRect(73, 73, 4, 4); }
function updateHPUI() { const pct = (player.hp / player.maxHp) * 100; hpFill.style.width = Math.max(0, pct) + '%'; }
function takeDamage(amt) { if (player.hasShield) { player.hasShield = false; playSound('explode'); createExplosion(player.x, player.y, '#0066ff'); return; } player.hp -= amt; updateHPUI(); player.flashTime = 10; screenShake = 15; if (player.hp <= 0 && !isTraining) endGame(); else playSound('hit'); }
function createExplosion(x, y, color, count = 16) { for(let i=0; i<count; i++) { particles.push({ x, y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, size: Math.random()*CONFIG.PARTICULAS.EXPLODE_TAM+1, color, life: 1.0, decay: Math.random()*0.03+0.01 }); } }
function switchWeapon(type) { if (!gameActive) return; player.weapon = type; }
function sortear(tab) { let r = Math.random(), ac = 0; for (let i in tab) { ac += tab[i]; if (r <= ac) return i; } return Object.keys(tab)[0]; }
function updateStaminaUI() { staminaArea.innerHTML = ''; for(let i = 0; i <= player.extraBars; i++) { let c = document.createElement('div'); c.className = 'stamina-container'; let f = document.createElement('div'); f.className = 'stamina-fill'; f.id = 'staminaFill' + i; c.appendChild(f); staminaArea.prepend(c); } }
function lerpColor(a, b, m) { const ah = parseInt(a.replace(/#/g, ''), 16), ar = ah >> 16, ag = (ah >> 8) & 0xff, ab = ah & 0xff, bh = parseInt(b.replace(/#/g, ''), 16), br = bh >> 16, bg = (bh >> 8) & 0xff, bb = bh & 0xff, rr = ar + m * (br - ar), rg = ag + m * (bg - ag), rb = ab + m * (bb - ab); return '#' + ((1 << 24) + (Math.round(rr) << 16) + (Math.round(rg) << 8) + Math.round(rb)).toString(16).slice(1); }
function drawGrid() { ctx.strokeStyle = '#151515'; const sx = Math.floor(camera.x/GRID_SIZE)*GRID_SIZE, sy = Math.floor(camera.y/GRID_SIZE)*GRID_SIZE; ctx.beginPath(); for (let x = sx; x < sx + canvas.width + GRID_SIZE; x += GRID_SIZE) { ctx.moveTo(x-camera.x, 0); ctx.lineTo(x-camera.x, canvas.height); } for (let y = sy; y < sy + canvas.height + GRID_SIZE; y += GRID_SIZE) { ctx.moveTo(0, y-camera.y); ctx.lineTo(canvas.width, y-camera.y); } ctx.stroke(); }

function endGame() {
    gameActive = false;
    document.querySelectorAll('.mob-slime, .mob-alien, .mob-ammo').forEach(el => el.remove());
    if (kills > bestKills) {
        bestKills = kills;
        localStorage.setItem('clawQuest_bestKills', bestKills);
    }
    document.getElementById('gameOver').style.display = 'flex';
    document.getElementById('gameOverStats').innerHTML = `
        KILLS: ${kills}<br>
        BEST: ${bestKills}<br>
        TIME: ${Math.floor((Date.now() - startTime)/1000)}s
    `;
    canvas.style.filter = 'blur(10px)';
    ui.style.display = 'none';
    mainHUD.style.display = 'none';
    radarContainer.style.display = 'none';
}

function returnToMenu() {
    document.getElementById('gameOver').style.display = 'none';
    canvas.style.display = 'none';
    canvas.style.filter = 'none'; 
    mainMenu.style.display = 'flex';
    document.getElementById('lastStats').style.display = 'block';
    document.getElementById('lastResult').innerText = `LAST RUN: ${kills} KILLS | BEST: ${bestKills}`;
}

function update() {
    if (!gameActive) return; 

    // --- CONTROLES COMBINADOS (MOBILE + TECLADO) ---
    if (shootJoy.active) {
        player.angle = Math.atan2(shootJoy.y, shootJoy.x);
        shoot(); // Atira automaticamente ao mover o joystick de tiro
    } else if (!('ontouchstart' in window)) {
        player.angle = Math.atan2(mouse.y - (canvas.height/2), mouse.x - (canvas.width/2));
    }

    if (player.weapon === 'mg' && mouse.down) shoot();

    const isM = (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] || moveJoy.active);
    let canS = (keys['ShiftLeft'] || keys['ShiftRight']) && (player.stamina > 0 || player.currentSpendingBar > 0) && isM;
    
    // Boost automático no mobile se o joystick estiver no limite? (Opcional, vamos manter manual por enquanto)

    if (canS) { 
        player.stamina -= 0.8; 
        if (player.stamina <= 0 && player.currentSpendingBar > 0) { 
            player.currentSpendingBar--; 
            player.stamina = 100; 
        } 
        player.accel = CONFIG.PLAYER.ACCEL * 2; 
    }
    else { 
        if (player.stamina < 100) player.stamina += CONFIG.PLAYER.STAMINA_REGEN; 
        else if (player.currentSpendingBar < player.extraBars) { 
            player.currentSpendingBar++; 
            player.stamina = 1; 
        } 
        player.accel = CONFIG.PLAYER.ACCEL; 
    }

    // Aplica Movimento
    if (moveJoy.active) {
        player.vx += moveJoy.x * player.accel;
        player.vy += moveJoy.y * player.accel;
    } else {
        if (keys['KeyW']) player.vy -= player.accel; 
        if (keys['KeyS']) player.vy += player.accel; 
        if (keys['KeyA']) player.vx -= player.accel; 
        if (keys['KeyD']) player.vx += player.accel;
    }

    player.vx *= player.friction; player.vy *= player.friction; 
    const curM = canS ? player.sprintSpeed : player.walkSpeed;
    let spd = Math.hypot(player.vx, player.vy); 
    if (spd > curM) { player.vx = (player.vx / spd) * curM; player.vy = (player.vy / spd) * curM; }
    
    player.x += player.vx; player.y += player.vy;
    
    const tx = player.x - Math.cos(player.angle)*35, ty = player.y - Math.sin(player.angle)*35; 
    trail.push({ x: tx, y: ty, life: 1.0 }); 
    if (trail.length > CONFIG.CAUDA.COMPRIMENTO) trail.shift();
    
    trail.forEach((t, i) => { t.life -= 0.02; if (t.life <= 0) trail.splice(i, 1); });
    
    camera.x = player.x - canvas.width / 2; camera.y = player.y - canvas.height / 2;
    // ... resto do código ...
    orbes.forEach((o, i) => { o.angle += CONFIG.GAMEPLAY.ORBE_VEL; o.x = player.x + Math.cos(o.angle) * CONFIG.GAMEPLAY.ORBE_RAIO; o.y = player.y + Math.sin(o.angle) * CONFIG.GAMEPLAY.ORBE_RAIO; });
    shocks.forEach((s, i) => { s.r += 15; s.life -= 0.02; if (s.life <= 0) shocks.splice(i, 1); });
    
    meteoros.forEach(m => {
        m.x += m.vx; m.y += m.vy;
        m.x -= player.vx * 2.5; 
        m.y -= player.vy * 2.5;
        m.angle += m.rotSpd;
        const margin = 500;
        if (m.x < -margin) m.x = canvas.width + margin; if (m.x > canvas.width + margin) m.x = -margin;
        if (m.y < -margin) m.y = canvas.height + margin; if (m.y > canvas.height + margin) m.y = -margin;
    });

    obstaculos.forEach((o, i) => {
        o.x += o.vx; o.y += o.vy;
        o.angle += o.rotSpd;
        if (o.x < camera.x - 1000) o.x += 3000; if (o.x > camera.x + canvas.width + 1000) o.x -= 3000;
        if (o.y < camera.y - 1000) o.y += 3000; if (o.y > camera.y + canvas.height + 1000) o.y -= 3000;
        for(let j = i + 1; j < obstaculos.length; j++) {
            let o2 = obstaculos[j];
            let dist = Math.hypot(o.x - o2.x, o.y - o2.y);
            if (dist < (o.size/2 + o2.size/2)) {
                let ang = Math.atan2(o.y - o2.y, o.x - o2.x);
                o.vx += Math.cos(ang) * 0.5; o.vy += Math.sin(ang) * 0.5;
                o2.vx -= Math.cos(ang) * 0.5; o2.vy -= Math.sin(ang) * 0.5;
            }
        }
        if (Math.hypot(player.x - o.x, player.y - o.y) < o.size/2 + player.size/2) {
            takeDamage(0.5); 
            player.vx *= 0.5; player.vy *= 0.5; 
        }
        enemies.forEach(e => {
            if (Math.hypot(e.x - o.x, e.y - o.y) < o.size/2 + e.size/2) {
                let ang = Math.atan2(e.y - o.y, e.x - o.x);
                e.x += Math.cos(ang) * 2; e.y += Math.sin(ang) * 2;
            }
        });
        bullets.forEach((b, bi) => {
            if (Math.hypot(b.x - o.x, b.y - o.y) < o.size/2) {
                bullets.splice(bi, 1);
                createExplosion(b.x, b.y, "#666", 3);
                
                // Meteoros/Obstáculos agora quebram e dropam sucata
                if (!o.hp) o.hp = 3; // 3 tiros para quebrar um meteoro
                o.hp--;
                o.flashTime = 5; 

                if (o.hp <= 0) {
                    createExplosion(o.x, o.y, "#444", 15);
                    playSound('explode');
                    
                    // 70% de chance de dropar sucata
                    if (Math.random() < 0.7) {
                        spawnLoot(o.x, o.y, 'scrap');
                    }
                    
                    obstaculos.splice(i, 1);
                }
            }
        });
    });

    powerups.forEach((p, i) => { 
        if (p.z < 0 || p.vz !== 0) { p.x += p.vx; p.y += p.vy; p.vz += p.gravity; p.z += p.vz; p.vx *= p.friction; p.vy *= p.friction; if (p.z > 0) { p.z = 0; p.vz = 0; p.vx = 0; p.vy = 0; p.canCollect = true; } } 
        if (p.canCollect) p.angle += p.rotSpd;
        const dist = Math.hypot(player.x - p.x, player.y - p.y); 
        if (p.canCollect && dist < 150) { p.x += (player.x - p.x) * 0.1; p.y += (player.y - p.y) * 0.1; } 
        if (p.canCollect && dist < 50) { 
            if(p.type === 'ammo') player.ammo += 15; 
            if(p.type === 'scrap') { player.scrap = (player.scrap || 0) + 1; updateScrapUI(); }
            if(p.type === 'shield') player.hasShield = true; 
            if(p.type === 'stamina') { player.extraBars++; player.currentSpendingBar = player.extraBars; updateStaminaUI(); } 
            if(p.type === 'mg') { player.hasMachineGun = true; switchWeapon('mg'); } 
            if(p.type === 'health') { player.hp = Math.min(player.maxHp, player.hp + 25); updateHPUI(); } 
            if(p.type === 'orbe') { orbes.push({ angle: 0, x: 0, y: 0 }); } 
            if(p.type === 'pem') { player.cargasPEM = Math.min(CONFIG.EQUIPAMENTOS.PEM.CARGAS_MAX, player.cargasPEM + 1); updatePEMHUD(); } 
            if(p.type === 'boost') { player.cargasBoost = Math.min(CONFIG.EQUIPAMENTOS.BOOST.CARGAS_MAX, player.cargasBoost + 1); updateBoostHUD(); } 
            
            if (p.ammoEl) p.ammoEl.remove();
            powerups.splice(i, 1); playSound('upgrade'); 
            if(isTraining) setTimeout(() => spawnLoot(p.x, p.y, p.type), 2000); 
        } 
    });

    if (Math.random() < CONFIG.AMBIENTE.ESTRELAS_CADENTES_CHANCE) {
        estrelasCadentes.push({ x: Math.random() * canvas.width, y: -50, vx: -12 - Math.random() * 8, vy: 12 + Math.random() * 8, life: 1.0 });
    }
    estrelasCadentes.forEach((s, i) => { s.x += s.vx; s.y += s.vy; s.life -= 0.02; if (s.life <= 0) estrelasCadentes.splice(i, 1); });

    let now = Date.now();
    if (!isTraining) {
        if (now - lastSpawnTime > spawnInterval) { 
            const r = Math.random(); let ty = 'NORMAL'; 
            if (kills >= 50 && r < 0.05) ty = 'BOSS'; 
            else if(r < 0.12) ty = 'INTERCEPTOR'; 
            else if(r < 0.25) ty = 'SCOUT'; 
            else if(r < 0.40) ty = 'ALIEN';
            spawnEnemy(ty); lastSpawnTime = now;
        }
        if (now - lastChestSpawn > chestInterval && chests.length < chestMax) { 
            let s = sortear(CONFIG.SPAWN_BAU), t='normal'; 
            if(s==='DOURADO')t='gold'; 
            else if(s==='BRONZE')t='ammo'; 
            else if(s==='AZUL')t='shield'; 
            else if(s==='VERMELHO')t='health'; 
            else if(s==='ORBITAL')t='orbital'; 
            spawnChest(player.x + Math.cos(Math.random()*Math.PI*2)*1200, player.y + Math.sin(Math.random()*Math.PI*2)*1200, t); 
            lastChestSpawn = now; 
        }
    }
    bullets.forEach((b, bi) => { b.x += b.vx; b.y += b.vy; enemies.forEach((e, ei) => { if (Math.hypot(b.x - e.x, b.y - e.y) < e.size/2 + b.size) { bullets.splice(bi, 1); if (e.hasShield) { e.hasShield = false; playSound('explode'); createExplosion(e.x, e.y, '#0066ff'); } else { e.hp--; e.flashTime = 5; if (e.type === 'ALIEN' && e.bossState === 'idle') { e.bossState = 'aggro'; e.lastStateChange = Date.now(); } if(handleEnemyDeath(e)) { enemies.splice(ei, 1); } else playSound('hit'); } } }); });
    orbes.forEach(o => { enemies.forEach((e, ei) => { if (Math.hypot(o.x - e.x, o.y - e.y) < e.size/2 + 15) { if (e.type === 'ALIEN' && e.bossState === 'idle') { e.bossState = 'aggro'; e.lastStateChange = Date.now(); } e.hp = 0; handleEnemyDeath(e); enemies.splice(ei, 1); } }); });
    enemyBullets.forEach((eb, i) => { 
        eb.x += eb.vx; eb.y += eb.vy; 
        
        // Colisão com Player (Padrão)
        if (!eb.targetIsAlien) {
            if (Math.hypot(player.x - eb.x, player.y - eb.y) < player.size/2) { 
                enemyBullets.splice(i, 1); 
                takeDamage(CONFIG.GAMEPLAY.DANO_TIRO); 
            }
        } 
        // Colisão com Aliens (Se for tiro de Scout caçador)
        else {
            enemies.forEach((e, ei) => {
                if (e.type === 'ALIEN' && Math.hypot(e.x - eb.x, e.y - eb.y) < e.size/2) {
                    enemyBullets.splice(i, 1);
                    e.hp--;
                    e.flashTime = 5;
                    if(handleEnemyDeath(e)) {
                        enemies.splice(ei, 1);
                    }
                }
            });
        }

        if (Math.hypot(player.x - eb.x, player.y - eb.y) > 2000) enemyBullets.splice(i, 1); 
    });
    enemies.forEach((e, i) => { 
        e.flashTime > 0 && e.flashTime--; 
        if (e.type === 'ALIEN') { updateShieldEyeIA(e); } 
        else if (e.type === 'BOSS') { e.x += Math.cos(e.moveDir)*e.speed; e.y += Math.sin(e.moveDir)*e.speed; if (Math.random() < 0.01) e.moveDir = Math.random()*Math.PI*2; if (e.bossState === 'aggro') { let n = Date.now(); if (n-e.lastBossShot > 1800) { for(let j=0; j<4; j++) setTimeout(() => { if (!gameActive) return; let ang = Math.atan2(player.y-e.y, player.x-e.x); enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(ang)*7, vy: Math.sin(ang)*7, color: '#ff00ff' }); }, j * 150); e.lastBossShot = n+1000; } } } 
        else if (e.speed > 0) { 
            let d = Math.hypot(player.x-e.x, player.y-e.y); 
            if (d < CONFIG.GAMEPLAY.AGGRO_RANGE) { 
                let ang = Math.atan2(player.y-e.y, player.x-e.x); 
                
                // --- RASTRO DO SCOUT (IGUAL DO PLAYER) ---
                if (e.type === 'SCOUT') {
                    const trailAng = e.angle || ang;
                    const tx = e.x - Math.cos(trailAng) * 20;
                    const ty = e.y - Math.sin(trailAng) * 20;
                    
                    // Rastro principal (cauda de partículas contínua)
                    if (frameCount % 1 === 0) {
                        particles.push({ 
                            x: tx, y: ty, 
                            vx: (Math.random() - 0.5) * 2 - Math.cos(trailAng) * 3, 
                            vy: (Math.random() - 0.5) * 2 - Math.sin(trailAng) * 3, 
                            size: Math.random() * 5 + 2, 
                            color: '#00D4FF',
                            life: 1.0, 
                            decay: 0.03 
                        });
                        
                        // Partículas de faísca ocasionais
                        if (Math.random() < 0.3) {
                            particles.push({ 
                                x: tx, y: ty, 
                                vx: (Math.random() - 0.5) * 8, 
                                vy: (Math.random() - 0.5) * 8, 
                                size: Math.random() * 3 + 1, 
                                color: '#ffffff',
                                life: 0.8, 
                                decay: 0.05 
                            });
                        }
                    }
                }

                // --- NOVA IA DO SCOUT: MANTER DISTÂNCIA E CAÇAR ALIENS ---
                if (e.type === 'SCOUT') {
                    // Busca o Alien mais próximo
                    let closestAlien = null;
                    let minDist = Infinity;
                    enemies.forEach(other => {
                        if (other.type === 'ALIEN' && other !== e) {
                            const dAlien = Math.hypot(other.x - e.x, other.y - e.y);
                            if (dAlien < minDist) {
                                minDist = dAlien;
                                closestAlien = other;
                            }
                        }
                    });

                    // Define o alvo (Alien se houver um perto, senão Player)
                    let target = player;
                    let targetDist = d;
                    let targetAng = ang;

                    if (closestAlien && minDist < 800) {
                        target = closestAlien;
                        targetDist = minDist;
                        targetAng = Math.atan2(target.y - e.y, target.x - e.x);
                    }

                    const idealDist = 400;
                    if (targetDist > idealDist + 50) {
                        e.x += Math.cos(targetAng) * e.speed;
                        e.y += Math.sin(targetAng) * e.speed;
                    } else if (targetDist < idealDist - 50) {
                        e.x -= Math.cos(targetAng) * (e.speed * 0.8);
                        e.y -= Math.sin(targetAng) * (e.speed * 0.8);
                    } else {
                        const orbitAng = targetAng + Math.PI/2;
                        e.x += Math.cos(orbitAng) * 1.5;
                        e.y += Math.sin(orbitAng) * 1.5;
                    }

                    // Atira no Alvo Atual
                    const now = Date.now();
                    if (!e.lastShot) e.lastShot = 0;
                    if (now - e.lastShot > 1500 && targetDist < 600) {
                        const bulletVel = CONFIG.INIMIGOS.SCOUT.VEL_TIRO || 6;
                        enemyBullets.push({ 
                            x: e.x, y: e.y, 
                            vx: Math.cos(targetAng) * bulletVel, 
                            vy: Math.sin(targetAng) * bulletVel, 
                            angle: targetAng,
                            isScoutBullet: true,
                            targetIsAlien: (target !== player),
                            color: '#00D4FF' 
                        });
                        e.lastShot = now;
                        playSound('shoot', 0.03);
                    }
                } else {
                    // IA PADRÃO (Normal, Interceptor): Perseguição Total
                    e.x += Math.cos(ang)*e.speed; e.y += Math.sin(ang)*e.speed; 
                }
            } 
        } 
        if (Math.hypot(player.x-e.x, player.y-e.y) < (player.size/2 + e.size/2)) { takeDamage(CONFIG.GAMEPLAY.DANO_TOUCH); if(!e.isTrainingTarget && e.type !== 'BOSS' && e.type !== 'ALIEN') { 
            if (e.slimeEl) e.slimeEl.remove();
            if (e.alienEl) e.alienEl.remove(); 
            createExplosion(e.x, e.y, e.color, 10); enemies.splice(i, 1); 
        } } 
    });
    particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.life -= p.decay; if (p.life <= 0) particles.splice(i, 1); });
    if (player.flashTime > 0) player.flashTime--; updateRadar(); killEl.innerText = kills; ammoEl.innerText = player.ammo; shieldEl.innerText = player.hasShield ? "ON" : "OFF";
    for(let i = 0; i <= player.extraBars; i++) { let f = document.getElementById('staminaFill' + i); if(f) f.style.width = (i < player.currentSpendingBar ? 100 : (i === player.currentSpendingBar ? player.stamina : 0)) + '%'; }
}

function draw() {
    if (!gameActive) { requestAnimationFrame(draw); return; }
    frameCount++; ctx.clearRect(0, 0, canvas.width, canvas.height); 
    if (CONFIG.AMBIENTE.NEBULOSA_ATIVO) {
        nebulosas.forEach(n => {
            const px = n.x - camera.x * CONFIG.AMBIENTE.PARALLAX_FACTOR, py = n.y - camera.y * CONFIG.AMBIENTE.PARALLAX_FACTOR;
            const pulse = (Math.sin(frameCount * n.pulseSpd + n.pulseOffset) + 1) / 2;
            const curSize = n.size * (0.9 + pulse * 0.2);
            ctx.save(); ctx.globalCompositeOperation = 'screen';
            const g = ctx.createRadialGradient(px, py, 0, px, py, curSize);
            g.addColorStop(0, n.color); g.addColorStop(0.5, n.color.replace('0.15', '0.05').replace('0.12', '0.04')); g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g; ctx.fillRect(px - curSize, py - curSize, curSize * 2, curSize * 2); ctx.restore();
            n.x += n.driftX; n.y += n.driftY;
        });
    }
    drawGrid(); ctx.save(); 
    if (screenShake > 0) { ctx.translate(Math.random()*screenShake-screenShake/2, Math.random()*screenShake-screenShake/2); screenShake *= 0.9; }
    ctx.translate(-camera.x, -camera.y);
    poeira.forEach(p => { p.x += p.vx; p.y += p.vy; if(p.x < player.x - canvas.width) p.x += canvas.width * 2; if(p.x > player.x + canvas.width) p.x -= canvas.width * 2; if(p.y < player.y - canvas.height) p.y += canvas.height * 2; if(p.y > player.y + canvas.height) p.y -= canvas.height * 2; ctx.fillStyle = CONFIG.AMBIENTE.POEIRA_COR; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); });
    obstaculos.forEach(o => drawMeteoro(o, true));
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(player.x, player.y + 15, 15, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1.0; ctx.shadowBlur = 0; 
    powerups.forEach(p => drawLoot(p));
    chests.forEach(drawChestEntity);
    const sp = Math.hypot(player.vx, player.vy); let tAlpha = Math.min(0.6, sp * 0.1);
    if (tAlpha > 0.01) {
        if (CONFIG.GLOW.CAUDA_ON) { ctx.shadowBlur = CONFIG.GLOW.CAUDA_INTENSE; ctx.shadowColor = CONFIG.GLOW.CAUDA_COR; }
        for (let i = 0; i < trail.length - 1; i++) {
            const t1 = trail[i], t2 = trail[i+1], ratio = i / trail.length;
            let color, op;
            if (ratio < 0.5) { const r2 = ratio * 2; color = lerpColor(CONFIG.CAUDA.COR_FIM, CONFIG.CAUDA.COR_MEIO, r2); op = 0.0 + r2 * (1.0 - 0.0); }
            else { const r2 = (ratio - 0.5) * 2; color = lerpColor(CONFIG.CAUDA.COR_MEIO, CONFIG.CAUDA.COR_INICIO, r2); op = 1.0 + r2 * (1.0 - 1.0); }
            ctx.globalAlpha = op * tAlpha * t1.life; ctx.strokeStyle = color; ctx.lineWidth = ratio * CONFIG.CAUDA.LARGURA; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1.0; particles.forEach(p => { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
    ctx.globalAlpha = 1.0; if (CONFIG.GLOW.TIRO_ON) { ctx.shadowBlur = CONFIG.GLOW.TIRO_INTENSE; ctx.shadowColor = CONFIG.GLOW.TIRO_COR; }
    bullets.forEach(drawBullet); 
    ctx.shadowBlur = 0;
    
    // --- DESENHO DE TIROS DE INIMIGOS (Incluindo Scout com Visual do Player) ---
    enemyBullets.forEach(eb => { 
        if (eb.isScoutBullet) {
            // Desenha com o estilo de fogo retangular do player, mas azul
            ctx.save();
            ctx.translate(eb.x, eb.y);
            ctx.rotate(eb.angle);
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#0066ff";
            ctx.fillStyle = "#00D4FF";
            ctx.fillRect(-8, -2, 16, 4);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-4, -1, 10, 2);
            ctx.restore();
        } else {
            // Tiro padrão circular para outros (Boss, etc)
            ctx.fillStyle = eb.color; ctx.shadowBlur = 10; ctx.shadowColor = eb.color; 
            ctx.beginPath(); ctx.arc(eb.x, eb.y, 6, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; 
        }
    });

    orbes.forEach(o => { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.angle * 10); ctx.fillStyle = '#00ff00'; ctx.shadowBlur = 15; ctx.shadowColor = '#00ff00'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-12, 4); ctx.lineTo(-8, 0); ctx.lineTo(-12, -4); ctx.closePath(); ctx.fill(); ctx.rotate(Math.PI/2); ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-12, 4); ctx.lineTo(-8, 0); ctx.lineTo(-12, -4); ctx.closePath(); ctx.fill(); ctx.restore(); });
    shocks.forEach(drawShockwave);

    if (isTraining) {
        const spawnTypes = ['NORMAL', 'INTERCEPTOR', 'SCOUT', 'SLIME', 'ALIEN', 'BOSS'];
        const colors = ['#FF8800', '#A20000', '#00D4FF', '#43ffb7', '#8a3cff', '#ff00ff'];
        spawnTypes.forEach((type, i) => {
            const px = 200 + (i * 180), py = 200;
            const dist = Math.hypot(player.x - px, player.y - py);
            ctx.save(); ctx.translate(px, py);
            ctx.shadowBlur = 20; ctx.shadowColor = colors[i];
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.strokeStyle = colors[i];
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#fff"; ctx.font = "7px 'Press Start 2P'"; ctx.textAlign = "center";
            ctx.fillText(type, 0, -60);
            ctx.rotate(frameCount * 0.02); ctx.strokeRect(-12, -12, 24, 24);
            ctx.restore();
            if (dist < 45 && frameCount % 60 === 0) { 
                spawnEnemy(type);
                shocks.push({ x: px, y: py, r: 0, maxR: 150, life: 1.0 });
            }
        });
    }

    drawPlayer();
    enemies.forEach(e => { if (e.type === 'BOSS') drawBossEntity(e); else if (e.type === 'INTERCEPTOR' || e.type === 'SCOUT') drawInterceptor(e); else if (e.type === 'SLIME') drawHeavyEnemy(e); else if (e.type === 'ALIEN') drawShieldEye(e); else drawNormalEnemy(e); if(e.hasShield) { ctx.strokeStyle = '#0066ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.size/2 + 5, 0, Math.PI * 2); ctx.stroke(); } });

    ctx.restore();
    ctx.save(); ctx.filter = 'blur(15px)'; meteoros.forEach(m => drawMeteoro(m, false)); ctx.restore();
    estrelasCadentes.forEach(s => { ctx.save(); ctx.globalAlpha = s.life; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 2, s.y - s.vy * 2); ctx.stroke(); ctx.restore(); });
    requestAnimationFrame(draw);
}

window.onload = () => { draw(); };
setInterval(update, 1000/60);