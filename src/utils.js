const Utils = {
    distance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    },
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    circleIntersect(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) < r1 + r2;
    },
    directionRow(dx, dy, currentRow = 0) {
        if (dx === 0 && dy === 0) return currentRow;
        if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 1 : 2;
        return dy < 0 ? 3 : 0;
    },
    walkFrame(elapsed, interval) {
        return [1, 2, 3, 2][Math.floor(elapsed / interval) % 4];
    }
};
