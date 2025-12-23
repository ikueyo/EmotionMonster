import * as THREE from 'three';

export class PartsRepository {
    constructor() {
        this.MONSTER_COLOR = 0x89d6f1;
        this.TOY_MATERIAL_PARAMS = {
            roughness: 0.6,
            metalness: 0.0,
            flatShading: false,
        };
        this.PENETRATION_DEPTH = 0.15;
        this.currentStyle = 'lips'; // Default style
    }

    setStyle(style) {
        if (['lips', 'fangs'].includes(style)) {
            this.currentStyle = style;
        }
    }

    createPart(type, isGhost) {
        const outerGroup = new THREE.Group();
        const innerGroup = new THREE.Group();
        // Adjust pivot to surface level so scaling works correctly
        innerGroup.position.y = this.PENETRATION_DEPTH;
        outerGroup.add(innerGroup);

        // Base Part Material
        const mat = new THREE.MeshStandardMaterial({
            color: this.MONSTER_COLOR,
            ...this.TOY_MATERIAL_PARAMS,
            transparent: isGhost,
            opacity: isGhost ? 0.5 : 1.0,
            emissive: 0x000000
        });

        if (type === 'eye') {
            this._createEye(innerGroup, isGhost);
        } else if (type === 'mouth') {
            this._createMouth(innerGroup, isGhost);
        } else if (type === 'arm') {
            this._createArm(innerGroup, mat, isGhost);
        } else if (type === 'leg') {
            this._createLeg(innerGroup, mat, isGhost);
        } else if (type === 'ear') {
            this._createEar(innerGroup, mat, isGhost);
        } else if (type === 'horn') {
            this._createHorn(innerGroup, mat, isGhost);
        }

        outerGroup.userData = { type: type, isPart: true };
        return outerGroup;
    }

