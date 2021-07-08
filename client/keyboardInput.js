import { Input } from './input.js'

export const KEY_LEFT = 37;
export const KEY_RIGHT = 39;
export const KEY_UP = 38;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_A = 65;
export const KEY_S = 83;
export const KEY_D = 68;
export const KEY_W = 87;

export class KeyboardInput extends Input {
    pushing;
    xForce;
    angForce;
    buttonsDown;
    movementKeys;
    objectToMove;

    constructor(objectToMove, key_left, key_right, key_turnLeft, key_turnRight) {
        super()
        this.objectToMove = objectToMove;
        this.movementKeys = [key_left, key_right];
        this.cannonKeys = [key_turnLeft, key_turnRight];
        this.buttonsDown = {}
    }

    setup(element, document) {
        
        document.addEventListener('keydown', (e) => {
            this.buttonsDown[e.keyCode] = true;

//            console.log('key down', e.keyCode)

            e.cancelBubble = true;
            e.stopPropagation();
            return false;
        });

        document.addEventListener('keyup', (e) => {
            this.buttonsDown[e.keyCode] = false;

            e.cancelBubble = true;
            e.stopPropagation();
            return false;
        });

        document.addEventListener('mousedown', () => {
            this.buttonsDown[KEY_SPACE] = true;
        })

        document.addEventListener('mouseup', () => {
            this.buttonsDown[KEY_SPACE] = false;
        })

        document.addEventListener('mouseout', () => {
            this.buttonsDown[KEY_SPACE] = false;
        })
    }

    step() {
        super.step()

        this.objectToMove.motion *= 0.97;
        if (this.buttonsDown[KEY_SPACE]) {
            this.objectToMove.fire();
        }
        if (this.buttonsDown[this.movementKeys[0]]) {
            this.objectToMove.motion = -1.0;
        } else if (this.buttonsDown[this.movementKeys[1]]) {
            this.objectToMove.motion = 1.0;
        }
        this.objectToMove.motion = Math.min(1, Math.max(-1, this.objectToMove.motion))

        this.objectToMove.cannonMotion *= 0.67;
        if (this.buttonsDown[this.cannonKeys[0]]) {
            this.objectToMove.cannonMotion -= 0.1;
        } else if (this.buttonsDown[this.cannonKeys[1]]) {
            this.objectToMove.cannonMotion += 0.1;
        }
        this.objectToMove.cannonMotion = Math.min(1, Math.max(-1, this.objectToMove.cannonMotion))
    }
}
