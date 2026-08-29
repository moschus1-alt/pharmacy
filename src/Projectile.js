class Projectile {
    constructor(x, y, targetX, targetY, game) {
        this.x = x;
        this.y = y;
        this.speed = 600; // 빠른 발사 속도
        this.radius = game.baseProjRadius || 5;
        this.damage = game.baseDamage || 10;
        this.active = true;
        this.color = 'yellow';

        const ang = Utils.angle(x, y, targetX, targetY);
        this.vx = Math.cos(ang) * this.speed;
        this.vy = Math.sin(ang) * this.speed;
    }

    update(dt) {
        if (!this.active) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx, cameraX, cameraY) {
        if (!this.active) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y - cameraY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
