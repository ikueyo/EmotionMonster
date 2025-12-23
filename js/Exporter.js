export class Exporter {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
    }

    downloadImage(filename = 'emotion_monster.png') {
        this.renderer.render(this.scene, this.camera);
        const dataURL = this.renderer.domElement.toDataURL('image/png');

        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        link.click();
    }
}
