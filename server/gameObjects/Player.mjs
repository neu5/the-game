import {
  getChebyshevDistance,
  getDestTile,
  getXYFromTile,
} from "../utils/algo.mjs";

import {
  GAME_ITEMS,
  ITEM_TYPES,
  WEARABLE_TYPES,
  getCurrentWeapon,
} from "../../shared/index.mjs";

const noObstacles = ({ PF, finder, map, player }) => {
  let noObstacle = true;

  if (player.equipment.weapon === "bow") {
    const combatGrid = new PF.Grid(map.length, map.length);
    const combatPath = finder
      .findPath(
        player.positionTile.tileX,
        player.positionTile.tileY,
        player.selectedPlayer.positionTile.tileX,
        player.selectedPlayer.positionTile.tileY,
        combatGrid
      )
      .slice(1, -1);

    noObstacle = combatPath.every(([x, y]) => map[y][x] === 0);
  }

  return noObstacle;
};

const ENERGY_ACTION_USE = 50;
const ENERGY_ATTACK_USE = 15;
const ENERGY_REGEN_RATE = 3;
const ENERGY_MAX = 100;

export default class Player {
  constructor({
    name,
    displayName,
    fraction,
    positionTile,
    size,
    dest,
    isWalking,
    isDead,
    equipment,
    backpack,
    settings,
    selectedPlayer,
    selectedPlayerTile,
    dropSelection,
    action,
    actionDurationTicks,
    actionDurationMaxTicks,
    attack,
    attackDelayTicks,
    attackDelayMaxTicks,
    energyRegenDelayTicks,
    energyRegenDelayMaxTicks,
    next,
    speed,
    isOnline,
    socketId,
    direction,
    hp,
    energy,
  }) {
    this.name = name;
    this.displayName = displayName;
    this.fraction = fraction;

    // movement
    this.positionTile = positionTile;
    this.size = size;
    this.dest = dest;
    this.isWalking = isWalking;
    this.isDead = isDead;
    this.direction = direction;
    this.speed = speed;
    this.next = next;
    this.dropSelection = dropSelection;

    // settings
    this.equipment = equipment;
    this.backpack = backpack;
    this.settings = settings;
    this.selectedPlayer = selectedPlayer;
    this.selectedPlayerTile = selectedPlayerTile;

    // properties
    this.action = action;
    this.actionDurationTicks = actionDurationTicks;
    this.actionDurationMaxTicks = actionDurationMaxTicks;
    this.attack = attack;
    this.attackDelayTicks = attackDelayTicks;
    this.attackDelayMaxTicks = attackDelayMaxTicks;
    this.energyRegenDelayTicks = energyRegenDelayTicks;
    this.energyRegenDelayMaxTicks = energyRegenDelayMaxTicks;
    this.hp = hp;
    this.energy = energy;

    // technical info
    this.socketId = socketId;
    this.isOnline = isOnline;

    // generated
    const { x, y } = getXYFromTile(positionTile.tileX, positionTile.tileY);
    this.x = x;
    this.y = y;
    this.toRespawn = false;
  }

  getFromBackpack(itemName) {
    return this.backpack.items.find((item) => item.id === itemName);
  }

  getWeaponRange() {
    return getCurrentWeapon(this.equipment.weapon).weapon.range;
  }

  canAddToBackpack(itemsToAddNum) {
    return itemsToAddNum <= this.backpack.slots - this.backpack.items.length;
  }

  addToBackpack(newItems) {
    if (!this.canAddToBackpack(newItems.length)) {
      return false;
    }

    newItems.forEach((newItem) => {
      const item = this.backpack.items.find((i) => i.id === newItem.id);

      if (item) {
        item.quantity += newItem.quantity;
      } else {
        this.backpack.items.push(newItem);
      }
    });

    return true;
  }

