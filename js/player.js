function shoot() {
    if (!gameActive || (player.ammo <= 0 && !isTraining)) return;
    const now = Date.now(), d = player.weapon === 'mg' ? 120 : 250;
    if (now - player.lastShot < d) return;

    bullets.push({ 
        x: player.x, y: player.y, 
        vx: Math.cos(player.angle) * 16, vy: Math.sin(player.angle) * 16, 
        angle: player.angle, 
        size: 4, color: '#ffff00' 
    });

    for (let i = 0; i < 3; i++) {
        particles.push({ 
            x: player.x + Math.cos(player.angle) * 30, y: player.y + Math.sin(player.angle) * 30, 
            vx: Math.cos(player.angle + (Math.random() - 0.5)) * 5, vy: Math.sin(player.angle + (Math.random() - 0.5)) * 5, 
            size: Math.random() * CONFIG.PARTICULAS.TIRO_TAM + 1, color: CONFIG.PARTICULAS.TIRO_COR, 
            life: 0.6, decay: 0.05 
        });
    }

    if (!isTraining) player.ammo--;
    player.lastShot = now;
    playSound(player.weapon === 'mg' ? 'mg-shoot' : 'shoot');
}

function drawPlayer() {
    const shift = keys['ShiftLeft'] || keys['ShiftRight'];
    const isMoving = (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']);
    
    if (shift && isMoving && (player.stamina > 0 || player.currentSpendingBar > 0)) {
        const tx = player.x - Math.cos(player.angle) * 20;
        const ty = player.y - Math.sin(player.angle) * 20;
        for(let i=0; i<2; i++) {
            particles.push({ 
                x: tx, y: ty, 
                vx: (Math.random() - 0.5) * 5 - Math.cos(player.angle) * 2, 
                vy: (Math.random() - 0.5) * 5 - Math.sin(player.angle) * 2, 
                size: Math.random() * CONFIG.PARTICULAS.RUN_TAM + 1, 
                color: CONFIG.PARTICULAS.RUN_COR, 
                life: 0.6, 
                decay: 0.05 
            });
        }
    }

    // --- NOVO ESCUDO ENERGÉTICO (GLOBO PULSANTE) ---
    if (player.hasShield) {
        ctx.save();
        const pulse = (Math.sin(frameCount * 0.08) + 1) / 2; // Oscila entre 0 e 1
        const sSize = player.size + 15 + (pulse * 5); // Respiração suave do tamanho
        
        // 1. Glow Externo (Aura)
        ctx.shadowBlur = 15 + (pulse * 10);
        ctx.shadowColor = '#00ccff';
        
        // 2. O Globo (Gradiente Radial)
        const grad = ctx.createRadialGradient(player.x, player.y, sSize * 0.6, player.x, player.y, sSize);
        grad.addColorStop(0, 'rgba(0, 102, 255, 0.1)'); // Centro translúcido
        grad.addColorStop(0.8, 'rgba(0, 204, 255, 0.3)'); // Borda interna
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.6)'); // Brilho na borda extrema
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(player.x, player.y, sSize, 0, Math.PI * 2);
        ctx.fill();

        // 3. Shimmers (Anéis de energia rápidos)
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - pulse)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, sSize - 5, 0, Math.PI * 2);
        ctx.stroke();

        // 4. Hexágonos/Fosfeno (Efeito colmeia sutil)
        ctx.globalCompositeOperation = 'overlay';
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        for(let a=0; a<Math.PI*2; a+=Math.PI/3) {
            ctx.beginPath();
            ctx.moveTo(player.x + Math.cos(a)*sSize, player.y + Math.sin(a)*sSize);
            ctx.lineTo(player.x + Math.cos(a+Math.PI/3)*sSize, player.y + Math.sin(a+Math.PI/3)*sSize);
            ctx.stroke();
        }

        ctx.restore();
    }

    ctx.save(); 
    ctx.translate(player.x, player.y); 
    ctx.rotate(player.angle);

    if (playerSprite && playerSprite.src && playerSprite.complete && playerSprite.naturalWidth !== 0) {
        const pSize = CONFIG.PLAYER.TAMANHO_SPRITE || 80;
        const ratio = playerSprite.naturalWidth / playerSprite.naturalHeight;
        let pW = pSize, pH = pSize;
        if (ratio > 1) pH = pSize / ratio; else pW = pSize * ratio;
        
        if (player.flashTime > 0) {
            ctx.filter = 'brightness(3)';
        }
        ctx.drawImage(playerSprite, -pW/2, -pH/2, pW, pH);
    } else {
        ctx.scale(3, 3); 
        ctx.translate(-12.5, -12.5);
        ctx.fillStyle = player.flashTime > 0 ? '#fff' : (player.color || '#00ff00');
        const p1 = new Path2D("M10.7116 12.5006C9.41962 12.6349 9.09548 13.0941 8.71295 13.4944C8.37782 14.0305 7.78222 14.3886 7.1057 14.3886C6.36803 14.3886 5.72735 13.9632 5.41506 13.3452C5.07871 13.0294 4.66983 12.6961 3.91874 12.5006C4.6606 12.3076 5.0688 11.9807 5.40282 11.6683C5.71041 11.0373 6.35832 10.6012 7.1057 10.6012C7.79628 10.6012 8.40264 10.9739 8.7336 11.5283C9.10755 11.9234 9.44273 12.3689 10.7116 12.5006ZM8.54158 12.4945C8.54158 11.6987 7.90151 11.0586 7.1057 11.0586C6.30982 11.0586 5.66982 11.6986 5.66982 12.4945C5.66982 13.2904 6.30982 13.9312 7.1057 13.9312C7.90154 13.9312 8.54158 13.2904 8.54158 12.4945L8.54158 12.4945Z");
        const p2 = new Path2D("M24.5986 14.9244C13.7003 17.3177 14.3037 23.7202 11.6467 20.3198C3.60963 16.6375 0.709668 17.5912 0.400794 12.5168C0.465697 12.5114 0.53455 12.5061 0.607159 12.5007C0.53455 12.4952 0.465697 12.4899 0.400794 12.4845C0.709667 7.4101 3.60962 8.36382 11.6467 4.68154C14.3037 1.28111 13.7003 7.68364 24.5986 10.0769C24.1427 10.1211 20.5363 10.5299 17.8935 9.81981C14.3355 8.86389 13.1662 9.22642 11.6467 10.19C10.5157 10.9072 12.0586 11.7779 16.766 12.3515C16.766 12.4074 16.7321 12.4352 16.766 12.494C16.745 12.5534 16.766 12.5939 16.766 12.6498C12.0586 13.2234 10.5157 14.0941 11.6467 14.8113C13.1662 15.7749 14.3355 16.1374 17.8935 15.1815C20.5363 14.4714 24.1427 14.8802 24.5986 14.9244ZM12.4997 12.5006C8.91142 12.1282 9.74283 10.2694 7.28778 9.81396C8.23187 8.78096 9.40557 8.50591 10.9337 10.0787C8.9417 6.59179 6.38025 7.84686 4.27981 10.4046C3.48846 11.0629 2.86055 12.0241 1.0294 12.5006C2.86055 12.9772 3.48843 13.9384 4.27981 14.5967C6.38027 17.1544 8.94173 18.4095 10.9337 14.9226C9.40533 16.4956 8.23115 16.2208 7.28697 15.1872C9.73335 14.7339 8.91753 12.8877 12.4579 12.505L12.4997 12.5006Z");
        ctx.fill(p1); ctx.fill(p2);
    }
    ctx.restore();
    
    ctx.save();
    ctx.translate(player.x, player.y);
    const cp = (Math.sin(frameCount * 0.1) + 1) / 2;
    const sa = (Date.now() - player.lastShot < 100);
    ctx.fillStyle = sa ? "#fff" : `rgba(255,255,255,${0.2 + cp * 0.3})`;
    ctx.shadowBlur = sa ? 20 : (5 + cp * 10); ctx.shadowColor = "#fff";
    ctx.beginPath(); ctx.arc(0, 0, sa ? 2.5 : 1.5, 0, Math.PI * 2); ctx.fill(); 
    ctx.restore();
}

function drawBullet(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff4500";
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(-8, -2, 16, 4);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-4, -1, 10, 2);
    ctx.restore();

    if (frameCount % 2 === 0) {
        particles.push({
            x: b.x - Math.cos(b.angle) * 10,
            y: b.y - Math.sin(b.angle) * 10,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1,
            color: Math.random() < 0.5 ? "#ff8c00" : "#ff4500",
            life: 0.4,
            decay: 0.05
        });
    }
}