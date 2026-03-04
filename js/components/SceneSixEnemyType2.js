class SceneSixEnemyType2 extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame); // y here will be randomized by the spawner in SceneSix
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Basic properties
        this.setScale(0.4); 
        this.setImmovable(true);

        // Play the idle/hover animation
        if (this.scene.anims.exists('irs_ship2_idle')) {
            this.play('irs_ship2_idle');
        } else {
            console.warn("SceneSixEnemyType2: 'irs_ship2_idle' animation not found!");
        }

        // Movement properties
        this.speed = Phaser.Math.Between(600, 900); // Much faster, randomized speed
    }

    update(time, delta) {
        // Horizontal Movement: Fly from right to left very fast
        this.x -= this.speed * (delta / 1000);

        // Deactivate if it moves off the left side of the camera's view
        // Add a little buffer to ensure it's fully off-screen based on its origin
        if (this.x < this.scene.cameras.main.scrollX - this.displayWidth) {
            this.setActive(false);
            this.setVisible(false);
            this.destroy(); // Destroy immediately as they are one-offs
        }
    }

    takeHit() {
        console.log('SceneSixEnemyType2 hit!');
        // Play.fun: award points for destroying dasher
        awardPoints(15);
        // Play explosion effect before destroying
        if (window.EffectUtils && typeof window.EffectUtils.playExplosion === 'function') {
            window.EffectUtils.playExplosion(this.scene, this.x, this.y);
        }

        // --- Play Ship Explode Sound ---
        if (this.scene && this.scene.sound) {
            this.scene.sound.play('shipExplode', { volume: 0.1 }); // Adjust volume as needed
        } else {
            console.warn("SceneSixEnemyType2: Could not play 'shipExplode' sound. Scene or sound manager missing.");
        }
        // --- End Play Ship Explode Sound ---

        // TODO: Reduce health, play explosion, etc.
        this.destroy();
    }
}

// Make class available if using script tags in index.html
if (typeof window !== 'undefined') {
    window.SceneSixEnemyType2 = SceneSixEnemyType2;
} 