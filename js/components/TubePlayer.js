class TubePlayer extends Phaser.Physics.Arcade.Sprite {
    // Movement tuning
    MAX_SPEED     = 180;  // cap speed so the tube doesn't zoom too fast
    ACCELERATION  = 600;  // how quickly the tube accelerates toward max speed
    WATER_DRAG    = 400;  // natural slowdown when no input (simulates water friction)

    constructor(scene, x, y, textureKey = 'player_atlas', frameName = 'idle.png') {
        // Allow custom texture/frame so scenes can supply their own player sprite
        super(scene, x, y, textureKey, frameName);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 0.5);
        this.setCollideWorldBounds(true);
        this.setDepth(10);
        this.prevX = x;
        this.prevY = y;

        // Arrow keys
        this.cursors = scene.input.keyboard.createCursorKeys();
        // WASD keys
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Apply watery drag and speed cap
        this.setDrag(this.WATER_DRAG, this.WATER_DRAG);
        this.setMaxVelocity(this.MAX_SPEED, this.MAX_SPEED);
    }

    disableMovement() {
        this.movementEnabled = false;
        this.setVelocity(0);
    }

    enableMovement() {
        this.movementEnabled = true;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.movementEnabled) return;
        // Store previous position before moving
        this.prevX = this.x;
        this.prevY = this.y;

        let ax = 0;
        let ay = 0;
        const touch = this.scene.game.touchControls ? this.scene.game.touchControls.directions : {};
        const left   = this.cursors.left.isDown  || this.wasd.left.isDown  || touch.left;
        const right  = this.cursors.right.isDown || this.wasd.right.isDown || touch.right;
        const up     = this.cursors.up.isDown    || this.wasd.up.isDown    || touch.up;
        const down   = this.cursors.down.isDown  || this.wasd.down.isDown  || touch.down;

        if (left)  ax = -this.ACCELERATION;
        if (right) ax =  this.ACCELERATION;
        if (up)    ay = -this.ACCELERATION;
        if (down)  ay =  this.ACCELERATION;

        // Apply acceleration. If no keys pressed, acceleration is zero and drag slows the tube.
        this.setAcceleration(ax, ay);
    }

    revertPosition() {
        this.setVelocity(0, 0);
        this.x = this.prevX;
        this.y = this.prevY;
    }
}

window.TubePlayer = TubePlayer; 