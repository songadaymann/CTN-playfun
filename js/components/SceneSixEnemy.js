class SceneSixEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Basic properties
        this.setScale(0.1); // Adjusted scale to make it smaller
        // this.setFlipX(true); // Flip sprite horizontally - REMOVED to un-flip
        this.setImmovable(true); // For now, player projectiles will interact with it

        // Play the idle/hover animation defined in SceneSix
        if (this.scene.anims.exists('irs_ship_idle')) {
            this.play('irs_ship_idle');
        } else {
            console.warn("SceneSixEnemy: 'irs_ship_idle' animation not found!");
        }

        // Movement properties
        this.speed = 100; // Pixels per second for horizontal movement, adjust as needed

        // Sine wave movement properties
        this.initialY = y;                       // Store the initial Y position to oscillate around it
        this.sineWaveAmplitude = 150;           // How far up/down it moves (pixels) - Increased for a bigger wave
        this.sineWaveFrequency = 0.002;          // How fast it oscillates (adjust for desired speed)
        this.sineWaveTime = Math.random() * 1000; // Start at a random point in the wave for variety if multiple enemies
    }

    update(time, delta) {
        // Horizontal Movement: Fly from right to left
        this.x -= this.speed * (delta / 1000); // delta is in ms, convert to seconds

        // Sine Wave Vertical Movement
        this.sineWaveTime += delta;
        const offsetY = Math.sin(this.sineWaveTime * this.sineWaveFrequency) * this.sineWaveAmplitude;
        this.y = this.initialY + offsetY;

        // Deactivate if it moves off the left side of the camera's view
        if (this.x < this.scene.cameras.main.scrollX - this.displayWidth) {
            this.setActive(false);
            this.setVisible(false);
            // console.log("SceneSixEnemy deactivated as it moved off-screen left.");
            // Optionally, destroy it if you don't plan to reuse: this.destroy();
        }
    }

    // Placeholder for taking damage
    takeHit() {
        console.log('SceneSixEnemy hit!');
        // Play.fun: award points for destroying enemy ship
        awardPoints(10);
        // Play explosion effect before destroying
        if (window.EffectUtils && typeof window.EffectUtils.playExplosion === 'function') {
            window.EffectUtils.playExplosion(this.scene, this.x, this.y);
        }
        
        // --- Play Ship Explode Sound ---
        if (this.scene && this.scene.sound) {
            this.scene.sound.play('shipExplode', { volume: 0.1 }); // Adjust volume as needed
        } else {
            console.warn("SceneSixEnemy: Could not play 'shipExplode' sound. Scene or sound manager missing.");
        }
        // --- End Play Ship Explode Sound ---

        // TODO: Reduce health, play explosion, etc.
        // For now, just destroy it
        this.destroy(); 
    }
}

// Make class available if using script tags in index.html
// If using modules, you would export default SceneSixEnemy;
if (typeof window !== 'undefined') {
    window.SceneSixEnemy = SceneSixEnemy;
} 