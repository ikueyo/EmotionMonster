import { SceneManager } from './scene/SceneManager.js';
import { MonsterManager } from './scene/MonsterManager.js';
import { InteractionManager } from './scene/InteractionManager.js';
import { CameraManager } from './scene/CameraManager.js';
import { UIManager } from './ui/UIManager.js';
import { Exporter } from './Exporter.js';
import * as THREE from 'three';

export class App {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.loader = document.getElementById('loader');

        // Core Components
        this.sceneManager = new SceneManager(this.container);
        // Initialize SceneManager IMMEDIATELY so scene/camera/renderer are created
        this.sceneManager.init();

        this.monsterManager = new MonsterManager(this.sceneManager.scene);
        this.interactionManager = new InteractionManager(
            this.sceneManager.camera,
            this.sceneManager.scene,
            this.monsterManager,
            this.container
        );
        this.cameraManager = new CameraManager();
        this.exporter = new Exporter(this.sceneManager.renderer, this.sceneManager.scene, this.sceneManager.camera);
        this.uiManager = new UIManager(this);

        this.init();
    }

    async init() {
        // Scene is already initialized in constructor

        // Setup Interaction (Drag/Drop/Click)
        this.interactionManager.init();

        // Setup UI
        this.uiManager.init();

        // Start Loop
        this.animate();

        // Hide Loader
        setTimeout(() => {
            if (this.loader) {
                this.loader.style.opacity = '0';
                setTimeout(() => this.loader.remove(), 500);
            }
        }, 500);

        window.addEventListener('resize', () => this.onResize());
    }

    createMonster(type) {
        this.monsterManager.createMonster(type);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.sceneManager.clock.getElapsedTime();

        // Update Monster Breath
        this.monsterManager.update(time);

        // Render
        this.sceneManager.render();
    }

    onResize() {
        this.sceneManager.onResize();
    }
}
