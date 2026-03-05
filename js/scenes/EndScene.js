class EndScene extends Phaser.Scene {

    constructor() {
        super({ key: 'EndScene' });
        // Initialize any variables needed for the end scene
        this.congratsText = null;
        this.creditsText = null;
        // Add variables to store final game data if needed
        // e.g., this.finalScore = 0;

        // HUD variables
        this.playerMoney = 0;
        this.playerETH = 0; // This will be set to 40 in init
        this.playerHits = 0;
        this.moneyTextEnd = null;
        this.ethTextEnd = null;
        this.moneyFluctuationTimerEnd = null;

        console.log("EndScene constructor");
    }

    init(data) {
        console.log("EndScene init received data:", data);
        // Store any final data passed from the previous scene
        this.playerMoney = data.dollars || 0;
        this.playerETH = 40; // ETH is fixed at 40 for the EndScene
        this.playerHits = data.hits || 0;
        // e.g., this.finalScore = data.score || 0;
    }

    preload() {
        console.log("EndScene: preload");
        // Load any assets needed specifically for the end scene
        // this.load.image('end_scene_bg', 'assets/images/end-scene/end-scene-far.png'); // Old background
        this.load.image('end_far_bg', 'assets/images/end-scene/end-far.png');
        this.load.image('end_mid_bg', 'assets/images/end-scene/end-mid.png');
        this.load.image('end_close_bg', 'assets/images/end-scene/end-front.png'); // "end-front.png" as the close layer
        this.load.image('end_ground_bg', 'assets/images/end-scene/end-ground.png');
        
        // --- Load Character Atlases ---
        this.load.atlas('player', 'assets/spritesheets/player/player.png', 'assets/spritesheets/player/player.json');
        this.load.atlas('wife', 'assets/spritesheets/wife/wife.png', 'assets/spritesheets/wife/wife.json');
        this.load.atlas('jupi', 'assets/spritesheets/kids/jupi.png', 'assets/spritesheets/kids/jupi.json');
        this.load.atlas('pip', 'assets/spritesheets/kids/pip.png', 'assets/spritesheets/kids/pip.json');
        this.load.atlas('poe', 'assets/spritesheets/kids/poe.png', 'assets/spritesheets/kids/poe.json');
        // --- End Load Character Atlases ---
        
        // this.load.audio('victory_music', 'assets/audio/victory.mp3');
    }

    create() {
        console.log('EndScene create() running - debug marker 2024-05-30');

        // Play.fun: game complete bonus (fewer hits = more bonus points)
        const hitBonus = Math.max(0, 500 - (this.playerHits * 25));
        awardPoints(1000 + hitBonus);

        // --- Initialize music ---
        const bootScene = this.scene.get('BootScene');
        if (bootScene && bootScene.musicManager) {
            bootScene.musicManager.playMusic('EndScene');
        } else {
            console.warn('MusicManager not found in EndScene. Cannot play music.');
        }
        // --- End music initialization ---

        console.log("EndScene: create");

        // --- HUD Setup ---
        const uiTextStyle = { fontSize: '20px', fill: '#FFFFFF', fontFamily: 'Monospace', stroke: '#000000', strokeThickness: 4 };

        this.moneyTextEnd = this.add.text(20, 20, `Money: $${Math.floor(this.playerMoney).toLocaleString()}`, uiTextStyle)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1001); // Ensure HUD is on top

        this.ethTextEnd = this.add.text(20, 50, `ETH: ${this.playerETH.toLocaleString()}`, uiTextStyle)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1001);

        this.add.text(20, 80, `Hits: ${this.playerHits}`, uiTextStyle)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1001);

        // Clear previous timer if it exists (e.g., scene restarted)
        if (this.moneyFluctuationTimerEnd) {
            this.moneyFluctuationTimerEnd.remove(false);
        }
        this.moneyFluctuationTimerEnd = this.time.addEvent({
            delay: 500, // Fluctuate every 500ms
            callback: this.fluctuateMoneyEnd,
            callbackScope: this,
            loop: true
        });
        // --- End HUD Setup ---

        // ------------------------------------------------------------------
        //  HIDE MOBILE TOUCH OVERLAY (joystick / A-button) so it does not
        //  block taps on the win button.
        // ------------------------------------------------------------------
        if (this.game && this.game.touchControls && this.game.touchControls.touchControlsElement) {
            console.log('EndScene: hiding touchControlsElement');
            this.game.touchControls.touchControlsElement.style.display = 'none';
        }
        // ------------------------------------------------------------------

        // this.cameras.main.setBackgroundColor('#000000'); // Black background

        const bgImageWidth = 4352; // Actual width of end-scene-far.png
        // IMPORTANT: If your new 'end_far_bg.png' (or the widest layer)
        // has a different width, update bgImageWidth above.
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // --- Add Parallax Background Images (with duplicates for infinite scroll) ---
        this.bgFar = this.add.image(0, 0, 'end_far_bg')
            .setOrigin(0, 0)
            .setDepth(-10)
            .setScrollFactor(0.2);
        this.bgFar2 = this.add.image(this.bgFar.displayWidth, 0, 'end_far_bg')
            .setOrigin(0, 0)
            .setDepth(-10)
            .setScrollFactor(0.2);

        this.bgMid = this.add.image(0, 0, 'end_mid_bg')
            .setOrigin(0, 0)
            .setDepth(-9)
            .setScrollFactor(0.5);
        this.bgMid2 = this.add.image(this.bgMid.displayWidth, 0, 'end_mid_bg')
            .setOrigin(0, 0)
            .setDepth(-9)
            .setScrollFactor(0.5);

        this.bgClose = this.add.image(0, 0, 'end_close_bg')
            .setOrigin(0, 0)
            .setDepth(-8)
            .setScrollFactor(0.8);
        this.bgClose2 = this.add.image(this.bgClose.displayWidth, 0, 'end_close_bg')
            .setOrigin(0, 0)
            .setDepth(-8)
            .setScrollFactor(0.8);

        this.bgGround = this.add.image(0, 0, 'end_ground_bg')
            .setOrigin(0, 0)
            .setDepth(0)
            .setScrollFactor(1);
        this.bgGround2 = this.add.image(this.bgGround.displayWidth, 0, 'end_ground_bg')
            .setOrigin(0, 0)
            .setDepth(0)
            .setScrollFactor(1);
        // --- End Background Setup ---

        // --- Define Character Animations ---
        // Player Walk (frames: WALK-2.png to WALK-6.png)
        if (!this.anims.exists('player_walk_end')) {
            this.anims.create({
                key: 'player_walk_end',
                frames: this.anims.generateFrameNames('player', { prefix: 'WALK-', start: 2, end: 6, suffix: '.png' }),
                frameRate: 10,
                repeat: -1
            });
        }
        // Wife Walk (frames: wife-walk1.png, wife-walk2.png)
        if (!this.anims.exists('wife_walk_end')) {
            this.anims.create({
                key: 'wife_walk_end',
                frames: [
                    { key: 'wife', frame: 'wife-walk1.png' },
                    { key: 'wife', frame: 'wife-walk2.png' }
                ],
                frameRate: 8,
                repeat: -1
            });
        }
        // Jupi Walk (frames: jupi1.png, jupi2.png, jupi3.png, jupi2.png, jupi1.png)
        if (!this.anims.exists('jupi_walk_end')) {
            this.anims.create({
                key: 'jupi_walk_end',
                frames: [
                    { key: 'jupi', frame: 'jupi1.png' },
                    { key: 'jupi', frame: 'jupi2.png' },
                    { key: 'jupi', frame: 'jupi1.png' },
                    { key: 'jupi', frame: 'jupi3.png' }
                ],
                frameRate: 9,
                repeat: -1
            });
        }
        // Pip Walk (frames: pip1.png, pip2.png, pip3.png, pip2.png, pip1.png)
        if (!this.anims.exists('pip_walk_end')) {
            this.anims.create({
                key: 'pip_walk_end',
                frames: [
                    { key: 'pip', frame: 'pip1.png' },
                    { key: 'pip', frame: 'pip2.png' },
                    { key: 'pip', frame: 'pip1.png' },
                    { key: 'pip', frame: 'pip3.png' }
                ],
                frameRate: 9,
                repeat: -1
            });
        }
        // Poe Walk (frames: poe1.png, poe2.png, poe3.png, poe2.png, poe1.png)
        if (!this.anims.exists('poe_walk_end')) {
            this.anims.create({
                key: 'poe_walk_end',
                frames: [
                    { key: 'poe', frame: 'poe1.png' },
                    { key: 'poe', frame: 'poe2.png' },
                    { key: 'poe', frame: 'poe1.png' },
                    { key: 'poe', frame: 'poe3.png' }
                ],
                frameRate: 9,
                repeat: -1
            });
        }
        // --- End Define Character Animations ---

        // --- Display Congratulations Message ---
        // this.congratsText = this.add.text(
        //     gameWidth / 2,
        //     gameHeight / 3,
        //     'CONGRATULATIONS!',
        //     {
        //         fontSize: '48px',
        //         fill: '#FFFF00', // Yellow text
        //         fontFamily: '"Press Start 2P", monospace',
        //         align: 'center'
        //     }
        // ).setOrigin(0.5);
        // this.congratsText.setScrollFactor(0); // Keep text fixed to camera

        // --- Display Credits or Final Message ---
        // const creditsContent = [
        //     'You Won!',
        //     '',
        //     'Game Developed By:',
        //     'Jonathan Mann',
        //     '',
        //     'Powered By:',
        //     'Phaser 3',
        //     '',
        //     '',
        //     'Click to Return to Title'
        // ];

        // this.creditsText = this.add.text(
        //     gameWidth / 2,
        //     gameHeight / 2 + 50, // Position below congrats text
        //     creditsContent,
        //     {
        //         fontSize: '20px',
        //         fill: '#FFFFFF', // White text
        //         fontFamily: '"Press Start 2P", monospace',
        //         align: 'center',
        //         lineSpacing: 10
        //     }
        // ).setOrigin(0.5);
        // this.creditsText.setScrollFactor(0); // Keep text fixed to camera

        // --- Add Walking Characters at Bottom ---
        // Individual character scales (adjust these as needed)
        this.playerScale = 0.35; // Example: set to 0.5 for larger player
        this.wifeScale = 0.35;
        this.jupiScale = .13;
        this.pipScale = .13;
        this.poeScale = .15;
        // To resize, just change the value above (e.g., this.jupiScale = 0.5;)

        const characterSpacing = 30; // Horizontal space between characters
        const bottomPadding = 8;    // Pixels from the absolute bottom edge (changed from 40)
        this.characters = [];

        // Create sprites with individual scales (right to left: player, wife, jupi, pip, poe)
        this.playerSprite = this.add.sprite(0, 0, 'player').setScale(this.playerScale);
        this.wifeSprite   = this.add.sprite(0, 0, 'wife').setScale(this.wifeScale);
        this.wifeSprite.setFlipX(true); // Flip wife horizontally
        this.jupiSprite   = this.add.sprite(0, 0, 'jupi').setScale(this.jupiScale);
        this.pipSprite    = this.add.sprite(0, 0, 'pip').setScale(this.pipScale);
        this.poeSprite    = this.add.sprite(0, 0, 'poe').setScale(this.poeScale);
        // Push in reverse order for right-to-left display
        this.characters.push(this.playerSprite, this.wifeSprite, this.jupiSprite, this.pipSprite, this.poeSprite);

        // Calculate total width
        let totalGroupWidth = 0;
        this.characters.forEach((char, index) => {
            totalGroupWidth += char.displayWidth;
            if (index < this.characters.length - 1) {
                totalGroupWidth += characterSpacing;
            }
        });

        // Calculate starting X position for the group to be centered
        this.characterStartX = (gameWidth - totalGroupWidth) / 2;
        this.characterY = gameHeight - bottomPadding; // Position based on bottom padding

        // Position and animate each character
        let currentX = this.characterStartX;
        // Reverse the array for right-to-left positioning
        this.characters.slice().reverse().forEach((char, index) => {
            char.setOrigin(0.5, 1); // Set origin to bottom center
            char.x = currentX + char.displayWidth / 2;
            char.y = this.characterY;
            char.setDepth(10); // Ensure they are above the background

            // Play animation based on index/sprite key
            if (char.texture.key === 'player') char.play('player_walk_end');
            else if (char.texture.key === 'wife') char.play('wife_walk_end');
            else if (char.texture.key === 'jupi') char.play('jupi_walk_end');
            else if (char.texture.key === 'pip') char.play('pip_walk_end');
            else if (char.texture.key === 'poe') char.play('poe_walk_end');
            // Update currentX for the next character
            currentX += char.displayWidth + characterSpacing;
        });
        // --- End Add Walking Characters ---

        // --- Create Winning Link Button ---
        const buttonStyle = {
            fontSize: '32px', // Larger font size
            fill: '#FFFF00',    // Yellow text
            fontFamily: '"Press Start 2P", monospace',
            align: 'center',
            backgroundColor: '#0000FF', // Blue background for button
            padding: { x: 20, y: 10 }     // Padding around text
        };
        const buttonText = 'Click here to hear the song!';
        this.winButton = this.add.text(
            gameWidth / 2,
            gameHeight / 2, // Centered
            buttonText,
            buttonStyle
        ).setOrigin(0.5)
         // Keep the button fixed relative to the camera (so it doesn't scroll with the world)
         .setScrollFactor(0)
         .setInteractive({ useHandCursor: true })
         .setDepth(1002); // Ensure button is on top

        // Helper to open the win-screen URL (re-used by text + hit zone)
        const openWinLink = () => {
            // Play.fun: save all accumulated points before leaving
            window.playfunSDK?.savePoints();

            const finalUrl = 'https://6000.songaday.world/';
            console.log('EndScene: Win button clicked, opening URL:', finalUrl);

            // Try to open in a new tab. Some mobile browsers block this; if so, fall back.
            const pop = window.open(finalUrl, '_blank');
            if (!pop) {
                console.warn('Popup blocked – falling back to same-tab navigation.');
                window.location.href = finalUrl;
            }
        };

        // Attach to the text object (desktop clicks still work)
        this.winButton.on('pointerdown', openWinLink);

        // --- MOBILE-FRIENDLY HIT ZONE ----------------------------------
        // Many mobile taps miss small text hit-areas; create a larger, invisible
        // interactive rectangle around the button for easier tapping.
        const zonePadding = 40; // px added on each side
        const hitZone = this.add.zone(
            this.winButton.x,
            this.winButton.y,
            this.winButton.displayWidth + zonePadding,
            this.winButton.displayHeight + zonePadding
        ).setOrigin(0.5)
         .setScrollFactor(0)
         .setInteractive({ useHandCursor: true })
         .setDepth(this.winButton.depth); // Match button depth so it sits on top

        hitZone.on('pointerdown', openWinLink);
        // ---------------------------------------------------------------
        // --- End Create Winning Link Button ---

        // --- Auto-scroll variables ---
        this.scrollSpeed = 60; // pixels per second
    }

    wrapBackground(bg1, bg2, cameraScrollX) {
        const imageWidth = bg1.displayWidth; // Assuming bg1 and bg2 have the same width
        const scrollFactor = bg1.scrollFactorX; // Assuming X and Y scroll factors are the same

        // Effective scroll position for this layer
        const layerScrolledDist = cameraScrollX * scrollFactor;

        // Check bg1
        // If the right edge of bg1 (bg1.x + imageWidth) is to the left of the layer's scrolled distance
        if (bg1.x + imageWidth < layerScrolledDist) {
            bg1.x = bg2.x + imageWidth;
        }

        // Check bg2
        if (bg2.x + imageWidth < layerScrolledDist) {
            bg2.x = bg1.x + imageWidth;
        }
    }

    update(time, delta) {
        // --- Auto-scroll the camera to the right (infinitely) ---
        this.cameras.main.scrollX += (this.scrollSpeed * delta) / 1000;

        // --- Wrap Backgrounds ---
        const cameraScrollX = this.cameras.main.scrollX;
        this.wrapBackground(this.bgFar, this.bgFar2, cameraScrollX);
        this.wrapBackground(this.bgMid, this.bgMid2, cameraScrollX);
        this.wrapBackground(this.bgClose, this.bgClose2, cameraScrollX);
        this.wrapBackground(this.bgGround, this.bgGround2, cameraScrollX);

        // --- Move characters with the camera ---
        let currentX = this.cameras.main.scrollX + this.characterStartX; // characterStartX centers them in view
        this.characters.slice().reverse().forEach((char, index) => {
            char.x = currentX + char.displayWidth / 2;
            char.y = this.characterY;
            currentX += char.displayWidth + 30; // characterSpacing
        });
    }

    // --- NEW METHOD for Money Fluctuation in EndScene ---
    fluctuateMoneyEnd() {
        const MIN_MONEY = 150000; // Define your min money for EndScene
        const MAX_MONEY = 750000; // Define your max money for EndScene
        const MAX_CHANGE_PER_TICK = 30000; // Max amount to change each time

        // Calculate a random change amount
        const changeAmount = Phaser.Math.Between(-MAX_CHANGE_PER_TICK, MAX_CHANGE_PER_TICK);

        // Apply the change
        let newValue = this.playerMoney + changeAmount;

        // Clamp the value within the desired range
        newValue = Phaser.Math.Clamp(newValue, MIN_MONEY, MAX_MONEY);

        // Update the player's money
        this.playerMoney = newValue;

        // Update the display text (ensure moneyTextEnd exists)
        if (this.moneyTextEnd) {
            this.moneyTextEnd.setText(`Money: $${Math.floor(this.playerMoney).toLocaleString()}`);
        }
        // ETH remains fixed at 40, so no update needed for ethTextEnd here
    }
    // --- END NEW METHOD ---

    shutdown() {
        console.log("EndScene: shutdown");
        // Stop and remove the money fluctuation timer to prevent it from running in the background
        if (this.moneyFluctuationTimerEnd) {
            this.moneyFluctuationTimerEnd.remove(false);
            this.moneyFluctuationTimerEnd = null;
        }
        // Clean up text objects if necessary, though Phaser usually handles this
        if (this.moneyTextEnd) {
            this.moneyTextEnd.destroy();
            this.moneyTextEnd = null;
        }
        if (this.ethTextEnd) {
            this.ethTextEnd.destroy();
            this.ethTextEnd = null;
        }
    }
}

// Make class available globally if needed
window.EndScene = EndScene;
