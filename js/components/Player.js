class Player extends Phaser.Physics.Arcade.Sprite {

    // --- Physics Constants (Adjust these!) ---
    MOVE_SPEED = 320;          // Max horizontal speed (scaled from 2.2)
    ACCELERATION = 1050;       // Horizontal acceleration (scaled from 0.10, needs to be higher)
    DRAG = 1600;               // Horizontal drag (scaled from 0.10, friction/deceleration)
    JUMP_VELOCITY = -620;      // Vertical jump velocity (scaled/interpreted from 10.0)
    GRAVITY = 1450;            // World gravity (scaled from 0.35)
    AIR_CONTROL_FACTOR = 0.71; // How much control in air (scaled from 0.25)
    ATTACK_DURATION = 300;    // Duration of the attack animation (adjust based on frameRate)
    HITBOX_OFFSET_X = 45;     // Horizontal offset - RE-EVALUATE BASED ON SCALE/ANIM
    HITBOX_OFFSET_Y = -10;    // Vertical offset - RE-EVALUATE
    HITBOX_WIDTH = 75;        // Width - RE-EVALUATE
    HITBOX_HEIGHT = 50;       // Height - RE-EVALUATE
    // Baseline frame height captured from first frame; used to keep collider bottom constant across differently trimmed frames
    baseFrameHeight = null;
    // ----------------------------------------

    // --- Scaling Factor ---
    SPRITE_SCALE = 0.4; // Enlarged scale

    // --- Collider Tuning (edit here!) ---
    IDLE_WIDTH_MULT   = 0.60; // body width when not attacking
    ATTACK_WIDTH_MULT = 0.28; // narrower body while attacking frames are wider
    HEIGHT_MULT       = 1; // shorter body so feet sit on ground (0.80–0.90 range)
    FEET_FUDGE        = -25;    // Downward adjustment so shoes touch ground
    // --------------------

    constructor(scene, x, y) { // Remove texture default
        console.log("Player Constructor Start");
        // Use the atlas key and the initial idle frame
        super(scene, x, y, 'player_atlas', 'idle.png');
        console.log("Player super() called with player_atlas");

        scene.add.existing(this);
        console.log("Player scene.add.existing called");
        scene.physics.add.existing(this);
        console.log("Player scene.physics.add.existing called");

        this.isHoldingLoan = false; // Initialize here

        // --- Set Origin and Scale FIRST ---
        this.setOrigin(0.5, 0.5); // Set origin to center for better alignment
        this.setScale(this.SPRITE_SCALE);
        console.log(`Player scale set to: ${this.SPRITE_SCALE}, Origin set to (0.5,0.5)`);

        // --- Physics Setup ---
        this.setGravityY(this.GRAVITY);
        this.setDragX(this.DRAG);
        this.setMaxVelocity(this.MOVE_SPEED, Math.abs(this.JUMP_VELOCITY * 2));
        this.setCollideWorldBounds(true);
        this.body.onWorldBounds = true;

        // Store baseline trimmed frame height (idle frame) once
        this.baseFrameHeight = this.frame.height;

        // Configure physics body using shared utility, computing vertical adjust dynamically
        const widthMult     = this.isAttacking ? this.ATTACK_WIDTH_MULT : this.IDLE_WIDTH_MULT;
        const heightMult    = this.HEIGHT_MULT;
        const verticalAdjust = ((this.frame.height - this.baseFrameHeight) / 2) - this.FEET_FUDGE;
        applyBodyFromFrame(this, { widthMult, heightMult, verticalAdjust, debug: window.APPLY_BODY_DEBUG });

        // Extra per-frame debug so we can see collider consistency without
        // having to toggle anything from the console.
        if (window.APPLY_BODY_DEBUG) {
            console.log(`[PlayerCollider] frame=${this.frame.name} fh=${this.frame.height} ` +
                        `base=${this.baseFrameHeight} vertAdj=${verticalAdjust.toFixed(1)} ` +
                        `offY=${this.body.offset.y.toFixed(1)} onFloor=${this.body.onFloor()}`);
        }

        console.log("Player Physics Setup Done");

        // --- Input Setup ---
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        console.log("Player Input Setup Done");

        this.movementEnabled = true;
        this.isAttacking = false;
        this.attackTimer = null; // Keep timer for now, maybe switch to anim complete later

        // --- Guitar Hitbox ---
        console.log("Creating Guitar Hitbox...");
        this.guitarHitbox = scene.add.rectangle(0, 0, this.HITBOX_WIDTH, this.HITBOX_HEIGHT, 0xff0000, 0.5)
                                   .setOrigin(0.5)
                                   .setVisible(false);
        console.log("Guitar Hitbox Rectangle Created (No Physics Body)");

        // --- Attack Input ---
        scene.input.on('pointerdown', this.attack, this);
        console.log("Player Attack Input Listener Added (global canvas tap)");

        // --- Start Idle Animation ---
        this.play('player_idle');

        console.log("Player initialized with keys, attack input, and atlas.");

        this.jumpKeyHeld = false;
        this.hasJumped = false;
    }

    disableMovement() {
        this.movementEnabled = false;
        this.setVelocityX(0);
        this.play('player_idle'); // Go to idle when disabled
        console.log("Player movement DISABLED");
    }

    enableMovement() {
        this.movementEnabled = true;
        console.log("Player movement ENABLED");
    }

    // --- NEW: Methods for Aave Loan State ---
    startHoldingLoan() {
        this.isHoldingLoan = true;
        this.play('player_aave_loan', true); // Play and ignore if already playing
        this.updateBodyOffset(); // Ensure body is correct for this sprite
        console.log("Player started holding Aave loan");
    }

    stopHoldingLoan() { // Call this if the loan state can end
        this.isHoldingLoan = false;
        // The regular animation logic in update() will take over
        console.log("Player stopped holding Aave loan");
    }
    // --- END NEW ---

    attack() {
        const onGround = this.body.blocked.down || this.body.touching.down;
        if (!this.movementEnabled || this.isAttacking /*|| !onGround*/) {
            return;
        }

        console.log("Player attacking!");
        this.isAttacking = true;
        this.play('player_attack', true); // Play attack animation, ignoreIfPlaying = true
        
        // --- Play Swing Guitar Sound ---
        const soundManager = this.scene.registry.get('soundManager');
        if (soundManager) {
            soundManager.playSound('swingGuitarSound', { volume: 0.1 });
        } else {
            console.warn('Player: SoundManager not found in scene registry. Cannot play swing guitar sound.');
        }
        // --- End Sound ---
        
        // Recalculate body offset for attack animation
        this.updateBodyOffset();

        // Hitbox positioning logic is moved to update for continuous positioning

        // Reset attack state after duration (could also use animation complete event)
        if (this.attackTimer) this.attackTimer.remove();
        this.attackTimer = this.scene.time.delayedCall(this.ATTACK_DURATION, () => {
            this.isAttacking = false;
            this.guitarHitbox.setVisible(false);
            // Don't force idle here, let update() handle the next state
            // console.log("Attack finished.");
        }, [], this);

        // Make hitbox visible immediately when attack starts
        // Position will be set in update
        const hitboxX = this.x + (this.flipX ? -this.HITBOX_OFFSET_X : this.HITBOX_OFFSET_X);
        const hitboxY = this.y + this.HITBOX_OFFSET_Y;
        this.guitarHitbox.setPosition(hitboxX, hitboxY);
        this.checkHitboxOverlap(); // Check overlap while attacking

        // Re-apply body offset each attack frame
        this.updateBodyOffset();
    }

    checkHitboxOverlap() {
        if (!this.scene.enemyManager) {
            return;
        }
        const enemyGroup = this.scene.enemyManager.getGroup();
        const hitboxGeom = this.guitarHitbox.getBounds();

        enemyGroup.children.each(enemy => {
            if (enemy.active && !enemy.isHit && Phaser.Geom.Intersects.RectangleToRectangle(hitboxGeom, enemy.getBounds())) {
                console.log("Hitbox overlapped with enemy!");
                this.handleEnemyHit(enemy);
            }
        });
    }

    handleEnemyHit(enemy) {
        if (!enemy || typeof enemy.takeHit !== 'function') return;

        const hitFromLeft = this.x < enemy.x;
        enemy.takeHit(hitFromLeft);

        // --- Play Hit Sound ---
        const soundManager = this.scene.registry.get('soundManager');
        if (soundManager) {
            soundManager.playSound('playerHitSound', { volume: 0.2 }); 
        } else {
            console.warn('Player: SoundManager not found in scene registry. Cannot play hit sound.');
        }
        // --- End Hit Sound ---

        const scene = this.scene;

        // 1. Camera shake for impact
        if (scene.cameras && scene.cameras.main) {
            scene.cameras.main.shake(120, 0.008);
        }

        // 2. Quick white flash on enemy
        enemy.setTintFill(0xffffff);
        setTimeout(() => enemy.clearTint(), 40);

        // 3. Dust/spark particle burst
        if (!scene.textures.exists('hit-dust')) {
            const gfx = scene.add.graphics({ x: 0, y: 0, add: false });
            gfx.fillStyle(0xffffff, 1);
            gfx.fillCircle(4, 4, 4);
            gfx.generateTexture('hit-dust', 8, 8);
            gfx.destroy();
        }
        const emitter = scene.add.particles(enemy.x, enemy.y, 'hit-dust', {
            speed: { min: -120, max: 120 },
            angle: { min: 0, max: 360 },
            lifespan: 350,
            quantity: 15,
            scale: { start: 0.7, end: 0 },
            alpha: { start: 1, end: 0 },
            gravityY: 300
        });
        emitter.setDepth(enemy.depth + 1);
        scene.time.delayedCall(400, () => emitter.destroy());

        // 4. Floating score popup
        const popup = scene.add.text(enemy.x, enemy.y - enemy.displayHeight / 2, '+100', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(enemy.depth + 2);
        scene.tweens.add({
            targets: popup,
            y: popup.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => popup.destroy()
        });

        // (Hit-stop removed temporarily to avoid game freeze)

        console.log("Enemy hit by guitar!");
    }

    update(time, delta) {
        const onGround = this.body.blocked.down || this.body.touching.down;
        const touch = this.scene.game.touchControls ? this.scene.game.touchControls.directions : {};

        // --- Handle Attack Input (from touch controls / mann.cool virtual controller) ---
        if (touch.action && !this.isAttacking) {
            this.attack(); 
        }

        // --- Handle Movement/Input (only if enabled) ---
        if (this.movementEnabled) {
            const currentAcceleration = onGround ? this.ACCELERATION : this.ACCELERATION * this.AIR_CONTROL_FACTOR;

            if (this.cursors.left.isDown || this.keyA.isDown || touch.left) {
                this.setAccelerationX(-currentAcceleration);
                this.setFlipX(true);
            } else if (this.cursors.right.isDown || this.keyD.isDown || touch.right) {
                this.setAccelerationX(currentAcceleration);
                this.setFlipX(false);
            } else {
                this.setAccelerationX(0);
            }

            // --- Variable Jump Height ---
            const jumpPressed = this.cursors.up.isDown || this.keySpace.isDown || touch.up;
            if (onGround && jumpPressed && !this.jumpKeyHeld) {
                this.setVelocityY(this.JUMP_VELOCITY);
                this.jumpKeyHeld = true;
                this.hasJumped = true;

                // --- Play Jump Sound ---
                const soundManager = this.scene.registry.get('soundManager');
                if (soundManager) {
                    soundManager.playSound('playerJumpSound', { volume: 0.1 });
                } else {
                    console.warn('Player: SoundManager not found in scene registry. Cannot play jump sound.');
                }
            }
            if (!jumpPressed) {
                this.jumpKeyHeld = false;
            }
            // If jump key released early and player is still moving up, cut velocity for short hop
            if (this.hasJumped && !jumpPressed && this.body.velocity.y < 0) {
                this.setVelocityY(this.body.velocity.y * 0.45); // Cut upward velocity for short hop
                this.hasJumped = false;
            }
            if (onGround) {
                this.hasJumped = false;
            }
            if (!onGround && this.body.blocked.left && this.body.velocity.x < 0) {
                this.setAccelerationX(0);
            }
            if (!onGround && this.body.blocked.right && this.body.velocity.x > 0) {
                this.setAccelerationX(0);
            }
        }

        // --- Animation Control ---
        // Priority: Aave Loan > Attack > Jump > Walk > Idle
        if (this.isHoldingLoan) {
            this.play('player_aave_loan', true); // Ensure loan animation stays if active
            // Recalculate body offset for loan animation
            this.updateBodyOffset();
        } else if (this.isAttacking) {
            // Attack animation is already playing, do nothing here
            // Ensure hitbox stays positioned correctly
            const hitboxX = this.x + (this.flipX ? -this.HITBOX_OFFSET_X : this.HITBOX_OFFSET_X);
            const hitboxY = this.y + this.HITBOX_OFFSET_Y;
            this.guitarHitbox.setPosition(hitboxX, hitboxY);
            this.checkHitboxOverlap(); // Check overlap while attacking

            // Re-apply body offset each attack frame
            this.updateBodyOffset();
        } else if (!onGround) {
            this.play('player_jump', true); // Play jump animation if in the air (and not attacking)
            // Recalculate body offset for jump animation
            this.updateBodyOffset();
        } else if (this.body.velocity.x !== 0) {
            this.play('player_walk', true); // Play walk animation if moving horizontally on ground
            // Recalculate body offset for walk animation
            this.updateBodyOffset();
        } else {
            this.play('player_idle', true); // Play idle animation if on ground and not moving
            // Recalculate body offset for idle animation
            this.updateBodyOffset();
        }

        // --- Update Hitbox Position (even if not attacking, just keep it hidden) ---
        // We position it during attack state now, and hide it otherwise via the attack timer.
        // If not attacking, ensure it's hidden (belt and suspenders)
        // if (!this.isAttacking && this.guitarHitbox.visible) {
        //     this.guitarHitbox.setVisible(false);
        // }

        // Note: checkHitboxOverlap() is now called only when isAttacking is true.
    }

    handleCollision(otherObject) {
        // console.log('Player collided with:', otherObject);
    }
    
    // Helper method to update body offset based on current animation frame
    updateBodyOffset() {
        const widthMult     = this.isAttacking ? this.ATTACK_WIDTH_MULT : this.IDLE_WIDTH_MULT;
        const heightMult    = this.HEIGHT_MULT;
        const verticalAdjust = ((this.frame.height - this.baseFrameHeight) / 2) - this.FEET_FUDGE;
        applyBodyFromFrame(this, { widthMult, heightMult, verticalAdjust, debug: window.APPLY_BODY_DEBUG });
    }
}

// Make class available for import (if using modules later)
// export default Player;
