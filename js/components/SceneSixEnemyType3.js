class SceneSixEnemyType3 extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame, initialVerticalState = 'top') {
        super(scene, x, y, texture, frame); // Initial y is less important as it will snap
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Basic properties
        this.setScale(0.5); // Adjust scale as needed for this larger sprite
        this.setImmovable(true);
        this.body.pushable = false; // Explicitly set pushable to false

        // Animation
        if (this.scene.anims.exists('irs_ship3_idle')) {
            this.play('irs_ship3_idle');
        } else {
            console.warn("SceneSixEnemyType3: 'irs_ship3_idle' animation not found!");
        }

        // Movement properties
        this.horizontalSpeed = 120; // Pixels per second
        this.yTopBoundary = scene.scale.height * 0.2;
        this.yBottomBoundary = scene.scale.height * 0.8;
        this.currentVerticalPositionState = initialVerticalState; // 'top' or 'bottom'
        this.horizontalTravelDuration = Phaser.Math.Between(2000, 3500); // ms to travel horizontally before teleporting
        this.timeOnCurrentSegment = 0;

        // Health
        this.health = 10;

        // Snap to initial vertical position
        this.y = (this.currentVerticalPositionState === 'top') ? this.yTopBoundary : this.yBottomBoundary;
    }

    update(time, delta) {
        // Horizontal Movement
        this.x -= this.horizontalSpeed * (delta / 1000);

        // Teleporting Logic
        this.timeOnCurrentSegment += delta;
        if (this.timeOnCurrentSegment >= this.horizontalTravelDuration) {
            this.timeOnCurrentSegment = 0;
            this.horizontalTravelDuration = Phaser.Math.Between(2000, 3500); // Randomize next segment duration

            // Switch vertical position state
            if (this.currentVerticalPositionState === 'top') {
                this.currentVerticalPositionState = 'bottom';
                this.y = this.yBottomBoundary;
            } else {
                this.currentVerticalPositionState = 'top';
                this.y = this.yTopBoundary;
            }
        }

        // Deactivate if it moves off the left side of the camera's view
        if (this.x < this.scene.cameras.main.scrollX - this.displayWidth) {
            this.setActive(false);
            this.setVisible(false);
            this.destroy();
        }
    }

    takeHit() {
        this.health--;
        console.log(`SceneSixEnemyType3 hit! Health: ${this.health}`);

        this.setTint(0xff0000); // Turn red
        this.scene.time.delayedCall(100, () => {
            if (this.active) { // Check if sprite still exists
                this.clearTint(); // Clear red tint
            }
        });

        if (this.health <= 0) {
            // Play.fun: award points for destroying teleporter
            awardPoints(25);

            if (window.EffectUtils && typeof window.EffectUtils.playExplosion === 'function') {
                // Make explosion slightly larger for this bigger enemy
                window.EffectUtils.playExplosion(this.scene, this.x, this.y, 'standard_explosion', 0.75);
            }

            // --- Play Ship Explode Sound ---
            if (this.scene && this.scene.sound) {
                this.scene.sound.play('shipExplode', { volume: 0.1 }); // Slightly louder for a bigger ship
            } else {
                console.warn("SceneSixEnemyType3: Could not play 'shipExplode' sound. Scene or sound manager missing.");
            }
            // --- End Play Ship Explode Sound ---

            this.destroy();
            console.log('SceneSixEnemyType3 destroyed!');
        }
    }
}

// Make class available if using script tags in index.html
if (typeof window !== 'undefined') {
    window.SceneSixEnemyType3 = SceneSixEnemyType3;
} 