class Enemy extends Phaser.Physics.Arcade.Sprite {
    // --- Scaling Factor (Adjust as needed) ---
    SPRITE_SCALE = 0.6; // enlarged
    // ----------------------------------------

    constructor(scene, x, y, textureKey = null, customWidth = null, customHeight = null) {
        // Use the provided texture key and the first idle frame
        let agentKey = textureKey;
        if (!agentKey) {
            // If the scene provides an agentTextureKey, use it
            if (scene.agentTextureKey) {
                agentKey = scene.agentTextureKey;
            } else {
                agentKey = 'tax-monster_atlas';
            }
        }
        let initialFrame;
        if (agentKey === 'tax-monster_atlas') {
            initialFrame = 'tax-monster-idle1.png';
        } else if (agentKey === 'irs-agent_atlas') {
            initialFrame = 'IRS1-run1.png';
        } else if (agentKey === 'irs-agent2_atlas') {
            initialFrame = 'irs-agent2-run1.png';
        } else if (agentKey === 'irs-agent3_atlas') {
            initialFrame = 'irs-agent3-run1.png';
        }
        super(scene, x, y, agentKey, initialFrame);

        // Store custom dimensions if provided
        this.customBodyWidth = customWidth;
        this.customBodyHeight = customHeight;

        // --- Basic Setup ---
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setOrigin(0.5, 0.5); // Center origin is usually better

        // Adjust scale based on type so sizes are sensible in game world
        if (agentKey === 'irs-agent_atlas') {
            this.SPRITE_SCALE = 0.2;
        } else if (agentKey === 'irs-agent2_atlas') {
            this.SPRITE_SCALE = 0.2;
            // Flip horizontally if in SceneOne, SceneTwo, or SceneThree
            if (scene.scene && (scene.scene.key === 'SceneOne' || scene.scene.key === 'SceneTwo' || scene.scene.key === 'SceneThree')) {
                this.setFlipX(true);
            }
        } else if (agentKey === 'irs-agent3_atlas') {
            this.SPRITE_SCALE = 0.3;
            // Always flip horizontally in SceneThree
            if (scene.scene && scene.scene.key === 'SceneThree') {
                this.setFlipX(true);
            }
        }
        this.setScale(this.SPRITE_SCALE);
        console.log(`Enemy (${agentKey}) scale set to: ${this.SPRITE_SCALE}, Origin set`);

        // --- Physics Setup (Dynamic Size/Offset) ---
        if (this.texture.key === 'tax-monster_atlas') {
            applyBodyFromFrame(this, { widthMult: 0.75, heightMult: 0.95 });
        } else if (this.texture.key === 'irs-agent_atlas') {
            applyBodyFromFrame(this, { widthMult: 0.5, heightMult: 0.9 });
        } else if (this.texture.key === 'irs-agent2_atlas') {
            let verticalAdjust = 0; // Default
            if (scene.scene) {
                if (scene.scene.key === 'SceneOne') {
                    verticalAdjust = 0; // Placeholder - adjust as needed for SceneOne
                } else if (scene.scene.key === 'SceneTwo') {
                    verticalAdjust = 50; // Existing value for SceneTwo
                } else if (scene.scene.key === 'SceneThree') {
                    verticalAdjust = 0; // Placeholder - adjust as needed for SceneThree
                }
            }
            // Use improved physics body logic for agent2
            applyBodyFromFrame(this, { widthMult: 0.5, heightMult: 0.9, verticalAdjust, debug: window.APPLY_BODY_DEBUG });
        } else if (this.texture.key === 'irs-agent3_atlas') {
            // Use improved physics body logic for agent3
            let verticalAdjust = 0; // Default
            if (scene.scene) {
                if (scene.scene.key === 'SceneOne') {
                    verticalAdjust = 55; // Placeholder - adjust as needed for SceneOne
                } else if (scene.scene.key === 'SceneTwo') {
                    verticalAdjust = 55; // Placeholder - adjust as needed for SceneTwo
                } else if (scene.scene.key === 'SceneThree') {
                    verticalAdjust = 59; // Existing value for SceneThree
                }
            }
            applyBodyFromFrame(this, { widthMult: 0.55, heightMult: 0.93, verticalAdjust, debug: window.APPLY_BODY_DEBUG });
        } else {
            applyBodyFromFrame(this);
        }
        
        // --- Initial Animation ---
        if (agentKey === 'tax-monster_atlas') {
            this.play('tax-monster_idle');
            console.log(`Enemy (${agentKey}) starting idle animation.`);
        } else if (agentKey === 'irs-agent_atlas') {
            this.play('irs-agent_run');
            console.log('Enemy (irs-agent) starting run animation.');
        } else if (agentKey === 'irs-agent2_atlas') {
            this.play('irs-agent2_run');
            console.log('Enemy (irs-agent2) starting run animation.');
        } else if (agentKey === 'irs-agent3_atlas') {
            this.play('irs-agent3_run');
            console.log('Enemy (irs-agent3) starting run animation.');
        }

        console.log(`Enemy instance (${agentKey}) created at (${x}, ${y})`);

        this.isHit = false; // Track if enemy has been hit by player
    }

