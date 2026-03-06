// --- mann.cool Virtual Controller Support ---
// Listen for control inputs from mann.cool virtual gamepad (mobile)
window.addEventListener('message', (event) => {
    const { type, key, eventType } = event.data || {};
    
    // Resume audio context if suspended (browser suspends when clicking outside iframe)
    if (window.game && window.game.sound && window.game.sound.context) {
        const audioContext = window.game.sound.context;
        if (audioContext.state === 'suspended') {
            console.log('🎮 Resuming suspended audio context');
            audioContext.resume().then(() => {
                console.log('🎮 Audio context resumed successfully');
            }).catch(err => {
                console.warn('🎮 Failed to resume audio context:', err);
            });
        }
    }
    
    // Handle keyboard events from virtual controller by updating touchControls
    if (type === 'keyEvent' && key && eventType && window.game && window.game.touchControls) {
        const isDown = eventType === 'keydown';
        const dirs = window.game.touchControls.directions;
        
        console.log('🎮 CTN received key event:', key, eventType, 'isDown:', isDown);
        console.log('🎮 Before update - dirs:', JSON.stringify(dirs));
        
        // Map keys to touch control directions
        if (key === 'ArrowUp' || key === 'w' || key === 'W') {
            dirs.up = isDown;
        } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
            dirs.down = isDown;
        } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
            dirs.left = isDown;
        } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
            dirs.right = isDown;
        } else if (key === ' ' || key === 'Space') {
            // Space/jump maps to 'up' for jumping in this game
            dirs.up = isDown;
        } else if (key === 'x' || key === 'X') {
            dirs.action = isDown;
        }
        console.log('🎮 After update - dirs:', JSON.stringify(dirs));
    }
    
    // Handle click events (for attack button) - set touch.action flag
    if (type === 'clickEvent' && eventType && window.game && window.game.touchControls) {
        const isDown = eventType === 'mousedown';
        console.log('🎮 CTN received click event:', eventType, '-> setting action:', isDown);
        window.game.touchControls.directions.action = isDown;
    }
});
console.log('🎮 mann.cool controller listener initialized');

// --- Play.fun SDK Initialization ---
window.playfunSDK = null;
async function initPlayFun() {
    if (typeof OpenGameSDK === 'undefined') {
        console.warn('Play.fun SDK not loaded');
        return;
    }
    try {
        window.playfunSDK = new OpenGameSDK({
            ui: { usePointsWidget: true }
        });
        await window.playfunSDK.init();
        console.log('Play.fun SDK initialized');
    } catch (e) {
        console.warn('Play.fun SDK init failed:', e);
        window.playfunSDK = null;
    }
}
initPlayFun();

// Helper: award points from any scene
// Auto-saves after level completions (50+ points) so progress isn't lost
let _unsavedPoints = 0;
function awardPoints(points) {
    if (!window.playfunSDK) return;
    window.playfunSDK.addPoints(points);
    _unsavedPoints += points;
    // Save immediately on big awards (level complete, boss defeat, etc.)
    if (_unsavedPoints >= 50) {
        window.playfunSDK.savePoints();
        _unsavedPoints = 0;
    }
}

// Save points on page close so nothing is lost
window.addEventListener('beforeunload', () => {
    window.playfunSDK?.savePoints();
});

// --- Global Game Configuration ---
const config = {
    type: Phaser.AUTO, // Automatically choose WebGL or Canvas
    pauseOnBlur: false, // Don't pause when clicking outside (needed for mann.cool virtual controller)
    audio: {
        disableWebAudio: false,
        noAudio: false,
    },
    scale: {
        mode: Phaser.Scale.FIT, // Fit the game within the container
        parent: 'phaser-game-container', // ID of the div to contain the game (optional, create in index.html if needed)
        autoCenter: Phaser.Scale.CENTER_BOTH, // Center the game canvas horizontally and vertically
        width: 1280,  // Base width of the game
        height: 720, // Base height of the game
    },
    physics: {
        default: 'arcade', // Use Arcade Physics
        arcade: {
            gravity: { y: 0 }, // Global gravity is set per-object (like in Player.js)
            debug: false // Set to true to see physics bodies and velocity
        }
    },
    input: {
        activePointers: 5 // Support up to 5 concurrent touches (move + jump + attack, etc.)
    },
    scene: [
        BootScene,  // Start with BootScene to load assets/generate textures
        TitleScene, // Add TitleScene here
        ThreeMillionScene, // Add ThreeMillionScene here
        InterstitialScene, // Add the new Interstitial Scene
        SceneOne,   // Then transition to SceneOne
        SceneTwo,   // Add SceneTwo to the list
        FallingScene, // New falling sequence scene
        HellScene, // New hell scene (single-screen rain)
        SceneThree, // Falling concludes here
        SceneFour, // New top-down river level
        SceneFive, // Basket number-collection scene
        SceneSix, // Side-scrolling shoot 'em up
        EndScene    // Final end credits/win scene
        
        
        // Add other scenes like TitleScene, EndScene here later
    ]
};

