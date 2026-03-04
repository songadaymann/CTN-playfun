class SceneTwo extends Phaser.Scene {

    constructor() {
        super({ key: 'SceneTwo' });
        this.player = null;      // To hold the player object
        this.groundGroup = null; // To hold the ground tiles
        this.wallGroup = null; // To hold the wall tiles
        this.brickDebrisGroup = null; // To hold flying brick debris
        this.groundTileSize = 64; // Same as SceneOne for consistency
        this.taxMonster = null;  // To hold the tax monster object
        this.enemyManager = null; // To hold the EnemyManager instance
        // Add counter variables
        this.counterText = null;
        this.counterValue = { value: 0 };
        this.ethCounterText = null;
        this.ethCounterValue = { value: 0 };
        this.aaveCounterText = null;
        this.aaveCounterValue = { value: 0 };
        this.initialCounterData = {}; // To store passed data
        this.isTaxMonsterStopped = false; // Flag for monster state
        this.doKwonMonster = null; // To hold the Do Kwon boss sprite
        this.isDoKwonSpawned = false; // Flag to prevent multiple spawns
        // Do Kwon Movement State
        this.doKwonMoveDirection = 1; // 1 for right, -1 for left
        this.doKwonMoveSpeed = 50; // Pixels per second
        this.doKwonMoveBounds = { left: 0, right: 0 };
        // Candle Shooting State
        this.redCandleGroup = null; // Group for candle projectiles
        this.doKwonShootTimer = null; // Timer event for shooting
        this.isPlayerFalling = false; // Flag to prevent multiple scene transitions
        this.loanRepaymentTriggered = false; // Flag to prevent multiple triggers
        // --- NEW: Do Kwon Candle Accuracy --- 
        this.doKwonAccuracyFactor = 1.0;    // Initial accuracy (1.0 = normal range)
        this.doKwonMinAccuracyFactor = 0.05; // Minimum accuracy factor (REDUCED from 0.15 to 0.05)
        this.doKwonAccuracyDecrease = 0.008; // Amount to decrease accuracy factor per shot
        // ------------------------------------
    }

    // Add init method to receive data
    init(data) {
        console.log("SceneTwo init received data:", data);
        this.initialCounterData = data || {}; // Store received data, default to empty object
    }

    preload() {
        console.log("SceneTwo: preload");
        // Assets should already be loaded by BootScene
    }

    create() {
        console.log("SceneTwo: create");
        this.cameras.main.setBackgroundColor('#000033'); // Dark blue background for contrast
        // REMOVED: this.agentTextureKey = 'irs-agent2_atlas'; // Use agent2 for all IRS agents in this scene

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // --- Add Parallax Backgrounds (Wide Images) ---
        // These images are expected to be the correct width for their scroll factor and world size.
        this.add.image(0, 0, 'scene2_bg_far_wide')
            .setOrigin(0, 0)
            .setScrollFactor(0.2)
            .setDepth(-10);

        this.add.image(0, 0, 'scene2_bg_mid_wide')
            .setOrigin(0, 0)
            .setScrollFactor(0.5)
            .setDepth(-9);

        this.add.image(0, 0, 'scene2_bg_close_wide')
            .setOrigin(0, 0)
            .setScrollFactor(0.8)
            .setDepth(-8);

        // Match world height to the actual canvas height so physics bodies and ground align with the screen
        const worldHeight = gameHeight;
        const numGroundTiles = 100; // Start with fewer tiles for SceneTwo
        const worldWidth = numGroundTiles * this.groundTileSize;

        // Set world bounds for SceneTwo
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // --- Create Ground ---
        this.groundGroup = this.physics.add.staticGroup();
        const groundY = worldHeight - this.groundTileSize / 2;
        console.log(`Creating ${numGroundTiles} ground tiles for SceneTwo.`);

        const brickTileFrame = 's2ground4.png';
        const otherTileFrames = ['s2ground1.png', 's2ground2.png', 's2ground3.png', 's2ground5.png'];
        
        let weightedGroundFrames = [];
        // Add the brick tile multiple times to increase its weight (e.g., 16 times for ~80% probability if others are 1 each)
        for (let k = 0; k < 16; k++) {
            weightedGroundFrames.push(brickTileFrame);
        }
        // Add each of the other tiles once
        otherTileFrames.forEach(frame => {
            weightedGroundFrames.push(frame);
        });
        // Total items in weightedGroundFrames will be 16 (brick) + 4 (others) = 20.
        // Probability of brick: 16/20 = 80%
        // Probability of each other tile: 1/20 = 5%

        for (let i = 0; i < numGroundTiles; i++) {
            const x = i * this.groundTileSize + this.groundTileSize / 2;
            const tile = this.groundGroup.create(x, groundY, 'ground-placeholder');
            tile.setOrigin(0.5);

            // Randomly select one of the new ground frames from the weighted list
            const randomFrameName = Phaser.Math.RND.pick(weightedGroundFrames);
            tile.setTexture('s2ground_atlas', randomFrameName); 

            tile.setDisplaySize(this.groundTileSize, this.groundTileSize);
            tile.refreshBody();

            // Add debug number if debug is enabled
            if (this.physics.config.debug) {
                this.add.text(x, groundY - this.groundTileSize / 2, i.toString(), {
                    fontSize: '12px', fill: '#fff', backgroundColor: '#000'
                }).setOrigin(0.5).setName(`debug_text_${i}`);
            }

            // --- Snap tile visuals to the ground line (matches SceneOne logic) ---
            const visualBottom = tile.getBounds().bottom;
            const physicsBottom = groundY + (this.groundTileSize / 2);
            const delta = physicsBottom - visualBottom;
            if (Math.abs(delta) > 0.1) {
                tile.y += delta;
            }
            // ------------------------------------------------------
        }

        // --- Create Wall at Tile 45 (2 wide, 4 high) ---
        this.wallGroup = this.physics.add.staticGroup(); // Initialize the wall group
        this.brickDebrisGroup = this.physics.add.group({ // Initialize debris group
            allowGravity: true,
            bounceX: 0.5,
            bounceY: 0.5,
            velocityX: () => Phaser.Math.Between(-150, 150),
            velocityY: () => Phaser.Math.Between(-300, -100)
        });

        const wallTileIndexX = 45;
        const wallWidthInTiles = 2;
        const wallHeightInTiles = 4;
        const wallTextureFrame = 's2ground4.png'; // The specified brick texture

        for (let i = 0; i < wallWidthInTiles; i++) {
            for (let j = 0; j < wallHeightInTiles; j++) {
                const x = (wallTileIndexX + i) * this.groundTileSize + this.groundTileSize / 2;
                const y = groundY - (j * this.groundTileSize);

                // Add wall tiles to this.wallGroup instead of this.groundGroup
                const wallTile = this.wallGroup.create(x, y, 's2ground_atlas', wallTextureFrame);
                wallTile.setOrigin(0.5);
                wallTile.setDisplaySize(this.groundTileSize, this.groundTileSize);
                wallTile.refreshBody(); // Important for static physics bodies
                wallTile.setData('isWall', true); // Mark as wall tile

                if (this.physics.config.debug) {
                    this.add.text(x, y - this.groundTileSize / 2, `W${i},${j}`, {
                        fontSize: '10px', fill: '#0f0', backgroundColor: '#000'
                    }).setOrigin(0.5).setName(`debug_wall_${wallTileIndexX + i}_${j}`);
                }
            }
        }
        // --- End Wall Creation ---

        // --- Create Player ---
        // Start player near the beginning of SceneTwo.  We spawn at Y=0 first so we can
        // accurately calculate the ground-aligned position using the *real* scaled height
        // of the sprite (similar to SceneOne logic).
        const playerStartX = 100; // Slightly inside the scene

        // 1) Spawn player temporarily at Y=0 so displayHeight is known after scale.
        this.player = new Player(this, playerStartX, 0);

        // 2) Compute where the player centre should be so that the *bottom edge* of the
        //    collider rests on the ground once physics settles.  We keep a small buffer so
        //    the sprite initially sits a little high and drops under gravity.
        const groundTopY = worldHeight - this.groundTileSize; // Visual top of ground layer
        const playerHalfHeight = this.player.displayHeight / 2;
        const buffer = 25; // Pixels above ground to start (gives a natural drop)
        const playerStartY = groundTopY - playerHalfHeight - buffer;
        this.player.setY(playerStartY);

        // Allow collision with SceneTwo bounds
        this.player.setCollideWorldBounds(true);
        console.log(`SceneTwo Player positioned at X=${playerStartX}, initial Y=${playerStartY} (groundTop=${groundTopY}).`);

        // --- Physics Collisions ---
        this.physics.add.collider(this.player, this.groundGroup);
        this.physics.add.collider(this.player, this.wallGroup, this.handlePlayerWallCollision, null, this); // New collider for wall
        this.physics.add.collider(this.brickDebrisGroup, this.groundGroup); // Debris collides with ground
        // this.physics.add.collider(this.brickDebrisGroup, this.wallGroup); // Optional: Debris collides with remaining wall
        console.log("SceneTwo: Colliders set between player and ground, and player and wall.");

        // --- Camera Setup ---
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1); // Follow player immediately
        console.log("SceneTwo: Camera set to follow player.");

        // --- Spawn Tax Monster (off-screen left, then snap to ground) ---
        const monsterStartX = -160; // Off-screen left; adjusted once tweened/moving later

        // 1) Spawn temporarily at Y=0 so we can calculate the scaled height.
        this.taxMonster = new Enemy(this, monsterStartX, 0, 'tax-monster_atlas'); 

        // 2) Position the monster so its *visible* bottom edge rests flush on the ground.
        const monsterDisplayH = this.taxMonster.displayHeight; // Already includes scale
        const monsterStartY = groundTopY - monsterDisplayH / 2;
        this.taxMonster.setY(monsterStartY);
        this.taxMonster.body?.reset(this.taxMonster.x, monsterStartY);

        // Extra precision: use physics body bottom then sprite bottom as a fallback ‑- this
        // mirrors the double-snap logic from SceneOne so trimming quirks don't bury feet.
        const bodyBottom = this.taxMonster.body?.bottom ?? this.taxMonster.getBounds().bottom;
        let deltaY = groundTopY - bodyBottom;
        if (deltaY !== 0) {
            this.taxMonster.y += deltaY;
            this.taxMonster.body?.reset(this.taxMonster.x, this.taxMonster.y);
            console.log(`Adjusted monster by ΔY=${deltaY.toFixed(1)} (body) to sit on ground.`);
        }

        const spriteBottom = this.taxMonster.getBounds().bottom;
        deltaY = groundTopY - spriteBottom;
        if (deltaY !== 0) {
            this.taxMonster.y += deltaY;
            this.taxMonster.body?.reset(this.taxMonster.x, this.taxMonster.y);
            console.log(`Adjusted monster by ΔY=${deltaY.toFixed(1)} (sprite) to sit on ground.`);
        }

        // Properties like allowGravity and immovable should ideally be managed by physics interactions/
        // group settings if needed, but we can set specific ones here if required for this instance.
        // this.taxMonster.body.setAllowGravity(false); // Enemy class doesn't set gravity
        // this.taxMonster.setImmovable(true); // Setting immovable might still be desired
        this.taxMonster.setImmovable(true); // Keep this for now
        this.taxMonster.setDepth(5); // Keep depth

        // The Enemy constructor logs its creation, so this one might be redundant
        // console.log("SceneTwo: Tax Monster created at", monsterStartX, monsterStartY);

        // --- Create Enemy Manager ---
        this.enemyManager = new EnemyManager(this);
        console.log("SceneTwo: Enemy Manager created.");

        // --- Physics Collisions (add monster and agents) ---
        this.physics.add.collider(this.player, this.groundGroup);
        this.physics.add.collider(this.player, this.taxMonster, this.handlePlayerMonsterCollision, null, this);
        // Add collider between player and agents using the manager's group
        this.physics.add.collider(this.player, this.enemyManager.getGroup(), this.handlePlayerAgentCollision, null, this);
        // *** ADD COLLIDER: Agents vs Ground ***
        this.physics.add.collider(this.enemyManager.getGroup(), this.groundGroup);
        console.log("SceneTwo: Colliders set between player, ground, monster, and agents.");

        // --- Create and Initialize Counters ---
        // Use initial data passed from SceneOne
        this.counterValue.value = this.initialCounterData.dollars || 0;
        this.ethCounterValue.value = this.initialCounterData.eth || 0;
        this.aaveCounterValue.value = this.initialCounterData.aave || 0;

        // Dollar Counter
        this.counterText = this.add.text(20, 20, `$: ${Math.floor(this.counterValue.value).toLocaleString()}`, {
            fontSize: '24px', fill: '#fff' // White text for dark background
        }).setOrigin(0, 0)
          .setScrollFactor(0); // Pin it

        // ETH Counter
        this.ethCounterText = this.add.text(20, 50, `ETH: ${Math.floor(this.ethCounterValue.value)}`, {
            fontSize: '24px', fill: '#fff' // White text
        }).setOrigin(0, 0)
            .setScrollFactor(0); // Pin it

        // Aave Counter
        this.aaveCounterText = this.add.text(20, 80, `Aave: ${this.aaveCounterValue.value}`, {
            fontSize: '24px', fill: '#ADD8E6' // Light blue for Aave on dark bg
        }).setOrigin(0, 0)
            .setScrollFactor(0) // Pin it
            .setVisible(this.aaveCounterValue.value > 0); // Show only if loan exists

        console.log("SceneTwo: Counters initialized with values:", this.initialCounterData);

        // --- Start Spawning Agents ---
        this.enemyManager.startSpawningAgents();

        // --- Create Red Candle Group ---
        this.redCandleGroup = this.physics.add.group({
            allowGravity: true,
            gravityY: 600, // Candles fall slower than Do Kwon initial drop
            // We can add world bounds collision later if needed
        });

        // Add collider between candles and ground (moved here from spawn function)
        this.physics.add.collider(this.redCandleGroup, this.groundGroup, this.handleCandleGroundCollision, null, this);

        // --- Add overlap between player and red candles ---
        this.physics.add.overlap(this.player, this.redCandleGroup, this.handlePlayerCandleCollision, null, this);

        // Remove placeholder text
        // this.add.text(this.scale.width / 2, this.scale.height / 2, 'Welcome to Scene Two!', {
        //     fontSize: '48px',
        //     fill: '#fff'
        // }).setOrigin(0.5);

        // You would set up Scene Two elements here
        // e.g., new background, different characters, game mechanics

        // --- Initialize music ---
        const musicManager = this.registry.get('musicManager');
        if (musicManager) {
            musicManager.play('sceneTwoMusic', { loop: true, volume: 0.4 });
            console.log("SceneTwo: Attempting to play 'sceneTwoMusic'.");
        } else {
            console.warn('SceneTwo: MusicManager not found in registry. Cannot play music.');
        }
        // --- End music initialization ---
    }

    // Add collision handler for the monster
    handlePlayerMonsterCollision(player, monster) {
        console.log("SCENE TWO COLLISION WITH TAX MONSTER!");
        // Player cannot pass the monster due to physics; no scene restart needed.
        // REMOVED: this.scene.restart(); 
        // Later, we might implement other effects here
    }

    // Add collision handler for Agents (copied from SceneOne and adapted)
    handlePlayerAgentCollision(player, agent) {
        console.log("SCENE TWO COLLISION WITH IRS AGENT! Losing dollars.");

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
            console.warn('SceneTwo: SoundManager not found. Cannot play player ow / ringloss sounds.');
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

        // 1. Subtract Dollars
        const dollarsToLose = 100000;
        // Use SceneTwo's counter variables
        this.counterValue.value = Math.max(0, this.counterValue.value - dollarsToLose); // Don't go below 0
        this.counterText.setText(`$: ${Math.floor(this.counterValue.value).toLocaleString()}`); // Update text with $ format
        // ETH is not affected by this collision

        // 2. Create Coin Burst Effect at Player Position using sprites (matches SceneOne)
        this.spawnCoinBurst(player.x, player.y, player.depth + 1);

        // 3. Destroy the specific agent that was hit
        agent.destroy();

        // Optional: Add brief invincibility or knockback later
    }

    // --- NEW: Coin Burst Helper (copied from SceneOne) ---
    spawnCoinBurst(x, y, depth) {
        const count = Phaser.Math.Between(10, 20);
        for (let i = 0; i < count; i++) {
            // Use real coin art loaded via BootScene (single-frame atlas)
            const coin = this.physics.add.image(x, y, 'coin_atlas', 'coin.png');

            // Match ThreeMillionScene technique: use un-scaled frame width
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

            // Optional: clean-up after a few seconds to avoid piling up forever
            this.time.delayedCall(5000, () => {
                if (coin && coin.active) {
                    coin.destroy();
                }
            });
        }
    }
    // --- End Coin Burst Helper ---

    // --- Spawn Do Kwon --- 
    spawnDoKwon() {
        if (this.isDoKwonSpawned) return; // Don't spawn if already spawned
        this.isDoKwonSpawned = true;
        console.log("Spawning Do Kwon...");

        // --- Play Do Kwon Appearance Sound ---
        const soundManager = this.registry.get('soundManager');
        if (soundManager) {
            soundManager.playSound('steadyLadsSound', { volume: 0.3 });
        } else {
            console.warn('SceneTwo: SoundManager not found. Cannot play steadyLadsSound.');
        }
        // --- End Sound ---

        // --- Define Spawn Position First ---
        const targetTileIndex = Phaser.Math.Between(78, 80); // Aim for center of 78-80 range
        const spawnX = (targetTileIndex * this.groundTileSize) + (this.groundTileSize / 2);
        const spawnY = -200; // Start above the screen

        // --- "Steady Lads" Text --- (NEW)
        const steadyLadsText = this.add.text(
            spawnX, 
            spawnY - 100, // Position above Do Kwon's spawn point
            'Steady lads, deploying more capital',
            {
                fontFamily: '"Press Start 2P", monospace', // Assuming similar style needed
                fontSize: '24px',
                fill: '#ffffcc', // Light yellow text
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: { x: 8, y: 4 },
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(this.cameras.main.scrollFactorX, this.cameras.main.scrollFactorY) // Match camera scroll if any
         .setDepth(150); // Ensure it's visible

        // Remove text after a delay
        this.time.delayedCall(4000, () => {
            if (steadyLadsText) steadyLadsText.destroy();
        });
        // --- End "Steady Lads" Text ---

        // --- Screen Shake and Sprite Creation (uses spawnX, spawnY defined above) ---
        const worldHeight = this.physics.world.bounds.height;
        const groundY = worldHeight - this.groundTileSize / 2;

        // Screen Shake
        this.cameras.main.shake(500, 0.015); // Shake intensity slightly less than start

        // Create Do Kwon sprite using new atlas (start with idle frame)
        this.doKwonMonster = this.physics.add.sprite(spawnX, spawnY, 'do-kwon_atlas', 'do-kwon-middle.png');
        this.doKwonMonster.anims.play('do-kwon_idle');
        this.doKwonMonster.setOrigin(0.5, 1); // Origin at bottom center for landing
        this.doKwonMonster.setDepth(6); // Ensure visibility (above tax monster)
        this.doKwonMonster.body.setGravityY(1000); // Make it fall (adjust gravity if needed)
        this.doKwonMonster.setCollideWorldBounds(true); // Prevent falling through floor if collider fails

        console.log("Do Kwon sprite created at:", spawnX, spawnY);

        // --- Colliders --- 
        // Collider with Ground (triggers landing logic)
        this.physics.add.collider(this.doKwonMonster, this.groundGroup, this.handleDoKwonLanded, null, this);

        // Collider with Player (basic barrier for now)
        this.physics.add.collider(this.player, this.doKwonMonster, () => {
            // Player cannot pass Do Kwon
            console.log("Player collided with Do Kwon barrier.");
        }, null, this);

        console.log("Colliders added for Do Kwon.");

        // Optional: Add a sound effect for the drop/shake
    }

    handleDoKwonLanded(doKwon, groundTile) {
        // Check if the function hasn't already run for this instance (prevents multiple triggers)
        if (!doKwon.body.allowGravity) return;
        
        console.log("Do Kwon has landed!");
        doKwon.body.setAllowGravity(false);
        doKwon.setImmovable(true);
        doKwon.setVelocityY(0); // Stop any residual vertical velocity

        // --- Expand Physics Body ---
        const currentWidth = doKwon.displayWidth;
        const currentHeight = doKwon.displayHeight;
        const newBodyWidth = currentWidth * 1.20; // Increase width by 20%
        const newBodyHeight = currentHeight; // Keep height the same

        // Calculate offset to keep the new body centered horizontally
        // Body offset is relative to the sprite's top-left. Sprite origin is (0.5, 1).
        const offsetX = (currentWidth - newBodyWidth) / 2;
        // Assuming vertical alignment is fine, keep original body.offset.y (likely 0 for origin 0.5,1)
        const offsetY = doKwon.body.offset.y; 

        doKwon.body.setSize(newBodyWidth, newBodyHeight);
        doKwon.body.setOffset(offsetX, offsetY);
        console.log(`Do Kwon body resized to: ${newBodyWidth.toFixed(1)}x${newBodyHeight.toFixed(1)}, offset: ${offsetX.toFixed(1)},${offsetY.toFixed(1)}`);
        // --- End Expand Physics Body ---

        // --- Setup Movement Bounds & Start Moving --- 
        const moveRange = this.groundTileSize * 1.5; // Move 1.5 tiles left/right
        this.doKwonMoveBounds.left = doKwon.x - moveRange;
        this.doKwonMoveBounds.right = doKwon.x + moveRange;
        // Ensure bounds stay within world limits slightly
        this.doKwonMoveBounds.left = Math.max(doKwon.width / 2, this.doKwonMoveBounds.left);
        this.doKwonMoveBounds.right = Math.min(this.physics.world.bounds.width - doKwon.width / 2, this.doKwonMoveBounds.right);
        
        doKwon.setVelocityX(this.doKwonMoveSpeed * this.doKwonMoveDirection);
        console.log(`Do Kwon movement bounds set: L=${this.doKwonMoveBounds.left.toFixed(0)}, R=${this.doKwonMoveBounds.right.toFixed(0)}`);

        // --- Start Shooting Timer --- 
        if (this.doKwonShootTimer) {
            this.doKwonShootTimer.remove(); // Remove existing timer if any (safety)
        }
        this.doKwonShootTimer = this.time.addEvent({
            delay: Phaser.Math.Between(1200, 2000), // Shoot every 1.2 - 2 seconds
            callback: this.shootRedCandle, // Function to call
            callbackScope: this,           // Context
            loop: true                     // Repeat indefinitely
        });
        console.log("Do Kwon started shooting candles.");

        // Optional: Add landing particle effect
        // const landingParticles = this.add.particles(doKwon.x, doKwon.y, 'ground-placeholder', {
        //     // Particle configuration...
        // });
        // landingParticles.explode(20);

        // --- Timed Ground Destruction Sequence ---
        // After Do Kwon lands, start a timer to destroy specific ground tiles.
        this.time.delayedCall(4000, () => {
            this.destroyGroundTileByIndex(73); // Destroy tile 73 after 4 seconds
            this.time.delayedCall(2000, () => {
                this.destroyGroundTileByIndex(74); // Destroy tile 74 after another 2 seconds
                this.time.delayedCall(2000, () => {
                    this.destroyGroundTileByIndex(75); // Destroy tile 75 after another 2 seconds
                }, [], this);
            }, [], this);
        }, [], this);
        // --- End Timed Ground Destruction ---
    }

    // --- Helper method to destroy a ground tile by its original index ---
    destroyGroundTileByIndex(targetIndex) {
        if (!this.groundGroup || !this.groundGroup.active) {
            console.warn(`SceneTwo: Ground group not available for destroying tile ${targetIndex}.`);
            return;
        }

        const expectedX = (targetIndex * this.groundTileSize) + (this.groundTileSize / 2);
        const tolerance = 1; // Small tolerance for floating point comparisons for tile.x

        const tiles = this.groundGroup.getChildren();
        let tileFoundAndDestroyed = false;
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            // Check if the tile is active and its x-coordinate matches the expected one
            if (tile && tile.active && Math.abs(tile.x - expectedX) < tolerance) {
                console.log(`SceneTwo: Timed destruction of ground tile at index ${targetIndex} (x: ${tile.x.toFixed(0)})`);
                tile.destroy();
                tileFoundAndDestroyed = true;
                break; // Exit loop once tile is found and destroyed
            }
        }

        if (!tileFoundAndDestroyed) {
            console.log(`SceneTwo: Ground tile at index ${targetIndex} not found for timed destruction (possibly already destroyed or index out of bounds).`);
        }
    }

    // --- Candle Shooting & Collision ---
    shootRedCandle() {
        if (!this.doKwonMonster || !this.doKwonMonster.active || !this.player || !this.player.active || this.doKwonMonster.body.allowGravity) {
            // Don't shoot if Do Kwon isn't active, player isn't active, or Do Kwon is still falling
            return;
        }

        // --- Play Throw Candle Sound ---
        const soundManager = this.registry.get('soundManager');
        if (soundManager) {
            soundManager.playSound('throwCandleSound', { volume: 0.3 });
        } else {
            console.warn('SceneTwo: SoundManager not found. Cannot play throwCandleSound.');
        }
        // --- End Sound ---

        // --- Spawn position: approximate Do Kwon's chest (a bit above center) ---
        const spawnX = this.doKwonMonster.x;
        const chestOffsetY = this.doKwonMonster.displayHeight * 0.6; // 60% up from bottom
        const spawnY = this.doKwonMonster.y - chestOffsetY;

        // Choose random candle frame (size)
        const candleFrames = ['big-candle.png', 'mid1-candle.png', 'mid2-candle.png', 'small-candle.png'];
        const selectedFrame = Phaser.Math.RND.pick(candleFrames);

        // --- Revised Arc Logic ---
        const targetX = this.player.x;
        const horizontalDistance = targetX - spawnX;

        // Base horizontal speed (adjust as needed, clamp to prevent extreme speeds)
        let velX = Phaser.Math.Clamp(horizontalDistance * 0.9, -300, 300);

        // Add slight randomness to horizontal speed
        velX += Phaser.Math.Between(-60, 60);

        // *** Apply the accuracy factor to the horizontal velocity ***
        velX *= this.doKwonAccuracyFactor;

        // Set a consistent initial upward velocity (adjust negative value for arc height)
        const initialUpwardVelocity = Phaser.Math.Between(-450, -650); // Stronger negative Y is higher arc
        // --- End Revised Arc Logic ---

        // Get / create candle sprite from pool
        const candle = this.redCandleGroup.get(spawnX, spawnY, 'red-candles_atlas', selectedFrame);

        if (candle) {
            candle.setActive(true).setVisible(true);
            candle.setOrigin(0.5, 0.5);
            candle.setCollideWorldBounds(false); // Allow candles to go off-screen if needed before falling

            // Scale candles much smaller (approx 20-30% of original) with slight variation
            const scale = Phaser.Math.FloatBetween(0.18, 0.32);
            candle.setScale(scale);

            // --- Set circular physics body for better rotation handling ---
            // Arcade Physics AABB (Axis-Aligned Bounding Box) bodies do not rotate with the sprite.
            // A circular body provides a more consistent collision shape for a rotating object.
            // We base the radius on the candle's UN SCALED frame width.
            // Phaser will then scale the circular body along with the sprite,
            // ensuring it's centered and sized correctly relative to the visual sprite.
            const unscaledRadius = candle.frame.width * 0.6; // Radius is 60% of unscaled frame width
            candle.body.setCircle(unscaledRadius);
            // For a sprite with origin (0.5, 0.5), setCircle(unscaledRadius) correctly centers
            // the circular physics body on the sprite's origin before scaling.

            // Give the candle some spin
            const spinSpeed = Phaser.Math.Between(-180, 180); // degrees per second
            candle.body.setAngularVelocity(spinSpeed);

            // Apply the calculated velocities for the arc
            candle.body.setVelocity(velX, initialUpwardVelocity);

            // Ensure gravity is enabled for the candle (it should be from the group, but double-check)
            if (!candle.body.allowGravity) {
                candle.body.setAllowGravity(true);
                // Use group gravity value if available, otherwise default
                candle.body.setGravityY(this.redCandleGroup.gravityY || 600);
            }

            // --- Decrease accuracy factor for the next shot --- 
            this.doKwonAccuracyFactor = Math.max(this.doKwonMinAccuracyFactor, this.doKwonAccuracyFactor - this.doKwonAccuracyDecrease);
            // Optional log to see the factor change
            // console.log("Accuracy factor:", this.doKwonAccuracyFactor.toFixed(3)); 
        }
    }

    handleCandleGroundCollision(candle, groundTile) {
        // console.log("Candle hit ground tile:", groundTile.x);
        if (candle && candle.active) {
            candle.destroy(); // Remove the candle
        }
        if (groundTile && groundTile.active) {
            // const dust = this.add.particles(...);
            // dust.explode();

            // --- Prevent destroying ground under Do Kwon ---
            let canDestroy = true;
            if (this.doKwonMonster && this.doKwonMonster.active) {
                const doKwonBounds = this.doKwonMonster.getBounds();
                // Check if the ground tile overlaps horizontally with Do Kwon
                if (Phaser.Geom.Intersects.RectangleToRectangle(groundTile.getBounds(), doKwonBounds)) {
                   // More precise check: Is the tile *directly* under his feet?
                   // Calculate tile X range Do Kwon covers
                   const dkLeftEdge = doKwonBounds.left;
                   const dkRightEdge = doKwonBounds.right;
                   const tileLeftEdge = groundTile.x - groundTile.width / 2;
                   const tileRightEdge = groundTile.x + groundTile.width / 2;

                   // Check for horizontal overlap
                   if (Math.max(dkLeftEdge, tileLeftEdge) < Math.min(dkRightEdge, tileRightEdge)) {
                       console.log(`Candle hit ground under Do Kwon (${groundTile.x.toFixed(0)}), preventing destruction.`);
                       canDestroy = false;
                   }
                } 
            }

            if (canDestroy) {
                groundTile.destroy(); // Remove the ground tile if it's safe
            } else {
                 // Optional: Add a different effect like a spark if destruction is prevented
            }
        }
    }

    // --- Player hit by red candle ---
    handlePlayerCandleCollision(player, candle) {
        if (!player || !candle || !candle.active) return;
        // Prevent repeated hits
        if (player.isHit) return;
        player.isHit = true;
        // Increment global hit counter
        this.registry.set('playerHits', (this.registry.get('playerHits') || 0) + 1);

        // Camera shake
        this.cameras.main.shake(120, 0.01);
        // Tint player red
        player.setTint(0xff0000);
        // Knockback: push player away from candle (left or right depending on relative position)
        const knockbackX = (player.x < candle.x) ? -300 : 300; // Increased from -200 : 200
        const knockbackY = -180; // Increased upward knockback from -120
        player.setVelocity(knockbackX, knockbackY);
        // Fade tint after short delay
        this.time.delayedCall(400, () => {
            player.clearTint();
            player.isHit = false;
        });
        // Optionally destroy the candle on hit
        candle.destroy();
    }

    // --- Loan Repayment Event --- Triggered near tile 45
    triggerLoanRepaymentEvent() {
        if (this.loanRepaymentTriggered) return; // Should be redundant due to check in update, but safe

        this.loanRepaymentTriggered = true;
        console.log("SceneTwo: Triggering loan repayment event.");

        // 0. Play Aave Repay Sound
        const soundManager = this.registry.get('soundManager');
        if (soundManager) {
            soundManager.playSound('aaveRepaySound', { volume: 0.7 }); // Adjust volume as needed
        } else {
            console.warn('SceneTwo: SoundManager not found. Cannot play aave repay sound.');
        }

        // 1. Camera Flash (Red)
        this.cameras.main.flash(500, 255, 0, 0); // 500ms duration, red color

        // 2. Display Text
        const repaymentText = this.add.text(
            this.scale.width / 2, 
            this.scale.height / 3, 
            'You sell most of your eth to avoid getting liquidated in the AAVE loan!', // Changed text
            {
                fontSize: '28px',
                fill: '#ffdddd', // Light red/pink text
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: { x: 10, y: 5 },
                align: 'center',
                wordWrap: { width: this.scale.width * 0.8 }
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(100); // Keep on top

        // Remove text after a delay
        this.time.delayedCall(6000, () => { // Increased duration to 6000ms
            if (repaymentText) repaymentText.destroy();
        });

        // 3. Counter Tweens
        const ethToGain = 163; // ETH gain is fixed at 163
        const currentEthValue = this.ethCounterValue.value;

        // Aave Tween (Decrease to 0)
        this.tweens.add({
            targets: this.aaveCounterValue,
            value: 0, // Target value is now 0
            duration: 2000, // 2 seconds
            ease: 'Linear',
            onUpdate: () => {
                this.aaveCounterText.setText(`Aave: ${Math.floor(this.aaveCounterValue.value)}`);
            },
            onComplete: () => {
                this.aaveCounterValue.value = 0; // Ensure final value is 0
                this.aaveCounterText.setText(`Aave: ${this.aaveCounterValue.value}`);
                this.aaveCounterText.setVisible(false);
                console.log("SceneTwo: Aave counter reached 0 and hidden.");
            }
        });

        // ETH Tween (Increase by 163)
        this.tweens.add({
            targets: this.ethCounterValue,
            value: currentEthValue + ethToGain,
            duration: 2000, // Match duration
            ease: 'Linear',
            onUpdate: () => {
                this.ethCounterText.setText(`ETH: ${Math.floor(this.ethCounterValue.value)}`);
            },
            onComplete: () => {
                // Ensure final value is exact
                this.ethCounterValue.value = currentEthValue + ethToGain;
                 this.ethCounterText.setText(`ETH: ${Math.floor(this.ethCounterValue.value)}`);
                 console.log("SceneTwo: ETH counter finished increasing.");
            }
        });

    }

    // --- NEW: Handle Player Collision with Wall ---
    handlePlayerWallCollision(player, wallTile) {
        console.log("Player hit wall tile at:", wallTile.x, wallTile.y);

        // Create flying brick parts
        const numBrickParts = Phaser.Math.Between(3, 5); // Create 3 to 5 brick parts
        for (let i = 0; i < numBrickParts; i++) {
            const brickPart = this.brickDebrisGroup.create(wallTile.x, wallTile.y, 'brick-part');
            if (brickPart) { // Check if create was successful (within group limits etc.)
                brickPart.setScale(Phaser.Math.FloatBetween(0.3, 0.7)); // Random scale
                // Velocity is set by group config, but we can add some randomness or ensure it's reset
                brickPart.setVelocity(
                    Phaser.Math.Between(-200, 200), // Random X velocity
                    Phaser.Math.Between(-350, -150) // Strong upward Y velocity
                );
                brickPart.setAngularVelocity(Phaser.Math.Between(-360, 360)); // Random spin

                // Set a lifespan for the brick parts
                this.time.delayedCall(Phaser.Math.Between(1000, 2000), () => {
                    if (brickPart.active) {
                        brickPart.destroy();
                    }
                });
            }
        }

        wallTile.destroy(); // Destroy the hit wall tile
    }
    // --- End Handle Player Collision with Wall ---

    update(time, delta) {
        // console.log("SceneTwo: update");
        // Update the player
        if (this.player) {
            this.player.update(time, delta);
        }

        // --- Update Tax Monster (if it exists) ---
        if (this.taxMonster) {
            this.taxMonster.update(time, delta);
        }
        // --- End Tax Monster Update ---

        // --- Update Enemy Manager ---
        if (this.enemyManager) {
            this.enemyManager.update(time, delta);
        }

        // --- Tax Monster Movement & Stopping ---
        if (this.taxMonster && !this.isTaxMonsterStopped) {
            const stopTileIndex = 72; // Changed from 70 to 72
            const stopBuffer = 10; // Small buffer before the tile center
            const monsterStopX = (stopTileIndex * this.groundTileSize) + (this.groundTileSize / 2) - (this.taxMonster.width / 2) - stopBuffer;

            if (this.taxMonster.x >= monsterStopX) {
                console.log(`SceneTwo: Tax monster stopping near tile ${stopTileIndex}.`);
                this.taxMonster.setVelocityX(0);
                this.isTaxMonsterStopped = true;
            } else {
                // Keep moving if not stopped
                const monsterSpeed = 180; // Faster than SceneOne's max speed (120)
                this.taxMonster.setVelocityX(monsterSpeed);
            }
        }

        // --- Dollar Value Decrease Over Time (Linked to Monster Progress) ---
        if (this.taxMonster && !this.isTaxMonsterStopped) {
            // Use the initial value passed from SceneOne as the starting point
            // Ensure initialCounterData is loaded before accessing it
            const startValue = this.initialCounterData?.dollars || 0;
            const endValue = 300000; // Target value by tile 70 (this might need adjustment if monster stops later)
            const totalDecrease = Math.max(0, startValue - endValue); // Prevent negative decrease

            const monsterStartX = -this.taxMonster.width; // Where the monster initially spawns
            const stopTileIndex = 72; // Adjusted to match monster's new stop position
            const stopBuffer = 10;
            const monsterStopX = (stopTileIndex * this.groundTileSize) + (this.groundTileSize / 2) - (this.taxMonster.width / 2) - stopBuffer;
            const monsterTravelDistance = monsterStopX - monsterStartX;

            if (monsterTravelDistance > 0 && startValue > endValue) { // Avoid division by zero and ensure decrease happens
                const currentMonsterTravel = Math.max(0, this.taxMonster.x - monsterStartX);
                const progress = Phaser.Math.Clamp(currentMonsterTravel / monsterTravelDistance, 0, 1);
                const currentDecrease = totalDecrease * progress;
                const newCounterValue = startValue - currentDecrease;

                // Update the counter value, ensuring it doesn't go below the target endValue during this phase
                this.counterValue.value = Math.max(endValue, newCounterValue);
                this.counterText.setText(`$: ${Math.floor(this.counterValue.value).toLocaleString()}`);
            }
        } else if (this.isTaxMonsterStopped && this.counterValue.value <= 300000) {
            // If monster stopped and value is already at or below target, ensure it stays at 300k if needed
            // This prevents it snapping back up if the calculation overshoot slightly just as it stops
            if (this.counterValue.value < 300000) {
                 this.counterValue.value = 300000;
                 this.counterText.setText(`$: ${Math.floor(this.counterValue.value).toLocaleString()}`);
            }
        }
        // --- End Dollar Value Decrease ---

        // --- Check for Do Kwon Spawn Trigger ---
        if (!this.isDoKwonSpawned && this.player) {
            const playerTileIndex = Math.floor(this.player.x / this.groundTileSize);
            const triggerStartTile = 70;
            const triggerEndTile = 80;

            if (playerTileIndex >= triggerStartTile && playerTileIndex <= triggerEndTile) {
                this.spawnDoKwon();
            }
        }
        // --- End Do Kwon Spawn Trigger --- 

        // --- Do Kwon Movement Update ---
        if (this.doKwonMonster && this.doKwonMonster.active && !this.doKwonMonster.body.allowGravity) {
            if (this.doKwonMonster.x <= this.doKwonMoveBounds.left) {
                this.doKwonMoveDirection = 1; // Move right
                this.doKwonMonster.setVelocityX(this.doKwonMoveSpeed * this.doKwonMoveDirection);
            } else if (this.doKwonMonster.x >= this.doKwonMoveBounds.right) {
                this.doKwonMoveDirection = -1; // Move left
                this.doKwonMonster.setVelocityX(this.doKwonMoveSpeed * this.doKwonMoveDirection);
            }
            // Ensure velocity stays constant in case physics engine changes it
             this.doKwonMonster.setVelocityX(this.doKwonMoveSpeed * this.doKwonMoveDirection);

            // --- Animate Do Kwon based on movement direction ---
            if (this.doKwonMoveDirection > 0) {
                this.doKwonMonster.anims.play('do-kwon_right', true);
            } else if (this.doKwonMoveDirection < 0) {
                this.doKwonMonster.anims.play('do-kwon_left', true);
            }
        }
        // --- End Do Kwon Movement --- 

        // --- Candle Cleanup ---
        if (this.redCandleGroup) {
            const worldHeight = this.physics.world.bounds.height;
            this.redCandleGroup.children.each(candle => {
                if (candle && candle.y > worldHeight + candle.height) { 
                    // console.log("Destroying off-screen candle");
                    candle.destroy();
                }
            });
        }
        // --- End Candle Cleanup ---

        // --- Brick Debris Cleanup (Off-screen) ---
        if (this.brickDebrisGroup) {
            this.brickDebrisGroup.children.each(brick => {
                if (brick && brick.y > this.physics.world.bounds.height + brick.height) {
                    // console.log("Destroying off-screen brick debris");
                    brick.destroy();
                }
            });
        }
        // --- End Brick Debris Cleanup ---

        // --- Player Falling Check (toggleable) ---
        const FALL_SCENE_ENABLED = true ; // TEMP: set to false to disable SceneThree transition on fall

        if (FALL_SCENE_ENABLED && this.player && this.player.active && !this.isPlayerFalling) {
            const worldHeight = this.physics.world.bounds.height;
            const FALL_MARGIN_PX = 20; // how far below ground line counts as true fall
            const groundTopY = worldHeight - this.groundTileSize;
            const offGround = !this.player.body.onFloor();
            const belowLine = this.player.body.bottom > groundTopY + FALL_MARGIN_PX;

            if (offGround && belowLine) {
                console.log("Player fell into a hole! Transitioning to Falling.");
                this.isPlayerFalling = false; // Prevent multiple triggers

                // Stop ongoing actions
                if (this.doKwonShootTimer) this.doKwonShootTimer.remove();
                if (this.enemyManager) this.enemyManager.stopSpawningAgents();
                this.player.disableMovement(); // Optional: Stop player control
                this.player.setVelocity(0, 0); // Stop movement
                this.player.body.setAllowGravity(false); // Stop falling further? 

                // Fade out music before transitioning
                const musicManager = this.registry.get('musicManager');
                if (musicManager) {
                    musicManager.fadeOutCurrentTrack(800); // 800ms fade
                }

                // Optional: Fade out player or screen
                // this.cameras.main.fadeOut(1000, 0, 0, 0);
                // this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                //     // Start next scene after fade
                //     this.scene.start('SceneThree', { /* Pass data if needed */ });
                // });

                // --- Start Next Scene (Pass Counter Data) --- 
                // For now, just transition immediately
                const counterData = {
                    dollars: this.counterValue.value,
                    eth: this.ethCounterValue.value,
                    aave: this.aaveCounterValue.value,
                    hits: this.registry.get('playerHits')
                };
                console.log("Starting Falling with data:", counterData);
                // Play.fun: level 2 complete bonus
                awardPoints(100);
                console.log(`SceneTwo: Before transition. scene.time.now: ${this.time.now}, game.getTime(): ${this.game.getTime()}, game.loop.now: ${this.sys.game.loop.now}`);
                this.scene.start('Falling', counterData);
            }
        }
        // --- End Falling Logic ---

        // --- Loan Repayment Event ---
        if (this.player && this.player.x >= 45 * this.groundTileSize) {
            this.triggerLoanRepaymentEvent();
        }
        // --- End Loan Repayment Event ---
    }
}

// Make class available (if using modules later)
// export default SceneTwo; 