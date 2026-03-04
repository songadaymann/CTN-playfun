class SceneFive extends Phaser.Scene {
    constructor() {
        super({ key: 'SceneFive' });
        // Player reference
        this.player = null;
        // Input helpers
        this.cursors = null;
        this.keyA = null;
        this.keyD = null;
        this.keySpace = null;
        // Keys for dialog navigation
        this.keyLeft = null;
        this.keyRight = null;
        this.keyEnter = null;

        // Data from SceneFour
        this.playerMoney = 0;
        this.playerETH = 0;
        this.taxesOwed = 0;

        // Configuration for the '0x' prefix display
        this.PREFIX_SETTINGS = {
            x_start: 260, // Initial X for the '0' character
            char_spacing: 2,      // Horizontal space between '0' and 'x'
            font_style: { fontSize: '32px', fill: '#79d276', fontFamily: 'Monospace' },
        };

        // Configuration for the main address slots area
        this.ADDRESS_SLOTS_CONFIG = {
            x_offset_from_prefix: 1 // Horizontal space after '0x' before the address slots begin
        };
        
        // Configuration for the display of individual address characters
        this.ADDRESS_CHAR_DISPLAY_SETTINGS = {
            originX: 0, // Default to match 'x' originX, tweak if needed
            originY: -7.45, // Default to match 'x' originY, tweak if needed
            interCharacterSpacing: 1, // Pixels between characters, adjust for desired tightness
            // font_style will be inherited from PREFIX_SETTINGS
        };

        // Padding (%) of each slot occupied by glyph sprite (1 = full width)
        this.GLYPH_SLOT_PADDING = .5; // This might become less relevant for text display
        // Depth at which the address characters render
        this.ADDR_DEPTH = -40;

        // Probability to spawn a needed glyph if available (0.0 to 1.0)
        this.PROBABILITY_SPAWN_NEEDED_GLYPH = 0.7;

        // To manage active dialog
        this.activeDialog = null;

        // For glyph spawning timer
        this.glyphSpawnTimer = null;
        // For dialog button navigation
        this.selectedDialogButtonIndex = 0;
        this.dialogButtonColors = {
            normal: '#555555',
            hover: '#777777',
            selected: '#999999'
        };

        // UI Text elements for displaying financial info
        this.moneyText = null;
        this.ethText = null;
        this.taxesOwedText = null;

        // --- NEW: Flag to control money fluctuation ---
        this.stopFluctuation = false;

        // --- Mobile touch edge detection flags ---
        this.touchLastLeft = false;
        this.touchLastRight = false;
        this.touchLastAction = false;
    }

    init(data) {
        console.log("SceneFive init received data:", data);
        this.playerMoney = data.dollars || 0;
        this.playerETH = data.eth || 0;
        this.taxesOwed = data.taxesOwed || 0;
        console.log(`SceneFive: Money: ${this.playerMoney}, ETH: ${this.playerETH}, Taxes: ${this.taxesOwed}`);

        // Camera shake intensity config
        this.CAM_SHAKE_INTENSITY = 0.01;

        // --- Financial Data Display ---
        const uiTextStyle = { fontSize: '20px', fill: '#ffffff', fontFamily: 'Monospace', stroke: '#000000', strokeThickness: 4 };
        const uiX = 20;
        let uiY = 20;

        this.moneyText = this.add.text(uiX, uiY, `Money: $${this.playerMoney.toLocaleString()}`, uiTextStyle).setScrollFactor(0).setDepth(1000);
        uiY += 25;
        this.ethText = this.add.text(uiX, uiY, `ETH: ${this.playerETH.toLocaleString()}`, uiTextStyle).setScrollFactor(0).setDepth(1000);
        uiY += 25;
        this.taxesOwedText = this.add.text(uiX, uiY, `Taxes Owed: $${this.taxesOwed.toLocaleString()}`, { ...uiTextStyle, fill: '#FF6347' /* Tomato Red */ }).setScrollFactor(0).setDepth(1000).setVisible(this.taxesOwed > 0);

        // --- Start Money Fluctuation Timer ---
        this.moneyFluctuationTimer = this.time.addEvent({
            delay: 500, // Adjust delay (ms) for fluctuation frequency
            callback: this.fluctuateMoney,
            callbackScope: this,
            loop: true
        });
        // --- End Money Fluctuation Timer ---
    }

    preload() {
        // All SceneFive assets (player_basket, opensea_bg, glyphs) are preloaded globally in BootScene.
    }

    create(data) {
        // --- Initialize music ---
        const musicManager = this.registry.get('musicManager');
        if (musicManager) {
            musicManager.play('sceneFiveMusic', { loop: true, volume: 0.5 });
            console.log("SceneFive: Attempting to play 'sceneFiveMusic'.");
        } else {
            console.warn('MusicManager not found in SceneFive. Cannot play music.');
        }
        // --- End music initialization ---

        console.log('SceneFive: create');

        // -----------------------------------------------------------------
        // Background – cycle through 5 static images to simulate flicker
        // -----------------------------------------------------------------
        const bgKeyStart = 'opensea_bg';
        this.bgSprite = this.add.image(0, 0, bgKeyStart)
                               .setOrigin(0, 0)
                               .setScrollFactor(0)
                               .setDepth(-50);

        // Scale to fit width while preserving aspect ratio
        const bgScale = this.scale.width / this.bgSprite.width;
        this.bgSprite.setScale(bgScale);

        // Darken rest of scene background just in case edges show
        this.cameras.main.setBackgroundColor('#1d1d1d');

        // -----------------------------------------------------------------
        // Intro instructions (scales with viewport)
        // -----------------------------------------------------------------

        // Derive a modest UI scale from the current canvas width.
        const uiScale = this.scale.width / 1280;

        const introStyle = {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: `${Math.round(28 * uiScale)}px`,
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: Math.max(2, Math.round(4 * uiScale)),
            lineSpacing: Math.round(10 * uiScale),
            backgroundColor: 'rgba(50, 50, 50, 0.7)',
            padding: { x: Math.round(10 * uiScale), y: Math.round(8 * uiScale) }
        };

        const introTextContent = [
            "Carefully copy the buyer's address!",
            "Move left and right to grab the glowing glyphs"
        ];

        const introText = this.add.text(
            this.cameras.main.midPoint.x,
            this.cameras.main.midPoint.y - 100 * uiScale,
            introTextContent,
            introStyle
        ).setOrigin(0.5)
         .setScrollFactor(0)
         .setDepth(1000);

        // Fade out instructions after a delay
        this.tweens.add({
            targets: introText,
            alpha: 0,
            duration: 800,
            delay: 7000, // Allow time to read
            onComplete: () => {
                introText.destroy();
            }
        });

        // -----------------------------------------------------------------
        // End Intro instructions
        // -----------------------------------------------------------------

        const gameWidth  = this.scale.width;
        const gameHeight = this.scale.height;

        // -------------------------------------------------------------
        // Physics world bounds – use full canvas size
        // -------------------------------------------------------------
        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);

        // -------------------------------------------------------------
        // Animations (idle + walk)
        // -------------------------------------------------------------
        // Idle (single frame)
        if (!this.anims.exists('basket_idle')) {
            this.anims.create({
                key: 'basket_idle',
                frames: [{ key: 'player_basket', frame: 'player-basket-idle.png' }],
                frameRate: 1,
                repeat: -1
            });
        }

        // Walk (frames 2-6). Frame names are enumerated explicitly so we can
        // shuffle or trim later without worrying about gaps.
        if (!this.anims.exists('basket_walk')) {
            this.anims.create({
                key: 'basket_walk',
                frames: [
                    { key: 'player_basket', frame: 'player-basket-WALK2.png' },
                    { key: 'player_basket', frame: 'player-basket-WALK3.png' },
                    { key: 'player_basket', frame: 'player-basket-WALK4.png' },
                    { key: 'player_basket', frame: 'player-basket-WALK5.png' },
                    { key: 'player_basket', frame: 'player-basket-WALK6.png' }
                ],
                frameRate: 10,
                repeat: -1
            });
        }

        // -------------------------------------------------------------
        // Create the player sprite
        // -------------------------------------------------------------
        const startX = gameWidth / 2;
        this.player = this.physics.add.sprite(startX, 0, 'player_basket', 'player-basket-idle.png');
        this.player.setOrigin(0.5, 0.5);
        this.player.setScale(0.4);
        this.player.setDepth(10);

        // --- Physics properties (mirrors core Player.js constants where relevant) ---
        this.player.setGravityY(980);
        this.player.setDragX(1000);
        this.player.setMaxVelocity(450, 900);
        this.player.setCollideWorldBounds(true);

        // Baseline frame height for consistent bottom-edge alignment across frames
        this.baseFrameHeight = this.player.frame.height;
        // Single place to tweak collider vertical offset (positive = lower body)
        this.feetFudge = 60;

        // Initial collider sizing
        if (typeof applyBodyFromFrame === 'function') {
            const WIDTH_MULT  = 0.60;
            const HEIGHT_MULT = 1;
            const verticalAdjust = ((this.player.frame.height - this.baseFrameHeight) / 2) - this.feetFudge;
            applyBodyFromFrame(this.player, { widthMult: WIDTH_MULT, heightMult: HEIGHT_MULT, verticalAdjust });
        }

        // Snap the player so its *visible* bottom sits right on the world bottom.
        const playerHalfHeight = this.player.displayHeight / 2;
        const FOOT_ADJUST = 0; // sprite stays flush; body will be nudged downward instead
        this.player.setY(gameHeight - playerHalfHeight + FOOT_ADJUST);

        // Play idle animation to start.
        this.player.play('basket_idle');

        // -------------------------------------------------------------
        // Input setup (cursors + WASD + space)
        // -------------------------------------------------------------
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        // Keys for dialog navigation
        this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        // ────────────────────────────────────────────────────────────
        //  CONFIG – Target address + helper sets
        // ────────────────────────────────────────────────────────────
        this.targetAddress =
            '3d9456Ad6463a77bD77123Cb4836e463030bfAb4'.replace(/^0x/i, '');
        // Upper-case for matching frame names like "A.png", "4.png" etc.
        this.correctChars = new Set(this.targetAddress.toUpperCase().split(''));

        // Frame list (e.g. [ 'A.png', '0.png', ... ])
        this.availableFrames = this.textures.get('glyphs').getFrameNames();

        // Physics group that will contain all falling glyph sprites
        this.glyphGroup = this.physics.add.group();

        // Spawn a new glyph every 600 ms
        this.glyphSpawnTimer = this.time.addEvent({
            delay: 600,
            loop: true,
            callback: this.spawnGlyph,
            callbackScope: this
        });

        // Handle overlap between player and glyphs
        this.physics.add.overlap(
            this.player,
            this.glyphGroup,
            this.handleGlyphCollision,
            undefined,
            this
        );

        // Particle texture for success feedback (simple white dot)
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(2, 2, 2);
        g.generateTexture('pdot', 4, 4);
        g.destroy();

        // Pre-create a burst emitter (Phaser 3.60+: this.add.particles returns a ParticleEmitter)
        this.successEmitter = this.add.particles(0, 0, 'pdot', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 400,
            quantity: 10,
            blendMode: 'ADD',
            emitting: false // we trigger bursts manually with explode()
        });

        // ────────────────────────────────────────────────────────────
        //  ADDRESS DISPLAY – progress shown on in-game monitor
        // ────────────────────────────────────────────────────────────
        this.ADDR_BOX = {
            left  : 300,   // Original left, now a general guideline; actual slots start after '0x'
            top   : 85,   // little higher
            right : 1270,  // further right  → 720 px of width
            bottom: 400    // little taller if you like
        };
        // Padding (%) of each slot occupied by glyph sprite (1 = full width)
        // this.GLYPH_SLOT_PADDING = 1; // Moved to constructor
        // Depth at which the address characters render (background is -50, glyphs default at 0)
        // this.ADDR_DEPTH = -40; // Moved to constructor

        this.targetChars = this.targetAddress.split(''); // array (40)
        const totalSlots = this.targetChars.length;

        // Calculate vertical center for '0x' and address characters
        const boxHeight = this.ADDR_BOX.bottom - this.ADDR_BOX.top;
        const centerY = this.ADDR_BOX.top + boxHeight / 2;

        // --- Create and position the '0x' prefix ---
        const prefixZeroText = this.add.text(
            this.PREFIX_SETTINGS.x_start,
            centerY,
            '0',
            this.PREFIX_SETTINGS.font_style
        ).setOrigin(3, -7.45).setDepth(this.ADDR_DEPTH);

        const prefixXTextX = this.PREFIX_SETTINGS.x_start + prefixZeroText.width + this.PREFIX_SETTINGS.char_spacing;
        const prefixXText = this.add.text(
            prefixXTextX,
            centerY,
            'x',
            this.PREFIX_SETTINGS.font_style
        ).setOrigin(3.3, -7.45).setDepth(this.ADDR_DEPTH);

        // --- Determine where the actual address character slots begin ---
        // const addressDisplayAreaStartX = prefixXText.x + prefixXText.width + this.ADDRESS_SLOTS_CONFIG.x_offset_from_prefix; // Old calculation

        // New calculation for the visual start of the address characters area
        const actualPrefixXOriginX = prefixXText.originX; // Get the originX user actually set on the 'x'
        const visualRightOfX = prefixXText.x + prefixXText.width * (1 - actualPrefixXOriginX);
        const firstCharVisualLeftX = visualRightOfX + this.ADDRESS_SLOTS_CONFIG.x_offset_from_prefix;

        // Precompute per-character positions for the collectible part
        // const addressSlotsBoxWidth = this.ADDR_BOX.right - addressDisplayAreaStartX; // Old calculation
        // const singleSlotWidth = availableWidthForAddressChars / totalSlots; // Not used for tight packing

        // Estimate avgMonoWidth (using placeholder '_', and style from prefix settings)
        let avgMonoWidth = 2; // Fallback, will be replaced
        const tempTextStyle = this.PREFIX_SETTINGS.font_style; // Use consistent font style
        const tempText = this.add.text(0, 0, '_', tempTextStyle).setVisible(false);
        if (tempText.width > 0) { // Ensure width is valid
            avgMonoWidth = tempText.width;
        }
        tempText.destroy();

        // Arrays to track display sprites and remaining indices per char
        // this.addressSprites = []; // Will be replaced by addressTextObjects
        this.addressTextObjects = []; // For storing the new text objects
        this.remainingIndicesByChar = {};

        // Determine the anchor X for the very first address character
        // such that its visual left edge aligns with firstCharVisualLeftX
        let currentTextAnchorX = firstCharVisualLeftX - (this.ADDRESS_CHAR_DISPLAY_SETTINGS.originX * avgMonoWidth);

        for (let i = 0; i < totalSlots; i++) {
            // For i > 0, calculate the anchor for the current character based on the previous one
            if (i > 0) {
                currentTextAnchorX += avgMonoWidth + this.ADDRESS_CHAR_DISPLAY_SETTINGS.interCharacterSpacing;
            }

            // Calculate the visual center of the current slot
            // const visualSlotCenterX = firstCharVisualLeftX + (i * singleSlotWidth) + (singleSlotWidth / 2); // Old logic

            // Calculate the anchor X for the text object to center it visually, using its specific origin
            // const textAnchorX = visualSlotCenterX - (avgMonoWidth / 2) + (this.ADDRESS_CHAR_DISPLAY_SETTINGS.originX * avgMonoWidth); // Old logic

            // Create a text object for each character slot
            const t = this.add.text(currentTextAnchorX, centerY, '_', tempTextStyle) // Initialize with placeholder
                .setOrigin(this.ADDRESS_CHAR_DISPLAY_SETTINGS.originX, this.ADDRESS_CHAR_DISPLAY_SETTINGS.originY)
                .setDepth(this.ADDR_DEPTH);

            this.addressTextObjects.push(t);

            const ch = this.targetChars[i].toUpperCase();
            if (!this.remainingIndicesByChar[ch]) {
                this.remainingIndicesByChar[ch] = [];
            }
            this.remainingIndicesByChar[ch].push(i);
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  Spawn a single glyph at a random X across the top
    // ──────────────────────────────────────────────────────────────
    spawnGlyph() {
        // Prefer characters we still need. Build a filtered list once per spawn.
        const neededFrames = this.availableFrames.filter((f) => {
            const c = f.replace('.png', '').toUpperCase();
            return this.remainingIndicesByChar[c] && this.remainingIndicesByChar[c].length > 0;
        });

        let framePool;
        if (neededFrames.length > 0 && Math.random() < this.PROBABILITY_SPAWN_NEEDED_GLYPH) {
            framePool = neededFrames;
        } else {
            framePool = this.availableFrames;
        }

        const frame = Phaser.Utils.Array.GetRandom(framePool);
        const char  = frame.replace('.png', '').toUpperCase();

        const startX = Phaser.Math.Between(50, this.scale.width - 50);
        const sprite = this.glyphGroup.create(startX, -50, 'glyphs', frame);
        sprite.setScale(0.35);
        sprite.setVelocityY(Phaser.Math.Between(150, 250));
        sprite.setCollideWorldBounds(false);
        sprite.char = char;
        // Correct only if we still need this char
        sprite.isCorrect = this.correctChars.has(char) && this.remainingIndicesByChar[char] && this.remainingIndicesByChar[char].length > 0;

        if (sprite.isCorrect) {
            sprite.preFX.setPadding(12);
            sprite.preFX.addGlow(0xa7e298, 4, 0);
        } else {
            // Add red glow for incorrect letters
            sprite.preFX.setPadding(12);
            sprite.preFX.addGlow(0xff0000, 4, 0);
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  Handle player ↔ glyph collision
    // ──────────────────────────────────────────────────────────────
    handleGlyphCollision(player, glyph) {
        if (glyph.isCorrect) {
            // Success ✨
            this.playSuccessFX(glyph);

            // Reveal in UI box
            this.revealAddressChar(glyph.char);
        } else {
            // Failure 🚫
            this.playFailureFX();

            // --- Play Player Ow Sound for incorrect glyph ---
            const soundManager = this.registry.get('soundManager');
            if (soundManager) {
                soundManager.playSound('playerOwSound', { volume: 0.1 });
            } else {
                console.warn('SceneFive: SoundManager not found. Cannot play player ow sound for incorrect glyph.');
            }
            // --- End Sound ---
        }

        glyph.destroy();
    }

    playSuccessFX(glyph) {
        // --- Play Correct Letter Sound ---
        const soundManager = this.registry.get('soundManager');
        if (soundManager) {
            soundManager.playSound('correctLetterSound', { volume: 0.05 });
        } else {
            console.warn('SceneFive: SoundManager not found. Cannot play correct letter sound.');
        }
        // --- End Sound ---

        // Brief player glow
        const glow = this.player.preFX.addGlow(0xa7e298, 6, 0);
        this.time.delayedCall(200, () => {
            this.player.preFX.remove(glow);
        });

        // Particle burst at glyph position
        this.successEmitter.explode(12, glyph.x, glyph.y);
    }

    playFailureFX() {
        // Flash red
        this.player.setTint(0xff0000);
        this.time.delayedCall(120, () => this.player.clearTint());

        // Camera shake
        this.cameras.main.shake(200, this.CAM_SHAKE_INTENSITY);
    }

    // ──────────────────────────────────────────────────────────────
    //  Reveal a collected character in the on-screen address box
    // ──────────────────────────────────────────────────────────────
    revealAddressChar(char) {
        const upper = char.toUpperCase();
        const list = this.remainingIndicesByChar[upper];
        if (!list || list.length === 0) {
            return; // Already filled all occurrences
        }

        const idx = list.shift();
        // const sprite = this.addressSprites[idx]; // Old sprite logic
        // const frameName = `${upper}.png`;
        // sprite.setTexture('glyphs', frameName);
        // sprite.setAlpha(1);

        // Add persistent glow to indicate success
        // sprite.preFX.setPadding(8); // Old glow logic
        // sprite.preFX.addGlow(0xa7e298, 4, 0); // Old glow logic

        const textObject = this.addressTextObjects[idx];
        if (textObject) {
            textObject.setText(upper);
            // No glow added to the text character itself for now, as per plan.
        }

        // If all collected, perhaps signal completion later
        this.collectedCount = (this.collectedCount || 0) + 1;
        if (this.collectedCount === this.targetChars.length) {
            console.log('Address complete!');
            // TODO: trigger next scene / celebration
            if (this.glyphSpawnTimer) { // Ensure timer exists
                this.glyphSpawnTimer.paused = true;
            }
            this.showSendAutoglyphDialog(); // New: Show dialog
        }
    }

    // -------------------------------------------------------------
    // Per-frame update – handle movement & animation switches
    // -------------------------------------------------------------
    update() {
        if (!this.player) return;

        // Retrieve touch control directions if on mobile
        const touch = this.game && this.game.touchControls ? this.game.touchControls.directions : {};

        // If a dialog is active, pause player input and other game updates
        if (this.activeDialog) {
            if (this.player.body.velocity.x !== 0) this.player.setVelocityX(0); // Stop movement
            
            // Dialog navigation
            if (this.activeDialog.buttons && this.activeDialog.buttons.length > 0) {
                // --- Keyboard ---
                if (Phaser.Input.Keyboard.JustDown(this.keyLeft)) {
                    this.selectedDialogButtonIndex = (this.selectedDialogButtonIndex - 1 + this.activeDialog.buttons.length) % this.activeDialog.buttons.length;
                    this.updateDialogButtonVisuals();
                } else if (Phaser.Input.Keyboard.JustDown(this.keyRight)) {
                    this.selectedDialogButtonIndex = (this.selectedDialogButtonIndex + 1) % this.activeDialog.buttons.length;
                    this.updateDialogButtonVisuals();
                } else if (Phaser.Input.Keyboard.JustDown(this.keyEnter) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
                    if (this.activeDialog.buttons[this.selectedDialogButtonIndex]) {
                        this.activeDialog.buttons[this.selectedDialogButtonIndex].emit('pointerdown');
                    }
                }

                // --- Touch controls (edge triggered) ---
                if (touch.left && !this.touchLastLeft) {
                    this.selectedDialogButtonIndex = (this.selectedDialogButtonIndex - 1 + this.activeDialog.buttons.length) % this.activeDialog.buttons.length;
                    this.updateDialogButtonVisuals();
                } else if (touch.right && !this.touchLastRight) {
                    this.selectedDialogButtonIndex = (this.selectedDialogButtonIndex + 1) % this.activeDialog.buttons.length;
                    this.updateDialogButtonVisuals();
                } else if (touch.action && !this.touchLastAction) {
                    if (this.activeDialog.buttons[this.selectedDialogButtonIndex]) {
                        this.activeDialog.buttons[this.selectedDialogButtonIndex].emit('pointerdown');
                    }
                }

                // Update touch edge flags
                this.touchLastLeft = touch.left;
                this.touchLastRight = touch.right;
                this.touchLastAction = touch.action;
            }
            return; // Skip the rest of the update loop
        }

        // Update touch edge flags when dialog not open (reset)
        this.touchLastLeft = touch.left;
        this.touchLastRight = touch.right;
        this.touchLastAction = touch.action;

        const onGround = this.player.body.blocked.down || this.player.body.touching.down;

        // Horizontal movement
        const leftPressed  = this.cursors.left.isDown  || this.keyA.isDown || touch.left;
        const rightPressed = this.cursors.right.isDown || this.keyD.isDown || touch.right;

        const MOVE_SPEED = 600;

        if (leftPressed) {
            this.player.setVelocityX(-MOVE_SPEED);
            this.player.setFlipX(true);
        } else if (rightPressed) {
            this.player.setVelocityX(MOVE_SPEED);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        // Jump
        const JUMP_VELOCITY = -450;
        if (onGround && (this.cursors.up.isDown || this.keySpace.isDown || touch.up || touch.action)) {
            this.player.setVelocityY(JUMP_VELOCITY);

            // --- Play Jump Sound ---
            const soundManager = this.registry.get('soundManager');
            if (soundManager) {
                soundManager.playSound('playerJumpSound', { volume: 0.05 }); // Adjust volume as needed
            } else {
                console.warn('SceneFive: SoundManager not found. Cannot play jump sound.');
            }
            // --- End Sound ---
        }

        // Animation selection
        if (onGround) {
            if (this.player.body.velocity.x !== 0) {
                this.player.play('basket_walk', true);
            } else {
                this.player.play('basket_idle', true);
            }
        } else {
            // Simple airborne frame – reuse idle for now; can swap later.
            this.player.play('basket_idle', true);
        }

        // Lift collider upward slightly each frame so sprite feet appear above ground.
        if (typeof applyBodyFromFrame === 'function') {
            const WIDTH_MULT  = 0.60;
            const HEIGHT_MULT = 1;
            const verticalAdjust = ((this.player.frame.height - this.baseFrameHeight) / 2) - this.feetFudge;
            applyBodyFromFrame(this.player, { widthMult: WIDTH_MULT, heightMult: HEIGHT_MULT, verticalAdjust });
        }

        // Destroy glyphs that have fallen off the screen bottom
        this.glyphGroup.children.each(sprite => {
            if (sprite.y > this.scale.height + 50) {
                sprite.destroy();
            }
        });
    }

    // -------------------------------------------------------------
    // DIALOG SYSTEM
    // -------------------------------------------------------------

    clearDialog() {
        if (this.activeDialog) {
            this.activeDialog.destroy();
            this.activeDialog = null;
        }
        // Reset touch edge flags when dialog closes
        this.touchLastLeft = false;
        this.touchLastRight = false;
        this.touchLastAction = false;
    }

    createDialogBackground(width, height, alpha = 0.8) {
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, alpha);
        // Make it slightly larger than content for padding
        bg.fillRect(-width / 2 - 10, -height / 2 - 10, width + 20, height + 20);
        return bg;
    }

    createDialogButton(x, y, text, callback) {
        const buttonText = this.add.text(x, y, text, {
            fontSize: '32px',
            fill: '#ffffff',
            // backgroundColor will be set by updateDialogButtonVisuals
            padding: { left: 15, right: 15, top: 10, bottom: 10 }
        })
        .setOrigin(0.5)
        .setInteractive();

        buttonText.on('pointerdown', callback);
        buttonText.on('pointerover', () => buttonText.setBackgroundColor(this.dialogButtonColors.hover));
        buttonText.on('pointerout', () => {
            // Revert to current selection state's color
            this.updateDialogButtonVisuals();
        });
        return buttonText;
    }

    updateDialogButtonVisuals() {
        if (!this.activeDialog || !this.activeDialog.buttons || this.activeDialog.buttons.length === 0) {
            return;
        }
        this.activeDialog.buttons.forEach((button, index) => {
            if (index === this.selectedDialogButtonIndex) {
                button.setBackgroundColor(this.dialogButtonColors.selected);
            } else {
                button.setBackgroundColor(this.dialogButtonColors.normal);
            }
        });
    }

    showSendAutoglyphDialog() {
        this.clearDialog(); // Clear any existing dialog
        if (this.glyphSpawnTimer) { // Pause glyphs as soon as this dialog appears
            this.glyphSpawnTimer.paused = true;
        }

        const dialogWidth = 500;
        const dialogHeight = 200;
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        const container = this.add.container(centerX, centerY).setDepth(100);
        this.activeDialog = container;
        this.activeDialog.buttons = []; // Initialize buttons array

        const background = this.createDialogBackground(dialogWidth, dialogHeight);
        container.add(background);

        const messageText = this.add.text(0, -dialogHeight / 2 + 50, 'Send Autoglyph?', {
            fontSize: '36px',
            fill: '#ffffff',
            wordWrap: { width: dialogWidth - 40 },
            align: 'center'
        }).setOrigin(0.5);
        container.add(messageText);

        const yesButton = this.createDialogButton(-dialogWidth / 4, dialogHeight / 2 - 50, 'Yes', () => {
            this.showAreYouSureDialog();
        });
        container.add(yesButton);
        this.activeDialog.buttons.push(yesButton);

        const noButton = this.createDialogButton(dialogWidth / 4, dialogHeight / 2 - 50, 'No', () => {
            this.showTaxesDialog("I know it's hard, but you have to pay your taxes.");
        });
        container.add(noButton);
        this.activeDialog.buttons.push(noButton);

        this.selectedDialogButtonIndex = 0; // Default to first button
        this.updateDialogButtonVisuals();
    }

    showAreYouSureDialog() {
        this.clearDialog();

        const dialogWidth = 500;
        const dialogHeight = 200;
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        const container = this.add.container(centerX, centerY).setDepth(100);
        this.activeDialog = container;
        this.activeDialog.buttons = []; // Initialize buttons array

        const background = this.createDialogBackground(dialogWidth, dialogHeight);
        container.add(background);

        const messageText = this.add.text(0, -dialogHeight / 2 + 50, 'Are you sure?', {
            fontSize: '36px',
            fill: '#ffffff',
            wordWrap: { width: dialogWidth - 40 },
            align: 'center'
        }).setOrigin(0.5);
        container.add(messageText);

        const yesButton = this.createDialogButton(-dialogWidth / 4, dialogHeight / 2 - 50, 'Yes', () => {
            this.clearDialog();
            this.animateMoneyIncreaseAndProceed();
        });
        container.add(yesButton);
        this.activeDialog.buttons.push(yesButton);

        const noButton = this.createDialogButton(dialogWidth / 4, dialogHeight / 2 - 50, 'No', () => {
            this.showTaxesDialog("I know it's hard, but you have to pay your taxes.");
        });
        container.add(noButton);
        this.activeDialog.buttons.push(noButton);

        this.selectedDialogButtonIndex = 0; // Default to first button
        this.updateDialogButtonVisuals();
    }

    showTaxesDialog(message) {
        this.clearDialog();

        const dialogWidth = 600; // Wider for potentially longer message
        const dialogHeight = 200;
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        const container = this.add.container(centerX, centerY).setDepth(100);
        this.activeDialog = container;
        this.activeDialog.buttons = []; // Initialize buttons array

        const background = this.createDialogBackground(dialogWidth, dialogHeight);
        container.add(background);

        const messageText = this.add.text(0, -dialogHeight / 2 + 60, message, { // Adjusted Y for text
            fontSize: '32px',
            fill: '#ffffff',
            wordWrap: { width: dialogWidth - 40 },
            align: 'center'
        }).setOrigin(0.5);
        container.add(messageText);

        const okButton = this.createDialogButton(0, dialogHeight / 2 - 50, 'Ok', () => {
            this.clearDialog();
            // What happens after "Ok"? For now, just closes. Glyphs remain paused.
            // If game should resume/restart, glyphSpawnTimer.paused = false; might be needed.

            // --- NEW: Transition to Interstitial for SceneSix ---
            const musicManager = this.registry.get('musicManager');
            const fadeOutDuration = 800; // ms

            if (musicManager) {
                musicManager.fadeOutCurrentTrack(fadeOutDuration);
            }

            // Prepare data for SceneSix (current money and ETH, taxes considered resolved)
            const sceneSixData = {
                dollars: this.playerMoney,
                eth: this.playerETH,
                // taxesOwed is not passed, implying it's resolved or no longer relevant
                hits: this.registry.get('playerHits')
            };
            // Play.fun: level 5 complete bonus
            awardPoints(100);
            console.log('SceneFive (Taxes Dialog Ok): Transitioning to InterstitialScene for SceneSix with data:', sceneSixData);

            // Delay the actual scene start to allow music to fade
            this.time.delayedCall(fadeOutDuration + 100, () => { // Add a small buffer
                this.scene.start('InterstitialScene', {
                    nextSceneKey: 'SceneSix',
                    imageKey: 'interstitial6', // Assuming same interstitial image
                    sceneData: sceneSixData
                });
            });
            // --- END NEW ---
        });
        container.add(okButton);
        this.activeDialog.buttons.push(okButton);

        this.selectedDialogButtonIndex = 0; // Default to first button
        this.updateDialogButtonVisuals();
    }

    animateMoneyIncreaseAndProceed() {
        console.log('Starting money animation with tween...');
        // --- NEW: Stop fluctuation during animation ---
        this.stopFluctuation = true;
        // --- END NEW ---

        const amountToAdd = 1100000;
        const targetMoney = this.playerMoney + amountToAdd;
        const duration = 1500; // ms for animation

        // Create a temporary object for the tween to target for smoother animation
        let moneyObject = { value: this.playerMoney }; 

        this.tweens.add({
            targets: moneyObject,
            value: targetMoney,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
                this.playerMoney = Math.floor(moneyObject.value);
                if (this.moneyText) {
                    this.moneyText.setText(`Money: $${this.playerMoney.toLocaleString()}`);
                }
            },
            onComplete: () => {
                // Ensure exact final value due to potential floating point inaccuracies with tween
                this.playerMoney = targetMoney; 
                 if (this.moneyText) {
                    this.moneyText.setText(`Money: $${this.playerMoney.toLocaleString()}`);
                }
                console.log('Money animation complete. Adding a beat before next level...');
                
                // Final transition after everything
                const sceneTransitionDelay = 500; // Short delay after money animation for scene transition trigger
                this.time.delayedCall(sceneTransitionDelay, () => {
                    const sceneSixData = {
                        dollars: this.playerMoney,
                        eth: this.playerETH,
                        // Taxes are paid, so don't pass taxesOwed
                        hits: this.registry.get('playerHits')
                    };
                    console.log('SceneFive complete. Transitioning to InterstitialScene for SceneSix with data:', sceneSixData);

                    // --- Fade out music before transitioning ---
                    const musicManager = this.registry.get('musicManager');
                    const fadeOutDuration = 800; // ms, should be less than or equal to final delay before actual transition
                    if (musicManager) {
                        musicManager.fadeOutCurrentTrack(fadeOutDuration);
                    }
                    // --- End music fade out ---

                    // Delay the actual scene start to allow music to fade
                    this.time.delayedCall(fadeOutDuration + 100, () => { // Add a small buffer
                        // Transition to the Interstitial Scene first
                        this.scene.start('InterstitialScene', {
                            nextSceneKey: 'SceneSix',
                            imageKey: 'interstitial6',
                            sceneData: sceneSixData
                        });
                        // this.scene.start('SceneSix', sceneSixData); // Old direct transition
                    });
                });
            },
            callbackScope: this
        });
    }

    // --- NEW METHOD for Money Fluctuation (similar to SceneFour) ---
    fluctuateMoney() {
        // Check the flag before fluctuating
        if (this.stopFluctuation) return;

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

        // Update the display text (use this.moneyText for SceneFive)
        if (this.moneyText) {
            this.moneyText.setText(`Money: $${Math.floor(this.playerMoney).toLocaleString()}`);
        }
    }
    // --- END NEW METHOD ---
}

// Attach to global so game.js can add it to the scene list if using script tags
window.SceneFive = SceneFive; 