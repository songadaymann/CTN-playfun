class EffectUtils {
    /**
     * Plays an explosion animation at a given position.
     * Assumes an animation with the key 'standard_explosion' is preloaded and defined in the scene.
     * @param {Phaser.Scene} scene - The scene in which to play the explosion.
     * @param {number} x - The x-coordinate for the explosion.
     * @param {number} y - The y-coordinate for the explosion.
     * @param {string} [explosionKey='standard_explosion'] - The key of the explosion animation.
     * @param {number} [scale=1] - The scale of the explosion sprite.
     */
    static playExplosion(scene, x, y, explosionKey = 'standard_explosion', scale = 0.3) {
        if (!scene || !scene.anims.exists(explosionKey)) {
            console.warn(`EffectUtils: Explosion animation key "${explosionKey}" not found or scene is invalid.`);
            return;
        }

        const explosion = scene.add.sprite(x, y, null); // Start with no texture, animation will provide it
        explosion.setScale(scale);
        explosion.setDepth(500); // Ensure explosions are generally on top

        // Play the animation
        explosion.play(explosionKey);

        // Listen for the animation complete event to destroy the sprite
        explosion.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            explosion.destroy();
        });
    }
}

// Make class available if using script tags in index.html
// If using modules, you would export default EffectUtils;
if (typeof window !== 'undefined') {
    window.EffectUtils = EffectUtils;
} 