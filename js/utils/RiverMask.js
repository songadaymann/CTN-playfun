class RiverMask {
    constructor(scene, maskKey) {
        this.scene = scene;
        const tex = scene.textures.get(maskKey);
        if (!tex) {
            console.warn(`RiverMask: texture '${maskKey}' not found.`);
            this.ready = false;
            return;
        }
        // Grab the source image from the texture
        const src = tex.getSourceImage();
        // Create an in-memory canvas and copy the image so we can read pixels fast
        this.width = src.width;
        this.height = src.height;

        const canvasTextureKey = maskKey + '_canvas';
        if (!scene.textures.exists(canvasTextureKey)) {
            scene.textures.createCanvas(canvasTextureKey, this.width, this.height);
        }
        const canvasTex = scene.textures.get(canvasTextureKey);
        canvasTex.context.drawImage(src, 0, 0);
        canvasTex.refresh();
        this.imageData = canvasTex.context.getImageData(0, 0, this.width, this.height).data;
        this.ready = true;
    }

    /**
     * Returns true if the location (x,y) in world coordinates lies within the
     * white area (river). If the mask is not ready, this returns true so the
     * game remains playable.
     */
    inside(x, y) {
        if (!this.ready) return true;
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        if (xi < 0 || yi < 0 || xi >= this.width || yi >= this.height) return false;
        const idx = (yi * this.width + xi) * 4; // R channel is fine (image is grayscale)
        return this.imageData[idx] > 200; // > ~78 % white counts as river
    }
}

// Expose globally like other helper classes in the project
window.RiverMask = RiverMask; 