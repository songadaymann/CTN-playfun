class FallingScene extends Phaser.Scene {

    FALL_DURATION = 10000; // 10 seconds – same as original

    constructor() {
        super({ key: 'Falling' });
        this.player = null;
        this.groundTileSize = 64; // Consistent sizing (used for exit processing if needed later)
        this.initialCounterData = {};
        this.counterText = null;
        this.counterValue = { value: 0 };
        this.ethCounterText = null;
        this.ethCounterValue = { value: 0 };
        this.aaveCounterText = null;
        this.aaveCounterValue = { value: 0 };
        this.isFalling = true; // State flag
        this.cloudGroup = null; // Group for clouds
        this.cloudTimer = null; // Timer for spawning clouds
        this.fallVisualStartTimeGlobal = 0; // Will store global time when visual fall starts
        this.fallEndTimer = null; // Added for fall end timer
    }

    init(data) {
        console.log('FallingScene init received data:', data);
        console.log(`FallingScene: init. scene.time.now: ${this.time.now}, game.getTime(): ${this.game.getTime()}, game.loop.now: ${this.sys.game.loop.now}`);
        this.initialCounterData = data || {}; // Store received data
        // IMPORTANT: Set sceneStartTime AFTER all major synchronous setup
        this.fallVisualStartTimeGlobal = this.sys.game.loop.now; // Capture global time for gradient start

        console.log(`FallingScene: fallVisualStartTimeGlobal set to ${this.fallVisualStartTimeGlobal}. Current timeScale: ${this.time.timeScale}. game.loop.now: ${this.sys.game.loop.now}`);

        console.log(`FallingScene: Preparing to set fall end timer. FALL_DURATION: ${this.FALL_DURATION}ms. scene.time.now: ${this.time.now}, game.loop.now: ${this.sys.game.loop.now}`);
    }

    preload() {
        // All required assets are pre-loaded in BootScene, so nothing here for now.
    }

    create() {
        // --- Initialize music ---
        const bootScene = this.scene.get('BootScene');
        if (bootScene && bootScene.registry.has('musicManager')) {
            const musicManager = bootScene.registry.get('musicManager');
            musicManager.play('fallingMusic', { loop: true, volume: 0.4 });
        } else {
            console.warn('MusicManager not found in BootScene registry. Cannot play music in FallingScene.');
        }
        // --- End music initialization ---

        // Ensure game time settings are standard
        this.time.timeScale = 1;
        if (this.fallEndTimer) { // Clear any pre-existing timer from a previous run
            this.fallEndTimer.remove(false);
            this.fallEndTimer = null;
        }

        this.FALL_DURATION = 10000; 
        console.log(`FallingScene: create start. Initial FALL_DURATION: ${this.FALL_DURATION}ms. scene.time.now: ${this.time.now}, game.loop.now: ${this.sys.game.loop.now}`);
        this.isFalling = true;
        this.cameras.main.setBackgroundColor('#5c94fc');
        
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const fallWorldHeight = gameHeight * 30;
        const fallWorldTopY = -gameHeight * 5;
        this.physics.world.setBounds(0, fallWorldTopY, gameWidth, fallWorldHeight);

        console.log(`FallingScene: Player setup start. Time: ${this.time.now}`);
        const playerStartX = gameWidth / 2;
        const playerStartY = fallWorldTopY + 100;
        this.player = new Player(this, playerStartX, playerStartY);
        this.player.setCollideWorldBounds(true);
        this.player.body.setAllowGravity(true);
        console.log(`FallingScene: Player setup end. scene.time.now: ${this.time.now}, game.loop.now: ${this.sys.game.loop.now}`);

        this.cameras.main.setBounds(0, fallWorldTopY, gameWidth, fallWorldHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 1);

        this.cloudGroup = this.add.group();
        this.startCloudSpawner();

        this.counterValue.value = this.initialCounterData.dollars || 0;
        this.ethCounterValue.value = this.initialCounterData.eth || 0;
        this.aaveCounterValue.value = this.initialCounterData.aave || 0;

        this.counterText = this.add.text(20, 20, `$: ${Math.floor(this.counterValue.value).toLocaleString()}`, {
            fontSize: '24px', fill: '#fff'
        }).setOrigin(0, 0).setScrollFactor(0);

        this.ethCounterText = this.add.text(20, 50, `ETH: ${Math.floor(this.ethCounterValue.value)}`, {
            fontSize: '24px', fill: '#fff'
        }).setOrigin(0, 0).setScrollFactor(0);

        this.aaveCounterText = this.add.text(20, 80, `Aave: ${this.aaveCounterValue.value}`, {
            fontSize: '24px', fill: '#ADD8E6'
        }).setOrigin(0, 0).setScrollFactor(0).setVisible(this.aaveCounterValue.value > 0);

        // Set up the timer to transition to Hell after FALL_DURATION
        this.fallEndTimer = this.time.delayedCall(this.FALL_DURATION, this.transitionToHell, [], this);
        console.log(`FallingScene: Fall end timer scheduled for ${this.FALL_DURATION}ms. Target time: ${this.sys.game.loop.now + this.FALL_DURATION}`);

        console.log(`FallingScene: Finished create. FALL_DURATION is ${this.FALL_DURATION}ms. fallVisualStartTimeGlobal is ${this.fallVisualStartTimeGlobal}. scene.time.now: ${this.time.now}, game.loop.now: ${this.sys.game.loop.now}`);
    }

    // ------------------------------------------------------------------
    // Utility  – Cloud spawning (copied from SceneThree)
    // ------------------------------------------------------------------
    startCloudSpawner() {
        this.spawnCloud();
        this.cloudTimer = this.time.addEvent({
            delay: Phaser.Math.Between(500, 1500),
            callback: this.spawnCloud,
            callbackScope: this,
            loop: true
        });
    }

    spawnCloud() {
        if (!this.isFalling) return;

        const gameWidth = this.scale.width;
        const camera = this.cameras.main;
        const spawnY = camera.worldView.bottom + 100;
        const spawnX = Phaser.Math.Between(0, gameWidth);

        const cloud = this.cloudGroup.create(spawnX, spawnY, 'cloud-placeholder');
        if (cloud) {
            cloud.setDepth(Phaser.Math.Between(-1, 1));
            cloud.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
            cloud.setAlpha(Phaser.Math.FloatBetween(0.6, 1.0));

            const moveDuration = Phaser.Math.Between(4000, 8000);
            this.tweens.add({
                targets: cloud,
                y: camera.worldView.top - 200,
                alpha: 0,
                duration: moveDuration,
                ease: 'Linear',
                onComplete: () => cloud.destroy()
            });
        }

        if (this.cloudTimer) {
            this.cloudTimer.delay = Phaser.Math.Between(500, 1500);
        }
    }

    // ------------------------------------------------------------------
    // Transition helper
    // ------------------------------------------------------------------
    transitionToHell() {
        console.log(`FallingScene: transitionToHell called. Time: ${this.time.now}. isFalling: ${this.isFalling}`);
        if (!this.isFalling) { // Simplified condition: only transition if we are currently "falling"
            // This check is mainly to prevent multiple transitions if this method
            // could somehow be called multiple times after the fall has logically ended.
            // The timer should be the primary gatekeeper.
            console.warn("FallingScene: transitionToHell called but isFalling is already false. This might indicate an issue or a rapid succession of calls. Transition will proceed.");
            // return; // Let's not return, allow the transition to proceed.
        }
        
        // Ensure we don't try to transition if the Hell scene is already active
        // This can happen if the timer fires slightly after a manual transition (if one existed)
        // or if the scene is somehow restarted and the timer from a previous instance fires.
        if (this.scene.isActive('Hell')) {
            console.warn("FallingScene: Transition to Hell attempted, but Hell scene is already active. Aborting transition.");
            // Clear any residual timers to prevent further attempts
            if (this.cloudTimer) {
                this.cloudTimer.remove(false);
                this.cloudTimer = null;
            }
            if (this.fallEndTimer) {
                this.fallEndTimer.remove(false);
                this.fallEndTimer = null;
            }
            this.isFalling = false; // Ensure falling state is false
            return;
        }

        console.log('FallingScene: Fall duration ended. Transitioning to Hell.');
        this.isFalling = false; // Set flag to stop updates and prevent re-entry
        if (this.cloudTimer) {
            this.cloudTimer.remove(false);
            this.cloudTimer = null;
        }
        if (this.fallEndTimer) { // Ensure we mark the timer as dealt with
            this.fallEndTimer.remove(false); // remove() is fine, destroy() also works
            this.fallEndTimer = null;
        }

        const counterData = {
            dollars: this.counterValue.value,
            eth: this.ethCounterValue.value,
            aave: this.aaveCounterValue.value,
            hits: this.registry.get('playerHits')
        };

        this.scene.start('Hell', counterData);
    }

    // ------------------------------------------------------------------
    // Update
    // ------------------------------------------------------------------
    update(time, delta) {
        if (this.player && this.isFalling) { // Only update if isFalling is true
            this.player.update(time, delta);

            // Gradient color logic – background & clouds
            const elapsedForGradient = this.sys.game.loop.now - this.fallVisualStartTimeGlobal; // Use global game time consistently
            const progress = Phaser.Math.Clamp(elapsedForGradient / this.FALL_DURATION, 0, 1);
            
            // Unconditional log for the first few updates
            if (time < this.fallVisualStartTimeGlobal + 500) { // Log for the first 500ms of scene time
                 console.log(`FallingScene Update: Time: ${time.toFixed(0)}, Delta: ${delta.toFixed(2)}, ElapsedForGradient: ${elapsedForGradient.toFixed(0)}, Progress: ${progress.toFixed(3)}, fallVisualStartTimeGlobal: ${this.fallVisualStartTimeGlobal.toFixed(0)}, game.loop.now: ${this.sys.game.loop.now.toFixed(0)}`);
            }

            // Background: two-phase fade to avoid purple/magenta hues
            let red, green, blue;

            // --- Fallback: Ensure transition even if delayedCall fails ---
            if (progress >= 1 && this.isFalling) {
                console.warn('FallingScene: Fallback transition trigger after full duration elapsed.');
                this.transitionToHell();
            }
            // --- End Fallback ---

            if (progress < 0.5) {
                const k = progress / 0.5; // 0-1 within first half
                red   = Math.floor(0x5c * (1 - k));  // 0x5c = 92
                green = Math.floor(0x94 * (1 - k)); // 0x94 = 148
                blue  = Math.floor(0xfc * (1 - k)); // 0xfc = 252
            } else {
                const k = (progress - 0.5) / 0.5; // 0-1 within second half
                red   = Math.floor(0x8b * k);  // 0x8b = 139 (deep red)
                green = 0;
                blue  = 0;
            }

            const bgColor = (red << 16) + (green << 8) + blue;
            this.cameras.main.setBackgroundColor(bgColor);

            // Clouds: interpolate from white (#ffffff) to red (#ff0000)
            const cloudRed   = 255; // always full red component
            const cloudGreen = Math.floor(255 * (1 - progress));
            const cloudBlue  = Math.floor(255 * (1 - progress));
            const cloudTint  = (cloudRed << 16) + (cloudGreen << 8) + cloudBlue;

            if (this.cloudGroup) {
                this.cloudGroup.children.each((cloud) => {
                    cloud.setTint(cloudTint);
                });
            }
        }
    }

    // Make sure to stop this timer if the scene is shut down prematurely
    shutdown() {
        console.log(`FallingScene: shutdown. Time: ${this.time.now}`);
        if (this.cloudTimer) {
            this.cloudTimer.remove(false);
            this.cloudTimer = null;
        }
        if (this.fallEndTimer) {
            this.fallEndTimer.remove(false);
            this.fallEndTimer = null;
        }
        // Reset any other scene-specific properties if necessary
        this.isFalling = true; // Reset for next time
        this.fallVisualStartTimeGlobal = 0; // Reset for next time
    }
} 