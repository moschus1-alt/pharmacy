class Player {
    constructor(x, y, game, profile) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.profile = profile;
        this.speed = profile.speed;
        this.radius = 23;
        this.hp = profile.maxHp;
        this.maxHp = profile.maxHp;

        this.fireCooldown = 0;
        this.fireRate = profile.fireRate;

        this.invulnerableTimer = 0;
        this.facingAngle = 0;
        this.isMoving = false;
        this.isRunning = false;
        this.stride = 0;
        this.shieldTimer = 0;
        this.shieldName = '';
        this.autoFireBonus = 0;
        this.autoCooldown = 0;
        this.autoRange = 440;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.facingRow = 0; // 여자 약사 스프라이트: 아래, 왼쪽, 오른쪽, 위
    }

    update(dt, input) {
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }
        this.shieldTimer = Math.max(0, this.shieldTimer - dt);

        const movement = input.getMovement();
        let dx = movement.x;
        let dy = movement.y;

        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;
        this.isMoving = dx !== 0 || dy !== 0;
        if (this.isMoving) {
            this.facingRow = Utils.directionRow(dx, dy, this.facingRow);
            this.walkTimer += dt;
            if (this.walkTimer >= 0.105) {
                this.walkFrame = Utils.walkFrame(this.walkTimer, 0.105);
            }
        } else {
            this.walkTimer = 0;
            this.walkFrame = 0;
        }
        this.isRunning = this.isMoving && input.isKeyPressed('shift');
        if (this.isMoving) this.stride += dt * (this.isRunning ? 17 : 10);
        const movementMultiplier = this.isRunning ? 1.45 : 1;
        this.x += dx * this.speed * dt * (movementMultiplier - 1);
        this.y += dy * this.speed * dt * (movementMultiplier - 1);

        // 맵 경계선 충돌 방지
        this.x = Math.max(this.radius, Math.min(this.game.map.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(this.game.map.height - this.radius, this.y));

        if (this.fireCooldown > 0) {
            this.fireCooldown -= dt;
        }
        this.autoCooldown -= dt;
        const machinePower = this.game.machinePower || 0;
        if ((this.autoFireBonus > 0 || machinePower > 0) && this.autoCooldown <= 0) {
            const target = this.game.enemies.find(enemy => Utils.distance(this.x, this.y, enemy.x, enemy.y) < 280);
            if (target) {
                const shots = Math.min(4, 1 + Math.floor(machinePower / 5));
                for (let i = 0; i < shots; i++) {
                    const spread = (i - (shots - 1) / 2) * 18;
                    this.game.spawnProjectile(this.x, this.y, target.x + spread, target.y - spread);
                }
                this.autoCooldown = Math.max(0.18, 1.15 - machinePower * 0.065 - this.autoFireBonus * 0.12);
            }
        }

        // 가장 가까운 손님에게 자동 처방. 클릭 중이면 마우스 방향을 우선합니다.
        if (this.fireCooldown <= 0) {
            const target = this.game.enemies.filter(e => e.active).sort((a, b) => Utils.distance(this.x, this.y, a.x, a.y) - Utils.distance(this.x, this.y, b.x, b.y))[0];
            const worldMouseX = input.mouseX + this.game.cameraX;
            const worldMouseY = input.mouseY + this.game.cameraY;
            if (input.isMouseDown || (target && Utils.distance(this.x, this.y, target.x, target.y) < this.autoRange)) {
                const tx = input.isMouseDown ? worldMouseX : target.x;
                const ty = input.isMouseDown ? worldMouseY : target.y;
                this.facingAngle = Utils.angle(this.x, this.y, tx, ty);
                this.game.spawnProjectile(this.x, this.y, tx, ty);
                window.gameAudio.shoot();
                this.fireCooldown = this.fireRate;
            }
        }
    }

    takeDamage(amount) {
        if (this.invulnerableTimer <= 0) {
            if (this.shieldTimer <= 0) {
                this.hp -= amount;
                window.gameAudio.playerHit();
            } else {
                window.gameAudio.shieldBlock();
            }
            this.invulnerableTimer = 1.0; // 1초 무적 시간
        }
    }

    draw(ctx, cameraX, cameraY) {
        if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            return; // 간이 깜빡임 효과
        }

        if (this.game.playerSprite.complete && this.game.playerSprite.naturalWidth > 0) {
            if (this.profile.id === 'seoyeon' && !this.game.usesWalkSprite) {
                const size = 108;
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'; ctx.beginPath();
                ctx.ellipse(this.x - cameraX, this.y - cameraY + 27, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
                ctx.translate(this.x - cameraX, this.y - cameraY);
                ctx.rotate(this.facingAngle + Math.PI / 2);
                ctx.drawImage(this.game.playerSprite, 160, 0, 690, 760, -size / 2, -size / 2, size, size);
                ctx.restore();
                ctx.save(); ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
                ctx.strokeStyle = 'rgba(0, 0, 0, .8)'; ctx.lineWidth = 3;
                ctx.strokeText(this.profile.name, this.x - cameraX, this.y - cameraY - 54);
                ctx.fillStyle = '#ffc2ee'; ctx.fillText(this.profile.name, this.x - cameraX, this.y - cameraY - 54); ctx.restore();
                if (this.shieldTimer > 0) this.drawShield(ctx, cameraX, cameraY);
                return;
            }
            if (this.game.usesWalkSprite) {
                const sheetFrame = this.game.playerSprite.naturalWidth / 4;
                const spriteSize = 100;
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
                ctx.beginPath(); ctx.ellipse(this.x - cameraX, this.y - cameraY + 27, 23, 7, 0, 0, Math.PI * 2); ctx.fill();
                ctx.drawImage(this.game.playerSprite, this.walkFrame * sheetFrame, this.facingRow * sheetFrame, sheetFrame, sheetFrame, this.x - cameraX - spriteSize / 2, this.y - cameraY - spriteSize / 2, spriteSize, spriteSize);
                ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
                ctx.strokeStyle = 'rgba(0, 0, 0, .8)'; ctx.lineWidth = 3;
                ctx.strokeText(this.profile.name, this.x - cameraX, this.y - cameraY - 48);
                ctx.fillStyle = this.profile.id === 'seoyeon' ? '#ffc2ee' : '#a9f7ef';
                ctx.fillText(this.profile.name, this.x - cameraX, this.y - cameraY - 48);
                ctx.restore();
                if (this.shieldTimer > 0) this.drawShield(ctx, cameraX, cameraY);
                return;
            }
            const spriteSize = 92;
            const step = Math.sin(this.stride);
            const bob = this.isMoving ? step * (this.isRunning ? 6 : 3.5) : Math.sin(Date.now() / 360) * 1.5;
            const squash = this.isMoving ? 1 - Math.abs(step) * (this.isRunning ? 0.08 : 0.04) : 1;
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.beginPath(); ctx.ellipse(this.x - cameraX, this.y - cameraY + 27, 25 * squash, 8 * squash, 0, 0, Math.PI * 2); ctx.fill();
            ctx.translate(this.x - cameraX, this.y - cameraY + bob);
            ctx.rotate(this.facingAngle + Math.PI / 2);
            ctx.scale(1 / squash, squash);
            ctx.drawImage(this.game.playerSprite, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
            ctx.restore();
            ctx.save();
            ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
            ctx.strokeStyle = 'rgba(0, 0, 0, .8)'; ctx.lineWidth = 3;
            ctx.strokeText(this.profile.name, this.x - cameraX, this.y - cameraY - 47);
            ctx.fillStyle = this.profile.id === 'seoyeon' ? '#ffc2ee' : '#a9f7ef';
            ctx.fillText(this.profile.name, this.x - cameraX, this.y - cameraY - 47);
            ctx.restore();
            if (this.shieldTimer > 0) {
                ctx.save();
                ctx.strokeStyle = this.shieldName.includes('세파') ? '#c78cff' : '#ffb15d';
                ctx.lineWidth = 3; ctx.globalAlpha = 0.8;
                ctx.beginPath(); ctx.arc(this.x - cameraX, this.y - cameraY, 42, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText(`${this.shieldName} ${this.shieldTimer.toFixed(1)}초`, this.x - cameraX, this.y - cameraY - 56);
                ctx.restore();
            }
            return;
        }

        // 스프라이트 로드 전 임시 몸통
        ctx.fillStyle = "white"; // 약사 가운 연상
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y - cameraY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 텍스트로 약사 특징
        ctx.fillStyle = "black";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.profile.name, this.x - cameraX, this.y - cameraY);
    }

    drawShield(ctx, cameraX, cameraY) {
        ctx.save();
        ctx.strokeStyle = this.shieldName.includes('세파') ? '#c78cff' : '#ffb15d';
        ctx.lineWidth = 3; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.arc(this.x - cameraX, this.y - cameraY, 42, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${this.shieldName} ${this.shieldTimer.toFixed(1)}초`, this.x - cameraX, this.y - cameraY - 56);
        ctx.restore();
    }
}
