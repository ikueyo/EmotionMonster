import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PartsRepository } from './PartsRepository.js';

export class MonsterManager {
    constructor(scene) {
        this.scene = scene;
        this.monsterGroup = null;
        this.bodyMesh = null;
        this.partsRepository = new PartsRepository();
    }

    createMonster(type = 'waterdrop') {
        this.monsterGroup = new THREE.Group();
        this.scene.add(this.monsterGroup);

        const MONSTER_COLOR = 0x89d6f1;
        const TOY_MATERIAL_PARAMS = {
            roughness: 0.6,
            metalness: 0.0,
            flatShading: false,
        };

        const bodyMat = new THREE.MeshStandardMaterial({
            color: MONSTER_COLOR,
            ...TOY_MATERIAL_PARAMS
        });

        let bodyGeo;

        if (type === 'waterdrop') {
            // --- A. 水滴型 ---
            bodyGeo = new THREE.SphereGeometry(1.2, 64, 64);
            const pos = bodyGeo.attributes.position;
            const v = new THREE.Vector3();
            for (let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i);
                let scale = 1.0;
                if (v.y > 0) scale = 1.0 - (v.y * 0.45);
                else scale = 1.0 + (Math.abs(v.y) * 0.15);
                scale = Math.max(0.1, scale);
                v.x *= scale; v.z *= scale;
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            bodyGeo.computeVertexNormals();

        } else if (type === 'peanut') {
            // --- B. 長條/花生型 ---
            bodyGeo = new THREE.SphereGeometry(1.1, 64, 64);
            const pos = bodyGeo.attributes.position;
            const v = new THREE.Vector3();
            for (let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i);
                v.y *= 1.4; // 拉長
                const normY = v.y / 1.4;
                let widthScale = 0.85 + Math.pow(Math.abs(normY), 2.2) * 0.25;
                v.x *= widthScale; v.z *= widthScale;
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            bodyGeo.computeVertexNormals();

        } else if (type === 'cube') {
            // --- C. 梯形扁方糖 (Tapered Flat Cube) ---
            // 基礎: 寬 1.6, 高 2.2, 深 1.0, 圓角 0.4
            // 增加分段數 segments=16 讓變形更滑順
            bodyGeo = new RoundedBoxGeometry(1.6, 2.2, 1.0, 16, 0.4);

            // 頂點變形：讓頭端(Y>0)收窄
            const pos = bodyGeo.attributes.position;
            const v = new THREE.Vector3();
            for (let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i);

                // 從中間偏下開始，越往上越收斂
                if (v.y > -0.5) {
                    // 高度係數：從 0.0 (y=-0.5) 到約 1.0 (y=1.1)
                    const factor = (v.y + 0.5) / 1.6;

                    // X軸縮放：頂端縮到原來的 75%
                    const scaleX = 1.0 - (factor * 0.25);

                    // Z軸縮放：頂端縮到原來的 85% (不要縮太多以免變太薄)
                    const scaleZ = 1.0 - (factor * 0.15);

                    v.x *= scaleX;
                    v.z *= scaleZ;
                }
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            bodyGeo.computeVertexNormals();
        } else {
            // Default fallback
            bodyGeo = new THREE.SphereGeometry(1.2, 64, 64);
        }

        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.name = "Body";
        this.bodyMesh.userData.isBody = true;
        this.bodyMesh.castShadow = true;
        this.bodyMesh.receiveShadow = true;
        this.monsterGroup.add(this.bodyMesh);

        // 陰影
        const shadowGeo = new THREE.CircleGeometry(5, 64);
        const shadowMat = new THREE.ShadowMaterial({ opacity: 0.1 });
        const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -1.3;
        shadowPlane.receiveShadow = true;
        this.scene.add(shadowPlane);
    }

    createPart(type, isGhost = false) {
        return this.partsRepository.createPart(type, isGhost);
    }

    setStyle(style) {
        this.partsRepository.setStyle(style);
    }

    addPart(part, parent = null) {
        if (parent) {
            parent.add(part);
        } else {
            if (this.monsterGroup) {
                this.monsterGroup.add(part);
            }
        }
        // Need to ensure we track parts? 
        // Current MonsterManager doesn't seem to have a this.parts list visible in the snippet?
        // Wait, looking at previous view_file of MonsterManager.js
        // It has `this.parts = []` usually?
        // Let's check line 11. It initializes `this.partsRepository = ...`. 
        // It does not seem to maintain a `this.parts` array in the snippet I saw!
        // But `createMonster` adds bodyMesh to monsterGroup.
        // `addPart` is just grouping.
        // I will assume no parts tracking array is strictly needed for this file based on snippet.
    }

    removePart(part) {
        if (this.monsterGroup && part) {
            this.monsterGroup.remove(part);
        }
    }

    update(time) {
        if (this.monsterGroup) {
            const s = 1 + Math.sin(time * 2) * 0.01;
            this.monsterGroup.scale.set(s, s, s);
            this.monsterGroup.position.y = Math.sin(time) * 0.03;
        }
    }
}
