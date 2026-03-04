// Utility to configure Arcade Physics body based on a sprite's *un-scaled* trimmed frame size.
// The helper is attached to the global object so it can be used by any component loaded via a script tag.
(function (global) {
    /**
     * Update body size and offset so that it scales automatically with the sprite.
     *
     * @param {Phaser.Physics.Arcade.Sprite} sprite  The sprite whose body should be adjusted.
     * @param {Object} [opts]
     * @param {number} [opts.widthMult=0.8]   Multiplier applied to the frame width to get body width.
     * @param {number} [opts.heightMult=0.9]  Multiplier applied to the frame height to get body height.
     * @param {number} [opts.verticalAdjust=0] Extra un-scaled pixels to raise (positive) or lower (negative) the body.
     */
    function applyBodyFromFrame(sprite, opts = {}) {
        if (!sprite.body) {
            console.warn('applyBodyFromFrame: sprite has no physics body yet');
            return;
        }

        const widthMult = opts.widthMult !== undefined ? opts.widthMult : 0.8;
        const heightMult = opts.heightMult !== undefined ? opts.heightMult : 0.9;
        const verticalAdjust = opts.verticalAdjust !== undefined ? opts.verticalAdjust : 0;

        // Trimmed (visible) frame size → un-scaled pixels.
        const frameW = sprite.frame.width;
        const frameH = sprite.frame.height;

        const bodyW = frameW * widthMult;
        const bodyH = frameH * heightMult;

        sprite.body.setSize(bodyW, bodyH);

        // Centre horizontally; align bottom edge, then apply any manual tweak.
        const offsetX = (frameW - bodyW) / 2;
        const offsetY = (frameH - bodyH) - verticalAdjust;

        sprite.body.setOffset(offsetX, offsetY);

        // Optional debug logging
        const debug = opts.debug || global.APPLY_BODY_DEBUG;
        if (debug) {
            // console.log(`[applyBodyFromFrame] ${sprite.texture?.key || 'sprite'} frame=${sprite.frame?.name || 'unknown'} ` +
            //     `fw=${frameW} fh=${frameH} bodyW=${bodyW.toFixed(1)} bodyH=${bodyH.toFixed(1)} ` +
            //     `offX=${offsetX.toFixed(1)} offY=${offsetY.toFixed(1)} scale=${sprite.scaleX}`);
        }
    }

    // Expose on the global object so Enemy.js / Player.js can call it without modules.
    global.applyBodyFromFrame = applyBodyFromFrame;
})(typeof window !== 'undefined' ? window : globalThis); 