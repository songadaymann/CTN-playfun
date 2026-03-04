class InterstitialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InterstitialScene' });
    }

    init(data) {
        this.nextSceneKey = data.nextSceneKey;
        this.imageKey = data.imageKey;
        this.sceneData = data.sceneData || {}; // Data to pass to the next scene
    }

    create() {
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // Display the interstitial image
        const img = this.add.image(gameWidth / 2, gameHeight / 2, this.imageKey);

        // Optional: Scale image to fit screen if needed, maintaining aspect ratio
        // This example scales to fit width, adjust as necessary
        let scale = gameWidth / img.width;
        // If scaling by width makes it too tall, scale by height instead
        if (img.height * scale > gameHeight) {
            scale = gameHeight / img.height;
        }
        img.setScale(scale);

        // Set a timer to transition to the next scene
        this.time.delayedCall(2500, () => { // 2.5 seconds delay
            this.scene.start(this.nextSceneKey, this.sceneData);
        }, [], this);
    }
} 