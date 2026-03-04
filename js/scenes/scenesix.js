class SceneSix extends Phaser.Scene {
    constructor() {
        super({ key: 'SceneSix' });
        this.player = null;
        this.cursors = null;
        this.keyW = null;
        this.keyA = null;
        this.keyS = null;
        this.keyD = null;
        this.playerSpeed = 300; // Pixels per second for player movement
        this.initialScrollSpeed = 50; // Store initial scroll speed
        this.scrollSpeed = this.initialScrollSpeed;  // Pixels per second for camera scroll, can be changed

        // Data from SceneFive
        this.playerMoney = 0;
        this.playerETH = 0;
        this.taxesOwed = 0;

        // Backgrounds
        this.bgFarS6 = null;
        this.bgMidS6 = null;
        this.bgFrontS6 = null;

        this.projectiles = null; // For projectiles
        this.fireRate = 100; // Milliseconds between shots (10 shots per second)
        this.lastFired = 0;  // Timestamp of the last shot

        // this.irsAgent = null; // Replacing with a group
        this.irsAgentGroup = null; 

        // Properties for Type 2 Enemy (Dasher) Spawning
        this.dasherSpawnTimer = 0;
        this.dasherSpawnIntervalMin = 700; // Minimum ms between dasher spawns
        this.dasherSpawnIntervalMax = 2000; // Maximum ms between dasher spawns
        this.nextDasherSpawnTime = 0; // When the next dasher should spawn
        this.dashersSpawned = 0;
        this.maxDashersToSpawn = 10; // Total number of dashers for this wave
        this.allDashersSpawned = false; // Flag to indicate when all dashers are done
        this.dashersReactivated = false; // NEW: Flag to track if dashers have been reactivated

        // Properties for Type 1 Enemy (Sine Wave) Continuous Spawning
        this.enemyType1SpawnIntervalMin = 2500; // ms
        this.enemyType1SpawnIntervalMax = 5000; // ms
        this.nextEnemyType1SpawnTime = 0;

        // Properties for Type 3 Enemy (Teleporter) Spawning
        this.teleporterSpawnDelay = 3000; // ms delay after all dashers are spawned
        this.teleporterSpawnIntervalMin = 2500;
        this.teleporterSpawnIntervalMax = 4000;
        this.nextTeleporterSpawnTime = 0;
        this.teleportersSpawned = 0;
        this.maxTeleportersToSpawn = 5; // Total number of teleporters
        this.teleporterInitialVerticalState = 'top'; // To alternate starting position
        this.allTeleportersSpawned = false; // Added flag for clarity

        // Properties for Type 4 Enemy (Paired Large Enemies) Spawning
        this.enemyType4SpawnDelay = 3000;      // ms delay after all teleporters are spawned
        this.enemyType4SpawnInterval = 5000;   // ms between spawning pairs
        this.nextEnemyType4SpawnTime = 0;      // When the next pair should spawn
        this.enemyType4PairsSpawned = 0;
        this.maxEnemyType4PairsToSpawn = 3;    // Total number of pairs to spawn
        this.allEnemyType4Spawned = false;     // Flag to indicate when all Type 4 are done

        // Boss Properties
        this.finalBoss = null;
        this.bossSpawned = false;
        this.bossFightActive = false;
        this.bossScrollDuration = 3000; // Time to scroll a bit more (ms) before boss
        this.bossAppearTime = 0;        // Timestamp when boss should appear
        this.bossDefeated = false;      // Flag for when boss is defeated
        this.massiveExplosionTimer = null; // Add new property for the timer
        this.bossSoundTimer = null; // Timer for random boss sounds

        // ETH reduction properties for Scene Six
        this.ETH_TARGET_SCENE_SIX = 40;
        this.ETH_REDUCTION_PER_TICK_SCENE_SIX = 0.35; // ETH reduced every 500ms tick

        // --- Mobile Touch Dialog Navigation Helper ---
        this.prevTouchDirs = { left: false, right: false, up: false, down: false, action: false }; // Track previous touch states
    }

    init(data) {
        console.log("SceneSix init received data:", data);
        this.playerMoney = data.dollars || 0;
        this.playerETH = data.eth || 0;
        this.taxesOwed = data.taxesOwed || 0;
        console.log(`SceneSix: Money: ${this.playerMoney}, ETH: ${this.playerETH}, Taxes: ${this.taxesOwed}`);

        // Reset boss state and scroll speed for scene restarts
        this.bossSpawned = false;
        this.bossFightActive = false;
        this.bossAppearTime = 0;
        this.bossDefeated = false;
        this.scrollSpeed = this.initialScrollSpeed; 
        this.allDashersSpawned = false; // Reset this too for wave logic
        this.dashersReactivated = false;
        this.allTeleportersSpawned = false;
        this.allEnemyType4Spawned = false;
        this.dashersSpawned = 0;
        this.teleportersSpawned = 0;
        this.enemyType4PairsSpawned = 0;
        this.massiveExplosionTimer = null; // Add new property for the timer
        // Ensure bossSoundTimer is reset if scene restarts, though it's created on boss spawn
        if (this.bossSoundTimer) {
            this.bossSoundTimer.remove(false);
            this.bossSoundTimer = null;
        }

        // --- Player Movement & Firing with Touch Controls ---
        let touchMoveX = 0;
        let touchMoveY = 0;
        let touchFire = false;

        if (this.game && this.game.touchControls) {
            const dirs = this.game.touchControls.directions;
            if (dirs.left) touchMoveX = -1;
            if (dirs.right) touchMoveX = 1;
            if (dirs.up) touchMoveY = -1;
            if (dirs.down) touchMoveY = 1;
            // For firing, we want continuous fire if held, similar to mouse down
            if (dirs.action) {
                touchFire = true;
            }
            // Update prevTouchDirs for action, though continuous fire doesn't strictly need "just pressed"
            this.prevTouchDirs.action = dirs.action; 
        }
        // --- End Player Movement & Firing with Touch Controls ---
    }

    preload() {
        // All SceneSix assets are preloaded globally in BootScene.
    }

    create(data) {
        // --- Initialize music ---
        // const bootScene = this.scene.get('BootScene');
        // if (bootScene && bootScene.musicManager) {
        //     bootScene.musicManager.playMusic('SceneSix');
        // }
        const musicManager = this.registry.get('musicManager');
        if (musicManager) {
            musicManager.play('sceneSixMusic', { loop: true, volume: 0.5 }); // Assuming 0.5 volume and loop
            console.log("SceneSix: Attempting to play 'sceneSixMusic'.");
        } else {
            console.warn('MusicManager not found in SceneSix. Cannot play music.');
        }
        // --- End music initialization ---

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // Background (placeholder - dark blue for space)
        // this.cameras.main.setBackgroundColor('#222244'); // Replaced by parallax backgrounds

        // World bounds for scrolling content. Player is bound to the screen.
        const worldWidth = gameWidth * 4; // Example: 4 screens wide, adjust as needed
        this.physics.world.setBounds(0, 0, worldWidth, gameHeight);
        this.cameras.main.setBounds(0, 0, worldWidth, gameHeight);

        // --- Add Parallax Backgrounds ---
        this.bgFarS6 = this.add.image(0, 0, 's6_bg_far')
            .setOrigin(0, 0)
            .setDepth(-10)
            .setScrollFactor(0.2);
        this.bgMidS6 = this.add.image(0, 0, 's6_bg_mid')
            .setOrigin(0, 0)
            .setDepth(-9)
            .setScrollFactor(0.5);
        this.bgFrontS6 = this.add.image(0, 0, 's6_bg_front')
            .setOrigin(0, 0)
            .setDepth(-8)
            .setScrollFactor(0.8);

        // Player
        this.player = this.physics.add.sprite(150, gameHeight / 2, 'player_rocket', 'player-rocket1.png')
            // .setScrollFactor(0) // Removed: let player move in world space
            .setCollideWorldBounds(true) // Clamp to world bounds
            .setDepth(100);     // Ensure player is above background elements
        
        this.player.setScale(0.25); // Adjust scale as needed (original frames are quite large)

        // Player Animations: 1 -> 2 -> 3 -> 4 -> 5 -> 4 -> 3 -> 2 (loop)
        const animFrames = [];
        for (let i = 1; i <= 5; i++) animFrames.push({ key: 'player_rocket', frame: `player-rocket${i}.png` });
        for (let i = 4; i >= 2; i--) animFrames.push({ key: 'player_rocket', frame: `player-rocket${i}.png` });

        if (!this.anims.exists('rocket_thrust')) {
            this.anims.create({
                key: 'rocket_thrust',
                frames: animFrames,
                frameRate: 15, // Adjust for desired animation speed
                repeat: -1
            });
        }
        this.player.play('rocket_thrust');

        // Coin Animation (even if single frame, for consistency with projectile group)
        if (!this.anims.exists('coin_fire')) {
            this.anims.create({
                key: 'coin_fire',
                frames: [{ key: 'end_coin', frame: '468B48E6-09ED-4138-9DA1-4E24C598C5D9.png' }],
                frameRate: 10, // Not relevant for single frame but required
                repeat: 0      // No repeat for a single frame "animation"
            });
        }

        // Define IRS Agent Ship Animation (Type 1)
        if (!this.anims.exists('irs_ship_idle')) {
            this.anims.create({
                key: 'irs_ship_idle',
                frames: this.anims.generateFrameNames('irs_agent_ship1', {
                    prefix: 'irs-agent-ship1-',
                    start: 1,
                    end: 2,
                    suffix: '.png'
                }),
                frameRate: 3, 
                repeat: -1 
            });
        }

        // Define IRS Agent Ship Animation (Type 2)
        if (!this.anims.exists('irs_ship2_idle')) {
            this.anims.create({
                key: 'irs_ship2_idle',
                frames: [
                    { key: 'irs_agent_ship2', frame: 'irs-agent-ship2-1.png' },
                    { key: 'irs_agent_ship2', frame: 'irs-agent-ship2-2.png' },
                    { key: 'irs_agent_ship2', frame: 'irs-agent-ship2-3.png' }
                ],
                frameRate: 5, // Adjust for desired animation speed
                repeat: -1 // Loop indefinitely
            });
        }

        // Define IRS Agent Ship Animation (Type 3)
        if (!this.anims.exists('irs_ship3_idle')) {
            this.anims.create({
                key: 'irs_ship3_idle',
                frames: [
                    { key: 'irs_agent_ship3_atlas', frame: 'irs-agent-ship3-1.png' },
                    { key: 'irs_agent_ship3_atlas', frame: 'irs-agent-ship3-2.png' }
                ],
                frameRate: 2, // Slow animation for this large ship
                repeat: -1 
            });
        }

        // Define IRS Agent Ship Animation (Type 4 - New)
        if (!this.anims.exists('irs_ship4_idle')) {
            this.anims.create({
                key: 'irs_ship4_idle',
                frames: [
                    { key: 'irs_agent_ship4', frame: 'irs-agent-ship4-1.png' },
                    { key: 'irs_agent_ship4', frame: 'irs-agent-ship4-12png.png' }
                ],
                frameRate: 2, // Slow animation for this large ship, adjust as needed
                repeat: -1 
            });
        }

        // Define Standard Explosion Animation
        if (!this.anims.exists('standard_explosion')) {
            this.anims.create({
                key: 'standard_explosion',
                frames: [
                    { key: 'explosion_atlas', frame: 'explosion1.png' },
                    { key: 'explosion_atlas', frame: 'explosion2.png' },
                    { key: 'explosion_atlas', frame: 'explosion3.png' }
                ],
                frameRate: 15, // Adjust for desired animation speed
                hideOnComplete: false // EffectUtils handles destruction
            });
        }

        // Define Final Tax Monster Animation
        if (!this.anims.exists('tax_monster_idle')) {
            this.anims.create({
                key: 'tax_monster_idle',
                frames: [
                    { key: 'final_tax_monster_atlas', frame: 'final-tax-monster1.png' },
                    { key: 'final_tax_monster_atlas', frame: 'final-tax-monster2.png' },
                    { key: 'final_tax_monster_atlas', frame: 'final-tax-monster3.png' },
                    { key: 'final_tax_monster_atlas', frame: 'final-tax-monster4.png' },
                    { key: 'final_tax_monster_atlas', frame: 'final-tax-monster5.png' },
                    { key: 'final_tax_monster_atlas', frame: 'final-tax-monster6.png' }
                ],
                frameRate: 5, // Adjust for desired animation speed (e.g., 5-8 fps for 6 frames)
                repeat: -1
            });
        }

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        // Projectiles Group
        this.projectiles = this.physics.add.group({
            defaultKey: 'end_coin',
            defaultFrame: '468B48E6-09ED-4138-9DA1-4E24C598C5D9.png', // Corrected frame name
            maxSize: 50 // Adjust as needed
        });

        // Create the IRS Agent Enemy Group
        this.irsAgentGroup = this.physics.add.group();

        // Initialize Type 1 enemy continuous spawning
        this.nextEnemyType1SpawnTime = this.time.now + Phaser.Math.Between(this.enemyType1SpawnIntervalMin, this.enemyType1SpawnIntervalMax);

        // Initialize the timer for the first dasher spawn
        this.nextDasherSpawnTime = this.time.now + Phaser.Math.Between(this.dasherSpawnIntervalMin, this.dasherSpawnIntervalMax);
        this.dashersSpawned = 0; // Reset count in case scene restarts
        this.allDashersSpawned = false;
        this.dashersReactivated = false; // Initialize reactivation flag

        // Reset teleporter spawning state
        this.teleportersSpawned = 0;
        this.nextTeleporterSpawnTime = 0; // Will be set properly once dashers are done
        this.allTeleportersSpawned = false;

        // Reset Type 4 enemy spawning state
        this.enemyType4PairsSpawned = 0;
        this.nextEnemyType4SpawnTime = 0; // Will be set properly once teleporters are done
        this.allEnemyType4Spawned = false;

        // Reset boss state variables on create (also done in init, but good for clarity)
        this.bossSpawned = false;
        this.bossFightActive = false;
        this.bossAppearTime = 0;
        this.bossDefeated = false;
        this.scrollSpeed = this.initialScrollSpeed; // Ensure scroll speed is reset

        // Display financial info (optional, but good for consistency)
        const uiTextStyle = { fontSize: '20px', fill: '#ffffff', fontFamily: 'Monospace', stroke: '#000000', strokeThickness: 4 };
        this.moneyText = this.add.text(20, 20, `Money: $${this.playerMoney.toLocaleString()}`, uiTextStyle).setScrollFactor(0).setDepth(1000);
        this.ethText = this.add.text(20, 45, `ETH: ${this.playerETH.toLocaleString()}`, uiTextStyle).setScrollFactor(0).setDepth(1000);
        this.taxesOwedText = this.add.text(20, 70, `Taxes Owed: $${this.taxesOwed.toLocaleString()}`, { ...uiTextStyle, fill: '#FF6347' /* Tomato Red */ }).setScrollFactor(0).setDepth(1000).setVisible(this.taxesOwed > 0);

        // --- Start Money Fluctuation Timer ---
        this.moneyFluctuationTimer = this.time.addEvent({
            delay: 500, // Adjust delay (ms) for fluctuation frequency
            callback: this.fluctuateMoney,
            callbackScope: this,
            loop: true
        });
        // --- End Money Fluctuation Timer ---

        // Add collider between player projectiles and the IRS agent group
        this.physics.add.collider(this.projectiles, this.irsAgentGroup, (projectile, enemy) => {
            projectile.setActive(false).setVisible(false).destroy(); // Destroy projectile on hit

            // --- Play Enemy Hit Sound for specific multi-hit enemies ---
            if (enemy instanceof SceneSixEnemyType3 || 
                enemy instanceof SceneSixEnemyType4 || 
                enemy instanceof FinalTaxMonster) {
                
                if (enemy.health > 0) { // Only play if not the killing blow
                    const soundManager = this.registry.get('soundManager');
                    if (soundManager) {
                        soundManager.playSound('enemyHitSix', { volume: 0.2

                         }); // Adjust volume as needed
                    } else {
                        console.warn('SceneSix: SoundManager not found. Cannot play enemy hit sound.');
                    }
                }
            }
            // --- End Play Enemy Hit Sound ---

            if (enemy.takeHit) { // Check if enemy has takeHit method
                enemy.takeHit(); // Enemy handles its own hit reaction
            } else {
                enemy.destroy(); // Fallback if no takeHit method
            }
        }, null, this);

        // --- NEW: Collider between Player and IRS Agent Group ---
        this.physics.add.collider(this.player, this.irsAgentGroup, this.handlePlayerEnemyCollision, null, this);
        // --- END NEW ---
    }

    update(time, delta) {
        // --- Player Movement & Firing with Touch Controls ---
        let touchMoveX = 0;
        let touchMoveY = 0;
        let touchFire = false;

        if (this.game && this.game.touchControls) {
            const dirs = this.game.touchControls.directions;
            if (dirs.left) touchMoveX = -1;
            if (dirs.right) touchMoveX = 1;
            if (dirs.up) touchMoveY = -1;
            if (dirs.down) touchMoveY = 1;
            // For firing, we want continuous fire if held, similar to mouse down
            if (dirs.action) {
                touchFire = true;
            }
            // Update prevTouchDirs for action, though continuous fire doesn't strictly need "just pressed"
            this.prevTouchDirs.action = dirs.action; 
        }
        // --- End Player Movement & Firing with Touch Controls ---

        // Camera Scrolling (conditionally)
        if (!this.bossFightActive && !this.bossDefeated) {
            this.cameras.main.scrollX += this.scrollSpeed * (delta / 1000);
            // Prevent camera from scrolling beyond the world width if not in boss transition scroll
            if (this.bossAppearTime === 0) { // Only apply this hard stop if not in boss scroll phase
                const maxScrollX = this.physics.world.bounds.width - this.cameras.main.width;
                if (this.cameras.main.scrollX >= maxScrollX) {
                    this.cameras.main.scrollX = maxScrollX;
                }
            }
        } // Scrolling stops if bossFightActive or bossDefeated

        // --- Type 1 Enemy Continuous Spawning ---
        if (!this.bossDefeated && time > this.nextEnemyType1SpawnTime) {
            this.spawnEnemyType1();
            this.nextEnemyType1SpawnTime = time + Phaser.Math.Between(this.enemyType1SpawnIntervalMin, this.enemyType1SpawnIntervalMax);
        }

        // --- Dasher Spawning Logic ---
        if (this.bossFightActive && !this.bossDefeated) { // Continuous dasher spawning during boss fight
            if (time > this.nextDasherSpawnTime) {
                this.spawnDasherEnemy();
                this.nextDasherSpawnTime = time + Phaser.Math.Between(this.dasherSpawnIntervalMin, this.dasherSpawnIntervalMax);
            }
        } else if (!this.allDashersSpawned && this.dashersSpawned < this.maxDashersToSpawn && time > this.nextDasherSpawnTime && !this.bossFightActive && !this.bossDefeated) {
            this.spawnDasherEnemy();
            this.dashersSpawned++;
            if (this.dashersSpawned >= this.maxDashersToSpawn) {
                if (!this.dashersReactivated) { 
                    this.allDashersSpawned = true; 
                    this.nextTeleporterSpawnTime = time + this.teleporterSpawnDelay;
                    console.log("Initial Dasher wave complete. Scheduling Teleporters.");
                } else { 
                    this.allDashersSpawned = true; 
                    console.log("Reactivated Dasher wave complete.");
                }
            }
            if (!this.allDashersSpawned) { 
                 this.nextDasherSpawnTime = time + Phaser.Math.Between(this.dasherSpawnIntervalMin, this.dasherSpawnIntervalMax);
            }
        }

        // --- Teleporter Spawning Logic ---
        if (this.allDashersSpawned && !this.allTeleportersSpawned && this.teleportersSpawned < this.maxTeleportersToSpawn && time > this.nextTeleporterSpawnTime && !this.bossFightActive && !this.bossDefeated) {
            this.spawnTeleporterEnemy();
            this.teleportersSpawned++;
            if (this.teleportersSpawned >= this.maxTeleportersToSpawn) {
                this.allTeleportersSpawned = true;
                this.nextEnemyType4SpawnTime = time + this.enemyType4SpawnDelay;
            }
            if (!this.allTeleportersSpawned) { 
                this.nextTeleporterSpawnTime = time + Phaser.Math.Between(this.teleporterSpawnIntervalMin, this.teleporterSpawnIntervalMax);
            }
        }

        // --- Type 4 Enemy Spawning Logic ---
        if (this.allTeleportersSpawned && !this.allEnemyType4Spawned && this.enemyType4PairsSpawned < this.maxEnemyType4PairsToSpawn && time > this.nextEnemyType4SpawnTime && !this.bossFightActive && !this.bossDefeated) {
            this.spawnEnemyType4Pair();
            this.enemyType4PairsSpawned++;

            const midpointType4Spawn = Math.floor(this.maxEnemyType4PairsToSpawn / 2);
            if (this.maxEnemyType4PairsToSpawn >=2 && this.enemyType4PairsSpawned >= midpointType4Spawn && !this.dashersReactivated) {
                console.log("Reactivating Dasher spawning during Type 4 wave...");
                this.allDashersSpawned = false; 
                this.dashersSpawned = 0;       
                this.nextDasherSpawnTime = time + Phaser.Math.Between(this.dasherSpawnIntervalMin, this.dasherSpawnIntervalMax); 
                this.dashersReactivated = true; 
            }

            if (this.enemyType4PairsSpawned >= this.maxEnemyType4PairsToSpawn) {
                this.allEnemyType4Spawned = true;
                console.log("All Type 4 enemy pairs spawned! Preparing for boss.");
            }
            if (!this.allEnemyType4Spawned) { 
                this.nextEnemyType4SpawnTime = time + this.enemyType4SpawnInterval;
            }
        }

        // --- Boss Phase Transition Logic ---
        if (this.allEnemyType4Spawned && !this.bossSpawned && !this.bossFightActive && !this.bossDefeated) {
            if (this.bossAppearTime === 0) { // First time we hit this condition
                console.log("All Type 4 waves done. Starting scroll for boss reveal...");
                this.bossAppearTime = time + this.bossScrollDuration; // Set time for boss to appear after scroll
                // Ensure scrollSpeed is normal for this short scroll, if it was ever set to 0
                this.scrollSpeed = this.initialScrollSpeed; 
            }

            if (time >= this.bossAppearTime) {
                this.spawnFinalBoss(); // This method will set bossSpawned and bossFightActive
            }
        }

        // Player Movement
        let moveX = 0;
        let moveY = 0;
        const playerMoveSpeed = this.playerSpeed * (delta / 1000); // Speed adjusted for delta time

        if (this.keyA.isDown || this.cursors.left.isDown || touchMoveX < 0) {
            moveX = -playerMoveSpeed;
        } else if (this.keyD.isDown || this.cursors.right.isDown || touchMoveX > 0) {
            moveX = playerMoveSpeed;
        }

        if (this.keyW.isDown || this.cursors.up.isDown || touchMoveY < 0) {
            moveY = -playerMoveSpeed;
        } else if (this.keyS.isDown || this.cursors.down.isDown || touchMoveY > 0) {
            moveY = playerMoveSpeed;
        }

        this.player.x += moveX;
        this.player.y += moveY;

        // --- Prevent player from going off-screen to the left ---
        const playerHalfWidth = this.player.displayWidth / 2;
        if (this.player.x - playerHalfWidth < this.cameras.main.scrollX) {
            this.player.x = this.cameras.main.scrollX + playerHalfWidth;
        }
        // --- End: Prevent player from going off-screen to the left ---

        // Clamp player to world bounds (handled by setCollideWorldBounds)
        // No need to clamp to screen bounds

        // ------------------------------------------------------------------
        //  INPUT – Firing (desktop + mobile)  
        // ------------------------------------------------------------------
        const pointer = this.input.activePointer;

        // a) Desktop (mouse) → fire while main button held
        const mousePointerDown = pointer.isDown && (!pointer.pointerType || pointer.pointerType === 'mouse');

        // b) Mobile / touch “anywhere tap” – but IGNORE the joystick area so moving the
        //    analog stick doesn't also shoot.
        let touchPointerDownAllowed = false;
        const ptrIsTouch = pointer.isDown && (pointer.pointerType === 'touch' || pointer.pointerType === 'pen' || !pointer.pointerType);

        // Only honour generic touch-screen taps when *no* on-screen controls are present
        if (ptrIsTouch && (!this.game || !this.game.touchControls)) {
            touchPointerDownAllowed = true;
        }

        if ((mousePointerDown || touchFire || touchPointerDownAllowed) && time > this.lastFired) {
            let projectile = this.projectiles.get(this.player.x + this.player.width * 0.15, this.player.y + 15);

            if (projectile) {
                projectile.setActive(true);
                projectile.setVisible(true);
                projectile.setScale(0.03); // Made coins smaller
                projectile.play('coin_fire'); 
                projectile.body.velocity.x = 800; // Projectile speed
                projectile.body.allowGravity = false;

                // --- Play Coin Shoot Sound ---
                const soundManager = this.registry.get('soundManager');
                if (soundManager) {
                    soundManager.playSound('coinShoot', { volume: 0.03 }); // Adjust volume as needed
                } else {
                    console.warn('SceneSix: SoundManager not found. Cannot play coin shoot sound.');
                }
                // --- End Play Coin Shoot Sound ---

                this.lastFired = time + this.fireRate;
            }
        }

        // Projectile removal when out of bounds (right side of camera)
        this.projectiles.children.each(projectile => {
            if (projectile.active && projectile.x > this.cameras.main.scrollX + this.cameras.main.width + projectile.width) {
                projectile.setActive(false);
                projectile.setVisible(false);
                // Optionally, you can call projectile.destroy() if you don't want to reuse them
                // this.projectiles.remove(projectile, true, true); // This would destroy it
            }
        });

        // Update enemies in the group
        if (this.irsAgentGroup) {
            this.irsAgentGroup.getChildren().forEach(enemy => {
                if (enemy.active && enemy.update) {
                    enemy.update(time, delta);
                }
            });
        }
    }

    spawnDasherEnemy() {
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        const spawnX = this.cameras.main.scrollX + gameWidth + 100; // Spawn off-screen to the right
        // Spawn within the middle 80% of the screen height
        const spawnY = Phaser.Math.Between(gameHeight * 0.1, gameHeight * 0.9);

        const dasher = new SceneSixEnemyType2(this, spawnX, spawnY, 'irs_agent_ship2', 'irs-agent-ship2-1.png');
        this.irsAgentGroup.add(dasher); // Add to the same group for collision
    }

    spawnTeleporterEnemy() {
        const gameWidth = this.scale.width;
        // const gameHeight = this.scale.height; // Not directly needed for y as it snaps

        const spawnX = this.cameras.main.scrollX + gameWidth + 150; // Spawn a bit further to give it presence
        // The initial Y is not critical as the enemy snaps, but we pass something valid.
        const dummyY = this.scale.height / 2;

        const teleporter = new SceneSixEnemyType3(this, spawnX, dummyY, 'irs_agent_ship3_atlas', 'irs-agent-ship3-1.png', this.teleporterInitialVerticalState);
        this.irsAgentGroup.add(teleporter);

        // Alternate initial vertical state for the next teleporter
        this.teleporterInitialVerticalState = (this.teleporterInitialVerticalState === 'top') ? 'bottom' : 'top';
    }

    spawnEnemyType1() {
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const spawnX = this.cameras.main.scrollX + gameWidth + 100; // Off-screen right

        // Spawn Type 1 enemies in a variable Y position for more dynamic feel
        // Their own sine wave movement is relative to this initial Y.
        const spawnY = Phaser.Math.Between(gameHeight * 0.25, gameHeight * 0.75);

        const agent = new SceneSixEnemy(this, spawnX, spawnY, 'irs_agent_ship1', 'irs-agent-ship1-1.png');
        this.irsAgentGroup.add(agent);
    }

    spawnEnemyType4Pair() {
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        const spawnX = this.cameras.main.scrollX + gameWidth + 200; // Spawn further off-screen due to size
        const spawnYTop = gameHeight * 0.15;    // Position for the top enemy
        const spawnYBottom = gameHeight * 0.85; // Position for the bottom enemy

        // Asset keys (updated for irs_agent_ship4)
        const textureKey = 'irs_agent_ship4'; // Changed from irs_agent_ship3_atlas
        const frameKey = 'irs-agent-ship4-1.png'; // Changed from irs-agent-ship3-1.png

        const enemyTop = new SceneSixEnemyType4(this, spawnX, spawnYTop, textureKey, frameKey);
        this.irsAgentGroup.add(enemyTop);

        const enemyBottom = new SceneSixEnemyType4(this, spawnX, spawnYBottom, textureKey, frameKey);
        this.irsAgentGroup.add(enemyBottom);

        console.log(`Spawned EnemyType4 pair at X: ${spawnX.toFixed(0)}, YTop: ${spawnYTop.toFixed(0)}, YBottom: ${spawnYBottom.toFixed(0)}`);
    }

    spawnFinalBoss() {
        if (this.bossSpawned) return; // Already spawned

        console.log("Spawning Final Tax Monster!");
        const gameHeight = this.scale.height;
        // Position boss relative to the current camera view, ensuring it's on screen
        // Since scrolling stops, position him relative to the camera's final scrollX
        const spawnX = this.cameras.main.scrollX + this.cameras.main.width * 0.8; // Right side of screen
        const spawnY = gameHeight; // Uses origin (0.5, 1), so it's at the bottom edge of screen

        this.finalBoss = new FinalTaxMonster(this, spawnX, spawnY, 'final_tax_monster_atlas', 'final-tax-monster1.png');
        this.irsAgentGroup.add(this.finalBoss); // Add to group for collision handling

        this.bossSpawned = true;
        this.bossFightActive = true;
        this.scrollSpeed = 0; // Stop camera scrolling definitively

        // Lock the world and camera to the current view for the boss fight arena
        const currentScrollX = this.cameras.main.scrollX;
        const lockedWorldWidth = currentScrollX + this.cameras.main.width;
        this.physics.world.setBounds(0, 0, lockedWorldWidth, gameHeight);
        this.cameras.main.setBounds(currentScrollX, 0, this.cameras.main.width, gameHeight);
        // Also need to make sure player is constrained to this new camera view if they could fly out
        // Player's setCollideWorldBounds(true) should now respect these new world bounds.
        // We might need to adjust player position if they are outside the new bounds slightly.
        if (this.player.x < currentScrollX) {
            this.player.x = currentScrollX + (this.player.displayWidth / 2);
        }
        if (this.player.x > lockedWorldWidth) {
            this.player.x = lockedWorldWidth - (this.player.displayWidth / 2);
        }

        console.log(`Final boss spawned. Arena locked. World width: ${lockedWorldWidth}, Camera scrollX: ${currentScrollX}`);
        
        // Start continuous dasher spawning for the boss fight
        this.nextDasherSpawnTime = this.time.now + Phaser.Math.Between(this.dasherSpawnIntervalMin, this.dasherSpawnIntervalMax);
        // Type 1 enemies will continue spawning based on their existing timer unless stopped in handleBossDefeat

        // --- Start Random Boss Sounds Timer ---
        if (this.bossSoundTimer) {
            this.bossSoundTimer.remove(false);
        }
        this.bossSoundTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 7000), // Random delay between 3-7 seconds
            callback: this.playRandomBossSound,
            callbackScope: this,
            loop: true
        });
        // --- End Random Boss Sounds Timer ---
    }

    reduceTaxes(amount) {
        if (this.taxesOwed <= 0) return; // Already paid off

        this.taxesOwed = Math.max(0, this.taxesOwed - amount);

        // Update HUD
        if (this.taxesOwedText) {
            if (this.taxesOwed > 0) {
                this.taxesOwedText.setText(`Taxes Owed: $${this.taxesOwed.toLocaleString()}`);
                this.taxesOwedText.setVisible(true); // Ensure visible if it was hidden
            } else {
                this.taxesOwedText.setText('Taxes PAID!'); // Or just hide it
                this.taxesOwedText.setFill('#90EE90'); // Change color to green
                // Optionally hide after a delay: 
                // this.time.delayedCall(1000, () => { this.taxesOwedText.setVisible(false); }, [], this);
            }
        }
    }

    handleBossDefeat() {
        if (this.bossDefeated) return; // Already handled
        console.log("Boss defeated! Level complete processing...");
        this.bossDefeated = true;
        this.bossFightActive = false; // Stop boss-specific logic
        this.scrollSpeed = 0; // Ensure scrolling remains stopped.

        // Stop all enemy spawners
        this.nextEnemyType1SpawnTime = Infinity; 
        this.nextDasherSpawnTime = Infinity; 
        this.allDashersSpawned = true; 
        this.allTeleportersSpawned = true; // Ensure these are also flagged as done
        this.allEnemyType4Spawned = true;  // Ensure these are also flagged as done


        // Clear out any remaining non-boss enemies for a clean victory screen
        this.irsAgentGroup.getChildren().forEach(enemy => {
            if (enemy !== this.finalBoss && enemy.active) {
                // enemy.destroy(); // Optionally destroy immediately
                // For now, just stopping new spawns. They might fly off or get covered by fade.
            }
        });

        // --- Set taxes definitively to 0 and update HUD --- 
        this.taxesOwed = 0;
        if (this.taxesOwedText) {
            this.taxesOwedText.setText('Taxes PAID!');
            this.taxesOwedText.setFill('#90EE90'); // Green color
            this.taxesOwedText.setVisible(true); 
        }
        // --- End Tax Update --- 

        const winTextStyle = { 
            fontSize: '36px', 
            fill: '#90EE90', 
            fontFamily: '"Courier New", Courier, monospace', 
            stroke: '#000000', 
            strokeThickness: 5, 
            align: 'center',
            wordWrap: { width: this.cameras.main.width * 0.8, useAdvancedWrap: true }
        };
        // Display this text immediately
        const winText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 50, // Adjusted Y to make space for explosions later
            "You defeated the Tax Monster!", 
            winTextStyle
        ).setOrigin(0.5).setScrollFactor(0).setDepth(2000);
        
        const smallerWinText = this.add.text(
             this.cameras.main.centerX,
            this.cameras.main.centerY + 30, // Adjusted Y
            "You paid your taxes! Now you can relax.",
            { ...winTextStyle, fontSize: '24px'}
        ).setOrigin(0.5).setScrollFactor(0).setDepth(2000);


        // --- THE BEAT (Short Delay) ---
        this.time.delayedCall(1500, () => { // 1.5 second beat
            console.log("Beat finished. Starting massive explosions and fade out.");

            // Start massive explosions (will run for 5 seconds)
            this.startMassiveExplosions();

            // Crossfade music
            const musicManager = this.registry.get('musicManager');
            const crossFadeDuration = 4000; // 4 second crossfade
            if (musicManager) {
                // Assuming musicManager has a crossFadeTo(newTrackKey, duration) method
                if (typeof musicManager.crossFadeTo === 'function') {
                    musicManager.crossFadeTo('endCreditsMusic', crossFadeDuration);
                    console.log(`SceneSix: Attempting to crossfade to 'endCreditsMusic' over ${crossFadeDuration}ms.`);
                } else {
                    console.warn("SceneSix: MusicManager does not have a crossFadeTo method. Playing new track directly after fade out or attempting simple fade.");
                    // Fallback: Fade out current, then play new, or just play new if no fadeOutCurrentTrack
                    if (typeof musicManager.fadeOutCurrentTrack === 'function') {
                        musicManager.fadeOutCurrentTrack(crossFadeDuration / 2); // Fade out quicker
                        this.time.delayedCall(crossFadeDuration / 2, () => {
                            musicManager.play('endCreditsMusic', { loop: true, volume: 0.5 }); // Adjust volume as needed
                        });
                    } else {
                        musicManager.play('endCreditsMusic', { loop: true, volume: 0.5 });
                    }
                }
            } else {
                console.warn('SceneSix: MusicManager not found in registry. Cannot crossfade music.');
            }

            // Start fade to white (4 second duration, happens during explosions)
            this.cameras.main.fadeOut(4000, 255, 255, 255); // Fade to white over 4 seconds

            // When fade out completes, transition to EndScene
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                console.log("Fade to white complete. Transitioning to EndScene.");
                
                if (this.massiveExplosionTimer) {
                    this.massiveExplosionTimer.remove(false); // Stop the explosion timer
                    this.massiveExplosionTimer = null;
                }
                // Clean up texts before transitioning
                if(winText) winText.destroy();
                if(smallerWinText) smallerWinText.destroy();
                if(this.taxesOwedText) this.taxesOwedText.destroy(); // Also remove the "Taxes PAID" text
                if(this.moneyText) this.moneyText.destroy();
                if(this.ethText) this.ethText.destroy();


                // Ensure camera is reset for the next scene
                this.cameras.main.resetFX(); // Clears fade effects
                this.cameras.main.setAlpha(1); // Ensure alpha is back to normal
                
                // Play.fun: level 6 (boss) complete bonus
                awardPoints(200);

                this.scene.start('EndScene', {
                    dollars: this.playerMoney,
                    eth: this.playerETH,
                    // taxesOwed: this.taxesOwed // Already 0, but can pass if EndScene uses it
                    hits: this.registry.get('playerHits')
                });
            });

        }, [], this);
        
        // Remove the old 5-second delay and direct transition
        // this.time.delayedCall(5000, () => { ... });

        // --- Stop Random Boss Sounds Timer ---
        if (this.bossSoundTimer) {
            this.bossSoundTimer.remove(false);
            this.bossSoundTimer = null;
        }
        // --- End Stop Random Boss Sounds Timer ---
    }

    startMassiveExplosions() {
        if (this.massiveExplosionTimer) {
            this.massiveExplosionTimer.remove(false); // Remove existing if any
        }

        // --- Play End Explosion Sound ---
        const soundManager = this.registry.get('soundManager');
        if (soundManager) {
            soundManager.playSound('endExplosion', { volume: 0.3 }); // Adjust volume as needed
        } else {
            console.warn('SceneSix: SoundManager not found. Cannot play end explosion sound.');
        }
        // --- End Play End Explosion Sound ---
 
        // Spawn explosions for about 5 seconds, every 75ms
        const explosionDuration = 5000; // 5 seconds
        const explosionInterval = 75;   // ms between each explosion spawn
        this.massiveExplosionTimer = this.time.addEvent({
            delay: explosionInterval, 
            callback: this.spawnRandomScreenExplosion,
            callbackScope: this,
            repeat: Math.floor(explosionDuration / explosionInterval) 
        });
        console.log(`Massive explosion sequence started for ${explosionDuration / 1000} seconds.`);
    }

    spawnRandomScreenExplosion() {
        const camera = this.cameras.main;
        const x = Phaser.Math.Between(camera.scrollX, camera.scrollX + camera.width);
        const y = Phaser.Math.Between(camera.scrollY, camera.scrollY + camera.height);
        const scale = Phaser.Math.FloatBetween(0.5, 3.5); // Various sizes

        const explosion = this.add.sprite(x, y, 'explosion_atlas');
        explosion.setScale(scale);
        explosion.setDepth(Phaser.Math.Between(1500, 2500)); // Ensure explosions are on top of most things
        explosion.play('standard_explosion');
        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });
    }

    // --- NEW METHOD for Money Fluctuation (similar to SceneFour/Five) ---
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

        // Update the display text (use this.moneyText for SceneSix)
        if (this.moneyText) {
            this.moneyText.setText(`Money: $${Math.floor(this.playerMoney).toLocaleString()}`);
        }

        // --- ETH Reduction Logic for SceneSix ---
        if (!this.bossDefeated && this.playerETH > this.ETH_TARGET_SCENE_SIX) {
            this.playerETH -= this.ETH_REDUCTION_PER_TICK_SCENE_SIX;
            if (this.playerETH < this.ETH_TARGET_SCENE_SIX) {
                this.playerETH = this.ETH_TARGET_SCENE_SIX;
            }
            // Update ETH display
            if (this.ethText) {
                this.ethText.setText(`ETH: ${Math.floor(this.playerETH).toLocaleString()}`);
            }
        }
        // --- END ETH Reduction Logic ---
    }
    // --- END NEW METHOD ---

    // --- NEW: Handle Player-Enemy Collision ---
    handlePlayerEnemyCollision(player, enemy) {
        // Prevent effect stacking if already hit
        if (player.isHit) return;

        console.log("Player hit by enemy:", enemy.constructor.name);
        
        // --- Play Player Ow Sound ---
        const soundManager = this.registry.get('soundManager');
        if (soundManager) {
            soundManager.playSound('playerOwS6', { volume: 0.2 }); // Adjust volume as needed
        } else {
            console.warn('SceneSix: SoundManager not found. Cannot play player ow sound.');
        }
        // --- End Play Player Ow Sound ---
        
        // Camera Shake
        this.cameras.main.shake(120, 0.008);

        // Tint player red temporarily
        player.isHit = true;
        // Increment global hit counter
        this.registry.set('playerHits', (this.registry.get('playerHits') || 0) + 1);
        player.setTint(0xff0000);
        this.time.delayedCall(400, () => {
            player.clearTint();
            player.isHit = false;
        }, [], this);

        // Optional: Damage the enemy or destroy it? For now, just player effect.
        // if (enemy.takeHit) {
        //     enemy.takeHit();
        // } else {
        //     enemy.destroy();
        // }
    }
    // --- END NEW ---

    playRandomBossSound() {
        if (this.finalBoss && this.finalBoss.active && this.finalBoss.health > 0 && this.bossFightActive && !this.bossDefeated) {
            const soundManager = this.registry.get('soundManager');
            if (soundManager) {
                const soundKey = Phaser.Math.RND.pick(['monsterEntrance1', 'monsterEntrance2']);
                soundManager.playSound(soundKey, { volume: 0.6 }); // Adjust volume as needed
                console.log(`Playing boss sound: ${soundKey}`);

                // Reschedule with a new random delay
                if (this.bossSoundTimer) { // Check if timer still exists (it should, as it's a loop)
                    this.bossSoundTimer.delay = Phaser.Math.Between(3000, 7000);
                }

            } else {
                console.warn('SceneSix: SoundManager not found. Cannot play random boss sound.');
            }
        }
    }
}

// Attach to global so game.js can add it to the scene list if using script tags
window.SceneSix = SceneSix; 