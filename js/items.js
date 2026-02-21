function spawnLoot(x, y, type) {
    const ang = Math.random() * Math.PI * 2, f = 5 + Math.random() * 5;
    let c = '#ffff00';
    if (type === 'shield') c = '#0066ff';
    else if (type === 'stamina') c = '#00ffff';
    else if (type === 'mg') c = '#ff00ff';
    else if (type === 'health') c = '#ff3333';
    else if (type === 'orbe') c = '#00ff00';
    else if (type === 'pem') c = CONFIG.EQUIPAMENTOS.PEM.COR;
    else if (type === 'boost') c = CONFIG.EQUIPAMENTOS.BOOST.COR;

    const rotSpd = (Math.random() - 0.5) * 0.03;

    powerups.push({ 
        x, y, vx: Math.cos(ang) * f, vy: Math.sin(ang) * f, 
        z: 0, vz: -10 - Math.random() * 5, 
        gravity: 0.6, friction: 0.94, 
        type, color: c,
        angle: Math.random() * Math.PI * 2,
        rotSpd: rotSpd,
        canCollect: false 
    });
}

function handleEnemyDeath(e) {
    if(e.hp <= 0) { 
        if(e.slimeEl) e.slimeEl.remove();
        if(e.alienEl) e.alienEl.remove(); // Limpeza Alien
        
        if (e.type === 'ALIEN') {
            if (Math.random() < 0.5) {
                spawnChest(e.x, e.y, 'gold');
            } else {
                spawnLoot(e.x, e.y, 'pem');
            }
        } else if(e.type === 'BOSS') {
            spawnChest(e.x, e.y, 'gold');
        } else { 
            let r = Math.random();
            if(e.type === 'SHIELD_EYE' && r < CONFIG.SHIELD_EYE.CHANCE_PEM) {
                spawnLoot(e.x, e.y, 'pem');
            } else {
                let c = CONFIG.DROP_MONSTER.COMUM; 
                if(e.type==='HEAVY') c = CONFIG.DROP_MONSTER.HEAVY; 
                if(e.type==='ELITE') c = CONFIG.DROP_MONSTER.ELITE; 
                if(r < c) spawnLoot(e.x, e.y, Math.random() < CONFIG.DROP_MONSTER.AMMO_W ? 'ammo' : 'health'); 
            }
        } 
        createExplosion(e.x, e.y, e.color, 15); 
        screenShake = (e.type === 'BOSS' || e.type === 'SHIELD_EYE' || e.type === 'ALIEN') ? 30 : 8; 
        kills++; 
        playSound('explode'); 
        return true;
    }
    return false;
}

function spawnChest(x, y, type = 'normal') {
    let c = '#b0b0b0';
    if (type === 'gold') c = '#ffd700';
    else if (type === 'shield') c = '#0066ff';
    else if (type === 'ammo') c = '#cd7f32';
    else if (type === 'health') c = '#ff3333';
    else if (type === 'orbital') c = '#00ff00';

    chests.push({ 
        x, y, size: (type === 'gold' || type === 'health') ? 60 : 45, 
        type, color: c, state: 'closed' 
    });
}

function tryInteract() {
    chests.forEach((c, i) => {
        if (c.state === 'closed' && Math.hypot(player.x - c.x, player.y - c.y) < 100) {
            c.state = 'opened';
            playSound('chest-open');
            createExplosion(c.x, c.y, c.color, 20);
            
            if (c.type === 'shield') {
                spawnLoot(c.x, c.y, 'shield');
            } else if (c.type === 'ammo') {
                // Baú de Bronze (Ammo): 50% chance de dropar 2x munição, senão 1x
                const count = Math.random() < 0.5 ? 2 : 1;
                for (let j = 0; j < count; j++) spawnLoot(c.x, c.y, 'ammo');
            } else if (c.type === 'health') {
                // Baú de Vida: 50% chance de dropar 2x health, senão 1x
                const count = Math.random() < 0.5 ? 2 : 1;
                for (let j = 0; j < count; j++) spawnLoot(c.x, c.y, 'health');
            } else if (c.type === 'orbital') {
                spawnLoot(c.x, c.y, 'orbe');
            } else {
                // Baú Dourado e Normal/Preto (type 'normal' ou 'gold')
                // Sempre dropam 2 itens NÃO repetidos
                let lootTable = (c.type === 'gold') ? CONFIG.LOOT_OURO : CONFIG.LOOT_CINZA;
                let droppedTypes = [];

                while (droppedTypes.length < 2) {
                    let s = sortear(lootTable);
                    let t = 'ammo';
                    if (s === 'METRALHADORA') t = 'mg';
                    else if (s === 'VIDA') t = 'health';
                    else if (s === 'ESCUDO') t = 'shield';
                    else if (s === 'STAMINA') t = 'stamina';
                    else if (s === 'ORBE') t = 'orbe';
                    else if (s === 'PEM') t = 'pem';
                    else if (s === 'BOOST') t = 'boost';
                    else if (s === 'MUNICAO') t = 'ammo';

                    // Só adiciona se não for repetido
                    if (!droppedTypes.includes(t)) {
                        spawnLoot(c.x, c.y, t);
                        droppedTypes.push(t);
                    }
                }
            }
            setTimeout(() => { if (chests.indexOf(c) !== -1) chests.splice(chests.indexOf(c), 1); }, 300);
        }
    });
}