    /**
     * Called when the agent is struck by the player's attack.
     * Plays the hit frame, disables further collisions, and launches the
     * sprite upward/backward while fading it out before destroying.
     * @param {boolean} hitFromLeft – true if the player is left of the enemy.
     */
    takeHit(hitFromLeft = true) {
        if (this.isHit) return; // Prevent multiple hits
        this.isHit = true;

        // Play.fun: award points for defeating an IRS agent
        awardPoints(10);

        // Define rainbow colors (moved here for use by both effects)
        const rainbowColors = [
            0xff0000, // Red
            0xffa500, // Orange
            0xffff00, // Yellow
            0x00ff00, // Green
            0x0000ff, // Blue
            0x4b0082, // Indigo
            0xee82ee  // Violet
        ];

        // Stop any existing movement & collisions
        this.body.setVelocity(0, 0);
        // Disable further collision checks with player & ground to avoid blocking
        this.body.checkCollision.none = true;
        this.body.setAllowGravity(false);
        // Fully disable physics body but keep sprite alive for tween
        this.body.enable = false;

        // --- Initial Hit Particle Burst ---
        const numParticles = Phaser.Math.Between(5, 8);
        for (let i = 0; i < numParticles; i++) {
            const burstParticleColor = Phaser.Math.RND.pick(rainbowColors);
            const particle = this.scene.add.circle(this.x, this.y, Phaser.Math.Between(2, 4), burstParticleColor, 1);
            particle.setDepth(this.depth + 1); // Ensure particles are above the enemy

            const angle = Phaser.Math.RND.angle(); // Random angle in radians
            const distance = Phaser.Math.Between(20, 40);
            const targetX = this.x + Math.cos(angle) * distance;
            const targetY = this.y + Math.sin(angle) * distance;

            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                scale: 0,
                alpha: 0,
                duration: Phaser.Math.Between(250, 400),
                ease: 'Quad.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }

        // Play the hit frame if available
        if (this.texture.key === 'irs-agent_atlas') {
            this.play('irs-agent_hit');
        } else if (this.texture.key === 'irs-agent2_atlas') {
            this.play('irs-agent2_hit');
        } else if (this.texture.key === 'irs-agent3_atlas') {
            this.play('irs-agent3_hit');
        }

        // Add a quick spin for visual flair
        this.setAngularVelocity(hitFromLeft ? 600 : -600);

        // Launch the enemy backward/upward
        const direction = hitFromLeft ? 1 : -1; // +1 means player is left of enemy ➔ enemy flies right
        const finalTargetX = this.x + 300 * direction;
        const finalTargetY = this.y - 300; // fly toward background (higher)
        const finalScale = this.scale * 0.1; // shrink to 10% before disappearing

        // --- IRS Agent: Two-stage launch for eased start ---
        if (["irs-agent_atlas", "irs-agent2_atlas", "irs-agent3_atlas"].includes(this.texture.key)) {
            // Stage 1: short, slow movement (ease out)
            const easeDuration = 120;
            const easeTargetX = this.x + 40 * direction;
            const easeTargetY = this.y - 30;
            this.scene.tweens.add({
                targets: this,
                x: easeTargetX,
                y: easeTargetY,
                scaleX: this.scaleX * 0.95,
                scaleY: this.scaleY * 0.95,
                alpha: 1,
                duration: easeDuration,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    // Stage 2: main fast launch
                    this.scene.tweens.add({
                        targets: this,
                        x: finalTargetX,
                        y: finalTargetY,
                        scaleX: finalScale,
                        scaleY: finalScale,
                        alpha: 0,
                        duration: 800 - easeDuration,
                        ease: 'Expo.easeOut',
                        onComplete: () => {
                            // --- Blip effect where the agent vanishes ---
                            const randomBlipColor = Phaser.Math.RND.pick(rainbowColors);
                            const blip = this.scene.add.circle(this.x, this.y, 4, randomBlipColor)
                                .setDepth(this.depth + 1);
                            if (blip.postFX) {
                                blip.postFX.addGlow(randomBlipColor, 4, 0, false);
                            } else {
                                console.warn("Glow FX not available for blip, postFX pipeline missing.");
                            }
                            this.scene.tweens.add({
                                targets: blip,
                                scale: 3,
                                alpha: 0,
                                duration: 200,
                                ease: 'Sine.easeOut',
                                onComplete: () => blip.destroy()
                            });
                            this.destroy();
                        }
                    });
                }
            });
        } else {
            // --- Tax Monster or other: original single-stage launch ---
            this.scene.tweens.add({
                targets: this,
                x: finalTargetX,
                y: finalTargetY,
                scaleX: finalScale,
                scaleY: finalScale,
                alpha: 0,
                duration: 800, // Combined and slightly shorter duration
                ease: 'Expo.easeOut', // Starts fast, then slows - good for a launch
                onComplete: () => {
                    // --- Blip effect where the agent vanishes ---
                    const randomBlipColor = Phaser.Math.RND.pick(rainbowColors);
                    const blip = this.scene.add.circle(this.x, this.y, 4, randomBlipColor)
                        .setDepth(this.depth + 1);
                    if (blip.postFX) {
                        blip.postFX.addGlow(randomBlipColor, 4, 0, false);
                    } else {
                        console.warn("Glow FX not available for blip, postFX pipeline missing.");
                    }
                    this.scene.tweens.add({
                        targets: blip,
                        scale: 3,
                        alpha: 0,
                        duration: 200,
                        ease: 'Sine.easeOut',
                        onComplete: () => blip.destroy()
                    });
                    this.destroy();
                }
            });
        }
    }

    // Add enemy-specific update logic here if needed
    update(time, delta) {
        if (this.isHit) {
            // No further updates/animation changes once hit
            return;
        }
        // --- Debug Logging ---
        // console.log(`Enemy update: Key=${this.texture.key}, VelocityX=${this.body?.velocity?.x?.toFixed(1)}`);
        // --- End Debug Logging ---

        // Example: Play run animation if moving horizontally
        if (this.texture.key === 'tax-monster_atlas') {
            if (this.body.velocity.x !== 0) {
                this.play('tax-monster_run', true); 
            } else {
                this.play('tax-monster_idle', true);
            }
        } else if (this.texture.key === 'irs-agent_atlas') {
            this.play('irs-agent_run', true);
        } else if (this.texture.key === 'irs-agent2_atlas') {
            this.play('irs-agent2_run', true);
        } else if (this.texture.key === 'irs-agent3_atlas') {
            this.play('irs-agent3_run', true);
        }
        
        // Potentially call updateBodyToBounds() if animation frame size changes drastically,
        // but for simple idle/run it might be okay to set it only once in constructor.
        // this.updateBodyToBounds(); 
    }
}

// Make class available (if using modules)
// export default Enemy;
