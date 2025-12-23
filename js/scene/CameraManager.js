import * as THREE from 'three';

export class CameraManager {
    constructor() {
        this.stream = null;
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.video.playsInline = true;
        this.video.muted = true; // Required for iOS autoplay

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.texture = null;
        this.offsetY = 0; // Vertical offset factor (-0.5 to 0.5)
    }

    async startCamera() {
        if (this.stream) return;

        const getStream = async (constraints) => {
            try {
                return await navigator.mediaDevices.getUserMedia(constraints);
            } catch (error) {
                return null;
            }
        };

        try {
            // Attempt 1: Ideal settings (Back Camera, High Res)
            let stream = await getStream({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 1280 }
                },
                audio: false
            });

            // Attempt 2: Fallback to User Camera (Front) if Back fails
            if (!stream) {
                console.warn("Back camera not found, trying user camera...");
                stream = await getStream({
                    video: {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 1280 }
                    },
                    audio: false
                });
            }

            // Attempt 3: Any video source
            if (!stream) {
                console.warn("User camera not found, trying any video source...");
                stream = await getStream({
                    video: true,
                    audio: false
                });
            }

            if (!stream) {
                throw new Error("No video device found after all attempts.");
            }

            this.stream = stream;
            this.video.srcObject = this.stream;

            // Wait for video to be ready
            return new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    resolve(true);
                };
            });

        } catch (err) {
            console.error("Camera Access Error:", err);
            alert("無法開啟相機，請確認瀏覽器權限或使用 HTTPS 連線。錯誤: " + err.message);
            throw err;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.video.pause();
        this.video.srcObject = null;
    }

    captureTexture() {
        if (!this.stream) return null;

        const videoW = this.video.videoWidth;
        const videoH = this.video.videoHeight;

        // Use client dims to avoid scrollbar issues
        const screenW = document.documentElement.clientWidth;
        const screenH = document.documentElement.clientHeight;

        const videoAspect = videoW / videoH;
        const screenAspect = screenW / screenH;

        let visibleW, visibleH, offX, offY;

        // Calculate visible area of video on screen (object-fit: cover logic)
        if (videoAspect > screenAspect) {
            // Video is wider than screen, width is cropped
            visibleW = videoH * screenAspect;
            visibleH = videoH;
            offX = (videoW - visibleW) / 2;
            offY = 0;
        } else {
            // Video is taller than screen, height is cropped
            visibleW = videoW;
            visibleH = videoW / screenAspect;
            offX = 0;
            offY = (videoH - visibleH) / 2;
        }

        // Guide size from CSS: Math.min(80vw, 400px)
        const guideSizeOnScreen = Math.min(screenW * 0.8, 400);

        // Scale from screen coordinates to video buffer coordinates
        const scale = visibleH / screenH;
        // Tightening factor: 0.9 -> Zoom in slightly to ensure we don't capture outside the circle
        const captureSizeOnBuffer = guideSizeOnScreen * scale * 0.9;

        // Final capture coordinates on video buffer
        const sx = offX + (visibleW - captureSizeOnBuffer) / 2;

        // Add Offset
        let sy = offY + (visibleH - captureSizeOnBuffer) / 2 - (this.offsetY * visibleH);

        // Clamp to safe area
        // Ensure the capture box stays within video bounds
        // sy must be >= 0
        // sy + captureSize must be <= videoH (so sy <= videoH - captureSize)
        sy = Math.max(0, Math.min(sy, videoH - captureSizeOnBuffer));

        this.canvas.width = 1024;
        this.canvas.height = 1024;

        // Draw the mapped area
        this.ctx.drawImage(this.video, sx, sy, captureSizeOnBuffer, captureSizeOnBuffer, 0, 0, 1024, 1024);

        if (this.texture) {
            this.texture.dispose();
        }
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.colorSpace = THREE.SRGBColorSpace;
        this.texture.flipY = false;

        return this.texture;
    }

    _applyCircularMask(size) {
        this.ctx.globalCompositeOperation = 'destination-in';
        this.ctx.beginPath();
        // Inner 98% to avoid tiny edge artifacts
        this.ctx.arc(size / 2, size / 2, (size / 2) * 0.98, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';
    }
}
