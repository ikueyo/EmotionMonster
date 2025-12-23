import * as THREE from 'three';

export class UIManager {
    constructor(app) {
        this.app = app;
        this.interactionManager = app.interactionManager;

        this.controlPanel = document.getElementById('control-panel');
        this.deleteBtn = document.getElementById('delete-btn');
        this.sliderY = document.getElementById('rotate-y');
        this.sliderZ = document.getElementById('rotate-z');
        this.sliderScale = document.getElementById('scale-slider');

        // Tool Buttons
        this.tools = document.querySelectorAll('.tool-btn');
        this.scanBtn = document.getElementById('btn-scan');
        this.saveBtn = document.getElementById('btn-save');

        // Camera UI
        this.cameraOverlay = document.getElementById('camera-overlay');
        this.btnCloseCam = document.getElementById('btn-close-cam');
        this.btnCapture = document.getElementById('btn-capture');

        // Skin Control Panel
        this.skinPanel = document.getElementById('skin-control-panel');
        this.skinBrightness = document.getElementById('skin-brightness');
        this.skinOffsetY = document.getElementById('skin-offset-y');
        this.skinScale = document.getElementById('skin-scale');
        this.skinCloseBtn = document.getElementById('skin-close-btn');
    }

    init() {
        this.setupTools();
        this.setupControlPanel();
        this.setupCameraUI();
        this.setupSkinPanel();
        this.setupSelectionScreen();

        // Listen to Selection Changes to update UI
        this.interactionManager.onSelectionChange = (part) => {
            this.updateUI(part);
        };
    }

