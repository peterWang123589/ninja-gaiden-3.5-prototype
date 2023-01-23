// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Globals } from "../Globals";
import GamepadDeviceManager from "../input/GamepadDeviceManager";
import SpriteFont from "../menus/SpriteFont";

export default class TitleScreen extends Phaser.Scene {
    bg: Phaser.GameObjects.Image;
    font: SpriteFont;
    private static readonly TEXT_MARGIN_LEFT = 64;
    private static readonly TEXT_MARGIN_TOP = 152;
    private static readonly PROMPT_NO_GAMEPADS = 'CONNECT GAMEPADS FOR CO-OP PLAY';
    private static readonly PROMPT_HAS_GAMEPADS = '# OF GAMEPADS FOUND: ';
    private static readonly PROMPT_TOUCH_SCREEN = "TOUCH SCREEN AGAIN TO PLAY";
    noPadGlyphs: Phaser.GameObjects.Sprite[];  
    hasPadGlyphs: Phaser.GameObjects.Sprite[];  
    hasTouchGlyphs: Phaser.GameObjects.Sprite[];  
    numPads: integer;
    kbPlugin: Phaser.Input.Keyboard.KeyboardPlugin;
    padPlugin: Phaser.Input.Gamepad.GamepadPlugin;
    fullscreen: boolean;
    touchConfirmed: integer;
    transitionInProgress: boolean;

    constructor() {
        console.log('[constructor@TitleScreen] IN');
        super('TitleScreen'); 
        this.noPadGlyphs = [];
        this.hasPadGlyphs = [];
        this.hasTouchGlyphs = [];
        this.numPads = 0;
        this.fullscreen = false;
        this.touchConfirmed = 0;
        this.transitionInProgress = false;
        console.log('[constructor@TitleScreen] OUT');
    }

    create() {
        console.log('[TitleScreen.create] IN');
        this.bg = this.add.image(0, 0, 'title_screen');
        this.bg.setOrigin(0, 0);
        //this.bg.setInteractive();
        this.font = new SpriteFont(this);
        let y = this._buildCopyrightNotice(TitleScreen.TEXT_MARGIN_TOP);        
        this._buildPlayerPrompt(y + 8);
        
        // full screen icon
        let icon;
        if (document.fullscreenEnabled) {
            icon = this.add.sprite(Globals.SCREEN_WIDTH - 40, 8, 'full_screen_icon');
            icon.setOrigin(0, 0);
        }
        
        this.kbPlugin = this.input.keyboard.on('keydown', event => {
            console.log("Pressed " + event.key);            
            this._startGame();
        });        
        this.padPlugin = this.input.gamepad.on('down', event => {
            console.log("Pressed " + event.button + " on " + event.pad);            
            this._startGame();
        });
        this.input.addPointer(1);
        this.input.on('pointerdown', pointer => {
            console.log("Touched at point " + pointer.x + "," + pointer.y); 
            if (icon) {
                if (pointer.x >= icon.x && pointer.x < icon.x + icon.width &&
                    pointer.y >= icon.y && pointer.y < icon.y + icon.height) {
                    this._toggleFullScreen();
                    return;
                }
            }
            if (this.touchConfirmed == 0) {
                this.font.setVisible(this.hasPadGlyphs, false);
                this.font.setVisible(this.noPadGlyphs, false);
                this.font.setVisible(this.hasTouchGlyphs, true);
                this.touchConfirmed = 1;
            } else {
                this.touchConfirmed = 2;
                this._startGame();
            }            
        });
        this.cameras.main.fadeIn(1000);
        console.log('[TitleScreen.create] OUT');
    }

    private _toggleFullScreen() {
        //if (!document.fullscreenElement) {
        if (!this.fullscreen) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
        this.fullscreen = !this.fullscreen;
    }

    private _startGame() {
        if (this.transitionInProgress) return;
        this.transitionInProgress = true;
        this.cameras.main.fadeOut(1000, 0, 0, 0, (_camera, _progress) => {
            if (_progress >= 1) {                
                this.scene.start('Scene21Desert', {numPlayers: 1 + this.numPads, touch: (this.touchConfirmed == 2)});
            }
        });
        
    }
    
    private _buildCopyrightNotice(offset_y: integer) {
        let _x = TitleScreen.TEXT_MARGIN_LEFT;
        let _y = offset_y;
        this.font.putGlyph(SpriteFont.CODE_COPYRIGHT, _x - 12, _y);
        this.font.putGlyphs('ORIGINAL GAME TECMO 1991', _x, _y); _y += SpriteFont.CHAR_HEIGHT + 2;
        this.font.putGlyphs('FAN PROJECT A. MOREIRA 2023', _x, _y); _y += SpriteFont.CHAR_HEIGHT + 2;
        this.font.putGlyphs('POWERED BY PHASER 3 GAME ENGINE', _x, _y); _y += SpriteFont.CHAR_HEIGHT + 2;
        return _y;
    }

    private _buildPlayerPrompt(offset_y: integer) {
        let _x = Globals.SCREEN_WIDTH / 2 ;//TitleScreen.TEXT_MARGIN_LEFT;
        let _y = offset_y;
        this.font.putGlyphs('PRESS ANY KEY TO START', _x, _y, SpriteFont.H_ALIGN_CENTER); _y += SpriteFont.CHAR_HEIGHT + 2;
        this.numPads = GamepadDeviceManager.getNumberOfDevices(this);

        this.noPadGlyphs = this.font.putGlyphs(TitleScreen.PROMPT_NO_GAMEPADS, _x, _y, SpriteFont.H_ALIGN_CENTER);
        this.hasPadGlyphs = this.font.putGlyphs(TitleScreen.PROMPT_HAS_GAMEPADS + this.numPads.toString(), _x, _y, SpriteFont.H_ALIGN_CENTER);
        this.hasTouchGlyphs = this.font.putGlyphs(TitleScreen.PROMPT_TOUCH_SCREEN, _x, _y, SpriteFont.H_ALIGN_CENTER);

        this.font.setVisible(this.hasTouchGlyphs, false);
        if (this.numPads > 0) {
            this.font.setVisible(this.noPadGlyphs, false);
        } else {
            this.font.setVisible(this.hasPadGlyphs, false);            
        }

        _y += SpriteFont.CHAR_HEIGHT + 2;

        return _y;
    }

    preload() {
        this.load.spritesheet('hudfont', 'assets/HudFont.png', {
            frameWidth: 8,
            frameHeight: 8
          });
        this.load.image('title_screen', 'assets/TitleScreen.png');
        this.load.image('full_screen_icon', 'assets/FullScreenIcon.png');
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        let numPads = GamepadDeviceManager.getNumberOfDevices(this);        
        if (numPads != this.numPads) {            
            this.numPads = numPads;
            if (numPads > 0) {
                this.font.setVisible(this.hasTouchGlyphs, false);
                this.font.changeGlyph(this.hasPadGlyphs[this.hasPadGlyphs.length - 1], this.numPads.toString());
                this.font.setVisible(this.hasPadGlyphs, true);
                this.font.setVisible(this.noPadGlyphs, false);
            } else {
                this.font.setVisible(this.hasTouchGlyphs, false);
                this.font.setVisible(this.hasPadGlyphs, false);
                this.font.setVisible(this.noPadGlyphs, true);
            }
        }

    }
}