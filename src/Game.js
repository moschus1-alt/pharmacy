class Game {
    constructor(canvas, profile) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.input = new InputManager();
        this.map = new GameMap(2000, 2000); // 전체 약국 크기

        this.profile = profile;
        this.player = new Player(this.map.width / 2, this.map.height / 2, this, profile);
        this.projectiles = [];
        this.enemies = [];
        this.drops = [];
        this.staff = [];
        this.messages = [];
        this.fireZones = [];
        this.novaCooldown = 0;
        this.stage = 1;
        this.stageKills = 0;
        this.stageTarget = 18;
        this.bossActive = false;
        this.autoCharges = 0;
        this.barcodeCharges = 0;

        this.exp = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.baseDamage = profile.damage;
        this.baseProjRadius = 5;

        this.playerSprite = new Image();
        this.usesWalkSprite = true;
        this.playerSprite.src = profile.id === 'seoyeon' ? 'assets/female-pharmacist-walk.png' : 'assets/male-pharmacist-walk.png';
        this.playerSprite.onerror = () => { this.playerSprite.src = 'assets/pharmacist-hero.png'; };
        this.enemySprite = new Image();
        this.enemySprite.src = 'assets/rude-customer.png';
        this.maleEnemyWalkSprite = new Image();
        this.maleEnemyWalkSprite.src = 'assets/male-rude-customer-walk.png';
        this.femaleEnemyWalkSprite = new Image();
        this.femaleEnemyWalkSprite.src = 'assets/female-rude-customer-walk.png';
        this.grandfatherEnemyWalkSprite = new Image();
        this.grandfatherEnemyWalkSprite.src = 'assets/grandfather-rude-customer-walk.png';
        this.grandmotherEnemyWalkSprite = new Image();
        this.grandmotherEnemyWalkSprite.src = 'assets/grandmother-rude-customer-walk.png';
        this.bossWalkSprite = new Image();
        this.bossWalkSprite.src = 'assets/midboss-complaint-manager-walk.png';

        window.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'q' && !event.repeat) this.fireEmergencyPrescription();
        });

        this.cameraX = 0;
        this.cameraY = 0;

        this.lastTime = performance.now();

        this.spawnTimer = 0;
        this.spawnInterval = 1.45; // 적 수를 줄여 전장을 읽기 쉽게 유지
    }

    updateSize(w, h) {
        this.width = w;
        this.height = h;
    }

    spawnProjectile(x, y, targetX, targetY) {
        this.projectiles.push(new Projectile(x, y, targetX, targetY, this));
    }

    fireEmergencyPrescription() {
        if (this.isPaused || this.isGameOver || this.novaCooldown > 0) return;
        if (this.enemies.length < 5) {
            this.messages.push({ text: '적이 더 몰려야 긴급 처방이 가능합니다!', x: this.player.x, y: this.player.y - 45, time: 1.4, color: '#ffb3a7' });
            return;
        }
        const count = 14;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const projectile = new Projectile(this.player.x, this.player.y, this.player.x + Math.cos(angle), this.player.y + Math.sin(angle), this);
            projectile.damage = 100;
            projectile.radius = 13;
            projectile.color = '#ff642f';
            projectile.speed = 760;
            projectile.vx = Math.cos(angle) * projectile.speed;
            projectile.vy = Math.sin(angle) * projectile.speed;
            this.projectiles.push(projectile);
        }
        this.novaCooldown = 12;
        this.fireZones.push({ x: this.player.x, y: this.player.y, radius: 175, time: 2.2, damageTimer: 0 });
        this.messages.push({ text: '긴급 처방 발동!!', x: this.player.x, y: this.player.y - 50, time: 1.5, color: '#ffe66d' });
    }

    spawnDrop(x, y) {
        const roll = Math.random();
        if (roll < 0.025) this.drops.push({ x, y, type: 'cefaclor', bob: Math.random() * Math.PI * 2 });
        else if (roll < 0.05) this.drops.push({ x, y, type: 'augmentin', bob: Math.random() * Math.PI * 2 });
        else if (roll < 0.075) this.drops.push({ x, y, type: 'auto', bob: Math.random() * Math.PI * 2 });
        else if (roll < 0.075) this.drops.push({ x, y, type: 'barcode', bob: Math.random() * Math.PI * 2 });
        else if (roll < 0.13) this.drops.push({ x, y, type: 'staff', bob: Math.random() * Math.PI * 2 });
        else if (roll < 0.18) this.drops.push({ x, y, type: 'upgrade', bob: Math.random() * Math.PI * 2 });
        else if (roll < 0.28) this.drops.push({ x, y, type: 'potion', bob: Math.random() * Math.PI * 2 });
    }

    collectDrop(drop) {
        if (drop.type === 'potion') {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
            this.messages.push({ text: '+50 HP', x: drop.x, y: drop.y, time: 1.2, color: '#7dff9b' });
        } else if (drop.type === 'auto') {
            this.player.autoFireBonus += 1;
            this.messages.push({ text: '자동조제기: 자동 발사 강화!', x: drop.x, y: drop.y, time: 1.5, color: '#b7ffb2' });
        } else if (drop.type === 'barcode') {
            this.baseDamage += 3;
            this.messages.push({ text: '바코드리더기: 피해 +3', x: drop.x, y: drop.y, time: 1.5, color: '#f5dd88' });
        } else if (drop.type === 'cefaclor') {
            this.player.shieldTimer = 14;
            this.player.shieldName = '세파클러 보호막';
            this.messages.push({ text: '세파클러 보호막 14초!', x: drop.x, y: drop.y, time: 2, color: '#dba6ff' });
        } else if (drop.type === 'augmentin') {
            this.player.shieldTimer = 7;
            this.player.shieldName = '오구멘틴 보호막';
            this.messages.push({ text: '오구멘틴 보호막 7초!', x: drop.x, y: drop.y, time: 2, color: '#ffbd70' });
        } else if (drop.type === 'staff') {
            this.staff.push(new StaffCompanion(this.player, this));
            this.messages.push({ text: '근무약사 출근! (30초)', x: drop.x, y: drop.y, time: 1.7, color: '#75c9ff' });
        } else {
            const upgrades = [
                ['처방전 강화! 피해 +5', () => this.baseDamage += 5],
                ['영양제 강화! 최대 HP +20', () => { this.player.maxHp += 20; this.player.hp += 20; }],
                ['신속 조제! 이동속도 +15', () => this.player.speed += 15]
            ];
            const [text, apply] = upgrades[Math.floor(Math.random() * upgrades.length)];
            apply();
            this.messages.push({ text, x: drop.x, y: drop.y, time: 1.7, color: '#ffd76b' });
        }
    }

    enemyDefeated(type) {
        if (type && type.startsWith('중간보스')) {
            this.bossActive = false;
            this.stage++;
            this.stageKills = 0;
            this.stageTarget += 7;
            this.drops.push({ x: this.player.x + 35, y: this.player.y, type: 'upgrade', bob: 0 });
            this.drops.push({ x: this.player.x - 35, y: this.player.y, type: 'potion', bob: 1 });
            this.messages.push({ text: `중간보스 격파! STAGE ${this.stage} 시작!`, x: this.player.x, y: this.player.y - 70, time: 2.5, color: '#ffe66d' });
            return;
        }
        if (this.bossActive) return;
        this.stageKills++;
        if (this.stageKills >= this.stageTarget) {
            this.bossActive = true;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.max(this.width, this.height) / 2 + 70;
            const x = Math.max(50, Math.min(this.map.width - 50, this.player.x + Math.cos(angle) * distance));
            const y = Math.max(50, Math.min(this.map.height - 50, this.player.y + Math.sin(angle) * distance));
            const bossTypes = ['중간보스: 불만 팀장', '중간보스: 야근 과장', '중간보스: 클레임 부장', '중간보스: 본사 이사'];
            this.enemies.push(new Enemy(x, y, this, bossTypes[(this.stage - 1) % bossTypes.length]));
            window.gameAudio.boss();
            this.messages.push({ text: '중간보스 출현!!', x: this.player.x, y: this.player.y - 70, time: 2.2, color: '#ff7a67' });
        }
    }

    addExp(amount) {
        this.exp += amount;
        if (this.exp >= this.level * 100 && !this.isPaused) {
            this.exp -= this.level * 100;
            this.level++;
            this.isPaused = true;
            window.onLevelUp();
        }
    }

    spawnEnemy() {
        // 플레이어 주변 일정 거리 밖에서 생성
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(this.width, this.height) / 2 + 100;
        let ex = this.player.x + Math.cos(angle) * dist;
        let ey = this.player.y + Math.sin(angle) * dist;

        // 맵 안쪽에서 나오도록 처리 (임시)
        ex = Math.max(0, Math.min(this.map.width, ex));
        ey = Math.max(0, Math.min(this.map.height, ey));

        const customerTypes = ["남자 진상", "여자 진상", "할아버지 진상", "할머니 진상"];
        let enemyType = customerTypes[Math.floor(Math.random() * customerTypes.length)];
        this.enemies.push(new Enemy(ex, ey, this, enemyType));
    }

    update(currentTime) {
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // 브라우저 탭 이동 등 예외 상황 방지
        if (dt > 0.1) return;

        if (this.isGameOver) return;
        if (this.isPaused) return;

        // 시스템 업데이트
        this.player.update(dt, this.input);
        this.novaCooldown = Math.max(0, this.novaCooldown - dt);
        this.projectiles.forEach(p => p.update(dt));
        this.fireZones.forEach(zone => {
            zone.time -= dt;
            zone.damageTimer -= dt;
            if (zone.damageTimer <= 0) {
                this.enemies.forEach(enemy => {
                    if (enemy.active && Utils.distance(zone.x, zone.y, enemy.x, enemy.y) < zone.radius) enemy.takeDamage(16);
                });
                zone.damageTimer = 0.35;
            }
        });
        this.fireZones = this.fireZones.filter(zone => zone.time > 0);
        this.enemies.forEach(e => e.update(dt));
        this.staff.forEach(s => s.update(dt));
        this.drops.forEach(drop => {
            if (Utils.distance(drop.x, drop.y, this.player.x, this.player.y) < this.player.radius + 22) drop.collected = true;
            if (drop.collected) this.collectDrop(drop);
        });
        this.drops = this.drops.filter(drop => !drop.collected);
        this.messages.forEach(message => message.time -= dt);
        this.messages = this.messages.filter(message => message.time > 0);

        // 적 생성
        this.spawnTimer += dt;
        // 레벨이 오를수록 생성 주기가 짧아짐
        const currentSpawnInterval = Math.max(0.55, this.spawnInterval - (this.level * 0.04));
        if (!this.bossActive && this.stageKills + this.enemies.length < this.stageTarget && this.spawnTimer >= currentSpawnInterval) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        // 충돌 검사 (투사체 -> 적)
        this.projectiles.forEach(p => {
            if (!p.active) return;
            this.enemies.forEach(e => {
                if (!e.active || !p.active) return;

                if (Utils.circleIntersect(p.x, p.y, p.radius, e.x, e.y, e.radius)) {
                    p.active = false;
                    e.takeDamage(p.damage);
                }
            });
        });

        // 충돌 검사 (적 -> 플레이어)
        this.enemies.forEach(e => {
            if (!e.active) return;
            if (Utils.circleIntersect(e.x, e.y, e.radius, this.player.x, this.player.y, this.player.radius)) {
                this.player.takeDamage(e.type.startsWith('중간보스') ? 25 + this.stage * 2 : 10);
            }
        });

        if (this.player.hp <= 0) {
            this.isGameOver = true;
        }

        // 오브젝트 정리
        this.projectiles = this.projectiles.filter(p => p.active && p.x >= -50 && p.y >= -50 && p.x <= this.map.width + 50 && p.y <= this.map.height + 50);
        this.enemies = this.enemies.filter(e => e.active);
        this.staff = this.staff.filter(s => s.active);

        // 카메라 업데이트 (플레이어 중앙)
        this.cameraX = this.player.x - this.width / 2;
        this.cameraY = this.player.y - this.height / 2;

        // 카메라가 맵 바깥을 보여주지 않도록 클램핑
        this.cameraX = Math.max(0, Math.min(this.map.width - this.width, this.cameraX));
        this.cameraY = Math.max(0, Math.min(this.map.height - this.height, this.cameraY));
    }

    draw() {
        // 배경 초기화
        this.ctx.fillStyle = "#111";
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 맵
        this.map.draw(this.ctx, this.cameraX, this.cameraY);
        this.fireZones.forEach(zone => {
            const gradient = this.ctx.createRadialGradient(zone.x - this.cameraX, zone.y - this.cameraY, 5, zone.x - this.cameraX, zone.y - this.cameraY, zone.radius);
            gradient.addColorStop(0, 'rgba(255,230,80,.9)'); gradient.addColorStop(.45, 'rgba(255,70,15,.65)'); gradient.addColorStop(1, 'rgba(180,0,0,0)');
            this.ctx.fillStyle = gradient; this.ctx.beginPath(); this.ctx.arc(zone.x - this.cameraX, zone.y - this.cameraY, zone.radius, 0, Math.PI * 2); this.ctx.fill();
        });

        // 적, 투사체, 플레이어 렌더링
        this.enemies.forEach(e => e.draw(this.ctx, this.cameraX, this.cameraY));
        this.drops.forEach(drop => drawDrop(this.ctx, drop, this.cameraX, this.cameraY));
        this.staff.forEach(s => s.draw(this.ctx, this.cameraX, this.cameraY));
        this.projectiles.forEach(p => p.draw(this.ctx, this.cameraX, this.cameraY));
        this.player.draw(this.ctx, this.cameraX, this.cameraY);
        this.messages.forEach(message => drawMessage(this.ctx, message, this.cameraX, this.cameraY));
    }
}

