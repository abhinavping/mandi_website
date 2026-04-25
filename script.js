document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('hero-canvas');
    const heroSection = document.getElementById('hero-section');

    if (!canvas || !heroSection) {
        return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error('[Scroll Debug] Canvas 2D context could not be created.');
        return;
    }

    const totalFrames = 120;
    const startFrame = 39;
    const frameSources = Array.from({ length: totalFrames }, (_, index) => {
        const frameNumber = String(index + startFrame).padStart(3, '0');
        return `ezgif-38211703915cee03-jpg/ezgif-frame-${frameNumber}.jpg`;
    });
    const frames = frameSources.map((src) => {
        const image = new Image();
        image.src = src;
        return image;
    });

    let rafId = 0;
    let currentFrameFloat = 0;
    let targetFrameFloat = 0;
    let lastDrawnFrameIndex = -1;
    let hasFirstFrameRendered = false;
    let lastDebugLogAt = 0;
    const debugLogInterval = 120;

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function easeInOutCubic(value) {
        return value < 0.5
            ? 4 * value * value * value
            : 1 - Math.pow(-2 * value + 2, 3) / 2;
    }

    function resizeCanvas() {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        canvas.style.width = `${viewportWidth}px`;
        canvas.style.height = `${viewportHeight}px`;
        canvas.width = Math.round(viewportWidth * dpr);
        canvas.height = Math.round(viewportHeight * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        requestRender();
    }

    function drawFrame(image) {
        if (!image || !image.complete || image.naturalWidth === 0) {
            return false;
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const imageRatio = image.naturalWidth / image.naturalHeight;
        const canvasRatio = viewportWidth / viewportHeight;

        let drawWidth = viewportWidth;
        let drawHeight = viewportHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (canvasRatio > imageRatio) {
            drawHeight = viewportWidth / imageRatio;
            offsetY = (viewportHeight - drawHeight) / 2;
        } else {
            drawWidth = viewportHeight * imageRatio;
            offsetX = (viewportWidth - drawWidth) / 2;
        }

        ctx.clearRect(0, 0, viewportWidth, viewportHeight);
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        return true;
    }

    function getScrollProgress() {
        const maxScroll = Math.max(
            heroSection.offsetHeight - window.innerHeight,
            1
        );
        const scrollOffset = (window.scrollY || window.pageYOffset || 0) - heroSection.offsetTop;
        const scrollY = clamp(scrollOffset, 0, maxScroll);
        return scrollY / maxScroll;
    }

    function updateTargetFrame() {
        const rawProgress = getScrollProgress();
        const easedProgress = easeInOutCubic(rawProgress);

        targetFrameFloat = easedProgress * (totalFrames - 1);

        const now = performance.now();
        if (now - lastDebugLogAt >= debugLogInterval) {
            lastDebugLogAt = now;
            console.log(
                `[Scroll Debug] scrollY=${Math.round(window.scrollY)} progress=${rawProgress.toFixed(3)} targetFrame=${Math.round(targetFrameFloat) + 1}`
            );
        }

        requestRender();
    }

    function render() {
        rafId = 0;

        const delta = targetFrameFloat - currentFrameFloat;
        if (Math.abs(delta) > 0.01) {
            currentFrameFloat += delta * 0.18;
        } else {
            currentFrameFloat = targetFrameFloat;
        }

        const frameIndex = clamp(
            Math.round(currentFrameFloat),
            0,
            totalFrames - 1
        );
        const frameImage = frames[frameIndex];

        if (frameImage && frameImage.complete && frameImage.naturalWidth > 0) {
            if (frameIndex !== lastDrawnFrameIndex || !hasFirstFrameRendered) {
                drawFrame(frameImage);
                lastDrawnFrameIndex = frameIndex;
                hasFirstFrameRendered = true;
            }
        } else if (!hasFirstFrameRendered && frames[0]?.complete && frames[0].naturalWidth > 0) {
            drawFrame(frames[0]);
            lastDrawnFrameIndex = 0;
            hasFirstFrameRendered = true;
        }

        if (Math.abs(targetFrameFloat - currentFrameFloat) > 0.01) {
            requestRender();
        }
    }

    function requestRender() {
        if (rafId) {
            return;
        }

        rafId = window.requestAnimationFrame(render);
    }

    frames.forEach((image, index) => {
        image.addEventListener('load', () => {
            console.log(`[Scroll Debug] Loaded frame ${index + 1}/${totalFrames}`);

            if (index === 0 && !hasFirstFrameRendered) {
                currentFrameFloat = 0;
                targetFrameFloat = Math.max(targetFrameFloat, 0);
                drawFrame(image);
                lastDrawnFrameIndex = 0;
                hasFirstFrameRendered = true;
            }

            requestRender();
        });

        image.addEventListener('error', () => {
            console.error(`[Scroll Debug] Failed to load ${frameSources[index]}`);
        });
    });

    resizeCanvas();
    updateTargetFrame();

    window.addEventListener('scroll', updateTargetFrame, { passive: true });
    window.addEventListener('resize', () => {
        resizeCanvas();
        updateTargetFrame();
    });

    if (document.readyState === 'complete') {
        updateTargetFrame();
    } else {
        window.addEventListener('load', updateTargetFrame, { once: true });
    }
});
 