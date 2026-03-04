class SoundManager {
    constructor(game) {
        this.game = game;
        this.sounds = {}; // To store sound instances if needed, or just use Phaser's cache
        console.log("SoundManager: Initialized");
    }

    /**
     * Preloads a sound effect.
     * Call this during a Scene's preload() method.
     * @param {Phaser.Scene} scene - The scene calling this method.
     * @param {string} key - The unique key for this sound effect.
     * @param {string} path - The path to the sound effect file.
     */
    loadSound(scene, key, path) {
        if (!key || !path) {
            console.error("SoundManager: Key and path are required to load a sound.");
            return;
        }
        scene.load.audio(key, path);
        console.log(`SoundManager: Audio [${key}] loading from ${path}`);
    }

    /**
     * Plays a sound effect.
     * @param {string} key - The key of the sound effect to play.
     * @param {Phaser.Types.Sound.SoundConfig} [config] - Optional configuration for the sound.
     * @returns {Phaser.Sound.BaseSound | null} The sound instance or null if not found/played.
     */
    playSound(key, config = {}) {
        if (!this.game.sound.get(key) && !this.game.cache.audio.has(key)) {
            console.warn(`SoundManager: Sound with key '${key}' not found in cache. Was it preloaded?`);
            // Attempt to play if it exists in the global sound manager, perhaps loaded elsewhere
            // This might be redundant if preloading is strictly enforced via loadSound
        }
        
        try {
            const sound = this.game.sound.play(key, config);
            if (sound) {
                console.log(`SoundManager: Playing sound [${key}]`);
                // Removed problematic .once event listeners that caused TypeError
                return sound;
            } else {
                console.warn(`SoundManager: Could not play sound [${key}]. Play method returned null.`);
                return null;
            }
        } catch (error) {
            console.error(`SoundManager: Exception when trying to play sound [${key}]:`, error);
            return null;
        }
    }

    /**
     * Adds a sound to Phaser's sound manager, creating a sound instance.
     * This is useful if you want to manage the sound instance directly (e.g., for looping, stopping).
     * @param {string} key - The key of the sound effect.
     * @returns {Phaser.Sound.BaseSound | null} The created sound instance or null.
     */
    addSound(key) {
        if (!this.game.cache.audio.has(key)) {
            console.warn(`SoundManager: Cannot add sound. Key '${key}' not found in cache. Was it preloaded?`);
            return null;
        }
        const soundInstance = this.game.sound.add(key);
        this.sounds[key] = soundInstance; // Optionally store it
        console.log(`SoundManager: Added sound instance for [${key}]`);
        return soundInstance;
    }

    /**
     * Stops a specific sound if it's playing.
     * @param {string} key - The key of the sound to stop.
     */
    stopSound(key) {
        // Phaser's SoundManager doesn't directly stop by key if multiple instances are playing.
        // This method would be more effective if we manage instances within SoundManager.
        // For now, let's assume we target sounds managed by Phaser's global playback.
        // A more robust way is to iterate through active sounds.
        const sounds = this.game.sound.getAllPlaying();
        let stopped = false;
        sounds.forEach(sound => {
            if (sound.key === key) {
                sound.stop();
                stopped = true;
            }
        });
        if (stopped) {
            console.log(`SoundManager: Stopped sound(s) with key [${key}]`);
        } else {
            // console.log(`SoundManager: No sound playing with key [${key}] to stop.`);
        }
    }

    /**
     * Stops all currently playing sound effects.
     */
    stopAllSounds() {
        this.game.sound.stopAll();
        console.log("SoundManager: Stopped all sounds.");
    }

    // Example: Set global volume for all sounds (effects) if desired
    // Note: Music volume is typically handled separately by MusicManager
    /**
     * Sets the global volume for sound effects.
     * @param {number} volume - Volume level (0 to 1).
     */
    setGlobalVolume(volume) {
        this.game.sound.volume = Phaser.Math.Clamp(volume, 0, 1);
        console.log(`SoundManager: Global SFX volume set to ${this.game.sound.volume}`);
    }

    /**
     * Gets the global volume for sound effects.
     * @returns {number} The current global volume.
     */
    getGlobalVolume() {
        return this.game.sound.volume;
    }
}

// Make class available globally if not using modules
if (typeof window !== 'undefined') {
    window.SoundManager = SoundManager;
} 