class StaffCompanion {
    constructor(player, game) { this.player = player; this.game = game; this.active = true; this.time = 30; this.phase = Math.random() * Math.PI * 2; this.attackTimer = 0; }
    update(dt) {
        this.time -= dt;
        this.phase += dt * 5;
        this.attackTimer -= dt;
        const target = this.game.enemies.find(enemy => Utils.distance(enemy.x, enemy.y, this.player.x, this.player.y) < 240);
        if (target && this.attackTimer <= 0) {
            const projectile = new Projectile(this.player.x, this.player.y, target.x, target.y, this.game);
            projectile.damage = 7;
            projectile.radius = 4;
            projectile.color = '#82dcff';
            projectile.speed = 450;
            const angle = Utils.angle(projectile.x, projectile.y, target.x, target.y);
            projectile.vx = Math.cos(angle) * projectile.speed;
            projectile.vy = Math.sin(angle) * projectile.speed;
            this.game.projectiles.push(projectile);
            this.attackTimer = 0.65;
        }
        if (this.time <= 0) {
            this.active = false;
            const lines = ['어제 술먹어서 오늘 출근 못해요~~', '저 퇴근합니다! 약은 챙겨 드세요~~', '근무 끝! 다음 타임에 봬요~~'];
            const line = lines[Math.floor(Math.random() * lines.length)];
            this.game.messages.push({ text: line, x: this.player.x, y: this.player.y - 55, time: 2.5, color: '#b9e8ff' });
            if (window.showStaffDialog) window.showStaffDialog(line);
        }
    }
    draw(ctx, cameraX, cameraY) {
        const x = this.player.x - cameraX + Math.cos(this.phase) * 42;
        const y = this.player.y - cameraY + Math.sin(this.phase) * 25;
        ctx.save(); ctx.fillStyle = '#5bbcff'; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('근무약사', x, y + 3);
        ctx.restore();
    }
}

function drawDrop(ctx, drop, cameraX, cameraY) {
    const x = drop.x - cameraX, y = drop.y - cameraY + Math.sin(Date.now() / 170 + drop.bob) * 4;
    ctx.save(); ctx.shadowBlur = 14; ctx.shadowColor = drop.type === 'potion' ? '#5dff85' : '#58baff';
    ctx.fillStyle = drop.type === 'potion' ? '#42e66b' : drop.type === 'staff' ? '#4da6ff' : '#f5be35'; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
    const icon = { potion: '+', staff: '직', auto: 'A', barcode: '▥', cefaclor: 'C', augmentin: 'O', upgrade: '★' }[drop.type];
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(icon, x, y + 5); ctx.restore();
}

function drawMessage(ctx, message, cameraX, cameraY) {
    ctx.save(); ctx.globalAlpha = Math.min(1, message.time); ctx.fillStyle = message.color; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(message.text, message.x - cameraX, message.y - cameraY - (1.5 - message.time) * 22); ctx.restore();
}
