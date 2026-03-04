class SceneFour extends Phaser.Scene {
    constructor() {
        super({ key: 'SceneFour' });
        this.player = null;
        this.riverMask = null;
        this.waterFrames = [];
        this.waterAnimTimer = null;
        this.landFrames = [];
        this.landAnimTimer = null;
        this.tubeMonster = null;

        // Data from SceneThree
        this.playerMoney = 0;
        this.playerETH = 0;
        this.taxesOwed = 0;

        // Easily tweak how far above the bottom the end-of-river sign sits (in pixels)
        this.END_SIGN_OFFSET_Y = 0; // ← edit this value to move sign up/down

        // Scene specific constants
        this.PLAYER_SCALE = 0.6; 
        this.MONSTER_SCALE = 0.2; 
        this.MONSTER_SPEED = 50;

        this.autoProceedTimer = null; // Added for auto-proceed
        this.isTransitioning = false; // Used to prevent multiple transitions
    }

    init(data) {
        console.log("SceneFour init received data:", data);
        this.playerMoney = data.dollars || 0;
        this.playerETH = data.eth || 0;
        this.taxesOwed = data.taxesOwed || 0;
        // Log to confirm values are received
        console.log(`SceneFour: Money: ${this.playerMoney}, ETH: ${this.playerETH}, Taxes: ${this.taxesOwed}`);
    }

    preload() {
        // Load negotiate level assets
        const base = 'assets/images/negotiate/';
        this.load.image('neg_bg_land',   base + 'MAIN-land.png');
        this.load.image('neg_bg_land1',  base + 'MAIN-land1.png');
        this.load.image('neg_water1',    base + 'water1.png');
        this.load.image('neg_water2',    base + 'water2.png');
        this.load.image('neg_end_sign',  base + 'end-sign.png');
        this.load.image('neg_arrow',     base + 'negotiate-arrow.png');

        // Collision mask – white for water, black for land
        this.load.image('neg_water_mask', base + 'white-water.png');

        // Player sprite specific to this scene
        this.load.atlas('player_inner_tube',
                       'assets/spritesheets/player/player-inner-tube.png',
                       'assets/spritesheets/player/player-inner-tube.json');

        // Log sprite
        this.load.atlas('logs',
                       'assets/spritesheets/logs/logs.png',
                       'assets/spritesheets/logs/logs.json');

        // Tube Monster sprite
        this.load.atlas('tube_monster_atlas',
                       'assets/spritesheets/tax-monster/tube-monster.png',
                       'assets/spritesheets/tax-monster/tube-monster.json');

        // --- Custom Sounds ---
        this.load.audio('success_sound', 'assets/sound/player/success.mp3');
    }

    create(data) {
        // --- Initialize music ---
        const musicManager = this.registry.get('musicManager');
        if (musicManager) {
            musicManager.play('sceneFourMusic', { loop: true, volume: 0.5 });
            console.log("SceneFour: Attempting to play 'sceneFourMusic'.");
        } else {
            console.warn('MusicManager not found in SceneFour. Cannot play music.');
        }
        // --- End music initialization ---

        const landTex = this.textures.get('neg_bg_land').getSourceImage();
        const worldWidth  = landTex.width;
        const worldHeight = landTex.height;

        // --- Add water background (two frames that swap visibility) ---
        const water1 = this.add.image(0, 0, 'neg_water1').setOrigin(0).setDepth(-3);
        const water2 = this.add.image(0, 0, 'neg_water2').setOrigin(0).setDepth(-3).setVisible(false);
        this.waterFrames = [water1, water2];

        // --- Add land overlay (banks) - now with two frames ---
        const land1 = this.add.image(0, 0, 'neg_bg_land').setOrigin(0).setDepth(-2);
        const land2 = this.add.image(0, 0, 'neg_bg_land1').setOrigin(0).setDepth(-2).setVisible(false);
        this.landFrames = [land1, land2];

        // --- End sign ---
        this.endSign = this.add.image(worldWidth / 2,
                                      worldHeight - this.END_SIGN_OFFSET_Y,
                                      'neg_end_sign')
                            .setOrigin(0.5, 1)
                            .setDepth(20);

        // --- River mask helper ---
        this.riverMask = new RiverMask(this, 'neg_water_mask');

        // --- Physics world bounds ---
        // DEBUGGING: Remove world bounds entirely
        // this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        console.log("DEBUGGING: World bounds removed entirely");

        // --- Player ---
        const startX = worldWidth / 2;
        const startY = 100;
        this.player = new TubePlayer(this, startX, startY, 'player_inner_tube', 'inner-tube.png');
        this.player.enableMovement();

        // --- Configure physics body using UNSCALED dimensions first ---
        const unscaledFrameWidth = this.player.frame.width;
        const unscaledFrameHeight = this.player.frame.height;

        // Calculate unscaled radius (e.g., 45% of unscaled frame width)
        const unscaledPlayerRadius = unscaledFrameWidth * 0.45;

        // Calculate unscaled offsets to center the circle within the unscaled frame
        let unscaledCircleOffsetX = (unscaledFrameWidth / 2) - unscaledPlayerRadius;
        let unscaledCircleOffsetY = (unscaledFrameHeight / 2) - unscaledPlayerRadius;

        // --- Nudge factors for fine-tuning (adjust these values as needed) ---
        const nudgeX = 50; // Positive moves right, negative moves left (unscaled pixels)
        const nudgeY = 50; // Positive moves down, negative moves up (unscaled pixels)

        unscaledCircleOffsetX += nudgeX;
        unscaledCircleOffsetY += nudgeY;

        // Set the body to be a circle using these (potentially nudged) unscaled dimensions.
        // This also sets the body's width & height to 2 * unscaledPlayerRadius.
        this.player.body.setCircle(unscaledPlayerRadius, unscaledCircleOffsetX, unscaledCircleOffsetY);

        // --- NOW apply scale ---
        // This will scale the sprite and its already-defined circular physics body.
        this.player.setScale(this.PLAYER_SCALE);
        
        // Store the final, SCALED radius for collision checks if needed elsewhere
        // After setScale, body.radius should be the scaled radius.
        this.player.collisionRadius = this.player.body.radius; 

        // Allow player to move beyond world bounds by disabling bottom collision check
        if (this.player.body) { // Ensure body exists before trying to set its properties
            // DEBUGGING: Don't set any world bound collisions
            this.player.body.setCollideWorldBounds(false);
        }

        // --- Camera (auto-scrolling) ---
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        // No follow initially; we will start drifting after showing intro text

        // Flag to start/stop autoscroll
        this.scrolling = false;

        // -----------------------------------------------------------------
        // Intro instructions (scales with viewport so they aren't tiny on large
        // backgrounds / high-DPI screens)
        // -----------------------------------------------------------------

        // Derive a modest UI scale from the current canvas width. 1280 → 1, 1920 → 1.5, etc.
        const uiScale = this.scale.width / 1280;

        const introStyle = {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: `${Math.round(28 * uiScale)}px`, // Reduced base font size from 35 to 28
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: Math.max(2, Math.round(4 * uiScale)),
            lineSpacing: Math.round(10 * uiScale), // Slightly reduced line spacing
            backgroundColor: 'rgba(50, 50, 50, 0.7)', // Added semi-transparent grey background
            padding: { x: Math.round(10 * uiScale), y: Math.round(8 * uiScale) } // Added padding for the background
        };

        const introTextContent = "It's time to negotiate!\nYou need 1,095,171 to pay your taxes.\nAvoid the low ball offers (logs)\nto reach a deal!! (another log)";
        const introText = this.add.text(
            this.cameras.main.midPoint.x,
            this.cameras.main.midPoint.y - 100 * uiScale,
            introTextContent, // New text content
            introStyle
        ).setOrigin(0.5)
         .setScrollFactor(0)
         .setDepth(1000);

        // New movement instructions
        const movementInstructionStyle = { // Can reuse or slightly modify introStyle
            fontFamily: '"Press Start 2P", monospace',
            fontSize: `${Math.round(22 * uiScale)}px`, // Slightly smaller font for secondary instruction
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: Math.max(2, Math.round(3 * uiScale)), // Slightly thinner stroke
            lineSpacing: Math.round(8 * uiScale),
            backgroundColor: 'rgba(50, 50, 50, 0.7)',
            padding: { x: Math.round(8 * uiScale), y: Math.round(6 * uiScale) }
        };
        const movementInstructionsText = this.add.text(
            introText.x, // Align with introText's x
            introText.y + introText.displayHeight / 2 + (20 * uiScale), // Position below introText
            "Use Arrow Keys or W/A/S/D to Steer!",
            movementInstructionStyle
        ).setOrigin(0.5)
         .setScrollFactor(0)
         .setDepth(1000);

        // Fade out instructions then start scrolling
        this.tweens.add({
            targets: [introText, movementInstructionsText], // Target both text objects
            alpha: 0,
            duration: 800,
            delay: 7000, // Increased from 5250ms
            onComplete: () => {
                introText.destroy();
                movementInstructionsText.destroy(); // Destroy new instructions as well
                this.scrolling = true;
            }
        });

        // Easily tweakable auto-scroll speed (pixels per second)
        this.SCROLL_SPEED = 60; // ← adjust to taste

        // Simple finish line detection
        this.endY = this.endSign.y - this.endSign.displayHeight; // player must pass under

        console.log('worldHeight', worldHeight, 'endSign.y', this.endSign.y, 'signHeight', this.endSign.displayHeight, 'computed endY', this.endY);

        // Track last good in-river position for solid collision
        this.lastGoodPos = { x: startX, y: startY };

        // --- Logs (obstacles & goal) ---
        // Configuration constants – tweak to taste
        this.LOG_SCALE       = 0.22;   // smaller logs
        this.LOG_PUSH_BACK_SPEED = 100; // how fast logs bounce back into river
        this.LOG_SPEED_Y     = -60;    // upstream movement (negative y)
        this.LOG_SPAWN_DELAY = 3000;   // ms between random log spawns (fewer logs)
        this.LOG_STEER_SPEED = 80;    // sideways speed logs use to steer around banks

        // Physics group to hold all log sprites
        this.logsGroup = this.physics.add.group();

        // Prepare list of frame names so we can pick random logs
        const allLogFrames = this.textures.get('logs').getFrameNames();
        this.GOLDEN_LOG_FRAME = '1100000.png'; // special frame that ends the level
        this.normalLogFrames = allLogFrames.filter(f => f !== this.GOLDEN_LOG_FRAME);

        this.collectedGolden = false; // track if player grabbed the goal log

        // Helper to fetch a random X that sits over water for a given Y
        this.getRandomRiverX = (y) => {
            const attempts = 40;
            for (let i = 0; i < attempts; i++) {
                const testX = Phaser.Math.Between(0, worldWidth);
                if (this.riverMask.inside(testX, y)) return testX;
            }
            // fallback to center
            return worldWidth / 2;
        };

        // Spawn the goal (golden) log near the river end
        const goldenY = worldHeight - 600; // placed near the very bottom of the river
        const goldenX = this.getRandomRiverX(goldenY);
        const goldenLog = this.logsGroup.create(goldenX, goldenY, 'logs', this.GOLDEN_LOG_FRAME);
        goldenLog.setScale(this.LOG_SCALE);
        goldenLog.setVelocity(0, this.LOG_SPEED_Y);
        goldenLog.setDepth(9);
        goldenLog.isGolden = true;

        // Keep golden log hidden until camera is near the end of level
        goldenLog.setVisible(false);
        goldenLog.body.enable = false;
        this.goldenLog = goldenLog;

        // New physics body setup for golden log
        const goldenFrame = goldenLog.frame;
        const goldenUnscaledW = goldenFrame.width;
        const goldenUnscaledH = goldenFrame.height;
        const goldenLogProportion = 0.45; // Body radius covers 90% of the smaller UN-SCALED dimension
        
        // Calculate unscaled RECTANGULAR body dimensions
        const gWidthProportion = 0.60; // Covers 60% of unscaled width
        const gHeightProportion = 0.90; // Covers 90% of unscaled height
        const gUnscaledBodyW = goldenUnscaledW * gWidthProportion;
        const gUnscaledBodyH = goldenUnscaledH * gHeightProportion;
        
        // Calculate base offset to center the UNSCALED RECTANGULAR body within the UNSCALED frame
        const gBaseOffsetX = (goldenUnscaledW - gUnscaledBodyW) / 2;
        const gBaseOffsetY = (goldenUnscaledH - gUnscaledBodyH) / 2;
        
        // Manual Adjustments based on UN-SCALED frame, if needed due to texture padding
        const gAdjustX = goldenUnscaledW * 0.15; // Example: Adjust right by 15% of UN-SCALED width
        const gAdjustY = goldenUnscaledH * 0.05; // Example: Adjust down by 5% of UN-SCALED height

        // Final UNSCALED offset including adjustments
        const gFinalOffsetX = gBaseOffsetX + gAdjustX;
        const gFinalOffsetY = gBaseOffsetY + gAdjustY;

        // Set the physics body using UNSCALED radius and offsets
        // Phaser will automatically scale this body based on goldenLog.scale
        // goldenLog.body.setCircle(gUnscaledRadius, gFinalOffsetX, gFinalOffsetY); // OLD Circle call
        // --- Set RECTANGULAR body --- 
        goldenLog.body.setSize(gUnscaledBodyW, gUnscaledBodyH);
        goldenLog.body.setOffset(gFinalOffsetX, gFinalOffsetY);
        console.log(`Golden Log Body (Unscaled Rect): w=${gUnscaledBodyW.toFixed(1)}, h=${gUnscaledBodyH.toFixed(1)}, off=(${gFinalOffsetX.toFixed(1)}, ${gFinalOffsetY.toFixed(1)})`);
        // --- End UNSCALED body setup ---

        goldenLog.collisionRadius = gUnscaledBodyW * goldenLog.scaleX; // Store SCALED radius if needed elsewhere
        goldenLog.lastGoodPos = { x: goldenX, y: goldenY };

        console.log('Spawned GOLDEN log at', goldenX, goldenY);

        // Periodically spawn ordinary logs further downstream (ahead of player)
        this.logsStopped = false;      // flag once ordinary logs stop
        this.goldenRevealed = false;   // flag after golden log becomes visible

        this.logSpawnEvent = this.time.addEvent({
            delay: this.LOG_SPAWN_DELAY,
            callback: () => {
                this.spawnRandomLog();
            },
            loop: true
        });

        // Collision detection between player and logs
        this.physics.add.overlap(this.player, this.logsGroup, this.onPlayerHitLog, null, this);

        // Pre-calculate scroll Y at which we stop ordinary log spawns
        const camH = this.cameras.main.height;
        this.STOP_SPAWN_SCROLL_Y = worldHeight - camH - 400; // 400px before bottom
        this.REVEAL_GOLDEN_SCROLL_Y = worldHeight - camH - 300; // point to reveal special log

        // --- Tube Monster --- 
        const monsterFrameName = '3BD45261-13C7-4317-8703-D6030AD5CB68.png';
        const monsterAtlasKey = 'tube_monster_atlas';
        const monsterSpawnInitialY = startY + 400; // startY is player's initial Y

        // Calculate the collision radius the monster WILL have after scaling.
        // This is needed to ensure its entire body spawns safely within the river.
        const unscaledMonsterFrame = this.textures.get(monsterAtlasKey).get(monsterFrameName);
        const unscaledMonsterFrameWidth = unscaledMonsterFrame.width;
        const finalScaledMonsterDisplayWidth = unscaledMonsterFrameWidth * this.MONSTER_SCALE;
        const expectedMonsterRadius = finalScaledMonsterDisplayWidth * 0.35; // Using the same proportion as later body setup

        let monsterSpawnX;
        const monsterSpawnY = monsterSpawnInitialY; // Y is fixed for the spawn attempt
        const maxSpawnAttempts = 50;
        let foundSafeSpawn = false;

        for (let i = 0; i < maxSpawnAttempts; i++) {
            // Ensure testX is far enough from edges to accommodate the radius
            const minX = Math.ceil(expectedMonsterRadius);
            const maxX = Math.floor(worldWidth - expectedMonsterRadius);
            if (minX >= maxX) { // Not enough space in the world for the monster
                console.warn(`SceneFour: World too narrow for monster radius ${expectedMonsterRadius}. Cannot find safe spawn X.`);
                monsterSpawnX = worldWidth / 2; // Default to center
                foundSafeSpawn = true; // Mark as found to avoid further warnings, though it might not be ideal
                break;
            }
            const testX = Phaser.Math.Between(minX, maxX);

            const samplePoints = [
                { x: testX, y: monsterSpawnY }, // Center
                { x: testX + expectedMonsterRadius, y: monsterSpawnY }, { x: testX - expectedMonsterRadius, y: monsterSpawnY }, // E, W
                { x: testX, y: monsterSpawnY + expectedMonsterRadius }, { x: testX, y: monsterSpawnY - expectedMonsterRadius }, // S, N
                { x: testX + expectedMonsterRadius * Math.SQRT1_2, y: monsterSpawnY + expectedMonsterRadius * Math.SQRT1_2 }, // SE
                { x: testX - expectedMonsterRadius * Math.SQRT1_2, y: monsterSpawnY + expectedMonsterRadius * Math.SQRT1_2 }, // SW
                { x: testX + expectedMonsterRadius * Math.SQRT1_2, y: monsterSpawnY - expectedMonsterRadius * Math.SQRT1_2 }, // NE
                { x: testX - expectedMonsterRadius * Math.SQRT1_2, y: monsterSpawnY - expectedMonsterRadius * Math.SQRT1_2 }  // NW
            ];

            if (samplePoints.every(p => this.riverMask.inside(p.x, p.y))) {
                monsterSpawnX = testX;
                foundSafeSpawn = true;
                break;
            }
        }

        if (!foundSafeSpawn) {
            console.warn(`SceneFour: Could not find a fully safe spawn X for monster at Y=${monsterSpawnY} with radius=${expectedMonsterRadius} after ${maxSpawnAttempts} attempts. Defaulting to world center X.`);
            monsterSpawnX = worldWidth / 2;
            // Check if even this fallback center is in water
            if (!this.riverMask.inside(monsterSpawnX, monsterSpawnY)) {
                 console.warn(`SceneFour: Monster fallback spawn point center (${monsterSpawnX}, ${monsterSpawnY}) is also outside water. Review river mask or monster size/spawn logic.`);
            }
        }

        this.tubeMonster = this.physics.add.sprite(monsterSpawnX, monsterSpawnY, monsterAtlasKey, monsterFrameName);
        // Note: setScale will be called AFTER physics body is defined using unscaled dimensions.
        this.tubeMonster.setDepth(10); // Same depth as player for now
        this.tubeMonster.isBouncing = false; // Initialize custom property for recoil

        // --- Configure monster physics body using UNSCALED dimensions (like player) ---
        // unscaledMonsterFrameWidth is available from the spawn logic above.
        // const unscaledMonsterFrame = this.textures.get(monsterAtlasKey).get(monsterFrameName); // Already done in spawn logic
        // const unscaledMonsterFrameWidth = unscaledMonsterFrame.width; // Already available from spawn logic
        const unscaledMonsterFrameHeight = this.tubeMonster.frame.height; // Get current unscaled frame height

        const unscaledMonsterRadiusProportion = 0.35; // Monster's specific radius proportion
        const unscaledMonsterRadius = unscaledMonsterFrameWidth * unscaledMonsterRadiusProportion;

        let unscaledMonsterCircleOffsetX = (unscaledMonsterFrameWidth / 2) - unscaledMonsterRadius;
        let unscaledMonsterCircleOffsetY = (unscaledMonsterFrameHeight / 2) - unscaledMonsterRadius;

        // --- Nudge factors for monster (adjust these values as needed) ---
        const monsterNudgeX = 0; // Positive moves right, negative moves left (unscaled pixels)
        const monsterNudgeY = 0; // Positive moves down, negative moves up (unscaled pixels)

        unscaledMonsterCircleOffsetX += monsterNudgeX;
        unscaledMonsterCircleOffsetY += monsterNudgeY;

        // Set the body to be a circle using these (potentially nudged) unscaled dimensions.
        this.tubeMonster.body.setCircle(unscaledMonsterRadius, unscaledMonsterCircleOffsetX, unscaledMonsterCircleOffsetY);

        // --- NOW apply scale to monster ---
        this.tubeMonster.setScale(this.MONSTER_SCALE);
        
        // Store the final, SCALED radius for collision checks and other logic
        this.tubeMonster.collisionRadius = this.tubeMonster.body.radius; 

        this.tubeMonster.lastGoodPos = { x: monsterSpawnX, y: monsterSpawnY };
        this.tubeMonster.setCollideWorldBounds(false); // Consistent with debug changes

        // Collision detection: player vs monster
        this.physics.add.collider(this.player, this.tubeMonster, this.onPlayerHitMonster, null, this);

        // Start the water animation
        this.waterAnimTimer = this.time.addEvent({
            delay: 500, // Animation speed in ms (half a second)
            callback: this.animateWater,
            callbackScope: this,
            loop: true
        });
        
        // Start the land animation at a slightly different interval
        this.landAnimTimer = this.time.addEvent({
            delay: 650, // Different timing from water for visual interest
            callback: this.animateLand,
            callbackScope: this,
            loop: true
        });

        // --- UI for Counters (including Taxes Owed) ---
        const commonUIStyle = { fontSize: '20px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4 };
        
        this.moneyTextS4 = this.add.text(20, 20, `Money: $${Math.floor(this.playerMoney).toLocaleString()}`, commonUIStyle)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(1001);

        this.ethTextS4 = this.add.text(20, 50, `ETH: ${Math.floor(this.playerETH).toLocaleString()}`, commonUIStyle)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(1001);
            
        this.taxesOwedTextS4 = this.add.text(20, 80, `Taxes Owed: $${Math.floor(this.taxesOwed).toLocaleString()}`, { ...commonUIStyle, fill: '#FF6347' /* Tomato Red */ })
            .setOrigin(0, 0).setScrollFactor(0).setDepth(1001).setVisible(this.taxesOwed > 0);

        console.log("SceneFour: UI counters created, Taxes Owed: " + this.taxesOwed);

        // --- Start Money Fluctuation Timer ---
        this.moneyFluctuationTimer = this.time.addEvent({
            delay: 500, // Adjust delay (ms) for fluctuation frequency
            callback: this.fluctuateMoney,
            callbackScope: this,
            loop: true
        });
        // --- End Money Fluctuation Timer ---
    }

    update(time, delta) {
        if (!this.player) return;

        // Move camera downward for autoscroll effect (only after intro)
        if (this.scrolling) {
            this.cameras.main.scrollY += this.SCROLL_SPEED * (delta / 1000);
        }
        // Optionally clamp so we don't scroll past the world bottom
        // Since we removed world bounds, use the texture height instead
        const maxScrollY = this.textures.get('neg_bg_land').getSourceImage().height - this.cameras.main.height;
        if (this.cameras.main.scrollY > maxScrollY) {
            this.cameras.main.scrollY = maxScrollY;
        }

        // --- Tube Monster Logic ---
        if (this.tubeMonster && this.tubeMonster.active) {
            // Chase player ONLY if not currently bouncing
            if (!this.tubeMonster.isBouncing && this.player && this.player.active) {
                const dirX = this.player.x - this.tubeMonster.x;
                const dirY = this.player.y - this.tubeMonster.y;
                const length = Math.hypot(dirX, dirY);

                if (length > 20) { // Keep a small distance
                    const velX = (dirX / length) * this.MONSTER_SPEED;
                    const velY = (dirY / length) * this.MONSTER_SPEED;
                    this.tubeMonster.setVelocity(velX, velY);
                } else {
                    this.tubeMonster.setVelocity(0, 0);
                }
            } else if (!this.tubeMonster.isBouncing) { // If not chasing (e.g. player inactive or monster just finished bouncing) and not actively bouncing, stop.
                 this.tubeMonster.setVelocity(0, 0);
            }

            const mRadius = this.tubeMonster.collisionRadius || 0;
            const mX = this.tubeMonster.x;
            const mY = this.tubeMonster.y;

            const monsterSamplePoints = [
                {x: mX,     y: mY},
                {x: mX + mRadius, y: mY},
                {x: mX - mRadius, y: mY},
                {x: mX,     y: mY + mRadius},
                {x: mX,     y: mY - mRadius},
                {x: mX + mRadius * Math.SQRT1_2, y: mY + mRadius * Math.SQRT1_2},  // SE
                {x: mX - mRadius * Math.SQRT1_2, y: mY + mRadius * Math.SQRT1_2},  // SW
                {x: mX + mRadius * Math.SQRT1_2, y: mY - mRadius * Math.SQRT1_2},  // NE
                {x: mX - mRadius * Math.SQRT1_2, y: mY - mRadius * Math.SQRT1_2}   // NW
            ];

            const monsterInRiver = monsterSamplePoints.every(p => this.riverMask.inside(p.x, p.y));

            if (monsterInRiver) {
                this.tubeMonster.lastGoodPos.x = mX;
                this.tubeMonster.lastGoodPos.y = mY;
            } else {
                // Monster is not in the river according to sample points.
                // To prevent vibration from conflicting setVelocity calls,
                // we temporarily disable the push-back velocity override.
                // The monster will now prioritize chasing. We can refine boundary behavior later.
                /* 
                const dx = this.tubeMonster.lastGoodPos.x - mX;
                const dy = this.tubeMonster.lastGoodPos.y - mY;
                const dist = Math.hypot(dx, dy);
                if (dist > 0) {
                    const PUSH_BACK_SPEED = 120; // Same as player
                    const vx = (dx / dist) * PUSH_BACK_SPEED;
                    const vy = (dy / dist) * PUSH_BACK_SPEED;
                    this.tubeMonster.setVelocity(vx, vy);
                }
                */
            }
            // Ensure monster doesn't go too far above the camera's top view if player is there
            const monsterVisibleTop = this.cameras.main.scrollY + 30;
             if (this.tubeMonster.y < monsterVisibleTop && this.player.y < monsterVisibleTop + 50) {
                 this.tubeMonster.y = monsterVisibleTop;
                 if (this.tubeMonster.body.velocity.y < 0) {
                     this.tubeMonster.body.velocity.y = 0;
                 }
             }       
        }

        // Keep player within the visible viewport – push down if they try to cross the top edge
        // But only if we haven't collected the golden log yet
        if (!this.collectedGolden) {
            const visibleTop = this.cameras.main.scrollY + 20; // 20-px margin
            if (this.player.y < visibleTop) {
                this.player.y = visibleTop;
                if (this.player.body.velocity.y < 0) {
                    // Nullify upward velocity so they don't fight the scroll indefinitely
                    this.player.body.velocity.y = 0;
                }
            }
        }

        // Enforce river bounds using mask (sample center + eight directions)
        const r = this.player.collisionRadius || 0;
        const px = this.player.x;
        const py = this.player.y;

        // List of sample points
        const samplePoints = [
            {x: px,     y: py},
            {x: px + r, y: py},
            {x: px - r, y: py},
            {x: px,     y: py + r},
            {x: px,     y: py - r},
            {x: px + r * Math.SQRT1_2, y: py + r * Math.SQRT1_2},  // SE
            {x: px - r * Math.SQRT1_2, y: py + r * Math.SQRT1_2},  // SW
            {x: px + r * Math.SQRT1_2, y: py - r * Math.SQRT1_2},  // NE
            {x: px - r * Math.SQRT1_2, y: py - r * Math.SQRT1_2}   // NW
        ];

        const inRiver = samplePoints.every(p => this.riverMask.inside(p.x, p.y));

        // If we're in river, remember this safe position
        if (inRiver) {
            this.lastGoodPos.x = px;
            this.lastGoodPos.y = py;
        }

        if (!inRiver) {
            // Gently push the player back toward the last safe position
            const dx = this.lastGoodPos.x - px;
            const dy = this.lastGoodPos.y - py;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                const PUSH_BACK_SPEED = 120;
                const vx = (dx / dist) * PUSH_BACK_SPEED;
                const vy = (dy / dist) * PUSH_BACK_SPEED;
                this.player.setVelocity(vx, vy);
            }
        }

        // Finish line check
        // Make the finish line check very lenient - if they've collected the gold log and gone significantly downward
        if (this.collectedGolden && (this.player.y > this.cameras.main.scrollY + this.cameras.main.height * 0.8)) {
            console.log("FINISHING LEVEL: Player y:", this.player.y, "Camera bottom:", this.cameras.main.scrollY + this.cameras.main.height);
            this.levelComplete();
        }

        // --- Logs bookkeeping ---
        this.logsGroup.children.iterate((log) => {
            if (!log) return;

            // Check if this is the golden log and it has been missed
            if (log === this.goldenLog && !this.collectedGolden && (log.y + log.displayHeight < this.cameras.main.scrollY - 100)) {
                console.log("Golden log missed, respawning...");
                const bottomSpawnY = this.cameras.main.scrollY + this.cameras.main.height + 100; // Spawn below current view
                const newX = this.getRandomRiverX(bottomSpawnY);
                log.setPosition(newX, bottomSpawnY);
                log.setVelocity(0, this.LOG_SPEED_Y); // Ensure it's moving up
                log.lastGoodPos = { x: newX, y: bottomSpawnY };
                log.setVisible(true); // Ensure it is visible
                log.body.enable = true; // Ensure its physics body is enabled
                // Apply glow effect
                if (log.preFX) {
                    log.preFX.setPadding(16); // Padding for the glow effect
                    log.preFX.addGlow(0xffff00, 2, 0, false); // Yellow glow, outerStrength=2
                }
                // Skip further processing for the golden log in this iteration after respawning
                return; 
            }

            // Destroy *other* (non-golden) logs that have floated past top of camera view
            if (log !== this.goldenLog && (log.y + log.displayHeight < this.cameras.main.scrollY - 100)) {
                log.destroy();
                return;
            }

            // Keep logs within river bounds (sample center + 4 directions)
            const r = log.collisionRadius || 0;
            const cx = log.x;
            const cy = log.y;
            const points = [
                { x: cx,     y: cy },
                { x: cx + r, y: cy },
                { x: cx - r, y: cy },
                { x: cx,     y: cy + r },
                { x: cx,     y: cy - r },
                { x: cx + r * Math.SQRT1_2, y: cy + r * Math.SQRT1_2 },
                { x: cx - r * Math.SQRT1_2, y: cy + r * Math.SQRT1_2 },
                { x: cx + r * Math.SQRT1_2, y: cy - r * Math.SQRT1_2 },
                { x: cx - r * Math.SQRT1_2, y: cy - r * Math.SQRT1_2 }
            ];
            const logInRiver = points.every(p => this.riverMask.inside(p.x, p.y));

            // Lookahead detection: anticipate upcoming land ahead of the log's movement
            const lookAheadDist = r * 2.5; // how far ahead to sample
            const aheadPoint = { x: cx, y: cy + this.LOG_SPEED_Y / Math.abs(this.LOG_SPEED_Y) * lookAheadDist };
            const aheadIsRiver = this.riverMask.inside(aheadPoint.x, aheadPoint.y);

            // Skip processing for hidden logs (golden not yet revealed)
            if (!log.visible) return; // skip hidden (golden) log until reveal

            if (!logInRiver || !aheadIsRiver) {
                // Steer the log sideways toward a random point that is inside the river at this Y.
                const targetY = aheadPoint.y;
                const targetX = this.getRandomRiverX(targetY);
                const dx = targetX - cx;
                const vx = Phaser.Math.Clamp(dx, -this.LOG_STEER_SPEED, this.LOG_STEER_SPEED);
                log.setVelocity(vx, this.LOG_SPEED_Y);
            } else {
                // Within the river – store safe position and gently damp sideways velocity
                log.lastGoodPos.x = cx;
                log.lastGoodPos.y = cy;
                log.setVelocity(log.body.velocity.x * 0.97, this.LOG_SPEED_Y);
            }

            // New physics body setup for logs
            const logFrame = log.frame;
            const logUnscaledW = logFrame.width;
            const logUnscaledH = logFrame.height;
            const logProportion = 0.45; // Body radius covers 90% of the smaller UN-SCALED dimension
            
            // Calculate unscaled RECTANGULAR body dimensions
            const widthProportion = 0.60; // Covers 60% of unscaled width
            const heightProportion = 0.90; // Covers 90% of unscaled height
            const unscaledBodyW = logUnscaledW * widthProportion;
            const unscaledBodyH = logUnscaledH * heightProportion;
            
            // Calculate base offset to center the UNSCALED RECTANGULAR body within the UNSCALED frame
            const baseOffsetX = (logUnscaledW - unscaledBodyW) / 2;
            const baseOffsetY = (logUnscaledH - unscaledBodyH) / 2;
            
            // Manual Adjustments based on UN-SCALED frame, if needed due to texture padding
            const adjustX = logUnscaledW * 0.15; // Example: Adjust right by 15% of UN-SCALED width
            const adjustY = logUnscaledH * 0.05; // Example: Adjust down by 5% of UN-SCALED height

            // Final UNSCALED offset including adjustments
            const finalOffsetX = baseOffsetX + adjustX;
            const finalOffsetY = baseOffsetY + adjustY;

            // Set the physics body using UNSCALED radius and offsets
            // Phaser will automatically scale this body based on log.scale
            // log.body.setCircle(unscaledRadius, finalOffsetX, finalOffsetY); // OLD Circle call
            // --- Set RECTANGULAR body --- 
            log.body.setSize(unscaledBodyW, unscaledBodyH);
            log.body.setOffset(finalOffsetX, finalOffsetY);
            // console.log(`Log Body (Unscaled Rect): w=${unscaledBodyW.toFixed(1)}, h=${unscaledBodyH.toFixed(1)}, off=(${finalOffsetX.toFixed(1)}, ${finalOffsetY.toFixed(1)})`); // Optional log
            // --- End UNSCALED body setup ---

            log.collisionRadius = unscaledBodyW * log.scaleX; // Store SCALED radius if needed elsewhere
        });

        // Stop spawning ordinary logs when near bottom of river
        if (!this.logsStopped && this.cameras.main.scrollY >= this.STOP_SPAWN_SCROLL_Y) {
            this.logsStopped = true;
            if (this.logSpawnEvent) {
                this.logSpawnEvent.remove();
            }
        }

        // Reveal the golden log shortly before the end
        if (!this.goldenRevealed && this.cameras.main.scrollY >= this.REVEAL_GOLDEN_SCROLL_Y) {
            this.goldenRevealed = true;
            if (this.goldenLog) {
                // Reposition golden log to spawn from just below the viewport
                const bottomSpawnY = this.cameras.main.scrollY + this.cameras.main.height + 100;
                const newX = this.getRandomRiverX(bottomSpawnY);
                this.goldenLog.setPosition(newX, bottomSpawnY);

                this.goldenLog.setVisible(true);
                this.goldenLog.body.enable = true;
                this.goldenLog.setVelocity(0, this.LOG_SPEED_Y);
                this.goldenLog.lastGoodPos = { x: newX, y: bottomSpawnY };
                // Apply glow effect
                if (this.goldenLog.preFX) {
                    this.goldenLog.preFX.setPadding(16); // Padding for the glow effect
                    this.goldenLog.preFX.addGlow(0xffff00, 2, 0, false); // Yellow glow, outerStrength=2
                }
            }
        }
    }

    // Spawn a random regular log a bit downstream (ahead) of the player
    spawnRandomLog() {
        if (!this.player || !this.normalLogFrames.length) return;

        // Place it just below the visible viewport so it drifts upward into view
        const bottomOfView = this.cameras.main.scrollY + this.cameras.main.height;
        let y = bottomOfView + Phaser.Math.Between(100, 400);

        console.log('Camera scrollY', this.cameras.main.scrollY, 'camera.height', this.cameras.main.height, 'bottomOfView', bottomOfView, 'calculated spawn y', y);

        // Allow logs to spawn freely; remove incorrect clamp that forced negative values

        const x = this.getRandomRiverX(y);
        const frame = Phaser.Utils.Array.GetRandom(this.normalLogFrames);
        const log = this.logsGroup.create(x, y, 'logs', frame);
        log.setScale(this.LOG_SCALE);
        log.setVelocity(0, this.LOG_SPEED_Y);
        log.setDepth(8);

        // New physics body setup for logs
        const logFrame = log.frame;
        const logUnscaledW = logFrame.width;
        const logUnscaledH = logFrame.height;
        const logProportion = 0.45; // Body radius covers 90% of the smaller UN-SCALED dimension
        
        // Calculate unscaled RECTANGULAR body dimensions
        const widthProportion = 0.60; // Covers 60% of unscaled width
        const heightProportion = 0.90; // Covers 90% of unscaled height
        const unscaledBodyW = logUnscaledW * widthProportion;
        const unscaledBodyH = logUnscaledH * heightProportion;
        
        // Calculate base offset to center the UNSCALED RECTANGULAR body within the UNSCALED frame
        const baseOffsetX = (logUnscaledW - unscaledBodyW) / 2;
        const baseOffsetY = (logUnscaledH - unscaledBodyH) / 2;
        
        // Manual Adjustments based on UN-SCALED frame, if needed due to texture padding
        const adjustX = logUnscaledW * 0.15; // Example: Adjust right by 15% of UN-SCALED width
        const adjustY = logUnscaledH * 0.05; // Example: Adjust down by 5% of UN-SCALED height

        // Final UNSCALED offset including adjustments
        const finalOffsetX = baseOffsetX + adjustX;
        const finalOffsetY = baseOffsetY + adjustY;

        // Set the physics body using UNSCALED radius and offsets
        // Phaser will automatically scale this body based on log.scale
        // log.body.setCircle(unscaledRadius, finalOffsetX, finalOffsetY); // OLD Circle call
        // --- Set RECTANGULAR body --- 
        log.body.setSize(unscaledBodyW, unscaledBodyH);
        log.body.setOffset(finalOffsetX, finalOffsetY);
        // console.log(`Log Body (Unscaled Rect): w=${unscaledBodyW.toFixed(1)}, h=${unscaledBodyH.toFixed(1)}, off=(${finalOffsetX.toFixed(1)}, ${finalOffsetY.toFixed(1)})`); // Optional log
        // --- End UNSCALED body setup ---

        log.collisionRadius = unscaledBodyW * log.scaleX; // Store SCALED radius if needed elsewhere
        log.lastGoodPos = { x, y };

        console.log('Spawned log', frame, 'at', x, y);
    }

    // Handle collisions between player and logs
    onPlayerHitLog(player, log) {
        // --- Player vs Log Collision ---
        if (this.isTransitioning) return; // No collisions during transition

        if (log.isGolden) {
            if (!this.collectedGolden) {
                this.collectedGolden = true;
                log.destroy(); // remove the golden log
                this.sound.play('success_sound', { volume: 0.2 }); // Play success sound with volume control

                // Update player money (example: add the value of the golden log)
                // The value of the golden log (1,100,000) is encoded in its frame name

                // Show congratulatory text instead of camera shake
                const msg = this.add.text(this.cameras.main.width / 2,
                                          this.cameras.main.height / 2,
                                          'GOOD JOB!',
                                          { fontFamily: 'Press Start 2P', fontSize: '32px', color: '#ffff66', stroke: '#000000', strokeThickness: 6 })
                                .setOrigin(0.5)
                                .setScrollFactor(0)
                                .setDepth(1000);
                this.tweens.add({ targets: msg, alpha: 0, duration: 1500, delay: 800, onComplete: () => msg.destroy() });

                // Sparkle particle burst (re-enabled)
                if (!this.textures.exists('sparkleParticle')) {
                    const g = this.add.graphics();
                    g.fillStyle(0xffff99, 1);
                    g.fillCircle(4, 4, 4);
                    g.generateTexture('sparkleParticle', 8, 8);
                    g.destroy();
                }

                const burstConfig = {
                    speed: { min: 30, max: 120 },
                    angle: { min: 0, max: 360 },
                    scale: { start: 1, end: 0 },
                    alpha: { start: 1, end: 0 },
                    lifespan: 800,
                    quantity: 25,
                    radial: true,
                    gravityY: 0,
                    blendMode: 'ADD'
                };

                const emitter = this.add.particles(log.x, log.y, 'sparkleParticle', burstConfig);
                emitter.setDepth(999);
                // Auto-destroy manager after particles finish
                this.time.delayedCall(900, () => emitter.destroy());

                // CRITICAL: completely disable world bounds after getting golden log
                // to ensure player can exit downward
                if (player.body) {
                    player.body.setCollideWorldBounds(false);
                }

                // Show guidance arrow for player to exit downwards
                this.showEndArrow();

                return;
            }
        }

        // --- Play Player Ow Sound for normal logs ---
        const soundManager = this.registry.get('soundManager');
        if (soundManager) {
            soundManager.playSound('playerOwSound', { volume: 0.2 });
        } else {
            console.warn('SceneFour: SoundManager not found. Cannot play player ow sound for log hit.');
        }
        // --- End Sound ---

        // Camera shake for normal logs only
        this.cameras.main.shake(120, 0.008);

        // Fade-out for normal logs when player bumps them
        log.body.enable = false; // disable further collisions
        this.tweens.add({
            targets: log,
            alpha: 0,
            duration: 400,
            ease: 'Linear',
            onComplete: () => log.destroy()
        });

        // Only apply damage effect if not already red
        if (!player.isHit) {
            player.isHit = true;
            // Increment global hit counter
            this.registry.set('playerHits', (this.registry.get('playerHits') || 0) + 1);
            player.setTint(0xff0000);
            this.time.delayedCall(400, () => {
                player.clearTint();
                player.isHit = false;
            });
        }
    }

    levelComplete() {
        if (this.isTransitioning) {
            console.log("SceneFour: LevelComplete called, but already transitioning.");
            return; // Prevent re-entry if already transitioning
        }
        this.isTransitioning = true; // Set flag to indicate transition has started
        console.log("SceneFour: levelComplete called, setting isTransitioning to true.");

        // Clear the auto-proceed timer if it exists and this function was called manually or by timer
        if (this.autoProceedTimer) {
            console.log("SceneFour: Clearing auto-proceed timer in levelComplete.");
            this.autoProceedTimer.remove();
            this.autoProceedTimer = null;
        }

        // Clean up timers
        if (this.waterAnimTimer) {
            this.waterAnimTimer.remove();
        }
        
        if (this.landAnimTimer) {
            this.landAnimTimer.remove();
        }
        
        // --- Fade out music before transitioning ---
        const musicManager = this.registry.get('musicManager');
        const fadeOutDuration = 800; // ms
        if (musicManager) {
            musicManager.fadeOutCurrentTrack(fadeOutDuration);
        }
        // --- End music fade out ---

        console.log('SceneFour: Transitioning to SceneFive with data:', {
            dollars: this.playerMoney,
            eth: this.playerETH,
            taxesOwed: this.taxesOwed
        });

        // Play.fun: level 4 complete bonus
        awardPoints(100);

        // Delay the scene transition to allow music to fade
        this.time.delayedCall(fadeOutDuration, () => {
            this.scene.start('InterstitialScene', {
                nextSceneKey: 'SceneFive',
                imageKey: 'interstitial5',
                sceneData: {
                    dollars: this.playerMoney,
                    eth: this.playerETH,
                    taxesOwed: this.taxesOwed,
                    hits: this.registry.get('playerHits')
                }
            });
        });
    }

    // Helper function attached once
    showEndArrow = () => {
        if (this.arrowShown) return;
        this.arrowShown = true;
        const arrow = this.add.image(this.cameras.main.width / 2,
                                   (this.cameras.main.height / 2) - 120,
                                   'neg_arrow')
                           .setOrigin(0.5)
                           .setScrollFactor(0)
                           .setDepth(1000)
                           .setScale(0.5);
        // gentle up-down tween to draw attention
        this.tweens.add({
            targets: arrow,
            y: arrow.y - 20,
            yoyo: true,
            repeat: -1,
            duration: 600,
            ease: 'Sine.easeInOut'
        });
        this.endArrow = arrow;

        // Start auto-proceed timer if not already transitioning
        if (!this.isTransitioning) {
            console.log("SceneFour: Starting auto-proceed timer.");
            this.autoProceedTimer = this.time.delayedCall(5000, this.levelComplete, [], this);
        }
    };

    // Method to alternate between water frames
    animateWater() {
        if (!this.waterFrames || this.waterFrames.length !== 2) return;
        
        // Toggle visibility
        this.waterFrames[0].setVisible(!this.waterFrames[0].visible);
        this.waterFrames[1].setVisible(!this.waterFrames[1].visible);
    }
    
    // Method to alternate between land frames
    animateLand() {
        if (!this.landFrames || this.landFrames.length !== 2) return;
        
        // Toggle visibility
        this.landFrames[0].setVisible(!this.landFrames[0].visible);
        this.landFrames[1].setVisible(!this.landFrames[1].visible);
    }

    onPlayerHitMonster(player, monster) {
        console.log("Player hit by Tube Monster!");

        // --- Play Player Ow Sound ---
        const soundManager = this.registry.get('soundManager');
        if (soundManager) {
            soundManager.playSound('playerOwSound', { volume: 0.2 });
        } else {
            console.warn('SceneFour: SoundManager not found. Cannot play player ow sound for monster hit.');
        }
        // --- End Sound ---

        this.cameras.main.shake(100, 0.007); // A bit of screen shake

        // Tint player red temporarily
        if (!player.isHit) { // Check if already hit to avoid overlapping tints/effects
            player.isHit = true;
            // Increment global hit counter
            this.registry.set('playerHits', (this.registry.get('playerHits') || 0) + 1);
            player.setTint(0xff0000);
            this.time.delayedCall(300, () => {
                player.clearTint();
                player.isHit = false;
            });
        }

        // --- Bounce-off Logic ---
        const BOUNCE_SPEED = 400; // Increased speed for a stronger "bumper boat" effect
        let dx = player.x - monster.x;
        let dy = player.y - monster.y;

        // Handle cases where they are at the exact same position to avoid division by zero
        if (dx === 0 && dy === 0) {
            // Apply a default small nudge, e.g., player moves right
            dx = 1;
        }

        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            const normDx = dx / dist;
            const normDy = dy / dist;

            player.setVelocity(normDx * BOUNCE_SPEED, normDy * BOUNCE_SPEED);
            monster.setVelocity(-normDx * BOUNCE_SPEED, -normDy * BOUNCE_SPEED);

            // Make monster recoil briefly
            if (monster && monster.active) {
                monster.isBouncing = true;
                this.time.delayedCall(300, () => { // Monster recoils for 300ms
                    if (monster && monster.active) { // Check if monster still exists
                        monster.isBouncing = false;
                    }
                }, [], this);
            }
        }
        // --- End Bounce-off Logic --
    }

    // --- NEW METHOD for Money Fluctuation ---
    fluctuateMoney() {
        const MIN_MONEY = 150000;
        const MAX_MONEY = 750000;
        const MAX_CHANGE_PER_TICK = 30000; // Max amount to change each time the timer fires

        // Calculate a random change amount
        const changeAmount = Phaser.Math.Between(-MAX_CHANGE_PER_TICK, MAX_CHANGE_PER_TICK);

        // Apply the change
        let newValue = this.playerMoney + changeAmount;

        // Clamp the value within the desired range
        newValue = Phaser.Math.Clamp(newValue, MIN_MONEY, MAX_MONEY);

        // Update the player's money
        this.playerMoney = newValue;

        // Update the display text (ensure moneyTextS4 exists)
        if (this.moneyTextS4) {
            this.moneyTextS4.setText(`Money: $${Math.floor(this.playerMoney).toLocaleString()}`);
        }
    }
    // --- END NEW METHOD ---
}

window.SceneFour = SceneFour; 