    setupSelectionScreen() {
        const selectionScreen = document.getElementById('selection-screen');
        const uiSidebar = document.getElementById('ui-sidebar');
        const uiHeader = document.getElementById('ui-header');
        const cards = document.querySelectorAll('.monster-card');

        cards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;

                // Animate Out
                selectionScreen.style.opacity = '0';

                // Wait for transition then Create Monster & Show UI
                setTimeout(() => {
                    selectionScreen.style.display = 'none';
                    uiSidebar.style.display = 'flex';
                    uiHeader.style.display = 'block';

                    this.app.createMonster(type);
                }, 500);
            });
        });
    }

    setupTools() {
        this.tools.forEach(btn => {
            const type = btn.dataset.type;
            if (!type) return;

            const start = (e) => {
                e.preventDefault();
                this.interactionManager.startDragNew(type);
                // Disable controls while dragging new parts
                this.app.sceneManager.controls.enabled = false;
            };

            btn.addEventListener('mousedown', start);
            btn.addEventListener('touchstart', start, { passive: false });
        });

        // Re-enable controls when drag ends (handled via mouseup on container in InteractionManager, 
        // but we also need to ensure controls are re-enabled if they were disabled)
        // Actually, InteractionManager handles re-enabling controls logic via onEnd -> we might need to expose controls to InteractionManager?
        // Current implementation passes Camera/Scene, maybe we pass controls too?
        // Refactor: Let InteractionManager manage controls state locally or pass it in. 
        // In current refactor, SceneManager has controls. 

        // Quick Fix for refactor: Allow InteractionManager to access controls via sceneManager if needed, 
        // or just let InteractionManager toggle a flag.
        // In original code: controls.enabled = false.

        // We will inject the controls toggling into InteractionManager's logic by monkey-patching or passing it.
        // Better: InteractionManager can just set a flag, Main Loop ignores controls?
        // Or better: access controls from app. 

        // IMPORTANT: The InteractionManager needs to disable orbit controls during drag.
        // I'll update InteractionManager to accept 'controls' or 'onDragStateChange' callback.
        // For now, let's access it via app reference if I passed app to InteractionManager? No I didn't.
        // I passed container.

        // Let's add a hook in App.js to handle this or modify InteractionManager to take sceneManager.
        // Since I already wrote InteractionManager, I can update it or just handle it here?
        // We can add a listener on container for mouse up to ensure controls are enabled.

        const enableControls = () => {
            this.app.sceneManager.controls.enabled = true;
        };
        window.addEventListener('mouseup', enableControls);
        window.addEventListener('touchend', enableControls);

        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => {
                this.app.exporter.downloadImage();
            });
        }
    }

    setupControlPanel() {
        this.deleteBtn.addEventListener('click', () => {
            this.interactionManager.deleteSelected();
        });

        this.sliderY.addEventListener('input', (e) => {
            this.interactionManager.rotateSelected('y', parseInt(e.target.value));
        });

        this.sliderZ.addEventListener('input', (e) => {
            this.interactionManager.rotateSelected('z', parseInt(e.target.value));
        });

        this.sliderScale.addEventListener('input', (e) => {
            if (this.interactionManager.scaleSelected) {
                this.interactionManager.scaleSelected(parseFloat(e.target.value));
            }
        });
    }

    setupSkinPanel() {
        // Brightness
        this.skinBrightness.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const bodyMesh = this.app.monsterManager.bodyMesh;
            if (bodyMesh && bodyMesh.material) {
                // Adjust color brightness. Base is 0xeeeeee (almost white).
                // We'll just multiply scalar
                bodyMesh.material.color.setScalar(val);
            }
        });

        // Offset Y
        this.skinOffsetY.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const bodyMesh = this.app.monsterManager.bodyMesh;
            if (bodyMesh && bodyMesh.material && bodyMesh.material.map) {
                bodyMesh.material.map.offset.y = val;
                // needsUpdate usually not needed for offset changes, but good to be safe if texture changes
            }
        });

        // Scale (Repeat)
        this.skinScale.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const bodyMesh = this.app.monsterManager.bodyMesh;
            if (bodyMesh && bodyMesh.material && bodyMesh.material.map) {
                bodyMesh.material.map.repeat.set(val, val);
            }
        });

        this.skinCloseBtn.addEventListener('click', () => {
            this.interactionManager.deselect();
        });
    }

    setupCameraUI() {
        // No slider logic for camera overlay anymore

        // Open Camera
        this.scanBtn.addEventListener('click', async () => {
            this.cameraOverlay.style.display = 'flex';
            this.cameraOverlay.appendChild(this.app.cameraManager.video); // Viewfinder
            this.app.cameraManager.video.id = 'camera-preview';

            await this.app.cameraManager.startCamera();
        });

        // Close Camera
        this.btnCloseCam.addEventListener('click', () => {
            this.closeCamera();
        });

        // Capture
        this.btnCapture.addEventListener('click', () => {
            const texture = this.app.cameraManager.captureTexture();
            if (texture) {
                // Apply to Monster
                if (this.app.monsterManager.bodyMesh) {
                    // Improve texture wrapping
                    texture.wrapS = THREE.MirroredRepeatWrapping;
                    texture.wrapT = THREE.MirroredRepeatWrapping;

                    // Reset or Default values
                    texture.repeat.set(1.5, 1.5);
                    this.skinScale.value = 1.5;

                    texture.offset.set(0, 0);
                    this.skinOffsetY.value = 0;

                    this.app.monsterManager.bodyMesh.material.map = texture;
                    this.app.monsterManager.bodyMesh.material.needsUpdate = true;

                    // Reset Brightness
                    this.app.monsterManager.bodyMesh.material.color.setHex(0xeeeeee);
                    this.skinBrightness.value = 1.0;

                    // Automatically select body to show adjustments
                    this.interactionManager.select(this.app.monsterManager.bodyMesh);
                }
            }
            this.closeCamera();
        });
    }

    closeCamera() {
        this.app.cameraManager.stopCamera();
        this.cameraOverlay.style.display = 'none';
        // Remove video element to stop it interfering
        const preview = document.getElementById('camera-preview');
        if (preview) preview.remove();
    }

    updateUI(part) {
        // Hide both initially
        this.controlPanel.style.display = 'none';
        this.skinPanel.style.display = 'none';

        if (part) {
            if (part.userData && part.userData.isBody) {
                // Body -> Skin Panel
                this.skinPanel.style.display = 'flex';
                // Sync UI with current state? 
                // We did it in capture already. If re-selecting, might need to read values?
                // For now, assuming state persists in UI elements or we don't mind.
            } else {
                // Part -> Control Panel
                this.controlPanel.style.display = 'flex';

                if (this.interactionManager.state.selectedInner) {
                    const inner = this.interactionManager.state.selectedInner;
                    const rotY = Math.round(inner.rotation.y * (180 / Math.PI));
                    const rotZ = Math.round(inner.rotation.z * (180 / Math.PI));
                    this.sliderY.value = rotY;
                    this.sliderZ.value = rotZ;
                    if (this.sliderScale) {
                        this.sliderScale.value = inner.scale.x;
                    }
                }
            }
        }
    }
}