// --- Helper Functions for Fullscreen API ---
function requestFullScreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) { // Firefox
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) { // Chrome, Safari and Opera
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { // IE/Edge
        element.msRequestFullscreen();
    }
}

function exitFullScreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
    }
}

// --- Initialize Phaser Game ---
window.onload = () => {
    // Optional: Check if Player class is loaded if not using modules
    if (typeof Player === 'undefined') {
        console.error("Player class not found. Make sure Player.js is included before game.js or use modules.");
        return;
    }
    // Optional: Check for BootScene and GameScene too
    if (typeof BootScene === 'undefined' || typeof SceneOne === 'undefined' || typeof SceneTwo === 'undefined' || typeof TitleScene === 'undefined' || typeof ThreeMillionScene === 'undefined' || typeof EndScene === 'undefined') {
        console.error("Required Scene classes not found.");
        return;
    }

    console.log("Initializing Phaser game...");
    const game = new Phaser.Game(config);
    window.game = game;
    console.log("Phaser game instance created:", game);

    // Check if we're running inside an iframe (e.g., embedded in mann.cool or play.fun)
    const isInIframe = window.self !== window.top;
    // Detect mann.cool specifically — it provides its own virtual controller
    const isMannCool = isInIframe && document.referrer.includes('mann.cool');

    // Create touch controls for mobile users (skip only if mann.cool provides its own)
    if (isMobileDevice() && !isMannCool) {
        game.touchControls = new TouchControls();
    } else {
        // Provide a dummy object for desktop / mann.cool to prevent errors
        // mann.cool will update this via postMessage
        game.touchControls = {
            directions: { left: false, right: false, up: false, down: false, action: false },
            destroy: () => {}, // No-op destroy
            getDirections: function() { return this.directions; } // Ensure getDirections exists
        };
        // Hide the touch controls container if it exists
        const touchControlsContainer = document.querySelector('.touch-controls');
        if (touchControlsContainer) {
            touchControlsContainer.style.display = 'none';
        }
    }

    // Initial orientation warning state (hide if in iframe)
    const warning = document.getElementById('rotate-warning');
    if (warning) {
        if (isInIframe) {
            warning.style.display = 'none'; // Always hide in iframe
        } else if (isMobileDevice() && isPortrait()) {
            warning.style.display = 'flex'; // Show if user in portrait at load
        } else {
            warning.style.display = 'none'; // Explicitly hide on desktop or mobile landscape
        }
    }

    // --- Start Scene Logic (with URL parameter override) ---
    const urlParams = new URLSearchParams(window.location.search);
    const startSceneParam = urlParams.get('startScene');
    let initialScene = 'BootScene'; // Default start scene

    if (startSceneParam) {
        const requestedSceneKey = startSceneParam.charAt(0).toUpperCase() + startSceneParam.slice(1);
        // Check if the requested scene exists in the game's scene manager
        // This requires the game instance to be created first.
        // We also need to ensure EndScene is in the config.scenes array.
        let sceneExists = false;
        config.scene.forEach(sceneClass => {
            if (sceneClass.name === requestedSceneKey || sceneClass.name.toLowerCase() === startSceneParam.toLowerCase()) {
                sceneExists = true;
            }
        });

        if (sceneExists) {
            initialScene = requestedSceneKey;
            console.log(`URL parameter 'startScene' found. Starting with: ${initialScene}`);
        } else {
            console.warn(`Requested startScene '${startSceneParam}' not found or not in config. Starting with default: ${initialScene}`);
        }
    }

    // The game starts scenes automatically based on the config array. 
    // To override, we'd typically change the first element of config.scene *before* game creation,
    // or manage scene starting manually *after* game creation. 
    // For simplicity with current setup, we rely on BootScene to handle transition to TitleScene,
    // and if a specific startScene is requested, BootScene should ideally handle that too,
    // or we need a more sophisticated scene manager/loader.

    // For now, if initialScene is not BootScene, we'll try to start it directly if the game is ready.
    // This assumes BootScene has already run if it's not the target.
    // A more robust solution would involve modifying BootScene or having a dedicated loader.
    if (initialScene !== 'BootScene') {
        // Ensure the game is fully ready before starting a non-default scene
        // This is a simplified check. A 'ready' event from the game might be better.
        game.scene.run(initialScene); // This might try to run it in parallel with BootScene initially.
                                  // It's better to modify BootScene to look at a global var or localStorage set here.
        // A better approach: config.scene = [SceneClass]; and then new Phaser.Game(config);
        // But that requires finding the SceneClass constructor from the string.
    }
    // Default behavior: Phaser starts with the first scene in the config.scene array (BootScene).
    // BootScene then transitions to TitleScene.
    // If we want to jump to EndScene, BootScene needs to be aware of this parameter,
    // or we need to handle the initial scene start more directly here. 

    // --- Debug: Player Feel Sliders Panel ---
    if (config.physics.arcade.debug) {
        const feelParams = [
            { key: 'MOVE_SPEED', label: 'Move Speed', min: 100, max: 600, step: 10, default: 220 },
            { key: 'ACCELERATION', label: 'Acceleration', min: 200, max: 3000, step: 50, default: 1200 },
            { key: 'DRAG', label: 'Drag', min: 100, max: 3000, step: 50, default: 1000 },
            { key: 'JUMP_VELOCITY', label: 'Jump Velocity', min: -800, max: -100, step: 10, default: -450 },
            { key: 'GRAVITY', label: 'Gravity', min: 100, max: 3000, step: 50, default: 980 },
            { key: 'AIR_CONTROL_FACTOR', label: 'Air Control', min: 0.1, max: 1.0, step: 0.01, default: 0.5 }
        ];
        const panel = document.createElement('div');
        panel.style.position = 'absolute';
        panel.style.top = '10px';
        panel.style.left = '10px';
        panel.style.padding = '10px 14px';
        panel.style.background = 'rgba(0,0,0,0.7)';
        panel.style.color = '#fff';
        panel.style.fontFamily = 'sans-serif';
        panel.style.fontSize = '13px';
        panel.style.borderRadius = '6px';
        panel.style.zIndex = '9999';
        panel.style.minWidth = '220px';
        panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        panel.innerHTML = '<b>Player Feel (Debug)</b><br><br>';
        feelParams.forEach(param => {
            const row = document.createElement('div');
            row.style.marginBottom = '8px';
            const label = document.createElement('span');
            label.textContent = param.label + ':';
            label.style.marginRight = '8px';
            label.style.display = 'inline-block';
            label.style.width = '90px';
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = param.min;
            slider.max = param.max;
            slider.step = param.step;
            slider.value = param.default;
            slider.style.verticalAlign = 'middle';
            slider.style.width = '90px';
            const valueDisplay = document.createElement('span');
            valueDisplay.textContent = slider.value;
            valueDisplay.style.marginLeft = '8px';
            slider.addEventListener('input', () => {
                valueDisplay.textContent = slider.value;
                let newValue = param.key === 'AIR_CONTROL_FACTOR' ? parseFloat(slider.value) : parseInt(slider.value, 10);
                // Update all players in all scenes
                game.scene.scenes.forEach(sc => {
                    if (sc.player) {
                        sc.player[param.key] = newValue;
                        if (param.key === 'MOVE_SPEED') {
                            sc.player.setMaxVelocity(newValue, Math.abs(sc.player.JUMP_VELOCITY * 2));
                        }
                        if (param.key === 'JUMP_VELOCITY') {
                            sc.player.setMaxVelocity(sc.player.MOVE_SPEED, Math.abs(newValue * 2));
                        }
                        if (param.key === 'GRAVITY') {
                            sc.player.setGravityY(newValue);
                        }
                    }
                });
            });
            row.appendChild(label);
            row.appendChild(slider);
            row.appendChild(valueDisplay);
            panel.appendChild(row);
        });
        document.body.appendChild(panel);
    }
};

