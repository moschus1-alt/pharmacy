class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.background = new Image();
        this.background.src = 'assets/pharmacy-arena.png';
    }

    draw(ctx, cameraX, cameraY) {
        // 바닥 그리기
        ctx.fillStyle = "#71849a";
        ctx.fillRect(-cameraX, -cameraY, this.width, this.height);

        if (this.background.complete && this.background.naturalWidth > 0) {
            ctx.save();
            ctx.globalAlpha = 0.62;
            ctx.filter = 'brightness(1.45) saturate(0.88)';
            ctx.drawImage(this.background, -cameraX, -cameraY, this.width, this.height);
            ctx.restore();
        }

        // 약국 내 임시 오브젝트 (계산대, 진열장 등)
        ctx.fillStyle = "rgba(224, 237, 248, 0.86)";
        ctx.fillRect(100 - cameraX, 100 - cameraY, 200, 50); // 계산대 영역
        ctx.fillRect(this.width - 200 - cameraX, 200 - cameraY, 50, 400); // 약품 보관장 영역
        ctx.fillRect(200 - cameraX, this.height - 150 - cameraY, 300, 50); // 앞쪽 조제대

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(100 - cameraX, 100 - cameraY, 200, 50);
        ctx.strokeRect(this.width - 200 - cameraX, 200 - cameraY, 50, 400);
        ctx.strokeRect(200 - cameraX, this.height - 150 - cameraY, 300, 50);

        // 맵 테두리
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 10;
        ctx.strokeRect(-cameraX, -cameraY, this.width, this.height);
    }
}
