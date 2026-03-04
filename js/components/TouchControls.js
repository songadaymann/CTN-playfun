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
            // Ensure the main element is null so destroy doesn't fail
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
        joystickWrapper.style.touchAction = 'none'; // Allow pointermove events
        joystickWrapper.style.pointerEvents = 'all';
        // Prevent selection and callouts on joystick
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

        // Position joystickWrapper in bottom-left
        Object.assign(joystickWrapper.style, {
            marginLeft: '20px',
            marginBottom: '20px'
        });

        // --- Action Button (bottom-right) ---
        const actionBtn = document.createElement('button');
        actionBtn.id = 'touch-action';
        actionBtn.textContent = 'Ⓐ';
        Object.assign(actionBtn.style, {
            width: '64px',
            height: '64px',
            fontSize: '24px',
            background: 'rgba(255,65,54,0.8)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            marginRight: '20px',
            marginBottom: '20px',
            pointerEvents: 'all'
        });

        // Build flexbox layout (space-between)
        this.touchControlsElement.style.justifyContent = 'space-between';
        this.touchControlsElement.style.alignItems = 'flex-end';

        this.touchControlsElement.appendChild(joystickWrapper);
        this.touchControlsElement.appendChild(actionBtn);

        container.appendChild(this.touchControlsElement);

        // Store refs
        this.joystick.baseEl = base;
        this.joystick.thumbEl = thumb;

        // Add event listeners
        this.addJoystickListeners(joystickWrapper);
        this.addActionButtonListeners(actionBtn);
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
        if (this.joystick.pointerId !== null) return; // Already tracking

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
        this.setDirections(0,0);

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

        this.setDirections(normX, normY);
    }

    setDirections(normX, normY) {
        const threshold = 0.3; // Deadzone threshold
        this.directions.left  = normX < -threshold;
        this.directions.right = normX >  threshold;
        this.directions.up    = normY < -threshold;
        this.directions.down  = normY >  threshold;
    }

    // ----------------------------------------------------------------
    // Action Button Logic
    // ----------------------------------------------------------------
    addActionButtonListeners(btn) {
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            // Action button pressed – set dedicated 'action' flag (no longer toggles 'up')
            this.directions.action = true;
        });
        const end = (e) => {
            e.preventDefault();
            this.directions.action = false; // Clear action flag
        };
        btn.addEventListener('pointerup', end);
        btn.addEventListener('pointerout', end);
        btn.addEventListener('pointercancel', end);
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
