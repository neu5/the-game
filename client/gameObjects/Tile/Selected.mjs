import Tile from "./Tile.mjs";

export default class TileSelected extends Tile {
  constructor(scene, x, y) {
    super(scene, x, y, "tile-selected");
  }
}