    _createEye(group, isGhost) {
        const scleraMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, roughness: 0.2, metalness: 0,
            transparent: isGhost, opacity: isGhost ? 0.5 : 1,
            emissive: 0x000000
        });
        const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 32), scleraMat);
        // Was 0.2, shifted -0.15 -> 0.05
        sclera.position.y = 0.05;
        sclera.userData.canGlow = true;

        const pupilMat = new THREE.MeshStandardMaterial({
            color: 0x333333, roughness: 0.1,
            transparent: isGhost, opacity: isGhost ? 0.5 : 1,
            emissive: 0x000000
        });
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), pupilMat);
        // Was 0.42 -> 0.27
        pupil.position.y = 0.27;
        pupil.scale.set(1, 0.3, 1);

        const highlightGeo = new THREE.CircleGeometry(0.04, 16);
        const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: isGhost, opacity: isGhost ? 0.5 : 0.8 });
        const highlight = new THREE.Mesh(highlightGeo, highlightMat);
        // Was y=0.45 -> 0.30
        highlight.position.set(0.08, 0.30, 0.08);
        highlight.rotation.x = -Math.PI / 2;

        group.add(sclera, pupil, highlight);
        sclera.castShadow = true;
    }

    _createMouth(group, isGhost) {
        if (this.currentStyle === 'fangs') {
            this._createMouthFangs(group, isGhost);
        } else {
            this._createMouthLips(group, isGhost);
        }
    }

    _createMouthLips(group, isGhost) {
        // --- 👄 嘴唇造型 (無尖牙版) ---
        const lipColor = 0xe63e62; // 唇色
        const lipMat = new THREE.MeshStandardMaterial({
            color: lipColor,
            roughness: 0.4,
            transparent: isGhost, opacity: isGhost ? 0.5 : 1,
            emissive: 0x000000
        });

        // 1. 上嘴唇 (M形)
        const upperLipShape = new THREE.Shape();
        upperLipShape.moveTo(-0.12, 0);
        upperLipShape.quadraticCurveTo(-0.06, 0.08, 0, 0.03);
        upperLipShape.quadraticCurveTo(0.06, 0.08, 0.12, 0);
        upperLipShape.quadraticCurveTo(0, 0.02, -0.12, 0);

        const extrudeSettings = {
            steps: 1, depth: 0.04, bevelEnabled: true,
            bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 5
        };

        const upperLipGeo = new THREE.ExtrudeGeometry(upperLipShape, extrudeSettings);
        const upperLip = new THREE.Mesh(upperLipGeo, lipMat);

        // 調整：旋轉與高度補償
        upperLip.rotation.x = -Math.PI / 2;
        upperLip.position.y = -0.02;
        upperLip.position.z = 0.01;
        upperLip.userData.canGlow = true;

        // 2. 下嘴唇 (U形)
        const lowerLipShape = new THREE.Shape();
        lowerLipShape.moveTo(-0.12, -0.01);
        lowerLipShape.quadraticCurveTo(0, 0.01, 0.12, -0.01);
        lowerLipShape.quadraticCurveTo(0, -0.1, -0.12, -0.01);

        const lowerLipGeo = new THREE.ExtrudeGeometry(lowerLipShape, extrudeSettings);
        const lowerLip = new THREE.Mesh(lowerLipGeo, lipMat);
        lowerLip.rotation.x = -Math.PI / 2;
        lowerLip.position.y = -0.02;
        lowerLip.position.z = 0.01;
        lowerLip.userData.canGlow = true;

        group.add(upperLip, lowerLip);
    }

    _createMouthFangs(group, isGhost) {
        // --- 嘴唇 + 尖牙 ---
        const lipColor = 0xe63e62;
        const lipMat = new THREE.MeshStandardMaterial({
            color: lipColor,
            roughness: 0.4,
            transparent: isGhost, opacity: isGhost ? 0.5 : 1,
            emissive: 0x000000
        });

        // 上嘴唇
        const upperLipShape = new THREE.Shape();
        upperLipShape.moveTo(-0.12, 0);
        upperLipShape.quadraticCurveTo(-0.06, 0.08, 0, 0.03);
        upperLipShape.quadraticCurveTo(0.06, 0.08, 0.12, 0);
        upperLipShape.quadraticCurveTo(0, 0.02, -0.12, 0);

        const extrudeSettings = {
            steps: 1, depth: 0.04, bevelEnabled: true,
            bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 5
        };

        const upperLipGeo = new THREE.ExtrudeGeometry(upperLipShape, extrudeSettings);
        const upperLip = new THREE.Mesh(upperLipGeo, lipMat);
        upperLip.rotation.x = -Math.PI / 2;
        upperLip.position.y = -0.02;
        upperLip.position.z = 0.01;
        upperLip.userData.canGlow = true;

        // 下嘴唇
        const lowerLipShape = new THREE.Shape();
        lowerLipShape.moveTo(-0.12, -0.01);
        lowerLipShape.quadraticCurveTo(0, 0.01, 0.12, -0.01);
        lowerLipShape.quadraticCurveTo(0, -0.1, -0.12, -0.01);

        const lowerLipGeo = new THREE.ExtrudeGeometry(lowerLipShape, extrudeSettings);
        const lowerLip = new THREE.Mesh(lowerLipGeo, lipMat);
        lowerLip.rotation.x = -Math.PI / 2;
        lowerLip.position.y = -0.02;
        lowerLip.position.z = 0.01;
        lowerLip.userData.canGlow = true;

        // 尖牙
        const toothMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, roughness: 0.2,
            transparent: isGhost, opacity: isGhost ? 0.5 : 1,
            emissive: 0x000000
        });
        const toothGeo = new THREE.ConeGeometry(0.025, 0.08, 16);

        const toothL = new THREE.Mesh(toothGeo, toothMat);
        // Adjusted pos for relative container
        toothL.position.set(-0.06, 0.0, 0.03);
        toothL.rotation.x = Math.PI;

        const toothR = new THREE.Mesh(toothGeo, toothMat);
        toothR.position.set(0.06, 0.0, 0.03);
        toothR.rotation.x = Math.PI;

        group.add(upperLip, lowerLip, toothL, toothR);
    }

    _createArm(group, mat, isGhost) {
        const armGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.6, 32);
        armGeo.translate(0, 0.3, 0);
        const arm = new THREE.Mesh(armGeo, mat);
        // Shift down 0.15 to maintain relative pos to outerGroup
        arm.position.y = -0.15;
        arm.userData.canGlow = true;

        const palmGeo = new THREE.SphereGeometry(0.14, 32, 32);
        const palm = new THREE.Mesh(palmGeo, mat);
        // Was 0.65 -> 0.50
        palm.position.y = 0.50;
        palm.scale.set(1, 0.8, 0.6);
        palm.userData.canGlow = true;

        const fingers = new THREE.Group();
        const fingerGeo = new THREE.CapsuleGeometry(0.035, 0.12, 4, 16);

        // Fingers y was 0.78 -> 0.63, 0.75 -> 0.60
        const f2 = new THREE.Mesh(fingerGeo, mat); f2.position.set(0, 0.63, 0); fingers.add(f2);
        const f1 = new THREE.Mesh(fingerGeo, mat); f1.position.set(-0.08, 0.60, 0); f1.rotation.z = 0.3; fingers.add(f1);
        const f3 = new THREE.Mesh(fingerGeo, mat); f3.position.set(0.08, 0.60, 0); f3.rotation.z = -0.3; fingers.add(f3);

        f1.userData.canGlow = true; f2.userData.canGlow = true; f3.userData.canGlow = true;

        group.add(arm, palm, fingers);
        arm.castShadow = true; palm.castShadow = true;
    }

    _createLeg(group, mat, isGhost) {
        const legGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.5, 32);
        legGeo.translate(0, 0.25, 0);
        const leg = new THREE.Mesh(legGeo, mat);
        // Shift down 0.15
        leg.position.y = -0.15;
        leg.userData.canGlow = true;

        const footGeo = new THREE.SphereGeometry(0.2, 32, 32);
        const foot = new THREE.Mesh(footGeo, mat);
        // Was 0.5 -> 0.35
        foot.position.y = 0.35;
        foot.position.z = 0.1; foot.scale.set(1, 0.7, 1.5);
        foot.userData.canGlow = true;

        const toes = new THREE.Group();
        const toeGeo = new THREE.SphereGeometry(0.08, 16, 16);
        // Was 0.45 -> 0.30
        const t2 = new THREE.Mesh(toeGeo, mat); t2.position.set(0, 0.30, 0.4); toes.add(t2);
        const t1 = new THREE.Mesh(toeGeo, mat); t1.position.set(-0.12, 0.30, 0.35); toes.add(t1);
        const t3 = new THREE.Mesh(toeGeo, mat); t3.position.set(0.12, 0.30, 0.35); toes.add(t3);

        t1.userData.canGlow = true; t2.userData.canGlow = true; t3.userData.canGlow = true;

        group.add(leg, foot, toes);
        leg.castShadow = true; foot.castShadow = true;
    }
    _createEar(group, mat, isGhost) {
        // Simple rounded ear shape
        const earGeo = new THREE.SphereGeometry(0.15, 32, 32);
        // Flatten it a bit
        earGeo.scale(1, 1, 0.4);
        const ear = new THREE.Mesh(earGeo, mat);
        ear.position.y = 0.05;
        ear.userData.canGlow = true;

        // Inner ear details
        const innerGeo = new THREE.SphereGeometry(0.1, 32, 32);
        innerGeo.scale(1, 1, 0.4);
        const innerEar = new THREE.Mesh(innerGeo, mat);
        innerEar.position.set(0, 0.05, 0.05);
        innerEar.scale.set(0.7, 0.7, 1);

        group.add(ear);
        ear.castShadow = true;
    }

    _createHorn(group, mat, isGhost) {
        // Rounded Cone (Pointed Horn)
        // radius=0.08, height=0.35
        const hornGeo = new THREE.ConeGeometry(0.08, 0.35, 32, 10);

        // Move pivot to base: default center is 0, so base is at -0.175.
        // We want base at 0, so translate up by half height.
        hornGeo.translate(0, 0.175, 0);

        // Bend the cone
        const pos = hornGeo.attributes.position;
        const v = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            // Bend factor: x += y^2 * strength
            // The higher the y, the more it bends
            const bend = v.y * v.y * 1.5;
            v.x += bend;
            pos.setXYZ(i, v.x, v.y, v.z);
        }
        hornGeo.computeVertexNormals();

        const horn = new THREE.Mesh(hornGeo, mat);
        horn.position.y = -0.05;
        horn.userData.canGlow = true;

        group.add(horn);
        horn.castShadow = true;
    }
}
