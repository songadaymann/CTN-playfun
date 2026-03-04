// js/utils/deviceUtils.js

// --- Helper Function for Mobile Device Detection ---
function isMobileDevice() {
    // Check for touch support or common mobile User Agent strings.
    const mobileUserAgent = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const touchSupport = ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);
    console.log(`isMobileDevice check: userAgent: ${mobileUserAgent}, touchSupport: ${touchSupport}`); // Uncomment for debugging
    return mobileUserAgent || touchSupport;
}

// --- Helper Function for Orientation Detection ---
function isPortrait() {
    // Use matchMedia for more reliable orientation detection across devices.
    // Fallback to comparing window.innerWidth and window.innerHeight if matchMedia is not supported.
    if (window.matchMedia) {
        return window.matchMedia("(orientation: portrait)").matches;
    }
    return window.innerHeight > window.innerWidth; // Basic fallback
} 