class FinalTaxMonster extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setImmovable(true);
        this.body.pushable = false; // Explicitly prevent being pushed
        this.play('tax_monster_idle'); // Animation key to be defined in SceneSix

        this.health = 110;
        this.sceneRef = scene; // Keep a reference to the scene

        // Boss is described as "huge"
        // Original sprite frames are around 500x400.
        // Let's scale him up. Adjust scale as needed for visual impact.
        this.setScale(1.5); 
        this.setOrigin(0.5, 1); // Anchor at bottom-center for easier ground placement

        this.setDepth(50); // Ensure it's appropriately layered

        // Set a larger body size for collision, adjust as necessary based on scaled sprite
        // This might need tweaking based on the visual scale and origin
        const bodyWidth = this.width * 0.8 * this.scaleX; // 80% of visible width
        const bodyHeight = this.height * 0.9 * this.scaleY; // 90% of visible height
        this.body.setSize(bodyWidth, bodyHeight);
        // Offset might be needed if origin isn't 0.5,0.5 for physics body
        // Since origin is (0.5, 1), the physics body might need an offset if default center isn't what we want.
        // Phaser typically centers the physics body on the sprite. Let's see default behavior first.
    }

    takeHit() {
        if (this.health <= 0) return; // Already defeated

        this.health--;
        // this.sceneRef.sound.play('enemy_hit', { volume: 0.4 }); // Assuming a generic hit sound - TEMP REMOVED

        // Reduce taxes in SceneSix
        this.sceneRef.reduceTaxes(10000); 

        // Visual feedback for getting hit (red tint flash)
        this.setTint(0xff0000); // Apply red tint
        this.sceneRef.time.delayedCall(80, () => { // Schedule tint removal
            this.clearTint(); // Remove tint after 80ms
        }, [], this);
        
        /* // Old alpha flicker effect - replaced by tint
        this.sceneRef.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 80,
            yoyo: true,
            onComplete: () => {
                this.setAlpha(1);
            }
        });
        */

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        console.log("Tax Monster Defeated!");
        // Play.fun: big bonus for defeating the final boss
        awardPoints(500);
        // Play a larger explosion animation at the boss's position
        let explosion = this.sceneRef.add.sprite(this.x, this.y - (this.displayHeight / 2), 'explosion_atlas');
        explosion.setScale(3.5); // Make explosion much larger for the boss
        explosion.setDepth(this.depth + 1); // Ensure explosion is on top of boss
        explosion.play('standard_explosion');
        
        // this.sceneRef.sound.play('boss_explode', { volume: 0.7 }); // Assuming a boss explosion sound - TEMP REMOVED

        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });

        // Disable the boss and effectively remove it
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false; // Disable physics body

        // Notify SceneSix that the boss is defeated
        this.sceneRef.handleBossDefeat();
        
        // We don't destroy the boss object immediately, in case SceneSix needs to reference it briefly.
        // SceneSix can clean it up if needed, or it will be cleaned up on scene shutdown.
        // Or, destroy after a delay:
        this.sceneRef.time.delayedCall(1000, () => { this.destroy(); }, [], this);
    }

    update(time, delta) {
        // Future boss patterns can go here (e.g., attacks, movement)
        // For now, the boss is stationary and just takes hits.
    }
}

// Make it accessible globally if SceneSix.js is not using ES6 modules for import
if (typeof window !== 'undefined') {
    window.FinalTaxMonster = FinalTaxMonster;
} 