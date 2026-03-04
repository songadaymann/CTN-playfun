class EnemyManager {
    constructor(scene) {
        this.scene = scene; // Reference to the scene (e.g., SceneOne)
        this.agentSpawnTimer = null;

        // Configure and create the group for IRS agents
        this.irsAgents = this.scene.physics.add.group({
            classType: Enemy,       // Use our custom Enemy class
            allowGravity: true,
            gravityY: 800,
            runChildUpdate: false // If Enemy had an update method, set true
        });

        console.log("EnemyManager created and IRS Agent group initialized.");
    }

    startSpawningAgents() {
        console.log("EnemyManager: Starting IRS agent spawning...");
        // Spawn immediately, then repeat
        this.spawnAgent();

        // Use a timed loop event to spawn agents periodically
        // Make sure any existing timer is cleared before creating a new one
        if (this.agentSpawnTimer) {
            this.agentSpawnTimer.remove();
        }
        this.agentSpawnTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(2000, 4000), // Spawn every 2-4 seconds (randomized)
            callback: this.spawnAgent,
            callbackScope: this,
            loop: true
        });
    }

    spawnAgent() {
        // Check only if the player exists in the scene
        if (!this.scene.player) {
            console.warn("EnemyManager: Player not found in scene, cannot spawn agent.");
            return; 
        }

        const gameWidth = this.scene.scale.width;
        const worldHeight = this.scene.physics.world.bounds.height;
        const groundHeight = this.scene.groundTileSize || 64; // Use scene's groundTileSize or default

        // Spawn off-screen to the right relative to the camera view
        const spawnX = this.scene.cameras.main.worldView.right + 100; // 100 pixels off-screen

        // --- Randomly select an agent texture ---
        const agentTextures = ['irs-agent_atlas', 'irs-agent2_atlas', 'irs-agent3_atlas'];
        const agentTextureKey = Phaser.Math.RND.pick(agentTextures);
        const agent = this.irsAgents.create(spawnX, 0, agentTextureKey);

        if (agent) {
            // After creation, align bottom to ground
            const actualAgentHeight = agent.displayHeight;
            const spawnY = worldHeight - groundHeight - actualAgentHeight / 2;
            agent.setY(spawnY);
            agent.setVelocityX(-150);
            // Ensure agent depth is below player so player appears in front
            agent.setDepth(3);
            // Ensure agent3 is always flipped horizontally
            if (agentTextureKey === 'irs-agent3_atlas') {
                agent.setFlipX(true);
            }
            // console.log(`EnemyManager: Spawned agent via group.create at ${spawnX.toFixed(0)}, ${spawnY.toFixed(0)}`); // Reduce console noise
        } else {
            console.error("EnemyManager: Failed to create agent from group.");
        }

        // Adjust timer delay for the *next* spawn to keep it random
        if (this.agentSpawnTimer) {
            this.agentSpawnTimer.delay = Phaser.Math.Between(2000, 4000);
        }
    }

    stopSpawningAgents() {
        if (this.agentSpawnTimer) {
            console.log("EnemyManager: Stopping agent spawns.");
            this.agentSpawnTimer.remove();
            this.agentSpawnTimer = null;
            // Optional: Decide if existing agents should be destroyed immediately
            // this.irsAgents.clear(true, true);
        }
    }

    // Update method to be called by the scene's update loop
    update(time, delta) {
        // --- Agent Cleanup ---
        // Checks if agents have gone off-screen left and destroys them
        Phaser.Actions.Call(this.irsAgents.getChildren(), (agent) => {
            // Need to check camera exists and has worldView
            if (this.scene.cameras.main && agent.x < this.scene.cameras.main.worldView.left - agent.width) {
                // console.log("EnemyManager: Destroying agent far left"); // Reduce noise
                agent.destroy();
            }
        });
    }

    // Getter to allow the scene to access the group for collisions
    getGroup() {
        return this.irsAgents;
    }
} 