// --- Resize Handling ---
window.addEventListener('resize', () => {
    // Let Phaser's Scale Manager handle the parent size change; just refresh its calculations
    if (window.game && window.game.scale) {
        window.game.scale.refresh();
    }
});

window.addEventListener('orientationchange', () => {
    // Delay the entire logic to ensure dimensions are updated
    setTimeout(() => {
        const warning = document.getElementById('rotate-warning');
        const gameContainer = document.getElementById('phaser-game-container') || document.body;
        const isInIframe = window.self !== window.top;

        if (!warning) return;

        // Never show rotate warning if in iframe (mann.cool handles this)
        if (isInIframe) {
            warning.style.display = 'none';
            return;
        }

        const mobileAndPortrait = isMobileDevice() && isPortrait();

        if (mobileAndPortrait) { // Portrait mode on mobile
            warning.style.display = 'flex'; // Show warning, ensure it's flex for centering
            // Exit fullscreen if in fullscreen
            if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
                exitFullScreen();
            }
        } else { // Landscape mode OR Desktop
            warning.style.display = 'none';
            // Attempt to go fullscreen ONLY IF NOT IN PORTRAIT (or if on desktop, where portrait doesn't matter for this)
            if (!isPortrait() || !isMobileDevice()) {
                requestFullScreen(gameContainer);
            }
        }

        // Inform Phaser's Scale Manager that the parent size may have changed
        if (window.game && window.game.scale) {
            window.game.scale.refresh();
        }
    }, 200); // 200ms delay, can be adjusted if needed
});
