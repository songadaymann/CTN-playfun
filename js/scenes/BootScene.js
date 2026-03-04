class BootScene extends Phaser.Scene {

    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        console.log("BootScene: preload");

        // --- Loading Screen Elements ---
        const { width, height } = this.sys.game.config;
        const progressBarWidth = Math.min(width * 0.8, 600); // Max 600px wide, or 80% of screen
        const progressBarHeight = 30;
        const progressBarX = (width - progressBarWidth) / 2;
        const progressBarY = height / 2;
        const textYOffset = 60; // How far below the progress bar the text appears
        const percentTextYOffset = 40; // How far below the "Loading..." text the percentage appears

        // Progress bar background
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

        // Progress bar fill
        const progressBar = this.add.graphics();

        // Loading text
        const loadingText = this.make.text({
            x: width / 2,
            y: progressBarY + textYOffset,
            text: 'Loading...',
            style: {
                fontFamily: '"Press Start 2P"',
                fontSize: '22px',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        // Percentage text
        const percentText = this.make.text({
            x: width / 2,
            y: progressBarY + textYOffset + percentTextYOffset,
            text: '0%',
            style: {
                fontFamily: '"Press Start 2P"',
                fontSize: '22px', // Increase font size
                fill: '#ffffff',
                padding: { x: 5, y: 2 } // Add some padding
            }
        });
        percentText.setOrigin(0.5, 0.5);

        // Update progress bar
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(progressBarX + 5, progressBarY + 5, (progressBarWidth - 10) * value, progressBarHeight - 10); // Add some padding
            percentText.setText(parseInt(value * 100) + '%');
        });

        // On load complete, call a new method to handle post-load setup
        this.load.on('complete', () => {
            console.log("BootScene: All assets loaded.");
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            this.onLoadComplete(); // Call the new method
        });
        // --- End Loading Screen Elements ---


        // --- Load Real Assets ---
        // Load the player atlas
        this.load.atlas('player_atlas', 'assets/spritesheets/player/player.png', 'assets/spritesheets/player/player.json');
        console.log("BootScene: Loading player_atlas");

        // Load the tax monster atlas
        this.load.atlas('tax-monster_atlas', 'assets/spritesheets/tax-monster/tax-monster.png', 'assets/spritesheets/tax-monster/tax-monster.json');
        console.log("BootScene: Loading tax-monster_atlas");

        // --- NEW: Load IRS Agent Atlas ---
        this.load.atlas('irs-agent_atlas', 'assets/spritesheets/irs-agent1/irs-agent.png', 'assets/spritesheets/irs-agent1/irs-agent.json');
        console.log("BootScene: Loading irs-agent_atlas");
        // --- NEW: Load IRS Agent 2 Atlas ---
        this.load.atlas('irs-agent2_atlas', 'assets/spritesheets/irs-agent2/irs-agent2.png', 'assets/spritesheets/irs-agent2/irs-agent2.json');
        console.log("BootScene: Loading irs-agent2_atlas");
        // --- NEW: Load IRS Agent 3 Atlas ---
        this.load.atlas('irs-agent3_atlas', 'assets/spritesheets/irs-agent3/irs-agent3.png', 'assets/spritesheets/irs-agent3/irs-agent3.json');
        console.log("BootScene: Loading irs-agent3_atlas");

        // --- NEW: Load Wall Tree Spikes Atlas ---
        this.load.atlas('wall-tree-spikes_atlas', 'assets/images/scene-one/wall-tree-spikes/wall-tree-spikes.png', 'assets/images/scene-one/wall-tree-spikes/wall-tree-spikes.json');
        console.log("BootScene: Loading wall-tree-spikes_atlas");

        // --- NEW: Load Question Block Atlas ---
        this.load.atlas('question-block_atlas', 'assets/images/scene-one/question-block/question-block.png', 'assets/images/scene-one/question-block/question-block.json');
        console.log("BootScene: Loading question-block_atlas");

        // --- NEW: Load Tile Sprite Sheet Atlas ---
        this.load.atlas('tile_sprite_sheet_atlas', 'assets/images/scene-one/tilemap/tile-sprite-sheet.png', 'assets/images/scene-one/tilemap/tile-sprite-sheet.json');
        console.log("BootScene: Loading tile_sprite_sheet_atlas");

        // --- NEW: Load Ground Atlas ---
        this.load.atlas('ground_atlas', 'assets/images/scene-one/tilemap/ground/ground.png', 'assets/images/scene-one/tilemap/ground/ground.json');
        console.log("BootScene: Loading ground_atlas");

        // --- NEW: Load Aave Loan Scroll Atlas ---
        this.load.atlas('aave-loan-scroll_atlas', 'assets/images/scene-one/aave-loan-scroll/aave-loan-scroll.png', 'assets/images/scene-one/aave-loan-scroll/aave-loan-scroll.json');
        console.log("BootScene: Loading aave-loan-scroll_atlas");

        // --- NEW: Load Scene Two Ground Atlas ---
        this.load.atlas('s2ground_atlas', 'assets/images/scene-two/ground/s2ground.png', 'assets/images/scene-two/ground/s2ground.json');
        console.log("BootScene: Loading s2ground_atlas");

        // --- Load Brick Particle Image for SceneTwo Wall Destruction ---
        this.load.image('brick-part', 'assets/images/scene-two/ground/brick-part.png');
        console.log("BootScene: Loading brick-part image");

        // --- Load Background Images for SceneOne ---
        this.load.image('scene1_bg_far', 'assets/images/scene-one/backgrounds/scene-one-far.png');
        this.load.image('scene1_bg_mid', 'assets/images/scene-one/backgrounds/scene-one-mid.png');
        // NEW: Near / close forest layer for Scene One
        this.load.image('scene1_bg_close', 'assets/images/scene-one/backgrounds/scene-one-close.png');
        console.log("BootScene: Loading background images for SceneOne");

        // --- Load Background Images for SceneTwo (Wide) ---
        this.load.image('scene2_bg_far_wide', 'assets/images/scene-two/backgrounds/far-wide.png');
        this.load.image('scene2_bg_mid_wide', 'assets/images/scene-two/backgrounds/mid-wide.png');
        this.load.image('scene2_bg_close_wide', 'assets/images/scene-two/backgrounds/close-wide.png');
        console.log("BootScene: Loading WIDE background images for SceneTwo");

        // --- Load Background Images for SceneThree ---
        const cb = '?v=' + new Date().getTime(); // Cache buster
        this.load.image('s3_glyph_far', 'assets/images/scene-three/glyph-far.png' + cb);
        this.load.image('s3_glyph_mid', 'assets/images/scene-three/glyph-mid.png' + cb);
        this.load.image('s3_glyph_close', 'assets/images/scene-three/glyph-close.png' + cb);
        console.log("BootScene: Loading background images for SceneThree");

        // Load individual background glyph for SceneThree
        this.load.image('bg_glyph215', 'assets/images/scene-three/autoglyph_images/glyph215.png' + cb);
        console.log("BootScene: Loading bg_glyph215 for SceneThree");

        // --- Load Interstitial Images ---
        this.load.image('interstitial1', 'assets/images/interstitials/scene1.png');
        this.load.image('interstitial2', 'assets/images/interstitials/scene2.png');
        this.load.image('interstitial3', 'assets/images/interstitials/scene3.png');
        this.load.image('interstitial4', 'assets/images/interstitials/scene4.png');
        this.load.image('interstitial5', 'assets/images/interstitials/scene5.png');
        this.load.image('interstitial6', 'assets/images/interstitials/scene6.png');
        console.log("BootScene: Loading interstitial1 image");
        console.log("BootScene: Loading interstitial2 image");
        console.log("BootScene: Loading interstitial3 image");
        console.log("BootScene: Loading interstitial4 image");
        console.log("BootScene: Loading interstitial5 image");
        console.log("BootScene: Loading interstitial6 image");

        // --- Preload HellScene assets (moved from HellScene) ---
        this.load.atlas('tax_coin', 'assets/images/hell/tax-coin.png', 'assets/images/hell/tax-coin.json');
        this.load.image('hell_bg', 'assets/images/hell/hell-background.png');
        this.load.image('hell_fire1', 'assets/images/hell/fire-1.png');
        this.load.image('hell_fire2', 'assets/images/hell/fire-2.png');
        this.load.image('hell_fire3', 'assets/images/hell/fire-3.png');
        this.load.image('hell_arrow', 'assets/images/hell/arrow.png');

        // --- Preload SceneFive assets (moved from SceneFive) ---
        this.load.atlas('player_basket', 'assets/spritesheets/player/player-basket/player-basket.png', 'assets/spritesheets/player/player-basket/player-basket.json');
        this.load.image('opensea_bg', 'assets/images/enter-address/opensea.png');
        this.load.atlas('glyphs', 'assets/spritesheets/numbers/letters-numbers.png', 'assets/spritesheets/numbers/letters-numbers.json');

        // --- Preload SceneSix assets (moved from SceneSix) ---
        this.load.atlas('player_rocket', 'assets/spritesheets/player/player-rocket/player-rocket.png', 'assets/spritesheets/player/player-rocket/player-rocket.json');
        this.load.image('s6_bg_far', 'assets/images/monster-lair/lair-far.png');
        this.load.image('s6_bg_mid', 'assets/images/monster-lair/lair-mid.png');
        this.load.image('s6_bg_front', 'assets/images/monster-lair/lair-front.png');
        this.load.atlas('end_coin', 'assets/images/monster-lair/end-coin.png', 'assets/images/monster-lair/end-coin.json');
        this.load.atlas('irs_agent_ship1', 'assets/spritesheets/irs-agent-ships/irs-agent-ship1/irs-agent-ship1.png', 'assets/spritesheets/irs-agent-ships/irs-agent-ship1/irs-agent-ship1.json');
        this.load.atlas('irs_agent_ship2', 'assets/spritesheets/irs-agent-ships/irs-agent-ship2/irs-agent-ship2.png', 'assets/spritesheets/irs-agent-ships/irs-agent-ship2/irs-agent-ship2.json');
        this.load.atlas('irs_agent_ship3_atlas', 'assets/spritesheets/irs-agent-ships/irs-agent-ship3/irs-agent-ship3.png', 'assets/spritesheets/irs-agent-ships/irs-agent-ship3/irs-agent-ship3.json');
        this.load.atlas('irs_agent_ship4', 'assets/spritesheets/irs-agent-ships/irs-agent-ship4/irs-agent-ship4.png', 'assets/spritesheets/irs-agent-ships/irs-agent-ship4/irs-agent-ship4.json');
        this.load.atlas('explosion_atlas', 'assets/images/monster-lair/explosion/explosion.png', 'assets/images/monster-lair/explosion/explosion.json');
        this.load.atlas('final_tax_monster_atlas', 'assets/spritesheets/tax-monster/final-tax-monster/final-tax-monster.png', 'assets/spritesheets/tax-monster/final-tax-monster/final-tax-monster.json');
        this.load.atlas('dead_tax_monster_atlas', 'assets/spritesheets/tax-monster/deadMonster.png', 'assets/spritesheets/tax-monster/deadMonster.json');
        // SceneSix audio
        this.load.audio('endCreditsMusic', 'assets/music/endCreditsMusic.mp3');
        this.load.audio('shipExplode', 'assets/sound/objects/shipExplode.mp3');
        this.load.audio('coinShoot', 'assets/sound/objects/coinShoot.mp3');
        this.load.audio('enemyHitSix', 'assets/sound/objects/enemyHitSix.mp3');
        this.load.audio('monsterEntrance1', 'assets/sound/monster/monsterEntrance.mp3');
        this.load.audio('monsterEntrance2', 'assets/sound/monster/monsterEntrance2.mp3');
        this.load.audio('endExplosion', 'assets/sound/objects/endExplosion.mp3');
        this.load.audio('playerOwS6', 'assets/sound/player/playerOw.mp3');

        // --- Load Autoglyph Images for SceneThree Ground ---
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
        autoglyphFilenames.forEach(filename => {
            const key = filename.replace('.png', ''); // e.g., "glyph53"
            this.load.image(key, `assets/images/scene-three/autoglyph_images_64/${filename}`);
        });
        console.log("BootScene: Loading autoglyph images for SceneThree ground");

        // --- Create Placeholder Textures (for things not yet replaced) ---
        // Moved to onLoadComplete to ensure it runs after assets are available if needed by placeholders
        // this.createPlaceholderTextures();

        // --- Debug Scene Start Logic ---
        const urlParams = new URLSearchParams(window.location.search);
        const rawParam = urlParams.get('startScene');
        const startSceneParam = rawParam ? rawParam.toLowerCase() : null; // Normalize to lowercase for simpler checks

        let targetScene = 'TitleScene'; // Default scene

        switch (startSceneParam) {
            case 'sceneone':
                targetScene = 'SceneOne';
                console.log('BootScene: URL parameter requests starting SceneOne.');
                break;
            case 'scenetwo':
                targetScene = 'SceneTwo';
                console.log('BootScene: URL parameter requests starting SceneTwo.');
                break;
            case 'scenethree':
                targetScene = 'SceneThree';
                console.log('BootScene: URL parameter requests starting SceneThree.');
                break;
            case 'scenefour':
                targetScene = 'SceneFour';
                console.log('BootScene: URL parameter requests starting SceneFour.');
                break;
            case 'scenefive':
                targetScene = 'SceneFive';
                console.log('BootScene: URL parameter requests starting SceneFive.');
                break;
            case 'scenesix':
                targetScene = 'SceneSix';
                console.log('BootScene: URL parameter requests starting SceneSix.');
                break;
            case 'endscene':
                targetScene = 'EndScene';
                console.log('BootScene: URL parameter requests starting EndScene.');
                break;
            case 'falling':
                targetScene = 'Falling';
                console.log('BootScene: URL parameter requests starting Falling scene.');
                break;
            case 'fire':
            case 'hell':
                targetScene = 'Hell';
                console.log('BootScene: URL parameter requests starting Hell scene.');
                break;
            case 'title':
            case 'titlescene':
                console.log('BootScene: URL parameter requests starting TitleScene.');
                break; // targetScene already TitleScene
            default:
                if (startSceneParam) {
                    console.log(`BootScene: Unknown startScene parameter "${rawParam}", defaulting to TitleScene.`);
                }
                // else no param: keep default
        }
        // --- End Debug Scene Start Logic ---

        // console.log(`BootScene: preload complete, starting ${targetScene}...`); // Moved to onLoadComplete
        // REMOVED: this.scene.start(targetScene); // Don't start next scene yet
        this.targetScene = targetScene; // Store the target scene name

        // NEW: Load the Do Kwon boss atlas
        this.load.atlas('do-kwon_atlas', 'assets/spritesheets/do-kwon/do-kwon.png', 'assets/spritesheets/do-kwon/do-kwon.json');
        console.log("BootScene: Loading do-kwon_atlas");

        // NEW: Load Red Candles Atlas (projectiles fired by Do Kwon)
        this.load.atlas('red-candles_atlas', 'assets/spritesheets/red-candles/red-candles.png', 'assets/spritesheets/red-candles/red-candles.json');
        console.log("BootScene: Loading red-candles_atlas");

        // --- NEW: Load Tax Yell Man Atlas ---
        this.load.atlas('tax-yell1_atlas', 'assets/spritesheets/tax-yell-men/tax-yell1.png', 'assets/spritesheets/tax-yell-men/tax-yell1.json');
        console.log("BootScene: Loading tax-yell1_atlas");

        // --- NEW: Load Tax Yell Man 2 Atlas ---
        this.load.atlas('tax-yell2_atlas', 'assets/spritesheets/tax-yell-men/tax-yell2.png', 'assets/spritesheets/tax-yell-men/tax-yell2.json');
        console.log("BootScene: Loading tax-yell2_atlas");

        // --- NEW: Load Tax Yell Man 3 Atlas ---
        this.load.atlas('tax-yell3_atlas', 'assets/spritesheets/tax-yell-men/tax-yell3.png', 'assets/spritesheets/tax-yell-men/tax-yell3.json');
        console.log("BootScene: Loading tax-yell3_atlas");

        // --- NEW: Load Wife Atlas ---
        this.load.atlas('wife_atlas', 'assets/spritesheets/wife/wife.png', 'assets/spritesheets/wife/wife.json');
        console.log("BootScene: Loading wife_atlas");

        // --- Load coin atlas for ThreeMillionScene / SceneOne particles ---
        this.load.atlas('coin', 'assets/images/three-million/coin.png', 'assets/images/three-million/coin.json');
        console.log("BootScene: Loading coin atlas for three-million");

        // --- MUSIC ASSETS ---
        console.log("BootScene: Loading music assets...");
        this.load.audio('titleMusic', 'assets/music/titleMusic.mp3');
        this.load.audio('sceneOneMusic', 'assets/music/sceneOneMusic.mp3');
        this.load.audio('sceneTwoMusic', 'assets/music/sceneTwoMusic.mp3');
        // Add other music tracks here, e.g.:
        // this.load.audio('bossBattleMusic', 'assets/music/placeholder_boss.mp3');
        
        this.load.audio('threeMillionMusic', 'assets/music/threeMillionMusic.mp3');
        console.log("BootScene: Loading threeMillionMusic");
        this.load.audio('fallingMusic', 'assets/music/fallingMusic.mp3');
        console.log("BootScene: Loading fallingMusic");
        this.load.audio('hellMusic', 'assets/music/hellMusic.mp3');
        console.log("BootScene: Loading hellMusic");
        this.load.audio('sceneThreeMusic', 'assets/music/sceneThreeMusic.mp3');
        console.log("BootScene: Loading sceneThreeMusic");
        // NEW: Load SceneFour Music
        this.load.audio('sceneFourMusic', 'assets/music/sceneFourMusic.mp3');
        console.log("BootScene: Loading sceneFourMusic");
        // NEW: Load SceneFive Music
        this.load.audio('sceneFiveMusic', 'assets/music/sceneFiveMusic.mp3');
        console.log("BootScene: Loading sceneFiveMusic");
        // NEW: Load SceneSix Music
        this.load.audio('sceneSixMusic', 'assets/music/sceneSixMusic.mp3');
        console.log("BootScene: Loading sceneSixMusic");
        console.log("BootScene: Finished loading music assets.");

        // --- SOUND EFFECT ASSETS ---
        console.log("BootScene: Loading sound effect assets...");
        const soundManager = this.registry.get('soundManagerInstance'); // Attempt to get, might be undefined here
        if (soundManager) { // This check might be too early if SM is created in create()
            soundManager.loadSound(this, 'playerJumpSound', 'assets/sound/player/jump.mp3');
            soundManager.loadSound(this, 'playerHitSound', 'assets/sound/player/hit.mp3');
            soundManager.loadSound(this, 'monsterEntranceSound', 'assets/sound/monster/monsterEntrance.mp3');
            soundManager.loadSound(this, 'questionBlockHitSound', 'assets/sound/objects/questionBlockHit.mp3');
            soundManager.loadSound(this, 'aaveLoanSound', 'assets/sound/objects/aaveLoanPaper.mp3');
            soundManager.loadSound(this, 'monsterJumpSound', 'assets/sound/monster/monsterEntrance2.mp3');
            soundManager.loadSound(this, 'playerOwSound', 'assets/sound/player/playerOw.mp3');
            soundManager.loadSound(this, 'ringlossSound', 'assets/sound/player/ringloss.mp3');
            soundManager.loadSound(this, 'taxYellSound', 'assets/sound/monster/taxYell.mp3');
            soundManager.loadSound(this, 'wifeThankYouSound', 'assets/sound/player/wifeThankYou.mp3');
            soundManager.loadSound(this, 'wifeWorriedSound', 'assets/sound/player/wifeWorried.mp3');
            soundManager.loadSound(this, 'teleportSound', 'assets/sound/objects/teleport.mp3');
            soundManager.loadSound(this, 'aaveRepaySound', 'assets/sound/objects/aaveRepay.mp3');
            soundManager.loadSound(this, 'correctLetterSound', 'assets/sound/objects/correctLetter.mp3'); // New sound for SceneFive
            soundManager.loadSound(this, 'swingGuitarSound', 'assets/sound/player/swingGuitar.mp3'); // New sound for player attack
            soundManager.loadSound(this, 'questionBlockFallSound', 'assets/sound/objects/questionBlockFall.mp3'); // Sound for question block falling
            soundManager.loadSound(this, 'getAaveSound', 'assets/sound/player/getAAve.mp3'); // Sound for getting Aave loan
            soundManager.loadSound(this, 'barrierSuccessSound', 'assets/sound/player/success.mp3'); // Sound for passing barrier
            soundManager.loadSound(this, 'steadyLadsSound', 'assets/sound/dokwon/steadyLads.mp3'); // Sound for Do Kwon appearance
            soundManager.loadSound(this, 'throwCandleSound', 'assets/sound/dokwon/throwCandle.mp3'); // Sound for Do Kwon throwing candle
             // Add new sounds here, e.g.:
            // soundManager.loadSound(this, 'coinCollectSound', 'assets/sound/placeholder_coin.mp3');

        } else {
            // Fallback: Load directly if SoundManager isn't ready (it won't be in preload if initialized in create)
            // This is the typical path for sounds loaded in preload before SoundManager is up.
            console.warn("BootScene: SoundManager instance not found in registry during preload. Loading sounds directly.");
            this.load.audio('playerJumpSound', 'assets/sound/player/jump.mp3');
            this.load.audio('playerHitSound', 'assets/sound/player/hit.mp3');
            this.load.audio('monsterEntranceSound', 'assets/sound/monster/monsterEntrance.mp3');
            this.load.audio('questionBlockHitSound', 'assets/sound/objects/questionBlockHit.mp3');
            this.load.audio('aaveLoanSound', 'assets/sound/objects/aaveLoanPaper.mp3');
            this.load.audio('monsterJumpSound', 'assets/sound/monster/monsterEntrance2.mp3');
            this.load.audio('playerOwSound', 'assets/sound/player/playerOw.mp3');
            this.load.audio('ringlossSound', 'assets/sound/player/ringloss.mp3');
            this.load.audio('taxYellSound', 'assets/sound/monster/taxYell.mp3');
            this.load.audio('wifeThankYouSound', 'assets/sound/player/wifeThankYou.mp3');
            this.load.audio('wifeWorriedSound', 'assets/sound/player/wifeWorried.mp3');
            this.load.audio('teleportSound', 'assets/sound/objects/teleport.mp3');
            this.load.audio('aaveRepaySound', 'assets/sound/objects/aaveRepay.mp3');
            this.load.audio('correctLetterSound', 'assets/sound/objects/correctLetter.mp3');
            this.load.audio('swingGuitarSound', 'assets/sound/player/swingGuitar.mp3');
            this.load.audio('questionBlockFallSound', 'assets/sound/objects/questionBlockFall.mp3');
            this.load.audio('getAaveSound', 'assets/sound/player/getAAve.mp3');
            this.load.audio('barrierSuccessSound', 'assets/sound/player/success.mp3');
            this.load.audio('steadyLadsSound', 'assets/sound/dokwon/steadyLads.mp3');
            this.load.audio('throwCandleSound', 'assets/sound/dokwon/throwCandle.mp3');
        }
        console.log("BootScene: Finished loading sound effect assets.");

        // --- NEW: Load ETH Coin (used for particle bursts) ---
        this.load.atlas('coin_atlas', 'assets/images/three-million/coin.png', 'assets/images/three-million/coin.json');
        console.log("BootScene: Loading coin_atlas");
    }

    // This method will now contain the logic originally in create()
    onLoadComplete() {
        console.log("BootScene: onLoadComplete - All assets loaded, proceeding with setup.");

        // Initialize global player hit counter in the registry
        this.registry.set('playerHits', 0);

        // --- Initialize Music Manager ---
        console.log("BootScene: Initializing MusicManager...");
        const musicManager = new MusicManager(this.game);
        this.registry.set('musicManager', musicManager);
        musicManager.addTrack('titleMusic');
        musicManager.addTrack('sceneOneMusic');
        musicManager.addTrack('sceneTwoMusic');
        musicManager.addTrack('fallingMusic');
        musicManager.addTrack('hellMusic');
        musicManager.addTrack('sceneThreeMusic');
        musicManager.addTrack('threeMillionMusic');
        musicManager.addTrack('sceneFourMusic');
        musicManager.addTrack('sceneFiveMusic');
        musicManager.addTrack('sceneSixMusic');
        console.log("BootScene: MusicManager initialized and tracks added.");

        // --- Initialize Sound Manager ---
        console.log("BootScene: Initializing SoundManager...");
        const localSoundManager = new SoundManager(this.game);
        this.registry.set('soundManager', localSoundManager);
        this.registry.set('soundManagerInstance', localSoundManager); // For preload access if needed (though direct load is fallback)
        console.log("BootScene: SoundManager initialized and added to registry.");
        // Sounds loaded directly in preload will be in Phaser's cache.
        // SoundManager's playSound method should be able to access them.

        // Generate placeholder textures (using graphics)
        this.createPlaceholderTextures();

        // --- Player Animations ---
        this.anims.create({
            key: 'player_idle',
            frames: [ { key: 'player_atlas', frame: 'idle.png' } ],
            frameRate: 1,
            repeat: 0
        });
        this.anims.create({
            key: 'player_walk',
            frames: this.anims.generateFrameNames('player_atlas', { prefix: 'WALK-', suffix: '.png', start: 2, end: 6 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'player_jump',
            frames: [ { key: 'player_atlas', frame: 'JUMP-3.png' } ],
            frameRate: 1,
            repeat: 0
        });
        this.anims.create({
            key: 'player_attack',
            frames: this.anims.generateFrameNames('player_atlas', { prefix: 'hit', suffix: '.png', start: 1, end: 3 }),
            frameRate: 15,
            repeat: 0
        });
        this.anims.create({
            key: 'player_aave_loan',
            frames: [ { key: 'player_atlas', frame: 'aave-loan.png' } ],
            frameRate: 1,
            repeat: 0
        });
        console.log("BootScene: Player animations created.");

        // --- Tax Monster Animations ---
        this.anims.create({
            key: 'tax-monster_idle',
            frames: this.anims.generateFrameNames('tax-monster_atlas', { prefix: 'tax-monster-idle', start: 1, end: 2, suffix: '.png' }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: 'tax-monster_run',
            frames: this.anims.generateFrameNames('tax-monster_atlas', { prefix: 'tax-monster-run', start: 1, end: 2, suffix: '.png' }),
            frameRate: 5,
            repeat: -1
        });
        console.log("BootScene: Tax Monster animations created.");

        // --- IRS Agent Animations ---
        this.anims.create({
            key: 'irs-agent_run',
            frames: this.anims.generateFrameNames('irs-agent_atlas', { prefix: 'IRS1-run', start: 1, end: 2, suffix: '.png' }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'irs-agent_hit',
            frames: [ { key: 'irs-agent_atlas', frame: 'IRS-got-hit.png' } ],
            frameRate: 1,
            repeat: 0
        });
        this.anims.create({
            key: 'irs-agent2_run',
            frames: [
                { key: 'irs-agent2_atlas', frame: 'irs-agent2-run1.png' },
                { key: 'irs-agent2_atlas', frame: 'irs-agent2-run2.png' }
            ],
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'irs-agent2_hit',
            frames: [ { key: 'irs-agent2_atlas', frame: 'irs-agent2-hit.png' } ],
            frameRate: 1,
            repeat: 0
        });
        this.anims.create({
            key: 'irs-agent3_run',
            frames: [
                { key: 'irs-agent3_atlas', frame: 'irs-agent3-run1.png' },
                { key: 'irs-agent3_atlas', frame: 'irs-agent3-run2.png' }
            ],
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'irs-agent3_hit',
            frames: [ { key: 'irs-agent3_atlas', frame: 'irs-agent3-hit.png' } ],
            frameRate: 1,
            repeat: 0
        });
        console.log("BootScene: IRS Agent animations created.");

        // --- Question Block Animations ---
        this.anims.create({
            key: 'question-block_spin',
            frames: this.anims.generateFrameNames('question-block_atlas', { prefix: 'QB', start: 1, end: 3, suffix: '.png' }),
            frameRate: 6,
            repeat: -1
        });
        console.log("BootScene: Created question-block_spin animation");

        // --- Do Kwon Animations (boss) ---
        this.anims.create({
            key: 'do-kwon_left',
            frames: [
                { key: 'do-kwon_atlas', frame: 'do-kwon-left-mid.png' },
                { key: 'do-kwon_atlas', frame: 'do-kwon-left.png' }
            ],
            frameRate: 4,
            repeat: -1
        });
        this.anims.create({
            key: 'do-kwon_right',
            frames: [
                { key: 'do-kwon_atlas', frame: 'do-kwon-right-mid.png' },
                { key: 'do-kwon_atlas', frame: 'do-kwon-right.png' }
            ],
            frameRate: 4,
            repeat: -1
        });
        this.anims.create({
            key: 'do-kwon_idle',
            frames: [ { key: 'do-kwon_atlas', frame: 'do-kwon-middle.png' } ],
            frameRate: 1,
            repeat: 0
        });
        console.log("BootScene: Do Kwon animations created.");

        // --- Tax Yell Man Animations ---
        this.anims.create({
            key: 'tax_yell',
            frames: this.anims.generateFrameNames('tax-yell1_atlas', {
                prefix: 'tax-yell1-',
                suffix: '.png',
                frames: ['closed', 'open']
            }),
            frameRate: 2,
            repeat: -1
        });
        this.anims.create({
            key: 'tax_yell_sides',
            frames: [
                { key: 'tax-yell2_atlas', frame: 'tax-yell2-closed.png' },
                { key: 'tax-yell2_atlas', frame: 'tax-yell2-openL.png' },
                { key: 'tax-yell2_atlas', frame: 'tax-yell2-closed.png' },
                { key: 'tax-yell2_atlas', frame: 'tax-yell2-openR.png' }
            ],
            frameRate: 2,
            repeat: -1
        });
        this.anims.create({
            key: 'tax_yell_everything',
            frames: this.anims.generateFrameNames('tax-yell3_atlas', {
                prefix: 'tax-yell3-',
                suffix: '.png',
                frames: ['closed', 'open']
            }),
            frameRate: 2,
            repeat: -1
        });
        console.log("BootScene: Tax Yell Man animations created.");

        // --- Wife Animations ---
        this.anims.create({
            key: 'wife_idle',
            frames: [ { key: 'wife_atlas', frame: 'wife-idle.png' } ],
            frameRate: 1,
            repeat: 0
        });
        this.anims.create({
            key: 'wife_walk',
            frames: this.anims.generateFrameNames('wife_atlas', {
                prefix: 'wife-walk',
                suffix: '.png',
                start: 1,
                end: 2
            }),
            frameRate: 5,
            repeat: -1
        });
        console.log("BootScene: Wife animations (idle, walk) created.");

        console.log(`BootScene: onLoadComplete finished, starting ${this.targetScene}...`);
        this.scene.start(this.targetScene);
    }

    // create() is now empty as its logic moved to onLoadComplete
    create() {
        console.log("BootScene: create (now intentionally empty, logic moved to onLoadComplete)");
    }

    createPlaceholderTextures() {
        const tileSize = 64; // Use a consistent variable

        // Ground Placeholder (Reused for Wall for now)
        const groundGfx = this.make.graphics({ x: 0, y: 0, add: false });
        groundGfx.fillStyle(0x8B4513, 1); // Brown color for ground/wall
        groundGfx.fillRect(0, 0, tileSize, tileSize);
        groundGfx.generateTexture('ground-placeholder', tileSize, tileSize);
        groundGfx.destroy();

        // IRS Agent Placeholder
        const agentWidth = 32;
        const agentHeight = 48;
        const agentGfx = this.make.graphics({ x: 0, y: 0, add: false });
        agentGfx.fillStyle(0x0000FF, 1); // Blue color
        agentGfx.fillRect(0, 0, agentWidth, agentHeight);
        agentGfx.generateTexture('irs-agent-placeholder', agentWidth, agentHeight);
        agentGfx.destroy();

        // Tax Monster Placeholder
        const taxMonsterWidth = 160;
        const taxMonsterHeight = 320;
        const taxMonsterGfx = this.make.graphics({ x: 0, y: 0, add: false });
        taxMonsterGfx.fillStyle(0xFF0000, 1); // Red color
        taxMonsterGfx.fillRect(0, 0, taxMonsterWidth, taxMonsterHeight);
        taxMonsterGfx.generateTexture('tax-monster-placeholder', taxMonsterWidth, taxMonsterHeight);
        taxMonsterGfx.destroy();

        // Funnel Placeholder
        const funnelWidth = 50;
        const funnelHeight = 30;
        const funnelGfx = this.make.graphics({ x: 0, y: 0, add: false });
        funnelGfx.fillStyle(0x808080, 1); // Gray color
        funnelGfx.fillRect(0, 0, funnelWidth, funnelHeight);
        funnelGfx.generateTexture('funnel-placeholder', funnelWidth, funnelHeight);
        funnelGfx.destroy();

        // Coin Placeholder
        const coinRadius = 8;
        const coinDiameter = coinRadius * 2;
        const coinGfx = this.make.graphics({ x: 0, y: 0, add: false });
        coinGfx.fillStyle(0xFFD700, 1); // Gold color
        coinGfx.fillCircle(coinRadius, coinRadius, coinRadius);
        coinGfx.generateTexture('coin-placeholder', coinDiameter, coinDiameter);
        coinGfx.destroy();

        // Question Mark Block Placeholder
        const qMarkGfx = this.make.graphics({ x: 0, y: 0, add: false });
        qMarkGfx.fillStyle(0xFFFF00, 1); // Yellow color
        qMarkGfx.fillRect(0, 0, tileSize, tileSize);
        qMarkGfx.lineStyle(4, 0x000000, 1); // Black outline
        qMarkGfx.strokeRect(0, 0, tileSize, tileSize);
        // Draw a simple question mark
        qMarkGfx.fillStyle(0x000000, 1); // Black for the mark
        qMarkGfx.font = '48px Arial'; // Use Phaser's text drawing (though graphics font is basic)
        // Approximation with shapes - adjust coordinates as needed for tileSize=64
        const qMarkCenterX = tileSize / 2;
        const qMarkCenterY = tileSize / 2;
        qMarkGfx.fillRect(qMarkCenterX - 15, qMarkCenterY - 20, 30, 10); // Top curve bar
        qMarkGfx.fillRect(qMarkCenterX + 5, qMarkCenterY - 15, 10, 25); // Top right vertical
        qMarkGfx.fillRect(qMarkCenterX - 15, qMarkCenterY - 15, 10, 15); // Top left vertical adjust
        qMarkGfx.fillRect(qMarkCenterX - 5, qMarkCenterY + 0, 10, 15);  // Main stem
        qMarkGfx.fillRect(qMarkCenterX - 5, qMarkCenterY + 20, 10, 10); // Dot
        qMarkGfx.generateTexture('question-mark-placeholder', tileSize, tileSize);
        qMarkGfx.destroy(); // Clean up graphics object

        // Aave Loan Placeholder (Simple green rectangle for now)
        const loanWidth = 40;
        const loanHeight = 60;
        const loanGfx = this.make.graphics({ x: 0, y: 0, add: false });
        loanGfx.fillStyle(0x228B22, 1); // Forest Green color
        loanGfx.fillRect(0, 0, loanWidth, loanHeight);
        loanGfx.generateTexture('aave-loan-placeholder', loanWidth, loanHeight);
        loanGfx.destroy();

        // Do Kwon Placeholder
        const doKwonWidth = 160; // Match tax monster
        const doKwonHeight = 320; // Match tax monster
        const doKwonGfx = this.make.graphics({ x: 0, y: 0, add: false });
        doKwonGfx.fillStyle(0x8A2BE2, 1); // Blue Violet color (example)
        doKwonGfx.fillRect(0, 0, doKwonWidth, doKwonHeight);
        doKwonGfx.generateTexture('do-kwon-placeholder', doKwonWidth, doKwonHeight);
        doKwonGfx.destroy();

        // Red Candle Placeholder
        const candleWidth = 15;
        const candleHeight = 50;
        const candleGfx = this.make.graphics({ x: 0, y: 0, add: false });
        candleGfx.fillStyle(0xFF0000, 1); // Bright Red
        // Optional: Add a 'wick' or outline
        // candleGfx.fillStyle(0x000000, 1); // Black wick
        // candleGfx.fillRect(candleWidth / 2 - 1, 0, 2, 5); // Small wick at top
        // candleGfx.lineStyle(1, 0x8B0000, 1); // Dark red outline
        // candleGfx.strokeRect(0, 0, candleWidth, candleHeight);
        candleGfx.fillRect(0, 0, candleWidth, candleHeight); // Solid red for now
        candleGfx.generateTexture('red-candle-placeholder', candleWidth, candleHeight);
        candleGfx.destroy();

        // Cloud Placeholder
        const cloudWidth = 128;
        const cloudHeight = 64;
        const cloudGfx = this.make.graphics({ x: 0, y: 0, add: false });
        cloudGfx.fillStyle(0xffffff, 0.9); // White, slightly transparent
        // Draw a simple cloud shape (ellipse)
        cloudGfx.fillEllipse(cloudWidth / 2, cloudHeight / 2, cloudWidth, cloudHeight);
        cloudGfx.generateTexture('cloud-placeholder', cloudWidth, cloudHeight);
        cloudGfx.destroy();

        console.log("BootScene: Finished generating textures.");
    }

    update() {
        //console.log("BootScene: update"); // Can be noisy
    }
}

// Make class available (if using modules later)
// export default BootScene;
