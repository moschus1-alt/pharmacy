class InputManager {
    constructor() {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.touchX = 0;
        this.touchY = 0;

        window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.isMouseDown = true;
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.isMouseDown = false;
        });

        this.bindTouchStick();
    }

    bindTouchStick() {
        const stick = document.getElementById('touch-stick');
        const knob = document.getElementById('touch-knob');
        if (!stick || !knob) return;
        let pointerId = null;
        const update = (event) => {
            const rect = stick.getBoundingClientRect();
            const max = rect.width * 0.32;
            let x = event.clientX - (rect.left + rect.width / 2);
            let y = event.clientY - (rect.top + rect.height / 2);
            const distance = Math.hypot(x, y);
            if (distance > max) { x = x / distance * max; y = y / distance * max; }
            this.touchX = x / max;
            this.touchY = y / max;
            knob.style.transform = `translate(${x}px, ${y}px)`;
        };
        const release = (event) => {
            if (pointerId !== null && event.pointerId !== pointerId) return;
            pointerId = null;
            this.touchX = 0;
            this.touchY = 0;
            knob.style.transform = 'translate(0, 0)';
        };
        stick.addEventListener('pointerdown', (event) => {
            pointerId = event.pointerId;
            stick.setPointerCapture(pointerId);
            update(event);
        });
        stick.addEventListener('pointermove', (event) => {
            if (event.pointerId === pointerId) update(event);
        });
        stick.addEventListener('pointerup', release);
        stick.addEventListener('pointercancel', release);
    }

    getMovement() {
        let x = this.touchX;
        let y = this.touchY;
        if (this.isKeyPressed('a') || this.isKeyPressed('arrowleft')) x -= 1;
        if (this.isKeyPressed('d') || this.isKeyPressed('arrowright')) x += 1;
        if (this.isKeyPressed('w') || this.isKeyPressed('arrowup')) y -= 1;
        if (this.isKeyPressed('s') || this.isKeyPressed('arrowdown')) y += 1;
        const length = Math.hypot(x, y);
        if (length > 1) { x /= length; y /= length; }
        return { x, y };
    }

    isKeyPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }
}