function dispararPEM() {
    if (player.cargasPEM <= 0) return;
    player.cargasPEM--;
    updatePEMHUD(); 
    
    // POSIÇÃO NA TELA PARA O EFEITO HTML
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    // CRIAR ELEMENTO HTML DO PULSO
    const emp = document.createElement('div');
    emp.className = 'emp-container';
    emp.style.left = screenX + 'px';
    emp.style.top  = screenY + 'px';

    const r1 = document.createElement('div'); r1.className = 'ring r1';
    const r2 = document.createElement('div'); r2.className = 'ring r2';

    emp.appendChild(r1);
    emp.appendChild(r2);
    document.body.appendChild(emp);

    // REMOÇÃO AUTOMÁTICA
    setTimeout(() => emp.remove(), 1300);

    // LÓGICA DE DANO E TREMOR
    playSound('upgrade', 0.2); 
    screenShake = 25;

    enemies.forEach((e, i) => {
        if (Math.hypot(player.x - e.x, player.y - e.y) < CONFIG.EQUIPAMENTOS.PEM.RAIO) {
            e.hp = 0;
            handleEnemyDeath(e);
            enemies.splice(i, 1);
        }
    });
}

function usarBoost() {
    if (player.cargasBoost <= 0) return;
    if (player.stamina >= 100 && player.currentSpendingBar >= player.extraBars) return;

    player.cargasBoost--;
    player.stamina = 100;
    if (player.currentSpendingBar < player.extraBars) {
        player.currentSpendingBar = player.extraBars;
    }
    
    updateBoostHUD();
    playSound('upgrade', 0.15);
    
    for(let i=0; i<10; i++) {
        particles.push({ 
            x: player.x, y: player.y, 
            vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, 
            size: Math.random()*5+2, color: '#ffff00', 
            life: 1.0, decay: 0.05 
        });
    }
}

function drawChestEntity(c) {
    ctx.save(); ctx.translate(c.x, c.y);
    
    let sprite = chestSprites[c.type] || chestSprites.normal;
    if (c.type === 'shield' || c.type === 'orbital') sprite = chestSprites.normal;
    if (c.type === 'gold') sprite = chestSprites.gold;
    if (c.type === 'health') sprite = chestSprites.health;
    if (c.type === 'ammo') sprite = chestSprites.ammo;

    if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
        ctx.shadowBlur = 20; ctx.shadowColor = c.color;
        
        const baseSize = c.size * 2.1; // Aumentado em 40% (de 1.5 para 2.1)
        const ratio = sprite.naturalWidth / sprite.naturalHeight;
        let drawW, drawH;
        
        if (ratio > 1) {
            drawW = baseSize;
            drawH = baseSize / ratio;
        } else {
            drawH = baseSize;
            drawW = baseSize * ratio;
        }
        
        ctx.drawImage(sprite, -drawW/2, -drawH/2, drawW, drawH);
    } else {
        ctx.shadowBlur = 15; ctx.shadowColor = c.color;
        ctx.fillStyle = c.color;
        ctx.fillRect(-25, -15, 50, 30); 
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-25, -15, 50, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(-3, -3, 6, 6);
    }
    ctx.restore();
}

