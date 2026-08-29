class Enemy {
    constructor(x, y, game, type = "진상") {
        this.game = game;
        this.type = type;
        this.x = x;
        this.y = y;
        this.target = game.player; // 플레이어
        this.active = true;
        this.taunt = Enemy.TAUNTS[Math.floor(Math.random() * Enemy.TAUNTS.length)];
        this.facingAngle = 0;
        this.slowTimer = 0;
        this.summonTimer = 4;
        this.rangedTimer = 3.5;
        this.walkTimer = Math.random();
        this.walkFrame = 0;
        this.facingRow = 0;

        if (type.startsWith("중간보스")) {
            const bossIndex = (game.stage - 1) % 4;
            this.speed = 58 + bossIndex * 8;
            this.radius = 34 + bossIndex * 3;
            this.hp = 520 + game.stage * 220 + bossIndex * 120;
            this.maxHp = this.hp;
            this.expYield = 220 + game.stage * 30;
            this.color = ['#d9534f', '#b24cff', '#ff8a2b', '#4e80ff'][bossIndex];
            this.taunt = ['오늘도 야근 확정이다!', '오늘도 야근 확정이다!', '클레임은 끝나지 않아!', '본사 방침이다!'][bossIndex];
        } else if (type === "의사") {
            this.speed = 120 + Math.random() * 20; // 진상보다 빠름
            this.radius = 14;
            this.hp = 15 + game.level * 5;
            this.maxHp = this.hp;
            this.expYield = 40;
            this.color = "#4da6ff"; // 파란색 계열
        } else {
            this.speed = 80 + Math.random() * 40; // 약간 느리지만 변수가 있음
            this.radius = 16;
            this.hp = 30 + game.level * 10;
            this.maxHp = this.hp;
            this.expYield = 30;
            this.color = "#ff4d4d"; // 붉은색 계열
        }
    }

    update(dt) {
        if (!this.active) return;

        // 플레이어 방향으로 따라가기
        const ang = Utils.angle(this.x, this.y, this.target.x, this.target.y);
        this.facingAngle = ang;
        if (this.slowTimer > 0) this.slowTimer -= dt;
        const speed = this.slowTimer > 0 ? this.speed * 0.4 : this.speed;
        this.x += Math.cos(ang) * speed * dt;
        this.y += Math.sin(ang) * speed * dt;
        this.facingRow = Utils.directionRow(Math.cos(ang), Math.sin(ang), this.facingRow);
        this.walkTimer += dt;
        this.walkFrame = Utils.walkFrame(this.walkTimer, 0.12);
        if (this.type.startsWith('중간보스')) {
            this.summonTimer -= dt;
            if (this.summonTimer <= 0 && this.game.enemies.length < 12) {
                const offset = Math.random() * Math.PI * 2;
                this.game.enemies.push(new Enemy(this.x + Math.cos(offset) * 65, this.y + Math.sin(offset) * 65, this.game, '보스 호출몹'));
                this.summonTimer = 4;
                this.game.messages.push({ text: '중간보스: 진상 호출!', x: this.x, y: this.y - 55, time: 1.2, color: '#ed8cff' });
                window.gameAudio.summon();
            }
            this.rangedTimer -= dt;
            if (this.rangedTimer <= 0) {
                this.game.spawnEnemyProjectile(this);
                window.gameAudio.bossShot();
                const lines = ['이힉~ 여긴 너무 비싸요. 다른 약국 갈래요.', '단골인데 드링크 한 병도 안주나?', '병원 문닫았는데 약 하루치만 미리 줘봐.', '비아그라 그냥 안팔아? 다른약국은 팔던데..'];
                this.game.messages.push({ text: lines[Math.floor(Math.random() * lines.length)], x: this.x, y: this.y - 72, time: 2.4, color: '#ffddb0' });
                this.rangedTimer = 4.2;
            }
        }
    }

    draw(ctx, cameraX, cameraY) {
        if (!this.active) return;

        // 진상 손님 또는 의사 캐릭터
        const walkSprite = this.type.startsWith('중간보스') ? this.game.bossWalkSprite : {
            '남자 진상': this.game.maleEnemyWalkSprite,
            '여자 진상': this.game.femaleEnemyWalkSprite,
            '할아버지 진상': this.game.grandfatherEnemyWalkSprite,
            '할머니 진상': this.game.grandmotherEnemyWalkSprite,
            '보스 호출몹': this.game.bossMinionWalkSprite
        }[this.type];
        if (walkSprite && walkSprite.complete && walkSprite.naturalWidth > 0) {
            const cell = walkSprite.naturalWidth / 4;
            const spriteSize = this.type.startsWith('중간보스') ? 132 : 58;
            ctx.save();
            ctx.translate(this.x - cameraX, this.y - cameraY);
            ctx.drawImage(walkSprite, this.walkFrame * cell, this.facingRow * cell, cell, cell, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
            ctx.restore();
        } else if (this.game.enemySprite.complete && this.game.enemySprite.naturalWidth > 0) {
            const spriteSize = this.type.startsWith("중간보스") ? 135 : this.type === "의사" ? 70 : 78;
            const bob = Math.sin(Date.now() / 110 + this.x) * 2;
            ctx.save();
            ctx.translate(this.x - cameraX, this.y - cameraY + bob);
            ctx.rotate(this.facingAngle + Math.PI / 2);
            if (this.type === "의사") ctx.filter = 'hue-rotate(155deg) saturate(1.25)';
            ctx.drawImage(this.game.enemySprite, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
            ctx.restore();
            if (this.type.startsWith('중간보스')) {
                ctx.save();
                ctx.strokeStyle = 'rgba(210, 100, 255, 0.8)'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(this.x - cameraX, this.y - cameraY, 48 + Math.sin(Date.now() / 90) * 4, 0, Math.PI * 2); ctx.stroke();
                ctx.restore();
            }
        } else {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y - cameraY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.stroke();
        }

        // 텍스트로 얼굴 느낌 주기
        ctx.fillStyle = "black";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.type, this.x - cameraX, this.y - cameraY);

        // 체력바
        const barWidth = 30;
        const barHeight = 5;
        const barX = this.x - cameraX - barWidth / 2;
        const barY = this.y - cameraY - this.radius - 10;

        ctx.fillStyle = "red";
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(barX, barY, barWidth * (Math.max(0, this.hp) / this.maxHp), barHeight);

        // 중간보스의 대사는 원거리 공격 시 메시지로만 표시합니다.
        if (!this.type.startsWith('중간보스')) {
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
            ctx.strokeText(this.taunt, this.x - cameraX, barY - 7);
            ctx.fillStyle = "#fff3a3";
            ctx.fillText(this.taunt, this.x - cameraX, barY - 7);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        window.gameAudio.enemyHit();
        if (this.hp <= 0 && this.active) {
            this.active = false;
            this.game.addExp(this.expYield); // 적 종류에 따른 경험치 획득
            this.game.spawnDrop(this.x, this.y);
            this.game.enemyDefeated(this.type);
        }
    }
}

Enemy.TAUNTS = [
    "약은 내일 먹지?",
    "복약지도 더 해봐!",
    "그 알약, 효과 있냐?",
    "야근 처방전이다!",
    "약사님, 품절이요!",
    "조제는 내가 한다!",
    "똥기저귀 버려주세요!",
    "약이 하루치 부족해요!",
    "저 약국은 전문약도 팔던데!"
];
