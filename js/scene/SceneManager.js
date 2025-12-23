import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf6f6fa);
        this.scene.fog = new THREE.Fog(0xf6f6fa, 12, 28);

        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        this.camera.position.set(0, 1.5, 8);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.SoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        this.setupLights();

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 0.5, 0);
    }

    setupLights() {
        // 半球光：提高強度讓整體更亮
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xfff0e0, 1.8);
        this.scene.add(hemiLight);

        // 方向光：降低強度讓陰影更柔和
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.radius = 8; // 更大的模糊半徑
        dirLight.shadow.bias = -0.0001;
        this.scene.add(dirLight);

        // 邊緣光：柔和的補光
        const rimLight = new THREE.SpotLight(0xfff8f0, 0.3);
        rimLight.position.set(-5, 5, -5);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        if (!this.camera || !this.renderer) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }
}
