class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    preload() {
        // Layered start-screen assets
        this.load.image('startBg',       'assets/images/start-screen/background.png');
        this.load.image('startSprites',  'assets/images/start-screen/sprites.png');
        this.load.image('pressReturn',   'assets/images/start-screen/press-return1.png');
    }

    create() {
        const { width, height } = this.scale;

        // Play Title Screen Music
        const bootScene = this.scene.get('BootScene');
        if (bootScene && bootScene.musicManager) {
            bootScene.musicManager.playMusic('TitleScene');
        } else {
            console.warn('MusicManager not found in TitleScene. Cannot play music.');
        }

        // ----- Background layer -----
        this.add
            .image(0, 0, 'startBg')
            .setOrigin(0, 0)
            .setDisplaySize(width, height) // Ensure full coverage
            .setScrollFactor(0)            // Fixed to camera
            .setDepth(0);

        // ----- Sprites layer -----
        this.add
            .image(0, 0, 'startSprites')
            .setOrigin(0, 0)
            .setDisplaySize(width, height)
            .setScrollFactor(0)
            .setDepth(10);

        // ----- Blinking "Press Return" prompt -----
        const pressImg = this.add
            .image(width / 2, height * 0.9, 'pressReturn') // Near bottom-center
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0) // Keep fixed relative to camera (important during shake)
            .setDepth(20);

        // DEBUG: confirm the texture actually exists and output its base size
        console.log('pressReturn texture loaded →', this.textures.exists('pressReturn'),
                    this.textures.exists('pressReturn') ? this.textures.get('pressReturn').getSourceImage().width + 'x' + this.textures.get('pressReturn').getSourceImage().height : 'missing');

        // Blink effect (fade in/out)
        this.tweens.add({
            targets: pressImg,
            alpha: 0,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Quad.easeInOut'
        });

        // ----- Lightning layer (white flashes between bg & sprites) -----
        const lightningRect = this.add
            .rectangle(0, 0, width, height, 0xffffff)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(5);

        // Helper: perform a single flash
        const doFlash = () => {
            lightningRect.setAlpha(1);
            this.cameras.main.shake(100, 0.01);
            this.tweens.add({
                targets: lightningRect,
                alpha: 0,
                duration: 120,
                ease: 'Quad.easeOut'
            });
        };

        // Schedule groups of flashes (2–4) every 3–8 seconds
        const scheduleLightning = () => {
            const groupDelay = Phaser.Math.Between(1000, 4000); // 3–8 s between groups
            const flashesInGroup = Phaser.Math.Between(2, 4);  // 2–4 flashes per group

            this.time.delayedCall(groupDelay, () => {
                let flashCount = 0;
                const flashInterval = 180; // ms between flashes in a group

                const flashSequence = () => {
                    doFlash();
                    flashCount += 1;
                    if (flashCount < flashesInGroup) {
                        this.time.delayedCall(flashInterval, flashSequence);
                    } else {
                        // After completing the group, queue up the next one
                        scheduleLightning();
                    }
                };

                flashSequence(); // Start the first flash immediately after delay
            });
        };
        scheduleLightning();

        const startGame = () => {
            const bootScene = this.scene.get('BootScene');

            const playMusicAndStartTransition = () => {
                if (bootScene && bootScene.musicManager) {
                    console.log('TitleScene: Starting game.');
                    bootScene.musicManager.stopMusic(false);
                    bootScene.musicManager.playMusic('TitleScene');
                }
                this.time.delayedCall(0, () => {
                    this.scene.start('ThreeMillionScene');
                });
            };

            if (this.sound.context.state === 'suspended') {
                this.sound.context.resume().then(playMusicAndStartTransition)
                    .catch(() => this.scene.start('ThreeMillionScene'));
            } else {
                playMusicAndStartTransition();
            }
        };

        // Start on ENTER key or tap
        this.input.keyboard.once('keydown-ENTER', startGame);
        this.input.once('pointerdown', startGame);
    }
}