function drawLoot(p) {
    if (p.type === 'ammo') {
        if (!p.ammoEl) {
            p.ammoEl = document.createElement('div');
            p.ammoEl.className = 'mob-ammo';
            p.ammoEl.innerHTML = `
                <div class="ammo-pack">
                    <div class="bullet" style="--x:-32px; --y:-10px; --r:-18deg; --bob:2.2s; --spin:10s;"></div>
                    <div class="bullet" style="--x:  0px; --y:-18px; --r: 10deg; --bob:2.5s; --spin:12s;"></div>
                    <div class="bullet" style="--x: 32px; --y:-8px;  --r: 22deg; --bob:2.1s; --spin:11s;"></div>
                    <div class="bullet" style="--x:-16px; --y: 20px; --r: -6deg; --bob:2.6s; --spin:13s;"></div>
                    <div class="bullet" style="--x: 18px; --y: 22px; --r: 14deg; --bob:2.3s; --spin:9s;"></div>
                </div>
            `;
            document.body.appendChild(p.ammoEl);
        }
        const screenX = p.x - camera.x;
        const screenY = (p.y + p.z) - camera.y;

        if (gameActive && screenX > -100 && screenX < window.innerWidth + 100 && screenY > -100 && screenY < window.innerHeight + 100) {
            p.ammoEl.style.display = 'block';
            p.ammoEl.style.left = (screenX - 50) + 'px';
            p.ammoEl.style.top = (screenY - 50) + 'px';
        } else {
            p.ammoEl.style.display = 'none';
        }
        return; // Não desenha nada no canvas para ammo
    }

    ctx.save(); 
    ctx.translate(p.x, p.y + p.z);
    
    if (!p.angle) p.angle = 0;
    ctx.rotate(p.angle);

    let sprite = null;
    let baseSize = 60; 

    if (p.type === 'ammo') { sprite = itemSprites.ammo; baseSize = CONFIG.ITENS.AMMO.TAMANHO; }
    else if (p.type === 'boost') { sprite = itemSprites.boost; baseSize = CONFIG.EQUIPAMENTOS.BOOST.TAMANHO; }
    else if (p.type === 'stamina') { sprite = itemSprites.stamina_bar; baseSize = CONFIG.ITENS.STAMINA_BAR.TAMANHO; }
    else if (p.type === 'shield') { sprite = itemSprites.shield; baseSize = CONFIG.ITENS.SHIELD.TAMANHO; }
    else if (p.type === 'health') { sprite = itemSprites.health; baseSize = CONFIG.ITENS.HEALTH.TAMANHO; }
    else if (p.type === 'pem') { sprite = itemSprites.pem; baseSize = CONFIG.EQUIPAMENTOS.PEM.TAMANHO; }
    else if (p.type === 'mg') { sprite = itemSprites.mg; baseSize = CONFIG.ITENS.MG.TAMANHO; }
    else if (p.type === 'orbe') { baseSize = CONFIG.ITENS.ORBE.TAMANHO; }
    else if (p.type === 'scrap') { baseSize = 30; }

    if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
        const ratio = sprite.naturalWidth / sprite.naturalHeight;
        let drawW, drawH;
        if (ratio > 1) { drawW = baseSize; drawH = baseSize / ratio; } else { drawH = baseSize; drawW = baseSize * ratio; }
        ctx.drawImage(sprite, -drawW/2, -drawH/2, drawW, drawH);
    } else {
        let configSize = baseSize;
        if (p.type === 'mg') {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(-configSize/3, -configSize/7.5, configSize/1.5, configSize/3.75);
            ctx.fillRect(-configSize/3, 0, configSize/5, configSize/3);
        } else if (p.type === 'orbe') {
            ctx.fillStyle = '#00ff00';
            ctx.shadowBlur = 20; ctx.shadowColor = '#00ff00';
            ctx.beginPath(); 
            ctx.moveTo(configSize/3, 0); 
            ctx.lineTo(-configSize/3, configSize/5); 
            ctx.lineTo(-configSize/5, 0); 
            ctx.lineTo(-configSize/3, -configSize/5); 
            ctx.closePath(); ctx.fill();
        } else if (p.type === 'scrap') {
            ctx.fillStyle = '#888';
            ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
            ctx.rotate(frameCount * 0.1);
            ctx.fillRect(-configSize/4, -configSize/4, configSize/2, configSize/2);
            ctx.fillStyle = '#666';
            ctx.fillRect(0, 0, configSize/4, configSize/4);
        } else if (p.type === 'pem' || p.type === 'boost') {
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 20; ctx.shadowColor = p.color;
            ctx.fillRect(-configSize/5, -configSize/3, configSize/2.5, configSize/1.5); 
            ctx.fillStyle = "#fff";
            ctx.fillRect(-configSize/10, -configSize/2.3, configSize/5, configSize/10); 
        } else {
            ctx.fillStyle = p.color;
            ctx.fillRect(-configSize/4, -configSize/4, configSize/2, configSize/2);
        }
    }
    ctx.restore();
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath(); ctx.ellipse(p.x, p.y + baseSize/3, baseSize/3, baseSize/6, 0, 0, Math.PI * 2); ctx.fill();
}

function drawShockwave(s) {
    ctx.save();
    ctx.strokeStyle = `rgba(0, 204, 255, ${s.life})`;
    ctx.lineWidth = 5 * s.life;
    ctx.shadowBlur = 20; ctx.shadowColor = "#00ccff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawMeteoro(m, isObstacle = false) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle);
    const sprite = meteorSprites[m.typeId];
    if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
        const w = m.size;
        const h = m.size * (CONFIG.AMBIENTE.METEORO_TYPES.find(t => t.id === m.typeId).ratio);
        ctx.drawImage(sprite, -w/2, -h/2, w, h);
    } else {
        ctx.fillStyle = isObstacle ? "#444" : "#1a1a1a";
        ctx.beginPath();
        m.points.forEach((p, i) => { if(i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}