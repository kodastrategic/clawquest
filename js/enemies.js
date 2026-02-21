function drawNormalEnemy(e) {
    ctx.save(); ctx.translate(e.x, e.y);
    const breath = (Math.sin(frameCount * 0.05) + 1) / 2;
    ctx.shadowBlur = 10 + (breath * 15);
    ctx.shadowColor = "#ff8c00";
    const rotationSpeed = 0.01;
    ctx.rotate(frameCount * rotationSpeed);
    const sprite = enemySprites.normal;
    if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
        if (e.flashTime > 0) ctx.filter = 'brightness(5)';
        ctx.drawImage(sprite, -e.size/2, -e.size/2, e.size, e.size);
        ctx.filter = 'none';
    } else {
        ctx.fillStyle = e.flashTime > 0 ? '#fff' : e.color;
        ctx.fillRect(-e.size/4, -e.size/4, e.size/2, e.size/2);
    }
    ctx.restore();
}

function drawHeavyEnemy(e) {
    if (!e.slimeEl) {
        e.slimeEl = document.createElement('div');
        e.slimeEl.className = 'mob-slime';
        e.slimeEl.innerHTML = `<div class="core"></div><div class="drop"></div><div class="drop"></div>`;
        document.body.appendChild(e.slimeEl);
    }
    const screenX = e.x - camera.x;
    const screenY = e.y - camera.y;
    if (gameActive && screenX > -120 && screenX < window.innerWidth + 120 && screenY > -120 && screenY < window.innerHeight + 120) {
        e.slimeEl.style.display = 'block';
        e.slimeEl.style.left = (screenX - 48) + 'px'; 
        e.slimeEl.style.top = (screenY - 48) + 'px';
        if (e.flashTime > 0) e.slimeEl.style.filter = 'url(#goo) brightness(3)';
        else e.slimeEl.style.filter = 'url(#goo)';
    } else {
        e.slimeEl.style.display = 'none';
    }
}

function drawShieldEye(e) {
    if (!e.alienEl) {
        e.alienEl = document.createElement('div');
        e.alienEl.className = 'mob-alien';
        e.alienEl.innerHTML = `
            <div class="alien-core">
                <div class="alien-eye">
                    <div class="eye-glow"></div>
                    <div class="eye-white">
                        <div class="eye-iris"></div>
                    </div>
                    <div class="eye-lid"></div>
                </div>
                <div class="alien-mouth"></div>
            </div>
            <div class="alien-laser-html"></div>
            <div class="alien-muzzle-html"></div>
        `;
        document.body.appendChild(e.alienEl);
    }

    const laserEl = e.alienEl.querySelector('.alien-laser-html');
    const muzzleEl = e.alienEl.querySelector('.alien-muzzle-html');
    const screenX = e.x - camera.x;
    const screenY = e.y - camera.y;

    if (gameActive && screenX > -150 && screenX < window.innerWidth + 150 && screenY > -150 && screenY < window.innerHeight + 150) {
        e.alienEl.style.display = 'block';
        e.alienEl.style.left = (screenX - 50) + 'px'; 
        e.alienEl.style.top = (screenY - 50) + 'px';
        e.alienEl.style.transform = `scale(${e.size/60})`;

        const iris = e.alienEl.querySelector('.eye-iris');
        const angToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
        
        const dx = player.x - e.x, dy = player.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        const max = 10;
        const ox = (dx/dist)*max;
        const oy = (dy/dist)*max;
        
        if (iris) iris.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;

        if (e.flashTime > 0) e.alienEl.style.filter = 'brightness(3)';
        else e.alienEl.style.filter = 'none';

        if (e.bossState === 'attacking') {
            if (laserEl) {
                laserEl.style.display = 'block';
                laserEl.style.left = (50 + ox) + 'px';
                laserEl.style.top = (45 + oy) + 'px'; 
                laserEl.style.width = '1200px'; 
                laserEl.style.transform = `rotate(${angToPlayer}rad)`;
            }
            if (muzzleEl) {
                muzzleEl.style.display = 'block';
                muzzleEl.style.left = (50 + ox) + 'px';
                muzzleEl.style.top = (45 + oy) + 'px';
            }
            // Partículas HTML
            if (frameCount % 3 === 0) {
                const p = document.createElement('div');
                p.style.position = 'absolute';
                p.style.width = '6px'; p.style.height = '6px';
                p.style.background = Math.random() < 0.5 ? '#fff' : '#ff0000';
                p.style.borderRadius = '50%';
                p.style.left = (50 + ox) + 'px'; p.style.top = (45 + oy) + 'px';
                p.style.zIndex = '10001'; p.style.pointerEvents = 'none';
                p.style.boxShadow = '0 0 10px #ff0000';
                e.alienEl.appendChild(p);
                const vx = (Math.random() - 0.5) * 15, vy = (Math.random() - 0.5) * 15;
                let life = 1.0;
                const anim = () => {
                    life -= 0.05;
                    if (life <= 0) { p.remove(); return; }
                    p.style.left = (parseFloat(p.style.left) + vx) + 'px';
                    p.style.top = (parseFloat(p.style.top) + vy) + 'px';
                    p.style.opacity = life; p.style.transform = `scale(${life})`;
                    requestAnimationFrame(anim);
                };
                requestAnimationFrame(anim);
            }
        } else {
            if (laserEl) laserEl.style.display = 'none';
            if (muzzleEl) muzzleEl.style.display = 'none';
        }
    } else {
        e.alienEl.style.display = 'none';
    }
}

