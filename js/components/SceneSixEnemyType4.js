class SceneSixEnemyType4 extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Basic properties
        this.setScale(0.7); // Larger than Type 3
        this.setImmovable(true);
        this.body.pushable = false; // Explicitly set pushable to false

        // Animation - Now using its own animation
        if (this.scene.anims.exists('irs_ship4_idle')) {
            this.play('irs_ship4_idle');
        } else {
            console.warn("SceneSixEnemyType4: 'irs_ship4_idle' animation not found! Ensure it's defined in SceneSix.");
        }

        // Movement properties
        this.speed = 70; // Slower, as it's a large enemy

        // Health
        this.health = 20;
    }

    update(time, delta) {
        // Horizontal Movement: Fly from right to left
        this.x -= this.speed * (delta / 1000);

        // Deactivate if it moves off the left side of the camera's view
        if (this.x < this.scene.cameras.main.scrollX - this.displayWidth) {
            this.setActive(false);
            this.setVisible(false);
            this.destroy(); // Destroy immediately
        }
    }

    takeHit() {
        this.health--;
        console.log(`SceneSixEnemyType4 hit! Health: ${this.health}`);

        this.setTint(0xff0000); // Turn red
        this.scene.time.delayedCall(100, () => {
            if (this.active) { // Check if sprite still exists
                this.clearTint(); // Clear red tint
            }
        });

        if (this.health <= 0) {
            // Play.fun: award points for destroying heavy ship
            awardPoints(50);
            // Play explosion effect before destroying
            if (window.EffectUtils && typeof window.EffectUtils.playExplosion === 'function') {
                // Potentially use a larger explosion or a specific one for this type
                window.EffectUtils.playExplosion(this.scene, this.x, this.y, 'standard_explosion', 0.9); // Slightly larger explosion
            }

            // --- Play Ship Explode Sound ---
            if (this.scene && this.scene.sound) {
                this.scene.sound.play('shipExplode', { volume: 0.1 }); // Even louder for this large ship
            } else {
                console.warn("SceneSixEnemyType4: Could not play 'shipExplode' sound. Scene or sound manager missing.");
            }
            // --- End Play Ship Explode Sound ---

            this.destroy();
            console.log('SceneSixEnemyType4 destroyed!');
        }
    }
}

// Make class available if using script tags in index.html
if (typeof window !== 'undefined') {
    window.SceneSixEnemyType4 = SceneSixEnemyType4;
} 