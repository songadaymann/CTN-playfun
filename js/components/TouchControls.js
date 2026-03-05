class TouchControls {
    constructor(scene) {
        this.scene = scene;
        // Directional booleans consumed by Player
        this.directions = { left: false, right: false, up: false, down: false, action: false };

        this.touchControlsElement = null;
        this.joystick = {
            baseEl: null,
            thumbEl: null,
            radius: 60,
            pointerId: null,
            center: { x: 0, y: 0 }
        };

        this.createControls();
    }

    // ----------------------------------------------------------------
    // DOM Creation
    // ----------------------------------------------------------------
    createControls() {
        // If not a mobile device, don't create a DOM element for controls
        if (typeof isMobileDevice === 'function' && !isMobileDevice()) {
            console.log('Not a mobile device, skipping touch control DOM creation.');
            this.touchControlsElement = null;
            return;
        }

        // Remove previous controls if re-created
        if (this.touchControlsElement) {
            this.touchControlsElement.remove();
        }

        const container = document.getElementById('phaser-game-container') || document.body;

        this.touchControlsElement = document.createElement('div');
        this.touchControlsElement.className = 'touch-controls';

        // --- Joystick (bottom-left) ---
        const joystickWrapper = document.createElement('div');
        joystickWrapper.style.position = 'relative';
        joystickWrapper.style.width = `${this.joystick.radius * 2}px`;
        joystickWrapper.style.height = `${this.joystick.radius * 2}px`;
        joystickWrapper.style.touchAction = 'none';
        joystickWrapper.style.pointerEvents = 'all';
        joystickWrapper.style.webkitUserSelect = 'none';
        joystickWrapper.style.mozUserSelect = 'none';
        joystickWrapper.style.msUserSelect = 'none';
        joystickWrapper.style.userSelect = 'none';
        joystickWrapper.style.webkitTouchCallout = 'none';

        const base = document.createElement('div');
        base.className = 'joystick-base';
        Object.assign(base.style, {
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255,255,255,0.4)'
        });

        const thumb = document.createElement('div');
        thumb.className = 'joystick-thumb';
        const thumbSize = this.joystick.radius * 0.6;
        Object.assign(thumb.style, {
            position: 'absolute',
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            left: `${(this.joystick.radius - thumbSize/2)}px`,
            top: `${(this.joystick.radius - thumbSize/2)}px`,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
            border: '2px solid rgba(255,255,255,0.8)'
        });

        joystickWrapper.appendChild(base);
        joystickWrapper.appendChild(thumb);

        Object.assign(joystickWrapper.style, {
            marginLeft: '20px',
            marginBottom: '20px'
        });

        // --- Right side: Jump (top) + Attack (bottom) ---
        const btnStyle = {
            width: '64px',
            height: '64px',
            fontSize: '28px',
            background: 'rgba(255,255,255,0.25)',
            color: '#fff',
            border: '2px solid rgba(255,255,255,0.5)',
            borderRadius: '50%',
            pointerEvents: 'all',
            touchAction: 'none',
            webkitUserSelect: 'none',
            mozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none',
            webkitTouchCallout: 'none',
            outline: 'none',
        };

        const rightGroup = document.createElement('div');
        Object.assign(rightGroup.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
            marginRight: '20px',
            marginBottom: '20px',
            pointerEvents: 'none',
        });

        const jumpBtn = this.createButton('\u25B2', btnStyle);    // ▲
        const attackBtn = this.createButton('\u2694', {            // ⚔
            ...btnStyle,
            background: 'rgba(255,65,54,0.7)',
            border: '2px solid rgba(255,100,80,0.8)',
        });

        rightGroup.appendChild(jumpBtn);
        rightGroup.appendChild(attackBtn);

        // Build layout
        this.touchControlsElement.style.justifyContent = 'space-between';
        this.touchControlsElement.style.alignItems = 'flex-end';

        this.touchControlsElement.appendChild(joystickWrapper);
        this.touchControlsElement.appendChild(rightGroup);

        container.appendChild(this.touchControlsElement);

        // Store refs
        this.joystick.baseEl = base;
        this.joystick.thumbEl = thumb;

        // Add event listeners
        this.addJoystickListeners(joystickWrapper);
        this.addButtonListeners(jumpBtn, 'up');
        this.addButtonListeners(attackBtn, 'action');
    }

    // ----------------------------------------------------------------
    // Joystick Logic
    // ----------------------------------------------------------------
    addJoystickListeners(wrapper) {
        wrapper.addEventListener('pointerdown', (e) => this.onJoyPointerDown(e));
        wrapper.addEventListener('pointermove', (e) => this.onJoyPointerMove(e));
        wrapper.addEventListener('pointerup', (e) => this.onJoyPointerUp(e));
        wrapper.addEventListener('pointercancel', (e) => this.onJoyPointerUp(e));
        wrapper.addEventListener('pointerout', (e) => this.onJoyPointerUp(e));
    }

    onJoyPointerDown(e) {
        e.preventDefault();
        if (this.joystick.pointerId !== null) return;

        this.joystick.pointerId = e.pointerId;

        const rect = e.currentTarget.getBoundingClientRect();
        this.joystick.center.x = rect.left + rect.width / 2;
        this.joystick.center.y = rect.top + rect.height / 2;

        this.updateJoystick(e);
    }

    onJoyPointerMove(e) {
        if (e.pointerId !== this.joystick.pointerId) return;
        e.preventDefault();
        this.updateJoystick(e);
    }

    onJoyPointerUp(e) {
        if (e.pointerId !== this.joystick.pointerId) return;
        e.preventDefault();

        // Reset thumb to center
        const thumbSize = this.joystick.thumbEl.offsetWidth;
        this.joystick.thumbEl.style.left = `${(this.joystick.radius - thumbSize/2)}px`;
        this.joystick.thumbEl.style.top  = `${(this.joystick.radius - thumbSize/2)}px`;

        // Clear directions
        this.setJoystickDirections(0, 0);

        this.joystick.pointerId = null;
    }

    updateJoystick(e) {
        const dx = e.clientX - this.joystick.center.x;
        const dy = e.clientY - this.joystick.center.y;

        const distance = Math.min(Math.sqrt(dx*dx + dy*dy), this.joystick.radius);
        const angle = Math.atan2(dy, dx);

        const normX = Math.cos(angle) * (distance / this.joystick.radius);
        const normY = Math.sin(angle) * (distance / this.joystick.radius);

        // Move thumb element
        const thumbSize = this.joystick.thumbEl.offsetWidth;
        const thumbX = this.joystick.radius + normX * this.joystick.radius - thumbSize/2;
        const thumbY = this.joystick.radius + normY * this.joystick.radius - thumbSize/2;
        this.joystick.thumbEl.style.left = `${thumbX}px`;
        this.joystick.thumbEl.style.top  = `${thumbY}px`;

        this.setJoystickDirections(normX, normY);
    }

    setJoystickDirections(normX, normY) {
        const threshold = 0.3;
        this.directions.left  = normX < -threshold;
        this.directions.right = normX >  threshold;
        this.directions.up    = normY < -threshold;
        this.directions.down  = normY >  threshold;
    }

    // ----------------------------------------------------------------
    // Button Helpers
    // ----------------------------------------------------------------
    createButton(label, style) {
        const btn = document.createElement('button');
        btn.textContent = label;
        Object.assign(btn.style, style);
        return btn;
    }

    addButtonListeners(btn, directionKey) {
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.directions[directionKey] = true;
        });

        const end = (e) => {
            e.preventDefault();
            this.directions[directionKey] = false;
        };

        btn.addEventListener('pointerup', end);
        btn.addEventListener('pointercancel', end);
        btn.addEventListener('pointerout', end);
    }

    destroy() {
        if (this.touchControlsElement && this.touchControlsElement.parentNode) {
            this.touchControlsElement.parentNode.removeChild(this.touchControlsElement);
        }
    }

    getDirections() {
        return this.directions;
    }
}

window.TouchControls = TouchControls;