function updateShieldEyeIA(e) {
    const now = Date.now(), conf = CONFIG.INIMIGOS.ALIEN;
    const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
    if (e.bossState !== 'charging' && e.bossState !== 'attacking') {
        const distFromHome = Math.hypot(e.x - e.spawnX, e.y - e.spawnY);
        if (distFromHome > 400) {
            const angHome = Math.atan2(e.spawnY - e.y, e.spawnX - e.x);
            e.x += Math.cos(angHome) * e.speed; e.y += Math.sin(angHome) * e.speed;
        } else {
            e.x += Math.cos(e.moveDir) * (e.speed * 0.6); e.y += Math.sin(e.moveDir) * (e.speed * 0.6);
            if (Math.random() < 0.01) e.moveDir = Math.random() * Math.PI * 2;
        }
    }
    switch(e.bossState) {
        case 'idle': 
            if (e.hp < conf.VIDA || distToPlayer < 400) { e.bossState = 'aggro'; e.lastStateChange = now; playSound('alien-voice', 0.1); } 
            break;
        case 'aggro': 
            if (distToPlayer < 400 && now - e.lastStateChange > 2500) { e.bossState = 'charging'; e.lastStateChange = now; } 
            break;
        case 'charging': 
            if (now - e.lastStateChange > 500) { 
                e.bossState = 'attacking'; e.lastStateChange = now; 
                playSound('laser-beam', 0.1);
                if (distToPlayer < 400) { takeDamage(35); screenShake = 15; } 
            } 
            break;
        case 'attacking': 
            if (now - e.lastStateChange > 300) { e.bossState = 'aggro'; e.lastStateChange = now; } 
            break;
    }
}

function drawInterceptor(e) {
    ctx.save(); ctx.translate(e.x, e.y);
    ctx.rotate(Math.atan2(player.y - e.y, player.x - e.x));
    
    // CORREÇÃO: Pega o sprite específico para o tipo (INTERCEPTOR ou SCOUT)
    let sprite = (e.type === 'SCOUT') ? enemySprites.scout : enemySprites.interceptor;
    
    if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
        if (e.flashTime > 0) ctx.filter = 'brightness(5)';
        ctx.drawImage(sprite, -e.size/2, -e.size/2, e.size, e.size);
        ctx.filter = 'none';
    } else {
        ctx.fillStyle = e.flashTime > 0 ? '#fff' : e.color;
        ctx.beginPath(); ctx.moveTo(e.size/2, 0); ctx.lineTo(-e.size/2, e.size/3); ctx.lineTo(-e.size/4, 0); ctx.lineTo(-e.size/2, -e.size/3); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
}

function drawBossEntity(e) {
    ctx.save(); ctx.translate(e.x, e.y);
    ctx.translate(0, Math.sin(frameCount * 0.05) * 10);
    ctx.fillStyle = e.flashTime > 0 ? '#fff' : e.color;
    ctx.fillRect(-30, -30, 60, 60);
    ctx.fillStyle = '#800080'; ctx.fillRect(-35, -10, 70, 20);
    const eyeX = (player.x - e.x) / 500 * 5, eyeY = (player.y - e.y) / 500 * 5;
    ctx.fillStyle = '#fff'; ctx.fillRect(-20 + eyeX, -20 + eyeY, 15, 15); ctx.fillRect(5 + eyeX, -20 + eyeY, 15, 15);
    ctx.fillStyle = '#000'; ctx.fillRect(-15 + eyeX * 1.5, -15 + eyeY * 1.5, 5, 5); ctx.fillRect(10 + eyeX * 1.5, -15 + eyeY * 1.5, 5, 5);
    for (let i = 0; i < 4; i++) {
        const rot = (frameCount * 0.02) + (i * Math.PI / 2), tx = Math.cos(rot) * 45, ty = Math.sin(rot) * 45;
        ctx.fillStyle = '#00ffff'; ctx.fillRect(tx - 5, ty - 5, 10, 10);
    }
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(-30, 45, 60, 8);
    ctx.fillStyle = "#ff3333"; ctx.fillRect(-30, 45, (e.hp / 12) * 60, 8);
    ctx.restore();
}

function spawnEnemy(type) {
    const dist = isTraining ? 400 : (800 + Math.random() * 200);
    const ang = Math.random() * Math.PI * 2;
    const enemyType = type.toUpperCase();
    const cnf = CONFIG.INIMIGOS[enemyType] || CONFIG.INIMIGOS.NORMAL;
    
    enemies.push({ 
        x: player.x + Math.cos(ang) * dist, 
        y: player.y + Math.sin(ang) * dist, 
        spawnX: player.x + Math.cos(ang) * dist, 
        spawnY: player.y + Math.sin(ang) * dist,
        size: cnf.TAM, 
        color: cnf.COR, 
        speed: cnf.VEL, 
        hp: cnf.VIDA, 
        type: enemyType, 
        hasShield: Math.random() < 0.1, 
        lastBossShot: 0, bossState: 'idle', 
        lastStateChange: Date.now(),
        moveDir: Math.random() * Math.PI * 2, flashTime: 0 
    });
    if (isTraining) playSound('chime');
}