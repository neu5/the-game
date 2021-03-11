import UIPlayerList from "./playerList";

export default class UIPlayerStatusList {
  constructor() {
    this.activePlayerList = new UIPlayerList("player-list-active");
    this.inactivePlayerList = new UIPlayerList("player-list-inactive");
  }

  get activeCount() {
    return this.activePlayerList.count;
  }

  playerActive(playerId) {
    this.activePlayerList.addPlayer(playerId);
    this.inactivePlayerList.removePlayer(playerId);
  }

  playerInactive(playerId) {
    this.activePlayerList.removePlayer(playerId);
    this.inactivePlayerList.addPlayer(playerId);
  }

  rebuild(players) {
    this.clear();
    Object.entries(players).forEach((p) => {
      if (p[1].isOnline === true) {
        this.activePlayerList.addPlayer(p[1].id);
      } else {
        this.inactivePlayerList.addPlayer(p[1].id);
      }
    });
  }

  clear() {
    this.activePlayerList.clear();
    this.inactivePlayerList.clear();
  }
}
