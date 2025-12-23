import * as THREE from 'three';

export class InteractionManager {
    constructor(camera, scene, monsterManager, container) {
        this.camera = camera;
        this.scene = scene;
        this.monsterManager = monsterManager;
        this.container = container;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.state = {
            isDraggingNew: false,
            dragType: null,
            ghostPart: null,
            selectedPart: null,
            selectedInner: null,
            isEditing: false
        };

        this.PENETRATION_DEPTH = 0.15;
        this.onSelectionChange = null; // Callback
    }

    init() {
        this.container.addEventListener('mousemove', (e) => this.onMove(e));
        this.container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.onMove(e.touches[0]);
        }, { passive: false });

        this.container.addEventListener('mouseup', () => this.onEnd());
        this.container.addEventListener('touchend', () => this.onEnd());

        this.container.addEventListener('mousedown', (e) => this.onDown(e));
        this.container.addEventListener('touchstart', (e) => this.onDown(e.touches[0]), { passive: false });
    }

    startDragNew(type) {
        if (this.state.isDraggingNew) return;

        this.state.isDraggingNew = true;
        this.state.dragType = type;
        this.state.ghostPart = this.monsterManager.createPart(type, true);
        this.state.ghostPart.visible = false;
        this.scene.add(this.state.ghostPart);

        this.deselect();
        if (this.onSelectionChange) this.onSelectionChange(null);
    }

    getMouse(e) {
        const rect = this.container.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((e.clientY - rect.top) / rect.height) * 2 + 1
        };
    }

    onDown(e) {
        if (this.state.isDraggingNew) return;
        const m = this.getMouse(e);
        this.mouse.set(m.x, m.y);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.monsterManager.monsterGroup.children, true);
        let hitPart = null;

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && obj.parent !== this.monsterManager.monsterGroup) {
                if (obj.userData && obj.userData.isPart) { hitPart = obj; break; }
                obj = obj.parent;
            }
            if (!hitPart && obj.userData && obj.userData.isPart) hitPart = obj;
        }

        if (hitPart) {
            this.select(hitPart);
            // Only set editing if it's a part, not body (body doesn't drag)
            if (!hitPart.userData.isBody) {
                this.state.isEditing = true;
            }
        } else {
            this.deselect();
        }
    }

    onMove(e) {
        const m = this.getMouse(e);
        this.mouse.set(m.x, m.y);

        if (this.state.isDraggingNew || this.state.isEditing) {
            if (!this.monsterManager.monsterGroup) return;

            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Raycast against everything in monsterGroup to find potential parents
            const intersects = this.raycaster.intersectObjects(this.monsterManager.monsterGroup.children, true);

            let hit = null;
            let hitObj = null;

            for (let i = 0; i < intersects.length; i++) {
                const obj = intersects[i].object;

                // Helper: Check if obj is descendent of specific parent or is that parent
                const isDescendant = (child, ancestor) => {
                    if (!ancestor) return false;
                    let p = child;
                    while (p) {
                        if (p === ancestor) return true;
                        p = p.parent;
                    }
                    return false;
                };

                // Ignore Self (Ghost or Selected)
                if (isDescendant(obj, this.state.ghostPart)) continue;
                if (isDescendant(obj, this.state.selectedPart)) continue;

                // Stop ray if we hit shadow plane or non-body/non-part (like helper lines if any)
                // Just filtering for visual meshes.

                if (obj.userData.isBody) {
                    hit = intersects[i];
                    hitObj = this.monsterManager.bodyMesh;
                    break;
                }

                if (obj.isMesh && obj !== this.monsterManager.bodyMesh) {
                    // Verify it's part of the monster
                    if (isDescendant(obj, this.monsterManager.monsterGroup)) {
                        hit = intersects[i];
                        hitObj = obj;
                        break;
                    }
                }
            }

            if (hit && hitObj) {
                const target = this.state.isDraggingNew ? this.state.ghostPart : this.state.selectedPart;
                this.state.targetParent = hitObj;

                if (target) {
                    target.visible = true;

                    const normal = hit.face.normal.clone();
                    normal.transformDirection(hitObj.matrixWorld).normalize();

                    const penetrationOffset = normal.clone().multiplyScalar(this.PENETRATION_DEPTH);
                    const buriedPoint = hit.point.clone().sub(penetrationOffset);

                    const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

                    // Visualize: Set world transform
                    target.position.copy(buriedPoint);
                    target.quaternion.copy(targetQuat);

                    target.updateMatrixWorld();
                }
            } else {
                if (this.state.isDraggingNew && this.state.ghostPart) this.state.ghostPart.visible = false;
                this.state.targetParent = null;
            }
        }
    }

    onEnd() {
        if (this.state.isDraggingNew) {
            if (this.state.ghostPart && this.state.ghostPart.visible && this.state.targetParent) {
                const newPart = this.monsterManager.createPart(this.state.dragType, false);

                let parent = this.state.targetParent;
                if (parent.userData.isBody) {
                    parent = this.monsterManager.monsterGroup;
                }

                this.monsterManager.addPart(newPart, parent);

                const worldPos = new THREE.Vector3();
                const worldQuat = new THREE.Quaternion();
                this.state.ghostPart.getWorldPosition(worldPos);
                this.state.ghostPart.getWorldQuaternion(worldQuat);

                // Convert to parent local
                parent.worldToLocal(worldPos);

                // Rotation handling
                const parentWorldQuat = new THREE.Quaternion();
                parent.getWorldQuaternion(parentWorldQuat);
                const parentWorldInverse = parentWorldQuat.clone().invert();

                newPart.position.copy(worldPos);
                newPart.quaternion.copy(parentWorldInverse.multiply(worldQuat));

                this.select(newPart);
            }
            if (this.state.ghostPart) this.scene.remove(this.state.ghostPart);
            this.state.ghostPart = null;
            this.state.isDraggingNew = false;
            this.state.targetParent = null;
        }
        if (this.state.isEditing) {
            if (this.state.selectedPart && this.state.targetParent) {
                let parent = this.state.targetParent;
                if (parent.userData.isBody) parent = this.monsterManager.monsterGroup;

                if (this.state.selectedPart.parent !== parent) {
                    // Reparent
                    const worldPos = new THREE.Vector3();
                    const worldQuat = new THREE.Quaternion();
                    this.state.selectedPart.getWorldPosition(worldPos);
                    this.state.selectedPart.getWorldQuaternion(worldQuat);

                    // Attach
                    parent.add(this.state.selectedPart);

                    // Restore transform
                    parent.worldToLocal(worldPos);
                    const parentWorldQuat = new THREE.Quaternion();
                    parent.getWorldQuaternion(parentWorldQuat);

                    this.state.selectedPart.position.copy(worldPos);
                    this.state.selectedPart.quaternion.copy(parentWorldQuat.invert().multiply(worldQuat));
                }
            }
            this.state.isEditing = false;
            this.state.targetParent = null;
        }
    }

    select(part) {
        if (this.state.selectedPart === part) return;
        if (this.state.selectedPart) this.deselect();

        this.state.selectedPart = part;
        if (part.children && part.children.length > 0 && !part.userData.isBody) {
            this.state.selectedInner = part.children[0];
        } else {
            this.state.selectedInner = null; // Body doesn't have rotatable inner part usually
        }

        // Visual Highlight
        part.traverse(c => {
            if (c.isMesh && c.userData.canGlow && c.material && c.material.emissive) {
                c.material.emissive.setHex(0xffffff);
                c.material.emissiveIntensity = 0.3;
            }
        });

        if (this.onSelectionChange) this.onSelectionChange(this.state.selectedPart);
    }

    deselect() {
        if (this.state.selectedPart) {
            this.state.selectedPart.traverse(c => {
                if (c.isMesh && c.material && c.material.emissive) {
                    c.material.emissive.setHex(0x000000);
                    c.material.emissiveIntensity = 0;
                }
            });
        }
        this.state.selectedPart = null;
        this.state.selectedInner = null;

        if (this.onSelectionChange) this.onSelectionChange(null);
    }

    deleteSelected() {
        if (this.state.selectedPart) {
            this.monsterManager.removePart(this.state.selectedPart);
            this.deselect();
        }
    }

    rotateSelected(axis, degrees) {
        if (!this.state.selectedInner) return;
        const rad = degrees * (Math.PI / 180);
        if (axis === 'y') this.state.selectedInner.rotation.y = rad;
        if (axis === 'z') this.state.selectedInner.rotation.z = rad;
    }

    scaleSelected(scale) {
        if (!this.state.selectedInner) return;
        this.state.selectedInner.scale.set(scale, scale, scale);
    }
}
