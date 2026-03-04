class HellScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Hell' });
        this.counterText = null;
        this.counterValue = { value: 0 };
        this.ethCounterText = null;
        this.ethCounterValue = { value: 0 };
        this.player = null;
        this.groundGroup = null;
        this.groundTileSize = 64;
        this.proceedArrow = null;
        this.arrowShown = false;
        this.sceneTransitioned = false;
        this.initialCounterData = {};
        this.coins = null;
        this.coinEvent = null;
        this.fireSprite = null; // Animated fire foreground
        // New counter display ("you owe" etc.)
        this.oweLabelTop = null;
        this.oweValueText = null;
        this.oweLabelBottom = null;
        this.oweValue = { value: 0 };
        this.autoProceedTimer = null; // Added for auto-proceed
    }

    init(data) {
        this.initialCounterData = data || {};
    }

    preload() {
        // All Hell scene assets are now preloaded globally in BootScene.
    }

    create() {
        console.log('HellScene: create');

        // --- Play Hell Music ---
        const bootScene = this.scene.get('BootScene');
        if (bootScene && bootScene.registry.has('musicManager')) {
            const musicManager = bootScene.registry.get('musicManager');
            musicManager.play('hellMusic', { loop: true, volume: 0.4 }); // Play hellMusic, looped
        } else {
            console.warn('MusicManager not found in BootScene registry. Cannot play music in HellScene.');
        }
        // --- End Hell Music ---

        this.cameras.main.setBackgroundColor('#550000'); // Hellish tint

        const gameWidth  = this.scale.width;
        const gameHeight = this.scale.height;

        // -----------------------------------------------------------------
        // Background – static hell backdrop
        // -----------------------------------------------------------------
        const hellBg = this.add.image(0, 0, 'hell_bg')
                              .setOrigin(0, 0)
                              .setScrollFactor(0)
                              .setDepth(-20);
        const bgScale = this.scale.width / hellBg.width;
        hellBg.setScale(bgScale);

        // -----------------------------------------------------------------
        // Foreground – animated fire (cycles through 3 frames)
        // -----------------------------------------------------------------
        this.fireSprite = this.add.image(0, 0, 'hell_fire1')
                                 .setOrigin(0, 0)
                                 .setScrollFactor(0)
                                 .setDepth(110);
        const fireScale = this.scale.width / this.fireSprite.width;
        this.fireSprite.setScale(fireScale);

        // Cycle fire frames every ~150 ms
        this.fireFrameIndex = 0;
        this.fireFrames = ['hell_fire1', 'hell_fire2', 'hell_fire3'];
        this.time.addEvent({
            delay: 150,
            loop: true,
            callback: () => {
                this.fireFrameIndex = (this.fireFrameIndex + 1) % this.fireFrames.length;
                this.fireSprite.setTexture(this.fireFrames[this.fireFrameIndex]);
            }
        });

        // -----------------------------------------------------------------
        // Ground (simple flat strip)
        // -----------------------------------------------------------------
        this.groundGroup = this.physics.add.staticGroup();
        const groundY = gameHeight - this.groundTileSize / 2;
        const numGroundTiles = Math.ceil(gameWidth / this.groundTileSize) + 1;
        const groundFrames = ['ground1.png', 'ground2.png', 'ground3.png'];
        for (let i = 0; i < numGroundTiles; i++) {
            const x = i * this.groundTileSize + this.groundTileSize / 2;
            const tile = this.groundGroup.create(x, groundY, 'ground_atlas', Phaser.Math.RND.pick(groundFrames));
            tile.setDisplaySize(this.groundTileSize, this.groundTileSize);
            tile.refreshBody();
        }

        // -----------------------------------------------------------------
        // Player (static, small movement allowed to leave right side)
        // -----------------------------------------------------------------
        const playerStartX = gameWidth / 2;
        this.player = new Player(this, playerStartX, 0);
        const groundTopY = gameHeight - this.groundTileSize;
        const playerHalfHeight = this.player.displayHeight / 2;
        const buffer = 5;
        this.player.setY(groundTopY - playerHalfHeight - buffer);
        this.player.setCollideWorldBounds(true);
        this.player.body.setAllowGravity(true);
        this.player.play('player_idle');
        this.physics.add.collider(this.player, this.groundGroup);
        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);

        // -----------------------------------------------------------------
        // Central "YOU OWE" animated counter & preceding story text
        // -----------------------------------------------------------------
        const fontCommon = {
            fontFamily: '"Press Start 2P", monospace',
            stroke: '#000',
            strokeThickness: 6,
            align: 'center',
            padding: { top: 6, bottom: 6 }
        };

        const centerY = gameHeight / 2;
        const storyTextYStart = centerY - 220; // Adjusted starting Y for story text
        const storyLineSpacing = 40;

        // --- New Story Text ---
        this.add.text(gameWidth / 2, storyTextYStart, 'The market crashed!', {
            ...fontCommon,
            fontSize: '28px', // Larger font for story
            fill: '#ffdddd' // Light red/pink for emphasis
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

        this.add.text(gameWidth / 2, storyTextYStart + storyLineSpacing, 'You spent most of your ETH to cover the aave loan!', {
            ...fontCommon,
            fontSize: '20px', // Slightly smaller for this line
            fill: '#ffdddd'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

        this.add.text(gameWidth / 2, storyTextYStart + storyLineSpacing * 2, "What ETH you have left won't cover the taxes!", {
            ...fontCommon,
            fontSize: '20px',
            fill: '#ffdddd'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

        this.add.text(gameWidth / 2, storyTextYStart + storyLineSpacing * 3, 'What are you going to do?', {
            ...fontCommon,
            fontSize: '24px', // A bit larger for the question
            fill: '#ffffcc' // Different color for the question
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);


        // --- Adjusted "YOU OWE" Text ---
        const oweTextYStart = centerY + 20; // Moved down

        this.oweLabelTop = this.add.text(gameWidth / 2, oweTextYStart, 'YOU OWE', {
            ...fontCommon,
            fontSize: '24px', // Made smaller
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

        this.oweValueText = this.add.text(gameWidth / 2, oweTextYStart + 45, '$0.00', { // Adjusted Y spacing
            ...fontCommon,
            fontSize: '36px', // Made smaller
            fill: '#ffea00'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

        this.oweLabelBottom = this.add.text(gameWidth / 2, oweTextYStart + 90, 'IN TAXES', { // Adjusted Y spacing
            ...fontCommon,
            fontSize: '24px', // Made smaller
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

        // Animate the owed amount to 1,095,171.79 over 9 seconds
        const finalOwed = 1095171.79;
        this.tweens.add({
            targets: this.oweValue,
            value: finalOwed,
            duration: 9000,
            ease: 'Linear',
            onUpdate: () => {
                const formatted = this.oweValue.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                this.oweValueText.setText(`$${formatted}`);
            }
        });

        // -----------------------------------------------------------------
        // Coin rain
        // -----------------------------------------------------------------
        this.coins = this.physics.add.group();
        this.coinEvent = this.time.addEvent({
            delay: 40,
            callback: this.dropCoin,
            callbackScope: this,
            loop: true
        });
        this.physics.add.collider(this.coins, this.groundGroup);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        // -----------------------------------------------------------------
        // Proceed arrow after 12s
        // -----------------------------------------------------------------
        this.time.delayedCall(12000, () => this.showProceedArrow(), [], this);
    }

    // ---------------------------------------------------------------------
    // Coin helpers
    // ---------------------------------------------------------------------
    dropCoin() {
        const x = Phaser.Math.Between(0, this.scale.width);
        const y = -20;
        const coin = this.coins.create(x, y, 'tax_coin', '262edf1e-d847-416b-8cc7-19b54f3d60ec.png');
        if (coin && coin.body) {
            const unscaledWidth = coin.frame.width;
            coin.setScale(0.05);
            coin.body.setCircle(unscaledWidth / 2);
            coin.setBounce(0.12);
            coin.setCollideWorldBounds(true);
            coin.body.setGravityY(900);
            coin.setVelocityX(Phaser.Math.Between(-40, 40));
            coin.setAngularVelocity(Phaser.Math.Between(-200, 200));
        }
    }

    collectCoin(player, coin) {
        coin.destroy();
        // No counter modification – purely cosmetic.
    }

    // ---------------------------------------------------------------------
    // Proceed arrow logic
    // ---------------------------------------------------------------------
    showProceedArrow() {
        if (this.arrowShown) return;
        this.arrowShown = true;

        const margin = 20;
        const arrowScale = 0.4;
        const gameWidth  = this.scale.width;
        const gameHeight = this.scale.height;

        this.proceedArrow = this.add.image(0, 0, 'hell_arrow')
                                   .setOrigin(0.5)
                                   .setScale(arrowScale)
                                   .setScrollFactor(0)
                                   .setDepth(200);

        this.proceedArrow.x = gameWidth - this.proceedArrow.displayWidth / 2 - margin;
        this.proceedArrow.y = gameHeight / 2;

        this.tweens.add({
            targets: this.proceedArrow,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Let player exit to the right edge
        this.player.setCollideWorldBounds(false);
        this.physics.world.setBoundsCollision(true, false, true, true);

        // Start auto-proceed timer
        if (!this.sceneTransitioned) {
            console.log("HellScene: Starting auto-proceed timer.");
            this.autoProceedTimer = this.time.delayedCall(5000, this.triggerAutoProceed, [], this);
        }
    }

    // ---------------------------------------------------------------------
    // Update
    // ---------------------------------------------------------------------
    update(time, delta) {
        if (this.player) this.player.update(time, delta);

        if (this.arrowShown && !this.sceneTransitioned && this.player) {
            if (this.player.x >= this.scale.width) {
                console.log("HellScene: Player initiated transition.");
                if (this.autoProceedTimer) {
                    console.log("HellScene: Clearing auto-proceed timer due to manual proceed.");
                    this.autoProceedTimer.remove();
                    this.autoProceedTimer = null;
                }
                console.log('HellScene: exit right reached – transitioning to InterstitialScene for SceneThree');
                // Clean up coin event
                if (this.coinEvent) this.coinEvent.remove();

                // --- Fade out Hell Music ---
                const bootScene = this.scene.get('BootScene');
                if (bootScene && bootScene.registry.has('musicManager')) {
                    const musicManager = bootScene.registry.get('musicManager');
                    musicManager.fadeOutCurrentTrack(500); // Fade out over 500ms
                } else {
                    console.warn('MusicManager not found in BootScene registry. Cannot fade out music in HellScene.');
                }
                // --- End Fade out Hell Music ---

                // Build counter data using values originally passed from SceneTwo
                const counterData = {
                    dollars: this.initialCounterData.dollars || 0,
                    eth: this.initialCounterData.eth || 0,
                    aave: this.initialCounterData.aave || 0,
                    taxesOwed: 1095171, // New "taxes owed" counter (integer, commas added when displayed)
                    hits: this.registry.get('playerHits')
                };

                this.sceneTransitioned = true; // Prevent duplicate transitions
                // Transition to the Interstitial Scene first
                this.scene.start('InterstitialScene', {
                    nextSceneKey: 'SceneThree',
                    imageKey: 'interstitial3',
                    sceneData: counterData
                });
                // this.scene.start('SceneThree', counterData); // Old direct transition
            }
        }
    }

    triggerAutoProceed() {
        if (!this.sceneTransitioned && this.player) { // Check if already transitioned
            console.log("HellScene: Auto-proceeding due to timer.");
            this.sceneTransitioned = true;

            if (this.coinEvent) this.coinEvent.remove();
            const bootScene = this.scene.get('BootScene');
            if (bootScene && bootScene.registry.has('musicManager')) {
                const musicManager = bootScene.registry.get('musicManager');
                musicManager.fadeOutCurrentTrack(500);
            }
            const counterData = {
                dollars: this.initialCounterData.dollars || 0,
                eth: this.initialCounterData.eth || 0,
                aave: this.initialCounterData.aave || 0,
                taxesOwed: 1095171,
                hits: this.registry.get('playerHits')
            };
            this.scene.start('InterstitialScene', {
                nextSceneKey: 'SceneThree',
                imageKey: 'interstitial3',
                sceneData: counterData
            });
        } else {
            console.log("HellScene: Auto-proceed timer fired, but scene already transitioned or player missing.");
        }
    }
} 