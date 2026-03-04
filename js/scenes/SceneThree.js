class SceneThree extends Phaser.Scene {

    FALL_DURATION = 10000; // 10 seconds

    constructor() {
        super({ key: 'SceneThree' });
        this.player = null;
        this.groundGroup = null;
        this.groundTileSize = 64; // Consistent sizing
        this.initialCounterData = {};
        this.counterText = null;
        this.counterValue = { value: 0 };
        this.ethCounterText = null;
        this.ethCounterValue = { value: 0 };
        this.aaveCounterText = null;
        this.aaveCounterValue = { value: 0 };
        this.taxesOwedText = null;
        this.taxesOwedValue = 0;
        // this.isFalling = true; // State flag
        // this.cloudGroup = null; // Group for clouds
        // this.cloudTimer = null; // Timer for spawning clouds

        // --- SceneThree Backgrounds ---
        this.bgFarS3 = null;
        this.bgMidS3 = null;
        this.bgCloseS3 = null;

        // --- Autoglyph Keys for Ground ---
        this.autoglyphKeys = [];

        // --- Wife Sprite ---
        this.wifeSprite = null;
        this.wifeTriggered = false;
        this.groundTopY = 0; // Will be set in setupLevel
        this.wifeMeetingPointX = null;
        this.wifeStatusText = null; // Debug text shown while wife is walking
        this.wifeRequestText = null; // Text that appears when wife stops
        this.playerLocked = false;   // Flag once player is locked at tile 120
        this.dialogShown = false;    // Flag once sell dialog is displayed
        this.dialogSelectedIndex = 0; // which choice is highlighted
        this.dialogChoices = [];      // array of Text choices
        this.dialogHighlight = null;  // red rectangle
        this.dialogKeyDownHandler = null; // To store the keyboard handler function
        this.dialogTimer = null;  // delayed call handle
        // --- Mobile dialog input tracking ---
        this.dialogLastUp = false;
        this.dialogLastDown = false;
        this.dialogLastAction = false;

        // --- Tax Monster (from SceneOne) ---
        this.taxMonster = null;
        this.isTaxMonsterStopped = false;
        this.monsterInitialPlayerDollars = 0; // To store player's dollars when monster starts moving
        this.MONSTER_MAX_SPEED_S3 = 120;      // Max speed for monster in SceneThree
        this.MONSTER_ACCELERATION_S3 = 0.25;  // Acceleration for monster
        this.MONSTER_START_X_S3 = 60;      // X position after initial tween (was 160)
        this.MONSTER_STOP_TILE_S3 = 115;    // Tile where monster aims to stop
        this.PLAYER_TRIGGER_MONSTER_STOP_TILE_S3 = 110; // Player must pass this tile to trigger monster stop check
        this.DOLLAR_DECREASE_TOTAL_S3 = 700000; // Total dollars player loses as monster advances
        this.monsterStopX_S3 = 0; // Calculated X position for monster to stop

        // --- Player Starting Position ---
        this.PLAYER_START_X_S3 = 250; // Default player starting X in SceneThree

        // --- Enemy Manager for IRS Agents ---
        this.enemyManager = null;
        this.agentSpawningStoppedS3 = false;
    }

    init(data) {
        console.log("SceneThree init received data:", data);
        this.initialCounterData = data || {}; // Store received data
    }

    preload() {
        console.log("SceneThree: preload");
        // Assets loaded in BootScene
    }

    create(data) {
        // --- Initialize music ---
        const bootScene = this.scene.get('BootScene');
        if (bootScene && bootScene.registry.has('musicManager')) { // Corrected to check registry
            const musicManager = bootScene.registry.get('musicManager'); // Corrected to get from registry
            musicManager.play('sceneThreeMusic', { loop: true, volume: 0.4 }); // Play sceneThreeMusic, looped
        } else {
            console.warn('MusicManager not found in BootScene registry. Cannot play music in SceneThree.');
        }
        // --- End music initialization ---

        console.log("SceneThree: create");
        // Start directly in level mode – no falling sequence
        this.isFalling = false;
        this.cameras.main.setBackgroundColor('#FFFFFF'); // White background

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // --- Add Parallax Backgrounds (SceneThree specific) ---
        this.bgFarS3 = this.add.image(0, 0, 's3_glyph_far')
            .setOrigin(0, 0)
            .setDepth(-10) // Furthest back
            .setScrollFactor(0.2);

        this.bgMidS3 = this.add.image(0, 0, 's3_glyph_mid')
            .setOrigin(0, 0)
            .setDepth(-9) // Middle layer
            .setScrollFactor(0.5);

        this.bgCloseS3 = this.add.image(0, 0, 's3_glyph_close')
            .setOrigin(0, 0)
            .setDepth(-8) // Closest layer
            .setScrollFactor(0.8);

        // --- Add Specific Background Glyph (glyph215) to Far Background Layer ---
        const glyph215X = this.scale.width / 2; // New position: Centered in the initial screen view
        const glyph215Y = this.scale.height / 2; // Vertically centered in game view

        this.bgGlyph215 = this.add.image(glyph215X, glyph215Y, 'bg_glyph215')
            .setOrigin(-1.8, 0.7) // Center origin
            .setScale(0.63) // Scale down the glyph
            .setDepth(-10)       // Same depth as bgFarS3
            .setScrollFactor(0.2); // Same scroll factor as bgFarS3
        console.log(`SceneThree: Added bg_glyph215 at x: ${glyph215X}, y: ${glyph215Y}`);

        // --- Add Tax Yell Man ---
        const taxManX = (25 * this.groundTileSize) + (this.groundTileSize / 2); // Position over tile 30
        // bgMidS3 is at y=0 with origin 0,0. Its top is y=0.
        // Align bottom of taxMan with top of bgMidS3 (y=0), then offset down by 111px.
        const taxManY = 0 + 375; // y-position for the bottom of the tax man

        this.taxYellMan = this.add.sprite(taxManX, taxManY, 'tax-yell1_atlas', 'tax-yell1-closed.png')
            .setOrigin(0.5, 1) // Origin at bottom-center for easier y-positioning
            .setScale(0.3) // Resize the sprite
            .setDepth(-8.5)    // Between bgMidS3 (-9) and bgCloseS3 (-8)
            .setScrollFactor(0.5); // Same scroll factor as bgMidS3
        
        // Play the yelling animation
        this.taxYellMan.play('tax_yell');
        console.log("SceneThree: Tax Yell Man added and animation started.");

        // --- Add Lien Text for Tax Yell Man ---
        const lienTextX = this.taxYellMan.x;
        const lienTextY = this.taxYellMan.y - this.taxYellMan.displayHeight - 20; // 20px padding above

        // Define a common text style, similar to Hell.js, for Press Start 2P font
        const commonTextStyleS3 = {
            fontFamily: '"Press Start 2P", monospace',
            align: 'center',
            // Properties from Hell.js fontCommon that will be overridden for lienText
            // but included here for structural similarity in definition
            stroke: '#000',       
            strokeThickness: 6,
            padding: { top: 6, bottom: 6 }
        };

        this.lienText = this.add.text(lienTextX, lienTextY, "We'll put a lien on your house!", {
            ...commonTextStyleS3, // Spread the common style
            fontSize: '16px',     // Specific size for this text
            fill: '#000000',     // Specific fill color
            stroke: '#FFFFFF',   // Specific stroke color (overrides commonTextStyleS3.stroke)
            strokeThickness: 4  // Specific stroke thickness (overrides commonTextStyleS3.strokeThickness)
        }).setOrigin(0.5, 1)      // Origin at bottom-center
          .setDepth(-8.4)         // In front of taxYellMan (-8.5)
          .setScrollFactor(0.5);  // Same scroll factor as taxYellMan
        console.log("SceneThree: Lien text added for Tax Yell Man.");

        // --- Add Second Tax Yell Man (tax-yell2) ---
        const taxMan2X = (35 * this.groundTileSize) + (this.groundTileSize / 2); // Position over tile 40
        const taxMan2BaseYOffset = 375; // Nudge this value to adjust vertical position of taxYellMan2
        const taxMan2Y = 0 + taxMan2BaseYOffset; // y-position for the bottom of the second tax man

        this.taxYellMan2 = this.add.sprite(taxMan2X, taxMan2Y, 'tax-yell2_atlas', 'tax-yell2-closed.png')
            .setOrigin(0.5, 1)       // Same origin (bottom-center)
            .setScale(0.3)           // Same scale
            .setDepth(-8.5)          // Same depth
            .setScrollFactor(0.5);   // Same scroll factor

        this.taxYellMan2.play('tax_yell_sides');
        console.log("SceneThree: Second Tax Yell Man (tax-yell2) added and animation started.");

        // --- Add Retirement Text for Second Tax Yell Man ---
        const retirementTextX = this.taxYellMan2.x;
        const retirementTextY = this.taxYellMan2.y - this.taxYellMan2.displayHeight - 20; // 20px padding above

        this.retirementText = this.add.text(retirementTextX, retirementTextY, "We'll drain your retirement!", {
            ...commonTextStyleS3, // Reuse the common style defined earlier
            fontSize: '16px',     // Specific size for this text
            fill: '#000000',     // Specific fill color
            stroke: '#FFFFFF',   // Specific stroke color
            strokeThickness: 4  // Specific stroke thickness
        }).setOrigin(0.5, 1)      // Origin at bottom-center
          .setDepth(-8.4)         // In front of taxYellMan2 (-8.5), same as other text
          .setScrollFactor(0.5);  // Same scroll factor as taxYellMan2
        console.log("SceneThree: Retirement text added for Second Tax Yell Man.");

        // --- Add Third Tax Yell Person (tax-yell3) ---
        const taxWomanX = (45 * this.groundTileSize) + (this.groundTileSize / 2); // Position over tile 45
        const taxWomanY = 0 + 375; // Consistent Y positioning with the first tax person

        this.taxYellWoman = this.add.sprite(taxWomanX, taxWomanY, 'tax-yell3_atlas', 'tax-yell3-closed.png') // Assuming 'tax-yell3-closed.png' is the default frame
            .setOrigin(0.5, 1)       // Origin at bottom-center
            .setScale(0.33)           // Consistent scale
            .setDepth(-8.5)          // Consistent depth
            .setScrollFactor(0.5);   // Consistent scroll factor

        this.taxYellWoman.play('tax_yell_everything');
        console.log("SceneThree: Third Tax Yell Person (tax-yell3) added and animation started.");

        // --- Add "We'll take EVERYTHING!" Text for Third Tax Person ---
        const everythingTextX = this.taxYellWoman.x;
        const everythingTextY = this.taxYellWoman.y - this.taxYellWoman.displayHeight - 20; // 20px padding above

        this.everythingText = this.add.text(everythingTextX, everythingTextY, "We'll take EVERYTHING!", {
            ...commonTextStyleS3, 
            fontSize: '16px',
            fill: '#000000',
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5, 1)
          .setDepth(-8.4)
          .setScrollFactor(0.5);
        console.log("SceneThree: 'We'll take EVERYTHING!' text added for Third Tax Person.");

        // --- Populate autoglyph keys (same as BootScene list for consistency) ---
        const autoglyphFilenames = [
            "glyph53.png", "glyph47.png", "glyph90.png", "glyph84.png", "glyph503.png",
            "glyph265.png", "glyph271.png", "glyph259.png", "glyph477.png", "glyph311.png",
            "glyph4.png", "glyph305.png", "glyph463.png", "glyph339.png", "glyph488.png",
            "glyph113.png", "glyph107.png", "glyph106.png", "glyph112.png", "glyph489.png",
            "glyph338.png", "glyph304.png", "glyph462.png", "glyph476.png", "glyph5.png",
            "glyph310.png", "glyph258.png", "glyph270.png", "glyph502.png", "glyph264.png",
            "glyph85.png", "glyph91.png", "glyph46.png", "glyph52.png", "glyph44.png",
            "glyph50.png", "glyph78.png", "glyph87.png", "glyph93.png", "glyph272.png",
            "glyph266.png", "glyph500.png", "glyph299.png", "glyph460.png", "glyph306.png",
            "glyph312.png", "glyph7.png", "glyph474.png", "glyph448.png", "glyph104.png",
            "glyph110.png", "glyph138.png", "glyph139.png", "glyph111.png", "glyph105.png",
            "glyph449.png", "glyph6.png", "glyph313.png", "glyph475.png", "glyph461.png",
            "glyph307.png", "glyph298.png", "glyph267.png", "glyph501.png", "glyph273.png",
            "glyph92.png", "glyph86.png", "glyph79.png", "glyph51.png", "glyph45.png",
            "glyph69.png", "glyph41.png", "glyph55.png", "glyph82.png", "glyph96.png",
            "glyph277.png", "glyph511.png", "glyph505.png", "glyph263.png", "glyph288.png",
            "glyph459.png", "glyph303.png", "glyph465.png", "glyph471.png", "glyph317.png",
            "glyph2.png", "glyph129.png", "glyph101.png", "glyph115.png", "glyph114.png",
            "glyph100.png", "glyph128.png", "glyph470.png", "glyph3.png", "glyph316.png",
            "glyph302.png", "glyph464.png", "glyph458.png", "glyph289.png", "glyph504.png"
        ];
        this.autoglyphKeys = autoglyphFilenames.map(filename => filename.replace('.png', ''));

        // --- World & Player Setup (Regular Level) ---
        const worldWidth = this.groundTileSize * 160; // 160 tiles wide (80 original + 80 new)
        this.physics.world.setBounds(0, 0, worldWidth, gameHeight);

        const playerStartX = this.PLAYER_START_X_S3; // Use configurable property
        this.player = new Player(this, playerStartX, 0); // temp Y, will be positioned in setupLevel()
        this.player.body.setAllowGravity(true);

        // --- Counter Setup (Visible during fall) ---
        this.counterValue.value = this.initialCounterData.dollars || 0;
        this.ethCounterValue.value = this.initialCounterData.eth || 0;
        this.aaveCounterValue.value = this.initialCounterData.aave || 0;
        this.taxesOwedValue = this.initialCounterData.taxesOwed || 0;

        // Define a common style for HUD text
        const hudTextStyle = { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4 }; // White fill, black stroke

        this.counterText = this.add.text(20, 20, `$: ${Math.floor(this.counterValue.value).toLocaleString()}`, hudTextStyle)
            .setOrigin(0, 0).setScrollFactor(0);

        this.ethCounterText = this.add.text(20, 50, `ETH: ${Math.floor(this.ethCounterValue.value)}`, hudTextStyle)
            .setOrigin(0, 0).setScrollFactor(0);

        this.aaveCounterText = this.add.text(20, 80, `Aave: ${this.aaveCounterValue.value}`, { 
            ...hudTextStyle, 
            fill: '#ADD8E6' // Aave is light blue, but keep the stroke
        }).setOrigin(0, 0).setScrollFactor(0).setVisible(this.aaveCounterValue.value > 0);

        this.taxesOwedText = this.add.text(20, 110, `Taxes Owed: ${Math.floor(this.taxesOwedValue).toLocaleString()}`, { 
            ...hudTextStyle, 
            fill: '#FF6347' // Taxes owed is red, but keep the stroke 
        }).setOrigin(0, 0).setScrollFactor(0).setVisible(this.taxesOwedValue > 0);
        console.log("SceneThree: Counters initialized.");

        // Immediately build the level (no falling delay)
        this.setupLevel();

        // --- Camera Setup to Follow Player ---
        // Ensure camera bounds match the world bounds established in setupLevel()
        // This call can be here or at the end of setupLevel(), as long as player and world are ready.
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1); // lerpX, lerpY for smoothing
        console.log("SceneThree: Camera set to follow player.");

        // --- Introduce Tax Monster ---
        this.introduceTaxMonsterS3();

        // --- Setup EnemyManager for IRS Agents ---
        this.enemyManager = new EnemyManager(this);
        if (this.enemyManager.getGroup()) {
            this.physics.add.collider(this.player, this.enemyManager.getGroup(), this.handlePlayerAgentCollisionS3, null, this);
            this.physics.add.collider(this.enemyManager.getGroup(), this.groundGroup);
            console.log("SceneThree: EnemyManager and IRS agent colliders created.");
        } else {
            console.error("SceneThree: EnemyManager group not available for collision setup.");
        }
    }

    setupLevel() {
        console.log("SceneThree: Setting up level.");
        // REMOVED: Cloud clearing logic

        // --- Create Actual Level Ground ---
        const worldWidth = this.groundTileSize * 130; // 160-tile level width (80 original + 80 new)
        const worldHeight = this.scale.height;
        const numGroundTiles = Math.ceil(worldWidth / this.groundTileSize);
        const groundTopY = worldHeight - this.groundTileSize; // Calculate ground top surface Y
        this.groundTopY = groundTopY; // Store for access in update()

        // Adjust world bounds for the playable level
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        this.groundGroup = this.physics.add.staticGroup();
        console.log(`Creating ${numGroundTiles} ground tiles for SceneThree level.`);
        for (let i = 0; i < numGroundTiles; i++) {
            const x = i * this.groundTileSize + this.groundTileSize / 2;
            // Use groundTopY + half tile size to position center of tiles correctly
            const tileY = groundTopY + this.groundTileSize / 2;

            // --- Randomly select an autoglyph for the ground tile ---
            const randomGlyphKey = Phaser.Math.RND.pick(this.autoglyphKeys);
            const tile = this.groundGroup.create(x, tileY, randomGlyphKey);
            tile.setOrigin(0.5);
            tile.setDisplaySize(this.groundTileSize, this.groundTileSize);
            tile.refreshBody();

            // --- Snap tile visuals to the ground line (similar to SceneOne) ---
            const visualBottom = tile.getBounds().bottom;
            const physicsBottom = tileY + (this.groundTileSize / 2); // Bottom of the physics body
            const delta = physicsBottom - visualBottom;
            if (Math.abs(delta) > 0.1) {
                tile.y += delta;
            }
            // --- End Snap ---

            // Add debug number if debug is enabled
            if (this.physics.config.debug) {
                this.add.text(x, groundTopY, i.toString(), { // Position text above tile
                    fontSize: '12px', fill: '#000', backgroundColor: 'rgba(255,255,255,0.7)'
                }).setOrigin(0.5).setName(`debug_text_s3_${i}`);
            }
        }
        // Move camera bounds setting *after* ground creation and player placement potentially?
        // Let's keep it here for now, should be fine.
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        console.log(`SceneThree: World bounds set to ${worldWidth}x${worldHeight}.`);

        // --- Position Player and Enable Controls ---
        // Find the ground tile closest to the player's current X
        const landingX = this.player.x;
        // Set player's bottom edge exactly on the ground's top edge
        this.player.y = groundTopY - (this.player.height / 2); // Assumes player origin 0.5, 0.5
        this.player.setVelocityY(0); // Stop vertical movement
        this.player.setCollideWorldBounds(true); // Collide with new level bounds
        // Add collider AFTER positioning
        this.physics.add.collider(this.player, this.groundGroup);
        this.player.enableMovement(); // Re-enable horizontal controls
        console.log("SceneThree: Player landed, controls enabled, ground collider added.");

        // --- Add other Scene Three elements here ---
        // e.g., Enemies, obstacles, goal

        // --- Wife Logic ---
        // Removed: wife debug spawn. Wife will now spawn dynamically in update() once the
        // player passes tile 110. See spawnWife() helper and update() implementation.

        // --- Tax Monster Logic (Ported from SceneOne) ---
        if (this.taxMonster && this.taxMonster.active) {
            // Dollar Value Decrease Over Time (Linked to Monster Progress)
            if (!this.isTaxMonsterStopped && this.monsterInitialPlayerDollars > 0) {
                const startValue = this.monsterInitialPlayerDollars;
                const endValue = Math.max(0, startValue - this.DOLLAR_DECREASE_TOTAL_S3); // Ensure doesn't go below zero from this mechanic alone
                const totalDecreaseForMechanic = startValue - endValue;

                const monsterTravelDistance = this.monsterStopX_S3 - this.MONSTER_START_X_S3;

                if (monsterTravelDistance > 0) {
                    const currentMonsterTravel = Math.max(0, this.taxMonster.x - this.MONSTER_START_X_S3);
                    const progress = Phaser.Math.Clamp(currentMonsterTravel / monsterTravelDistance, 0, 1);
                    const currentDecrease = totalDecreaseForMechanic * progress;
                    const newCounterValue = startValue - currentDecrease;

                    this.counterValue.value = Math.max(endValue, newCounterValue); // Clamp to the mechanic's end value
                    this.counterText.setText(`$: ${Math.floor(this.counterValue.value).toLocaleString()}`);
                }
            }

            // Tax Monster Movement & Stopping Logic
            if (!this.isTaxMonsterStopped) {
                const playerNearStopArea = this.player.x > (this.PLAYER_TRIGGER_MONSTER_STOP_TILE_S3 * this.groundTileSize);

                // Calculate monsterStopX_S3 dynamically if not already set (after monster is created)
                if (this.monsterStopX_S3 === 0 && this.taxMonster.width > 0) {
                    const stopBuffer = 20; // From SceneOne
                    this.monsterStopX_S3 = (this.MONSTER_STOP_TILE_S3 * this.groundTileSize) + (this.groundTileSize / 2) - (this.taxMonster.displayWidth / 2) - stopBuffer;
                }
                
                if (this.monsterStopX_S3 > 0 && playerNearStopArea && this.taxMonster.x >= this.monsterStopX_S3) {
                    console.log(`SceneThree: Tax monster stopping near tile ${this.MONSTER_STOP_TILE_S3}.`);
                    this.taxMonster.setVelocityX(0);
                    this.taxMonster.setImmovable(true);
                    this.isTaxMonsterStopped = true;
                    // Play idle animation when stopped
                    if (this.taxMonster) {
                        this.taxMonster.play('tax-monster_idle', true);
                    }

                    // --- Stop Agent Spawning when Tax Monster stops ---
                    if (this.enemyManager && !this.agentSpawningStoppedS3) {
                        console.log("SceneThree: Tax monster stopped, stopping agent spawns.");
                        this.enemyManager.stopSpawningAgents();
                        this.agentSpawningStoppedS3 = true;
                    }
                    // --- End Stop Agent Spawning ---
                } else {
                    // Continue normal monster movement (gradual acceleration)
                    const currentSpeed = this.taxMonster.body.velocity.x;
                    if (currentSpeed < this.MONSTER_MAX_SPEED_S3) {
                        this.taxMonster.setVelocityX(Math.min(currentSpeed + this.MONSTER_ACCELERATION_S3, this.MONSTER_MAX_SPEED_S3));
                    } else {
                        this.taxMonster.setVelocityX(this.MONSTER_MAX_SPEED_S3);
                    }
                    // Ensure run animation is playing if moving
                    if (this.taxMonster && this.taxMonster.body.velocity.x > 0) {
                        this.taxMonster.play('tax-monster_run', true);
                    }
                }
            }
        }
        // --- End Tax Monster Logic ---

        // --- Enemy Manager Update ---
        if (this.enemyManager) {
            this.enemyManager.update(time, delta);
        }
        // --- End Enemy Manager Update ---

        // Spawn wife once player is beyond tile 118
        if (!this.wifeTriggered && this.player) {
            const playerTile = Math.floor(this.player.x / this.groundTileSize);
            if (playerTile > 118) {
                this.spawnWife();
            }
        }

        // Lock player at tile 120 once reached
        if (!this.playerLocked && this.player) {
            const lockTile = 120 + 0.5; // center of tile 120
            const lockX = lockTile * this.groundTileSize;
            if (this.player.x >= lockX) {
                this.playerLocked = true;
                this.player.disableMovement();
                this.player.setAccelerationX(0);
                this.player.setVelocityX(0);
                this.player.x = lockX; // Snap to tile center
                console.log("Player locked at tile 120.");
            }
        }

        // Handle wife stopping at meeting point (tile 122)
        if (this.wifeSprite && this.wifeSprite.active && this.wifeSprite.body && this.wifeSprite.body.velocity.x < 0) {
            if (this.wifeSprite.x <= this.wifeMeetingPointX) {
                this.wifeSprite.setVelocityX(0);
                this.wifeSprite.play('wife_idle');
                console.log("Wife reached tile 122 and is now idle.");

                // Hide or destroy the debug text once she stops walking
                if (this.wifeStatusText) {
                    this.wifeStatusText.destroy();
                    this.wifeStatusText = null;
                }

                // --- Show request text above wife ---
                if (!this.wifeRequestText) {
                    this.wifeRequestText = this.add.text(
                        this.wifeSprite.x,
                        this.wifeSprite.y - this.wifeSprite.displayHeight - 20,
                        'Can you please sell the autoglyph?',
                        {
                            fontFamily: '"Press Start 2P", monospace',
                            fontSize: '14px',
                            fill: '#000000',
                            stroke: '#FFFFFF',
                            strokeThickness: 4,
                            align: 'center'
                        }
                    ).setOrigin(0.5, 1);
                    this.wifeRequestText.setScrollFactor(this.wifeSprite.scrollFactorX, this.wifeSprite.scrollFactorY);

                    // Schedule dialog to appear after a short pause (2 seconds)
                    if (!this.dialogTimer) {
                        this.dialogTimer = this.time.delayedCall(2000, () => {
                            this.showSellDialog();
                            this.dialogTimer = null; // clear reference
                        }, [], this);
                    }
                }
            }
        }

        // Keep debug text positioned above the wife as she moves
        if (this.wifeStatusText && this.wifeSprite) {
            this.wifeStatusText.setPosition(
                this.wifeSprite.x,
                this.wifeSprite.y - this.wifeSprite.displayHeight - 20
            );
        }

        // Keep request text anchored in case camera scrolls
        if (this.wifeRequestText && this.wifeSprite) {
            this.wifeRequestText.setPosition(
                this.wifeSprite.x,
                this.wifeSprite.y - this.wifeSprite.displayHeight - 20
            );
        }

        // Other Scene Three update logic goes here AFTER setupLevel is called
        if (!this.isFalling) {
            // e.g., enemy movement, checks
        }

        if (this.dialogTimer && this.dialogShown) {
            // If dialog already shown via other means, cancel pending timer
            this.dialogTimer.remove();
            this.dialogTimer = null;
        }

        // Reset dialog input edge flags
        this.dialogLastUp = false;
        this.dialogLastDown = false;
        this.dialogLastAction = false;
    }

    // Helper to spawn the wife off-screen to the right and have her walk leftwards
    spawnWife() {
        if (this.wifeTriggered) return;

        this.wifeTriggered = true;
        console.log("SceneThree: Spawning wife after player passed tile 118.");

        // Determine where she should stop (tile 122 center)
        this.wifeMeetingPointX = (122 + 0.5) * this.groundTileSize;

        // Place her at least 3 tiles to the right of the meeting point, *and* off-screen if camera is further right.
        const minSpawnX = this.wifeMeetingPointX + (3 * this.groundTileSize);
        const offscreenSpawnX = this.cameras.main.scrollX + this.scale.width + 300; // 300px beyond camera edge
        const wifeStartX = Math.max(minSpawnX, offscreenSpawnX);

        // Clamp to world bounds so she doesn't spawn outside level
        const worldRightEdge = this.physics.world.bounds.width - this.groundTileSize / 2;
        const finalSpawnX = Math.min(wifeStartX, worldRightEdge);

        this.wifeSprite = this.physics.add.sprite(finalSpawnX, this.groundTopY, 'wife_atlas', 'wife-idle.png');
        this.wifeSprite.setOrigin(0.5, 1);
        this.wifeSprite.setScale(0.4);
        this.wifeSprite.setFlipX(false); // Keep existing facing direction – do NOT change
        this.wifeSprite.play('wife_walk');
        this.wifeSprite.setVelocityX(-120); // Walk left towards the player / tile 122

        if (this.groundGroup) {
            this.physics.add.collider(this.wifeSprite, this.groundGroup);
        }
        this.wifeSprite.body.setAllowGravity(true);

        console.log(`Wife sprite spawned at X: ${finalSpawnX}, will stop at X: ${this.wifeMeetingPointX} (meeting tile 122)`);
    }

    // Helper: show sell dialog with two choices
    showSellDialog() {
        if (this.dialogShown) return;
        this.dialogShown = true;

        const dialogWidth = 600;
        const dialogHeight = 220;
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // Container fixed to camera (UI layer)
        this.dialogContainer = this.add.container(0, 0);
        this.dialogContainer.setScrollFactor(0);
        this.dialogContainer.setDepth(1000); // on top

        // Background rectangle
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRoundedRect(centerX - dialogWidth / 2, centerY - dialogHeight / 2, dialogWidth, dialogHeight, 20);
        this.dialogContainer.add(bg);

        // Prompt text
        const promptText = this.add.text(centerX, centerY - 60, 'Sell your autoglyph?', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);
        this.dialogContainer.add(promptText);

        // Choice buttons
        const choicesData = [
            { label: 'I don\'t have a choice',  offsetY: 0 },
            { label: 'I guess I have to',        offsetY: 40 },
        ];

        this.dialogChoices = choicesData.map((choice, idx) => {
            const txt = this.add.text(centerX, centerY + choice.offsetY, choice.label, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '14px',
                fill: '#FFFF00',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            txt.on('pointerover', () => txt.setTintFill(0xffaaaa));
            txt.on('pointerout',  () => txt.clearTint());

            txt.on('pointerdown', () => {
                this.dialogSelectedIndex = idx;
                this.updateDialogHighlight();
                this.confirmDialogSelection();
            });

            this.dialogContainer.add(txt);
            return txt;
        });

        // Create red highlight rectangle (stroke only)
        const firstBounds = this.dialogChoices[0].getBounds();
        this.dialogHighlight = this.add.rectangle(firstBounds.centerX, firstBounds.centerY, firstBounds.width + 12, firstBounds.height + 12)
            .setOrigin(0.5)
            .setFillStyle(0x000000, 0) // transparent fill
            .setStrokeStyle(3, 0xff0000);
        this.dialogContainer.add(this.dialogHighlight);

        // Ensure highlight is behind text
        this.dialogContainer.setDepth(1000);
        this.dialogHighlight.setDepth(1001);

        // Keyboard navigation
        this.dialogKeyDownHandler = (event) => {
            console.log('Keydown event:', event.code, event.key); // Log the event code and key
            if (event.code === 'ArrowUp') {
                this.moveDialogSelection(-1);
            } else if (event.code === 'ArrowDown') {
                this.moveDialogSelection(1);
            } else if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.confirmDialogSelection();
            }
        };
        this.input.keyboard.on('keydown', this.dialogKeyDownHandler, this);

        this.updateDialogHighlight();
    }

    moveDialogSelection(delta) {
        if (!this.dialogChoices || this.dialogChoices.length === 0) return;
        const len = this.dialogChoices.length;
        this.dialogSelectedIndex = (this.dialogSelectedIndex + delta + len) % len;
        this.updateDialogHighlight();
    }

    updateDialogHighlight() {
        if (!this.dialogHighlight || !this.dialogChoices[this.dialogSelectedIndex]) return;
        const bounds = this.dialogChoices[this.dialogSelectedIndex].getBounds();
        this.dialogHighlight.setPosition(bounds.centerX, bounds.centerY);
        this.dialogHighlight.width = bounds.width + 12;
        this.dialogHighlight.height = bounds.height + 12;
    }

    confirmDialogSelection() {
        if (!this.dialogChoices[this.dialogSelectedIndex]) return;
        const selectedLabel = this.dialogChoices[this.dialogSelectedIndex].text;
        console.log(`Dialog choice selected: ${selectedLabel}`);
        this.closeSellDialog(); // This cleans UI elements for the dialog

        // --- Fade out music and then transition ---
        const bootScene = this.scene.get('BootScene');
        if (bootScene && bootScene.registry.has('musicManager')) {
            const musicManager = bootScene.registry.get('musicManager');
            const fadeDuration = 1000; // 1 second fade out

            // Assuming 'sceneThreeMusic' is the key for the music playing in this scene
            // and MusicManager has a fadeOut(key, duration) method.
            musicManager.fadeOutCurrentTrack(fadeDuration);
            console.log(`SceneThree: Initiating ${fadeDuration}ms fade out for sceneThreeMusic.`);

            this.time.delayedCall(fadeDuration, () => {
                const sceneFourData = {
                    dollars: this.counterValue.value,
                    eth: this.ethCounterValue.value,
                    taxesOwed: this.taxesOwedValue,
                    hits: this.registry.get('playerHits')
                };
                // Play.fun: level 3 complete bonus
                awardPoints(100);
                console.log('Music faded. Transitioning to InterstitialScene for SceneFour with data:', sceneFourData);
                this.scene.start('InterstitialScene', {
                    nextSceneKey: 'SceneFour',
                    imageKey: 'interstitial4',
                    sceneData: sceneFourData
                });
            }, [], this);
        } else {
            // Fallback if music manager isn't found (should not happen in normal flow)
            console.warn('MusicManager not found in BootScene registry. Transitioning immediately without fade.');
            const sceneFourData = {
                dollars: this.counterValue.value,
                eth: this.ethCounterValue.value,
                taxesOwed: this.taxesOwedValue,
                hits: this.registry.get('playerHits')
            };
            this.scene.start('InterstitialScene', {
                nextSceneKey: 'SceneFour',
                imageKey: 'interstitial4',
                sceneData: sceneFourData
            });
        }
    }

    closeSellDialog() {
        if (this.dialogContainer) {
            this.dialogContainer.destroy();
            this.dialogContainer = null;
        }
        if (this.dialogKeyDownHandler) { // Check the new handler property
            this.input.keyboard.off('keydown', this.dialogKeyDownHandler, this); // Correctly remove the listener
            this.dialogKeyDownHandler = null; // Nullify the stored handler
        }
        if (this.dialogTimer) {
            this.dialogTimer.remove();
            this.dialogTimer = null;
        }
    }

    introduceTaxMonsterS3() {
        console.log("SceneThree: Introducing tax monster...");

        const currentGroundTopY = this.scale.height - this.groundTileSize;
        const monsterStartX_Initial = -160; // Start off-screen left
        const monsterTempY  = 0;    // Placeholder Y

        this.taxMonster = new Enemy(this, monsterStartX_Initial, monsterTempY, 'tax-monster_atlas');

        const monsterDisplayH = this.taxMonster.displayHeight;
        const monsterStartY   = currentGroundTopY - monsterDisplayH / 2;
        this.taxMonster.setY(monsterStartY);
        this.taxMonster.body?.reset(this.taxMonster.x, monsterStartY);

        // Fine-tune position (similar to SceneOne)
        const bodyBottom = this.taxMonster.body?.bottom ?? this.taxMonster.getBounds().bottom;
        const deltaY = currentGroundTopY - bodyBottom;
        if (deltaY !== 0) {
            this.taxMonster.y += deltaY;
            this.taxMonster.body?.reset(this.taxMonster.x, this.taxMonster.y);
        }
        const spriteBottom = this.taxMonster.getBounds().bottom;
        const deltaSprite  = currentGroundTopY - spriteBottom;
        if (deltaSprite !== 0) {
            this.taxMonster.y += deltaSprite;
            this.taxMonster.body?.reset(this.taxMonster.x, this.taxMonster.y);
        }

        this.physics.add.collider(this.player, this.taxMonster, this.handlePlayerMonsterCollisionS3, null, this);

        this.tweens.add({
            targets: this.taxMonster,
            x: this.MONSTER_START_X_S3, // Tween to the defined start X for movement phase
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                console.log("SceneThree: Tax monster arrived. Starting its movement logic.");
                this.taxMonster.setImmovable(false);
                this.taxMonster.body.setMass(1000);
                this.taxMonster.setDepth(5); // Same depth as in SceneOne
                this.monsterInitialPlayerDollars = this.counterValue.value; // Store current dollars for decrease mechanic

                // Calculate monsterStopX_S3 here now that monster displayWidth is available
                const stopBuffer = 20; 
                this.monsterStopX_S3 = (this.MONSTER_STOP_TILE_S3 * this.groundTileSize) + (this.groundTileSize / 2) - (this.taxMonster.displayWidth / 2) - stopBuffer;
                console.log("SceneThree: Calculated monsterStopX_S3:", this.monsterStopX_S3);

                // Play run animation
                if (this.taxMonster) {
                    this.taxMonster.play('tax-monster_run', true); 
                }

                // --- Start Spawning Agents via Manager ---
                if (this.enemyManager) {
                    this.enemyManager.startSpawningAgents();
                    console.log("SceneThree: IRS Agent spawning started.");
                }
                // --- End Start Spawning Agents ---
            }
        });
    }

    handlePlayerMonsterCollisionS3(player, monster) {
        console.log("SceneThree: Collision with Tax Monster!");
        // Monster acts as a physical barrier, no specific action on collision for now.
    }

    handlePlayerAgentCollisionS3(player, agent) {
        console.log("SceneThree: COLLISION WITH IRS AGENT! Losing dollars.");

        // --- Play Player Ow then Ringloss Sounds ---
        const soundManager = this.registry.get('soundManager');
        if (soundManager) {
            const owSound = soundManager.playSound('playerOwSound', { volume: 0.2 });
            if (owSound && owSound.once) {
                owSound.once('complete', () => {
                    soundManager.playSound('ringlossSound', { volume: 0.25 });
                });
            } else {
                this.time.delayedCall(300, () => {
                    soundManager.playSound('ringlossSound', { volume: 0.25 });
                });
            }
        } else {
            console.warn('SceneThree: SoundManager not found. Cannot play player ow / ringloss sounds.');
        }

        // --- NEW: Player Hit Effects ---
        // Prevent effect stacking if already hit
        if (player.isHit) return; // Stop if already processing a hit

        // Camera Shake
        this.cameras.main.shake(120, 0.008);

        // Tint player red temporarily
        player.isHit = true;        // Set the flag
        // Increment global hit counter
        this.registry.set('playerHits', (this.registry.get('playerHits') || 0) + 1);
        player.setTint(0xff0000);
        this.time.delayedCall(400, () => {
            player.clearTint();
            player.isHit = false; // Clear the flag after delay
        }, [], this);
        // --- END NEW ---

        // 1. Subtract Dollars (ensure counterValue and counterText exist)
        const dollarsToLoseS3 = 50000; // Adjusted amount for SceneThree, can be tuned
        if (this.counterValue && this.counterText) {
            this.counterValue.value = Math.max(0, this.counterValue.value - dollarsToLoseS3);
            this.counterText.setText(`$: ${Math.floor(this.counterValue.value).toLocaleString()}`);
        } else {
            console.warn("SceneThree: Counter value or text not found for agent collision.");
        }

        // 2. Create Coin Burst Effect at Player Position using sprites (matches SceneOne)
        this.spawnCoinBurst(player.x, player.y, player.depth + 1);

        // 3. Destroy the specific agent that was hit
        if (agent && agent.active) {
            agent.destroy();
        }

        // Optional: Add brief invincibility or knockback to player later
    }

    // --- NEW: Coin Burst Helper (copied from SceneOne) ---
    spawnCoinBurst(x, y, depth) {
        const count = Phaser.Math.Between(10, 20);
        for (let i = 0; i < count; i++) {
            // Use real coin art loaded via BootScene (single-frame atlas)
            const coin = this.physics.add.image(x, y, 'coin_atlas', 'coin.png');

            // Match technique: use un-scaled frame width
            const unscaledCoinWidth = coin.frame.width;
            const desiredDisplayWidth = 64; // ≈ one ground tile
            const scaleFactor = desiredDisplayWidth / unscaledCoinWidth;
            coin.setScale(scaleFactor);

            coin.setDepth(depth);

            // Set a circular physics body based on UN-SCALED width so scale is applied automatically
            if (coin.body && coin.body.setCircle) {
                coin.body.setCircle(unscaledCoinWidth / 2);
            }

            // Random burst trajectory
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const speed = Phaser.Math.Between(150, 300);
            coin.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed - 150);
            coin.setGravityY(800);

            // Enable collision with the ground so coins land and bounce
            this.physics.add.collider(coin, this.groundGroup);

            // Make them bounce a little for visual flair
            coin.setBounce(0.3);

            // Clean up after a few seconds
            this.time.delayedCall(5000, () => {
                if (coin && coin.active) {
                    coin.destroy();
                }
            });
        }
    }
    // --- End Coin Burst Helper ---

    update(time, delta) {
        if (this.player) {
            this.player.update(time, delta);
        }

        // ------------------------------------------------------------------
        // Dialog Navigation via Touch Controls (Mobile)
        // ------------------------------------------------------------------
        if (this.dialogShown && this.game && this.game.touchControls) {
            const dirs = this.game.touchControls.directions;

            // Move selection UP when joystick moved up (edge trigger)
            if (dirs.up && !this.dialogLastUp) {
                this.moveDialogSelection(-1);
            }
            // Move selection DOWN when joystick moved down (edge trigger)
            if (dirs.down && !this.dialogLastDown) {
                this.moveDialogSelection(1);
            }
            // Confirm choice when action button pressed (edge trigger)
            if (dirs.action && !this.dialogLastAction) {
                this.confirmDialogSelection();
            }

            // Store last state for edge detection
            this.dialogLastUp = dirs.up;
            this.dialogLastDown = dirs.down;
            this.dialogLastAction = dirs.action;
        }
        // ------------------------------------------------------------------

        // --- NEW LOGIC FOR EARLY AGENT SPAWNING STOP ---
        if (this.enemyManager && !this.agentSpawningStoppedS3 && this.player) {
            const playerTile = Math.floor(this.player.x / this.groundTileSize);
            if (playerTile > 80) {
                console.log("SceneThree: Player passed tile 80, stopping agent spawns earlier.");
                this.enemyManager.stopSpawningAgents();
                this.agentSpawningStoppedS3 = true; // Use the existing flag
            }
        }
        // --- END NEW LOGIC FOR EARLY AGENT SPAWNING STOP ---

        // --- Tax Monster Logic (Ported from SceneOne) ---
        if (this.taxMonster && this.taxMonster.active) {
            // Dollar Value Decrease Over Time (Linked to Monster Progress)
            if (!this.isTaxMonsterStopped && this.monsterInitialPlayerDollars > 0) {
                const startValue = this.monsterInitialPlayerDollars;
                const endValue = Math.max(0, startValue - this.DOLLAR_DECREASE_TOTAL_S3); // Ensure doesn't go below zero from this mechanic alone
                const totalDecreaseForMechanic = startValue - endValue;

                const monsterTravelDistance = this.monsterStopX_S3 - this.MONSTER_START_X_S3;

                if (monsterTravelDistance > 0) {
                    const currentMonsterTravel = Math.max(0, this.taxMonster.x - this.MONSTER_START_X_S3);
                    const progress = Phaser.Math.Clamp(currentMonsterTravel / monsterTravelDistance, 0, 1);
                    const currentDecrease = totalDecreaseForMechanic * progress;
                    const newCounterValue = startValue - currentDecrease;

                    this.counterValue.value = Math.max(endValue, newCounterValue); // Clamp to the mechanic's end value
                    this.counterText.setText(`$: ${Math.floor(this.counterValue.value).toLocaleString()}`);
                }
            }

            // Tax Monster Movement & Stopping Logic
            if (!this.isTaxMonsterStopped) {
                const playerNearStopArea = this.player.x > (this.PLAYER_TRIGGER_MONSTER_STOP_TILE_S3 * this.groundTileSize);

                // Calculate monsterStopX_S3 dynamically if not already set (after monster is created)
                if (this.monsterStopX_S3 === 0 && this.taxMonster.width > 0) {
                    const stopBuffer = 20; // From SceneOne
                    this.monsterStopX_S3 = (this.MONSTER_STOP_TILE_S3 * this.groundTileSize) + (this.groundTileSize / 2) - (this.taxMonster.displayWidth / 2) - stopBuffer;
                }
                
                if (this.monsterStopX_S3 > 0 && playerNearStopArea && this.taxMonster.x >= this.monsterStopX_S3) {
                    console.log(`SceneThree: Tax monster stopping near tile ${this.MONSTER_STOP_TILE_S3}.`);
                    this.taxMonster.setVelocityX(0);
                    this.taxMonster.setImmovable(true);
                    this.isTaxMonsterStopped = true;
                    // Play idle animation when stopped
                    if (this.taxMonster) {
                        this.taxMonster.play('tax-monster_idle', true);
                    }

                    // --- Stop Agent Spawning when Tax Monster stops ---
                    if (this.enemyManager && !this.agentSpawningStoppedS3) {
                        console.log("SceneThree: Tax monster stopped, stopping agent spawns.");
                        this.enemyManager.stopSpawningAgents();
                        this.agentSpawningStoppedS3 = true;
                    }
                    // --- End Stop Agent Spawning ---
                } else {
                    // Continue normal monster movement (gradual acceleration)
                    const currentSpeed = this.taxMonster.body.velocity.x;
                    if (currentSpeed < this.MONSTER_MAX_SPEED_S3) {
                        this.taxMonster.setVelocityX(Math.min(currentSpeed + this.MONSTER_ACCELERATION_S3, this.MONSTER_MAX_SPEED_S3));
                    } else {
                        this.taxMonster.setVelocityX(this.MONSTER_MAX_SPEED_S3);
                    }
                    // Ensure run animation is playing if moving
                    if (this.taxMonster && this.taxMonster.body.velocity.x > 0) {
                        this.taxMonster.play('tax-monster_run', true);
                    }
                }
            }
        }
        // --- End Tax Monster Logic ---

        // --- Enemy Manager Update ---
        if (this.enemyManager) {
            this.enemyManager.update(time, delta);
        }
        // --- End Enemy Manager Update ---

        // Spawn wife once player is beyond tile 118
        if (!this.wifeTriggered && this.player) {
            const playerTile = Math.floor(this.player.x / this.groundTileSize);
            if (playerTile > 118) {
                this.spawnWife();
            }
        }

        // Lock player at tile 120 once reached
        if (!this.playerLocked && this.player) {
            const lockTile = 120 + 0.5; // center of tile 120
            const lockX = lockTile * this.groundTileSize;
            if (this.player.x >= lockX) {
                this.playerLocked = true;
                this.player.disableMovement();
                this.player.setAccelerationX(0);
                this.player.setVelocityX(0);
                this.player.x = lockX; // Snap to tile center
                console.log("Player locked at tile 120.");
            }
        }

        // Handle wife stopping at meeting point (tile 122)
        if (this.wifeSprite && this.wifeSprite.active && this.wifeSprite.body && this.wifeSprite.body.velocity.x < 0) {
            if (this.wifeSprite.x <= this.wifeMeetingPointX) {
                this.wifeSprite.setVelocityX(0);
                this.wifeSprite.play('wife_idle');
                console.log("Wife reached tile 122 and is now idle.");

                // Hide or destroy the debug text once she stops walking
                if (this.wifeStatusText) {
                    this.wifeStatusText.destroy();
                    this.wifeStatusText = null;
                }

                // --- Show request text above wife ---
                if (!this.wifeRequestText) {
                    this.wifeRequestText = this.add.text(
                        this.wifeSprite.x,
                        this.wifeSprite.y - this.wifeSprite.displayHeight - 20,
                        'Can you please sell the autoglyph?',
                        {
                            fontFamily: '"Press Start 2P", monospace',
                            fontSize: '14px',
                            fill: '#000000',
                            stroke: '#FFFFFF',
                            strokeThickness: 4,
                            align: 'center'
                        }
                    ).setOrigin(0.5, 1);
                    this.wifeRequestText.setScrollFactor(this.wifeSprite.scrollFactorX, this.wifeSprite.scrollFactorY);

                    // Schedule dialog to appear after a short pause (2 seconds)
                    if (!this.dialogTimer) {
                        this.dialogTimer = this.time.delayedCall(2000, () => {
                            this.showSellDialog();
                            this.dialogTimer = null; // clear reference
                        }, [], this);
                    }
                }
            }
        }

        // Keep debug text positioned above the wife as she moves
        if (this.wifeStatusText && this.wifeSprite) {
            this.wifeStatusText.setPosition(
                this.wifeSprite.x,
                this.wifeSprite.y - this.wifeSprite.displayHeight - 20
            );
        }

        // Keep request text anchored in case camera scrolls
        if (this.wifeRequestText && this.wifeSprite) {
            this.wifeRequestText.setPosition(
                this.wifeSprite.x,
                this.wifeSprite.y - this.wifeSprite.displayHeight - 20
            );
        }

        // Other Scene Three update logic goes here AFTER setupLevel is called
        if (!this.isFalling) {
            // e.g., enemy movement, checks
        }

        if (this.dialogTimer && this.dialogShown) {
            // If dialog already shown via other means, cancel pending timer
            this.dialogTimer.remove();
            this.dialogTimer = null;
        }
    }
} 