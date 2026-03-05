class TouchControls {
    constructor(scene) {
        this.scene = scene;
        // Directional booleans consumed by Player
        this.directions = { left: false, right: false, up: false, down: false, action: false };

        this.touchControlsElement = null;

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

        // Shared button styles
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

        // --- Left side: Left + Right arrow buttons ---
        const leftGroup = document.createElement('div');
        Object.assign(leftGroup.style, {
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            marginLeft: '20px',
            marginBottom: '20px',
            pointerEvents: 'none',
        });

        const leftBtn = this.createButton('\u25C0', btnStyle);   // ◀
        const rightBtn = this.createButton('\u25B6', btnStyle);   // ▶

        leftGroup.appendChild(leftBtn);
        leftGroup.appendChild(rightBtn);

        // --- Right side: Jump (top) + Attack (bottom) ---
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

        // Assemble layout
        this.touchControlsElement.appendChild(leftGroup);
        this.touchControlsElement.appendChild(rightGroup);
        container.appendChild(this.touchControlsElement);

        // Wire up button listeners
        this.addButtonListeners(leftBtn, 'left');
        this.addButtonListeners(rightBtn, 'right');
        this.addButtonListeners(jumpBtn, 'up');
        this.addButtonListeners(attackBtn, 'action');
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