  moveToBackpack(itemName, equipmentItemType) {
    const item = this.equipment[equipmentItemType];

    if (itemName !== item.id) {
      return false;
    }

    const itemSchema = GAME_ITEMS[item.id];

    if (itemSchema.type === ITEM_TYPES.BACKPACK) {
      return false;
    }

    if (itemSchema.type === ITEM_TYPES.QUIVER && this.hasArrows()) {
      const { arrows } = this.equipment;
      if (!this.addToBackpack([item, arrows])) {
        return false;
      }

      this.removeFromEquipment(arrows.id, ITEM_TYPES.ARROWS);
    } else if (!this.addToBackpack([item])) {
      return false;
    }

    this.removeFromEquipment(itemName, equipmentItemType);

    return true;
  }

  removeFromBackpack(itemName) {
    const item = this.getFromBackpack(itemName);

    if (!item) {
      return false;
    }

    const itemSchema = GAME_ITEMS[item.id];

    if (itemSchema.type === ITEM_TYPES.ARROWS) {
      this.destroyItemFromBackpack(itemName);
    } else if (item.quantity > 1) {
      item.quantity -= 1;
    } else if (!this.destroyItemFromBackpack(itemName)) {
      return false;
    }

    return true;
  }

  setBackpack(slots = 0, items = []) {
    this.backpack = {
      slots,
      items,
    };
  }

  addToEquipment(item) {
    const itemSchema = GAME_ITEMS[item.id];

    if (!itemSchema || !WEARABLE_TYPES.includes(itemSchema.type)) {
      return false;
    }

    const itemFromEquipment = this.equipment[itemSchema.type];
    if (
      itemFromEquipment &&
      !this.moveToBackpack(itemFromEquipment.id, itemSchema.type)
    ) {
      return false;
    }

    if (
      itemSchema.type === ITEM_TYPES.ARROWS &&
      this.equipment.quiver === undefined
    ) {
      return false;
    }

    this.equipment[itemSchema.type] = item;

    return true;
  }

  moveToEquipmentFromBackpack(itemName) {
    const item = this.getFromBackpack(itemName);

    const itemSchema = GAME_ITEMS[item.id];

    if (!WEARABLE_TYPES.includes(itemSchema.type)) {
      return false;
    }

    if (itemSchema.type === ITEM_TYPES.BACKPACK) {
      const currentBackpack = this.equipment.backpack;
      const backpackItems = this.backpack.items;

      const { slots } = itemSchema;

      this.setBackpack(slots, [
        ...(backpackItems.length >= slots
          ? backpackItems.slice(0, slots)
          : backpackItems),
        currentBackpack,
      ]);

      this.destroyItemFromBackpack(itemName);
      this.equipment.backpack = item;
    } else {
      if (!this.removeFromBackpack(itemName)) {
        this.removeFromEquipment(itemName, GAME_ITEMS[itemName]);

        return false;
      }
      if (!this.addToEquipment(item)) {
        return false;
      }
    }

    return true;
  }

  removeFromEquipment(itemName, equipmentItemType) {
    return this.destroyItemFromEquipment(itemName, equipmentItemType);
  }

  setOnline(socketId) {
    this.isOnline = true;
    this.socketId = socketId;
  }

  setSelectedObject(player) {
    this.selectedPlayer = player;
  }

  setSettingsFollow(value) {
    this.settings.follow = value;
  }

  setSettingsFight(value) {
    this.settings.fight = value;
  }

  setSettingsShowRange(value) {
    this.settings.showRange = value;
  }

  setWeapon(value) {
    this.equipment.weapon = value;
  }

  inRange(range) {
    return (
      getChebyshevDistance(
        this.positionTile,
        this.selectedPlayer.positionTile
      ) <= range
    );
  }

  hasRangedWeapon() {
    return this.getWeaponRange() > 1;
  }

  hasArrows() {
    return Boolean(this.equipment.arrows);
  }

  useArrow() {
    if (this.hasArrows()) {
      this.equipment.arrows.quantity -= 1;

      if (this.equipment.arrows.quantity === 0) {
        this.removeFromEquipment(this.equipment.arrows.id, "arrows");
      }

      return true;
    }
    return false;
  }

