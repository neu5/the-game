import Phaser from 'phaser';
import io from 'socket.io-client';

export default class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }
    preload() {
        this.load.image('tileset', './assets/tileset/tileset.png');
        this.load.tilemapTiledJSON('map', './assets/map/map.json');

        this.load.spritesheet('player', './assets/character/characters.png', {
            frameWidth: 52,
            frameHeight: 72,
        });
    }
    create() {
        const tilemap = this.make.tilemap({ key: 'map' });
        const tileset = tilemap.addTilesetImage('tileset', 'tileset');

        const groundLayer = tilemap.createLayer('Ground', tileset);
        const collisionsLayer = tilemap.createLayer('Collisions', tileset);
        const aboveLayer = tilemap.createLayer('Above', tileset);

        // collisionsLayer.setCollisionByProperty({ collides: true });

        const playerSprite = this.add.sprite(0, 0, 'player');
        // playerSprite.setDepth(2);
        this.cameras.main.startFollow(playerSprite);

        const gridMovementConfig = {
            characters: [{
              id: 'player',
              sprite: playerSprite,
              walkingAnimationMapping: 6,
              startPosition: new Phaser.Math.Vector2(8, 8)
            }],
          };
        
        this.gridMovementPlugin.create(tilemap, gridMovementConfig);

        // const debugGraphics = this.add.graphics().setAlpha(0.75);
        //     collisionsLayer.renderDebug(debugGraphics, {
        //     tileColor: null, // Color of non-colliding tiles
        //     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        //     faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
        // });

        this.socket = io();
        this.stateStatus = null;
        this._playersNum = 0;
        this._players = {};

        this.socket.on('newPlayer', player => {
            let id = player.playerId;
            this.displayServerMessage('New player connected! ' + id);
            this.updatePlayers(this._playersNum + 1);
            this._players[id] = {
                playerId: id
            };
        });
        this.socket.on('playerDisconnected', id => {
            this.displayServerMessage('Player has left: ' + id);
            this.updatePlayers(this._playersNum - 1);
            delete this._players[id];
        });
        this.socket.on('currentPlayers', players => {
            let playerNum = Object.keys(players).length;
            this.displayServerMessage('Current players: ' + playerNum);
            this.updatePlayers(playerNum);
            this._players = players;
        });

        this.cameras.main.fadeIn(250);
        this.stateStatus = 'playing';
    }
    updatePlayers(n) {
        this._playersNum = n;
    }
    displayServerMessage(msg) {
        var posX = 30;
        var posY = 150;
        var msg = this.add.text(posX, posY, 'server: ' + msg, { font: '22px ', fill: '#ffde00', stroke: '#000', strokeThickness: 3 });
        msg.setOrigin(0.0, 0.0);
        this.tweens.add({targets: msg, alpha: 0, y: posY-50, duration: 4000, ease: 'Linear'});
    }
    update() {
        const cursors = this.input.keyboard.createCursorKeys();
            if (cursors.left.isDown) {
            this.gridMovementPlugin.moveLeft('player');
            } else if (cursors.right.isDown) {
            this.gridMovementPlugin.moveRight('player');
            } else if (cursors.up.isDown) {
            this.gridMovementPlugin.moveUp('player');
            } else if (cursors.down.isDown) {
            this.gridMovementPlugin.moveDown('player');
            }
    }
};