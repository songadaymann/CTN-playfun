class MusicManager {
    constructor(game) {
        this.game = game; // Phaser.Game instance
        this.currentTrack = null;
        // Store references to all music sound objects managed by this class
        this.musicTracks = {}; // Key: trackKey, Value: Phaser.Sound.BaseSound object
        console.log("MusicManager initialized");
    }

    /**
     * Preloads all music assets. Should be called from a scene's preload method (e.g., BootScene).
     * @param {Phaser.Scene} scene - The scene to load the audio into.
     */
    preload(scene) {
        // Example of how to load music:
        // scene.load.audio('titleMusic', 'assets/music/title_theme.mp3');
        // scene.load.audio('level1Music', 'assets/music/level1_background.mp3');
        // --- Add all your game's music files to be loaded here ---
        console.log('MusicManager: Preload. Define actual music files to load here.');
    }

    /**
     * Adds a loaded audio track to the manager's internal collection.
     * This should be called after Phaser has loaded the audio, typically in the create method
     * of the scene that preloaded the audio (e.g., BootScene's create method).
     * @param {string} key - The key of the loaded audio track (must match the key used in preload).
     */
    addTrack(key) {
        if (!this.game.cache.audio.exists(key)) {
            console.warn(`MusicManager: Audio key "${key}" not found in cache. Ensure it was preloaded correctly.`);
            return;
        }
        if (!this.musicTracks[key]) {
            this.musicTracks[key] = this.game.sound.add(key);
            console.log(`MusicManager: Successfully added track "${key}" to manager.`);
        } else {
            console.log(`MusicManager: Track "${key}" already added.`);
        }
    }

    /**
     * Plays a music track. If another track is playing, it will be stopped.
     * @param {string} key - The key of the music track to play.
     * @param {object} [config] - Configuration for playing the sound.
     * @param {boolean} [config.loop=false] - Whether the music should loop.
     * @param {number} [config.volume=1] - The volume of the music (0 to 1).
     */
    play(key, config = { loop: false, volume: 1 }) {
        let trackToPlay = this.musicTracks[key];

        if (!trackToPlay) {
            // console.warn(`MusicManager: Track "${key}" not in manager's list. Checking cache.`);
            if (this.game.cache.audio.exists(key)) {
                console.log(`MusicManager: Track "${key}" found in cache. Adding to manager and sound system.`);
                // Add to Phaser's sound manager and store the instance in our manager
                trackToPlay = this.game.sound.add(key);
                this.musicTracks[key] = trackToPlay; 
            } else {
                console.error(`MusicManager: Track "${key}" not found in cache and not pre-added. Cannot play.`);
                return;
            }
        }

        // Should not happen if logic above is correct, but as a safeguard:
        if (!trackToPlay) { 
            console.error(`MusicManager: Track "${key}" object is null even after attempting to add/retrieve. Cannot play.`);
            return;
        }
        
        if (this.currentTrack && this.currentTrack.isPlaying) {
            const currentTrackKey = this.getTrackKey(this.currentTrack);
            if (currentTrackKey === key) {
                console.log(`MusicManager: Track "${key}" is already the current track and playing.`);
                // Optionally, ensure current config is applied if different
                if (config.volume !== undefined) trackToPlay.setVolume(config.volume);
                if (config.loop !== undefined) trackToPlay.setLoop(config.loop); // Phaser 3 uses setLoop(boolean)
                return;
            }
            console.log(`MusicManager: Stopping current track "${currentTrackKey || 'unknown'}" to play "${key}".`);
            this.currentTrack.stop();
        }

        console.log(`MusicManager: Playing track "${key}".`);
        trackToPlay.play({
            loop: config.loop || false,
            volume: config.volume !== undefined ? config.volume : 1
        });

        this.currentTrack = trackToPlay;
    }

    /**
     * Stops the currently playing music track.
     */
    stop() {
        if (this.currentTrack && this.currentTrack.isPlaying) {
            const currentTrackKey = this.getTrackKey(this.currentTrack);
            console.log(`MusicManager: Stopping track "${currentTrackKey || 'unknown'}".`);
            this.currentTrack.stop();
            this.currentTrack = null;
        } else {
            // console.log("MusicManager: No track currently playing to stop.");
        }
    }

    /**
     * Pauses the currently playing music track.
     */
    pause() {
        if (this.currentTrack && this.currentTrack.isPlaying) {
            const currentTrackKey = this.getTrackKey(this.currentTrack);
            console.log(`MusicManager: Pausing track "${currentTrackKey || 'unknown'}".`);
            this.currentTrack.pause();
        }
    }

    /**
     * Resumes the currently paused music track.
     */
    resume() {
        if (this.currentTrack && this.currentTrack.isPaused) {
            const currentTrackKey = this.getTrackKey(this.currentTrack);
            console.log(`MusicManager: Resuming track "${currentTrackKey || 'unknown'}".`);
            this.currentTrack.resume();
        }
    }

    /**
     * Sets the volume of the currently playing track.
     * @param {number} volume - The volume level (0 to 1).
     */
    setVolume(volume) {
        if (this.currentTrack) {
            const currentTrackKey = this.getTrackKey(this.currentTrack);
            console.log(`MusicManager: Setting volume for "${currentTrackKey || 'unknown'}" to ${volume}.`);
            this.currentTrack.setVolume(volume);
        }
    }
    
    /**
     * Helper to get the key for a sound object from our managed tracks map.
     * @param {Phaser.Sound.BaseSound} soundObject The sound object to find the key for.
     * @returns {string|null} The key if found, otherwise null.
     */
    getTrackKey(soundObject) {
        if (!soundObject) return null;
        for (const key in this.musicTracks) {
            if (this.musicTracks[key] === soundObject) {
                return key;
            }
        }
        // Fallback: Phaser sound objects often have a 'key' property with the asset key.
        // This can be useful if the soundObject wasn't sourced directly from this.musicTracks lookup.
        if (soundObject.key && this.musicTracks[soundObject.key] === soundObject) {
             return soundObject.key;
        }
        return null; // Should ideally not happen if currentTrack is always set from musicTracks
    }

    /**
     * Fades out the currently playing music track over a specified duration.
     * The track is stopped after the fade completes.
     * @param {number} [duration=1000] - The duration of the fade-out in milliseconds.
     */
    fadeOutCurrentTrack(duration = 1000) {
        if (this.currentTrack && this.currentTrack.isPlaying) {
            const trackKey = this.getTrackKey(this.currentTrack) || 'unknown';
            console.log(`MusicManager: Fading out current track "${trackKey}" over ${duration}ms.`);
            if (this.game && this.game.tweens) {
                this.game.tweens.add({
                    targets: this.currentTrack,
                    volume: 0,
                    duration: duration,
                    onComplete: () => {
                        this.stop();
                    }
                });
            } else {
                console.warn("MusicManager: this.game.tweens not available, cannot fade out. Stopping immediately.");
                this.stop();
            }
        } else {
            console.log("MusicManager: No current track playing to fade out.");
        }
    }

    // --- Advanced features (can be added later if needed) ---
    // fadeIn(key = null, duration = 1000, targetVolume = 1, loop = false) { ... }
} 