  canAttack({ PF, finder, map }) {
    return (
      this.selectedPlayer.isDead === false &&
      this.energy >= ENERGY_ATTACK_USE &&
      this.attackDelayTicks >= this.attackDelayMaxTicks &&
      (this.hasRangedWeapon() ? this.hasArrows() : true) &&
      this.inRange(this.getWeaponRange()) &&
      noObstacles({ PF, finder, map, player: this })
    );
  }

  canPerformAction() {
    return this.inRange(1) && this.energy >= ENERGY_ACTION_USE;
  }

  gotHit(damage) {
    this.hp -= damage;

    if (this.hp < 0) {
      this.hp = 0;
    }

    if (this.hp === 0) {
      this.energy = 0;
      this.isDead = true;
      this.resetSelected();

      if (this.action && this.actionDurationTicks !== null) {
        this.action = null;
        this.actionDurationTicks = null;
        this.actionDurationMax = null;
      }
    }
  }

  updateFollowing(map, players) {
    if (
      this.selectedPlayerTile === null ||
      this.selectedPlayer.positionTile.tileX !==
        this.selectedPlayerTile.tileX ||
      this.selectedPlayer.positionTile.tileY !== this.selectedPlayerTile.tileY
    ) {
      this.selectedPlayerTile = {
        tileX: this.selectedPlayer.positionTile.tileX,
        tileY: this.selectedPlayer.positionTile.tileY,
      };

      let obj = this.selectedPlayer;

      if (this.selectedPlayer.startingTile === undefined) {
        obj = {
          ...obj,
          startingTile: obj.positionTile,
        };
      }

      const { tileX, tileY } = getDestTile(this, {
        map,
        obj,
        players,
      });

      if (tileX && tileY) {
        this.dest = {
          ...getXYFromTile(tileX, tileY),
          tile: {
            tileX,
            tileY,
          },
        };
      }
    }
  }

  energyUse(type) {
    this.energy -= {
      attack: ENERGY_ATTACK_USE,
      chop: ENERGY_ACTION_USE,
      mine: ENERGY_ACTION_USE,
    }[type];
  }

  energyRegenerate() {
    if (
      this.energyRegenDelayTicks >= this.energyRegenDelayMaxTicks &&
      !this.isDead &&
      this.energy < ENERGY_MAX
    ) {
      this.energy += ENERGY_REGEN_RATE;
      this.energyRegenDelayTicks = 0;

      if (this.energy > ENERGY_MAX) {
        this.energy = ENERGY_MAX;
      }
      return true;
    }
    return false;
  }

  destroyItem(itemName, equipmentItemType) {
    return equipmentItemType
      ? this.destroyItemFromEquipment(itemName, equipmentItemType)
      : this.destroyItemFromBackpack(itemName);
  }

  destroyItemFromBackpack(itemName) {
    try {
      this.backpack.items = this.backpack.items.reduce(
        (backpack, currentItem) => {
          if (currentItem.id !== itemName) {
            backpack.push(currentItem);
          }
          return backpack;
        },
        []
      );
      return true;
    } catch (err) {
      throw new Error(`Cannot destroy ${itemName} from backpack.`);
    }
  }

  destroyItemFromEquipment(itemName, equipmentItemType) {
    const item = this.equipment[equipmentItemType];

    if (itemName === item.id && delete this.equipment[equipmentItemType]) {
      const itemSchema = GAME_ITEMS[item.id];

      if (itemSchema.type === ITEM_TYPES.BACKPACK) {
        this.setBackpack();
      }

      return true;
    }
    return false;
  }

  respawn(respawnTile) {
    this.isDead = false;
    this.toRespawn = false;
    this.hp = 100;
    this.energy = ENERGY_MAX;

    const respawnXY = getXYFromTile(respawnTile.tileX, respawnTile.tileY);
    this.positionTile = respawnTile;
    this.x = respawnXY.x;
    this.y = respawnXY.y;
  }

  resetActionDuration() {
    if (Number.isInteger(this.actionDurationTicks)) {
      this.actionDurationTicks = null;
      this.actionDurationMax = null;

      return true;
    }

    return false;
  }

  resetSelected() {
    this.dropSelection = true;
  }
}
