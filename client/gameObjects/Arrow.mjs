import Phaser from "phaser";

export default class Arrow extends Phaser.GameObjects.Image {
  constructor(scene, x, y) {
    super(scene, x, y, "arrow-bow");

    this.setScale(0.5, 0.5);
    this.visible = false;
  }
}
