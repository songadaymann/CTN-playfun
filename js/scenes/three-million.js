class ThreeMillionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ThreeMillionScene' });
        this.infoText = null;
        this.coins = null;
        this.centralDollarText = null;
        this.counterValue = { value: 0 };
        this.centralEthText = null;
        this.ethCounterValue = { value: 0 };
        this.hudDollarText = null;
        this.hudEthText = null;
        this.player = null;
        this.groundGroup = null;
        this.groundTileSize = 64;
        this.proceedArrow = null;
        this.arrowShown = false;
        this.sceneTransitioned = false;
        this.euphoricText = null;
        this.autoProceedTimer = null;
    }

    preload() {
        // Assets like funnel-placeholder and coin-placeholder are generated in BootScene
        this.load.image('coin', 'assets/images/three-million/coin.png');
        // Cloud layers
        this.load.image('clouds_back', 'assets/images/three-million/clouds-back.png');
        this.load.image('clouds_front', 'assets/images/three-million/clouds-front.png');
        // Proceed arrow (flashes after 12s)
        this.load.image('cloud_arrow', 'assets/images/three-million/cloud-arrow.png');

        // --- Load Sound Effects ---
        // const soundManager = this.registry.get('soundManager');
        // if (soundManager) {
        //     soundManager.loadSound(this, 'goldCoinSound', 'assets/sound/objects/goldCoin.mp3');
        // } else {
        //     console.warn('ThreeMillionScene: SoundManager not found in registry. Cannot load sounds.');
        // }
    }

    create() {
        console.log("ThreeMillionScene: create");
        this.cameras.main.setBackgroundColor('#add8e6'); // Match SceneOne's initial bg

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // --- Create HUD Counters (Top-Left) ---
        const hudFont = { fontSize: '24px', fill: '#fff', fontFamily: '"Press Start 2P", monospace', stroke: '#000', strokeThickness: 4 }; 
        this.hudDollarText = this.add.text(20, 20, '$: 0', hudFont).setOrigin(0, 0).setScrollFactor(0).setDepth(150);
        this.hudEthText = this.add.text(20, 50, 'ETH: 0', hudFont).setOrigin(0, 0).setScrollFactor(0).setDepth(150);
        // --- End HUD Counters ---

        // --- Create Ground (Simplified for this scene) ---
        this.groundGroup = this.physics.add.staticGroup();
        const groundY = gameHeight - this.groundTileSize / 2;
        const numGroundTiles = Math.ceil(gameWidth / this.groundTileSize) + 1; // Cover screen width
        const groundFrames = ['ground1.png', 'ground2.png', 'ground3.png'];

        for (let i = 0; i < numGroundTiles; i++) {
            const x = i * this.groundTileSize + this.groundTileSize / 2;
            const tile = this.groundGroup.create(x, groundY, 'ground_atlas', Phaser.Math.RND.pick(groundFrames));
            tile.setDisplaySize(this.groundTileSize, this.groundTileSize);
            tile.refreshBody();
        }

        // --- Create Player (Static for this scene) ---
        const playerStartX = gameWidth / 2;
        this.player = new Player(this, playerStartX, 0); // Initial Y, will be adjusted
        const groundTopY = gameHeight - this.groundTileSize;
        const playerHalfHeight = this.player.displayHeight / 2;
        const buffer = 5; // Smaller buffer, player stands closer to ground
        const playerStartY = groundTopY - playerHalfHeight - buffer;
        this.player.setY(playerStartY);
        this.player.setCollideWorldBounds(true); // Keep player within screen
        this.player.body.setAllowGravity(true); // Ensure gravity affects player
        this.player.play('player_idle'); // Start with idle animation

        // Physics collision for player and ground
        this.physics.add.collider(this.player, this.groundGroup);

        // Set world bounds for this scene (just screen dimensions)
        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);

        // No explanatory text: we'll let the counters speak for themselves.

        // --- New Coin System ---
        this.coins = this.physics.add.group();

        // Make coins fall from the sky
        this.coinEvent = this.time.addEvent({
            delay: 30, // How often to drop a coin (milliseconds) - Faster spawn rate
            callback: this.dropCoin,
            callbackScope: this,
            loop: true
        });

        // Collision between coins and ground
        this.physics.add.collider(this.coins, this.groundGroup);
        // Collision between coins themselves (Removed as per request)
        // this.physics.add.collider(this.coins, this.coins);
        // Player collects coins
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        // --- Central Counter Texts ---
        const counterFont = {
            fontFamily: '"Press Start 2P", monospace', // Will fall back to monospace if font not loaded
            stroke: '#000',
            strokeThickness: 6,
            align: 'center',
            padding: { top: 6, bottom: 6 } // add vertical padding so the stroke is not clipped
        };

        // Dollars (larger)
        this.centralDollarText = this.add.text(gameWidth / 2, gameHeight / 2 - 30, '$: 0', {
            ...counterFont,
            fontSize: '40px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

        // ETH (slightly smaller, below dollars counter)
        this.centralEthText = this.add.text(gameWidth / 2, gameHeight / 2 + 40, 'ETH: 0', {
            ...counterFont,
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

        // --- Control Instructions at bottom ---
        const instructionsText = 'WASD to move\nSPACE to jump\nCLICK for action';
        this.add.text(gameWidth / 2, gameHeight - 10, instructionsText, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '28px', // Increased font size
            fill: '#ffffff',
            stroke: '#000',
            strokeThickness: 4,
            align: 'center',
            lineSpacing: 8,
            padding: { top: 4, bottom: 4 }
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(150);

        // 4. Start Counter Tweens
        const finalDollars = 3000000;
        const finalEth = 650;

        this.tweens.add({
            targets: this.counterValue,
            value: finalDollars,
            duration: 12000,
            ease: 'Linear',
            onUpdate: () => {
                this.centralDollarText.setText(`$: ${Math.floor(this.counterValue.value).toLocaleString()}`);
            },
            onComplete: () => {
                this.centralDollarText.setVisible(false);
                this.hudDollarText.setText(`$: ${Math.floor(this.counterValue.value).toLocaleString()}`);
            }
        });

        this.tweens.add({
            targets: this.ethCounterValue,
            value: finalEth,
            duration: 12000,
            ease: 'Linear',
            onUpdate: () => {
                this.centralEthText.setText(`ETH: ${Math.floor(this.ethCounterValue.value)}`);
            },
            onComplete: () => {
                this.centralEthText.setVisible(false);
                this.hudEthText.setText(`ETH: ${Math.floor(this.ethCounterValue.value)}`);
            }
        });

        // 5. After 12 seconds, prompt player to move right with a flashing arrow
        this.time.delayedCall(12000, () => {
            this.displayEuphoricMessage();
        }, [], this);

        // --- Cloud Layers ---
        // BACK clouds (behind everything)
        const cloudsBack = this.add.image(0, 0, 'clouds_back')
                                  .setOrigin(0, 0)
                                  .setScrollFactor(0) // Fixed to viewport
                                  .setDepth(-10);

        // Scale back clouds to fit screen width while maintaining aspect ratio
        const backScale = this.scale.width / cloudsBack.width;
        cloudsBack.setScale(backScale);

        // FRONT clouds (in front of everything)
        const cloudsFront = this.add.image(0, 0, 'clouds_front')
                                   .setOrigin(0, 0)
                                   .setScrollFactor(0)
                                   .setDepth(100);

        const frontScale = this.scale.width / cloudsFront.width;
        cloudsFront.setScale(frontScale);

        // --- Initialize music ---
        const musicManager = this.registry.get('musicManager');
        if (musicManager) {
            musicManager.play('threeMillionMusic', { loop: true, volume: 0.5 });
            console.log("ThreeMillionScene: Attempting to play 'threeMillionMusic'.");
        } else {
            console.warn('ThreeMillionScene: MusicManager not found in registry. Cannot play music.');
        }
        // --- End music initialization ---
    }

    dropCoin() {
        const gameWidth = this.scale.width;
        const x = Phaser.Math.Between(0, gameWidth); // Drop from anywhere along the width
        const y = -20; // Start just above the top of the screen for a smoother entry

        const coin = this.coins.create(x, y, 'coin');
        if (coin && coin.body) { // Ensure coin and coin.body exist
            // Get the unscaled width of the coin's frame (original image width)
            const unscaledCoinWidth = coin.frame.width;

            coin.setScale(0.05); // Apply desired scale to the sprite

            // Set the physics body to be a circle.
            // The radius is based on the UN-SCALED width.
            // Phaser will then automatically apply the sprite's scale (0.05) to this body.
            coin.body.setCircle(unscaledCoinWidth / 2);

            // Give it a gentle bounce so it doesn't spring upward too much
            coin.setBounce(0.12);
            coin.setCollideWorldBounds(true);

            // Apply gravity so the coin accelerates downward like rain
            coin.body.setGravityY(900);

            // Add a little horizontal drift for variety
            coin.setVelocityX(Phaser.Math.Between(-40, 40));

            // Spin for a bit of visual flair
            coin.setAngularVelocity(Phaser.Math.Between(-200, 200));
        }
    }

    collectCoin(player, coin) {
        coin.destroy(); // Remove the coin

        // --- Play Coin Collection Sound ---
        // const soundManager = this.registry.get('soundManager');
        // if (soundManager) {
        //     soundManager.playSound('goldCoinSound', { volume: 0.3 }); // Play with a slightly lower volume
        // } else {
        //     console.warn('ThreeMillionScene: SoundManager not found. Cannot play coin sound.');
        // }
        // Optional: Add a poof particle effect here later
        // The main dollar counter is still time-based as per current design.
    }

    // --- NEW: Display Euphoric Message --- 
    displayEuphoricMessage() {
        if (this.euphoricText) return; // Don't create if already exists

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        const messageStyle = {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center',
            wordWrap: { width: gameWidth * 0.8, useAdvancedWrap: true }
        };

        const messageLine1 = "Wow! You made three million dollars selling your songs as NFTs!";
        const messageLine2 = "You must feel euphoric right now.";

        this.euphoricText = this.add.container(gameWidth / 2, gameHeight / 2 - 100); // Position container
        const text1 = this.add.text(0, 0, messageLine1, messageStyle).setOrigin(0.5);
        const text2 = this.add.text(0, text1.height, messageLine2, messageStyle).setOrigin(0.5);
        this.euphoricText.add([text1, text2]);
        this.euphoricText.setDepth(200); // Ensure it's on top
        this.euphoricText.setScrollFactor(0);

        // After 5 seconds, show the proceed arrow and destroy this message
        this.time.delayedCall(5000, () => {
            this.showProceedArrow();
            if (this.euphoricText) {
                this.euphoricText.destroy();
                this.euphoricText = null;
            }
        }, [], this);
    }
    // --- END NEW --- 

    // --- Arrow Prompt Logic ---
    showProceedArrow() {
        if (this.proceedArrow) return; // Already shown

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // Place arrow midway vertically on right edge and scale it down
        const arrowScale = 0.4;
        this.proceedArrow = this.add.image(0, 0, 'cloud_arrow')
                                   .setOrigin(0.5)
                                   .setScale(arrowScale)
                                   .setScrollFactor(0)
                                   .setDepth(200);

        // Reposition after scaling so it sits flush with a small margin from the right
        const margin = 20;
        this.proceedArrow.x = gameWidth - this.proceedArrow.displayWidth / 2 - margin;
        this.proceedArrow.y = gameHeight / 2;

        // Flashing tween (fade in/out)
        this.tweens.add({
            targets: this.proceedArrow,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.arrowShown = true;

        // Allow the player to move past the right edge once prompted
        if (this.player) {
            this.player.setCollideWorldBounds(false);
        }

        // Disable collision with the right world bound so other objects can leave too (keep others)
        if (this.physics && this.physics.world) {
            this.physics.world.setBoundsCollision(true, false, true, true);
        }

        // Start auto-proceed timer
        if (!this.sceneTransitioned) {
            console.log("ThreeMillionScene: Starting auto-proceed timer.");
            this.autoProceedTimer = this.time.delayedCall(5000, this.triggerAutoProceed, [], this);
        }
    }

    update(time, delta) {
        if (this.player) {
            this.player.update(time, delta); // Process player input and updates
        }

        // If arrow is shown, check if player moved off-screen to the right (half body off)
        if (this.arrowShown && !this.sceneTransitioned && this.player) {
            const gameWidth = this.scale.width;
            // Trigger when player's center X crosses right edge of screen
            if (this.player.x >= gameWidth) {
                console.log("ThreeMillionScene: Player initiated transition.");
                if (this.autoProceedTimer) {
                    console.log("ThreeMillionScene: Clearing auto-proceed timer due to manual proceed.");
                    this.autoProceedTimer.remove();
                    this.autoProceedTimer = null;
                }
                this.sceneTransitioned = true;
                // Fade out music before transitioning
                const musicManager = this.registry.get('musicManager');
                if (musicManager) {
                    musicManager.fadeOutCurrentTrack(800); // 800ms fade
                }
                // Pass the final counter values forward
                const counterData = {
                    dollars: Math.floor(this.counterValue.value),
                    eth: Math.floor(this.ethCounterValue.value),
                    hits: this.registry.get('playerHits')
                };
                // Transition to the Interstitial Scene first
                this.scene.start('InterstitialScene', {
                    nextSceneKey: 'SceneOne',
                    imageKey: 'interstitial1',
                    sceneData: counterData
                });
            }
        }
    }

    triggerAutoProceed() {
        if (!this.sceneTransitioned && this.player) { // Check if already transitioned
            console.log("ThreeMillionScene: Auto-proceeding due to timer.");
            this.sceneTransitioned = true;
            const musicManager = this.registry.get('musicManager');
            if (musicManager) {
                musicManager.fadeOutCurrentTrack(800);
            }
            const counterData = {
                dollars: Math.floor(this.counterValue.value),
                eth: Math.floor(this.ethCounterValue.value),
                hits: this.registry.get('playerHits')
            };
            this.scene.start('InterstitialScene', {
                nextSceneKey: 'SceneOne',
                imageKey: 'interstitial1',
                sceneData: counterData
            });
        } else {
            console.log("ThreeMillionScene: Auto-proceed timer fired, but scene already transitioned or player missing.");
        }
    }
} 