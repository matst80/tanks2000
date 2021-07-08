import { KeyboardInput, KEY_A, KEY_D, KEY_LEFT, KEY_RIGHT, KEY_W, KEY_UP, KEY_DOWN, KEY_S } from './keyboardInput.js';
import { Player } from './player.js';
import { DebugRender } from './debugRender.js';

const PTM = 32;


export class Game2 {
    canvas;
    context;
    player1;
    player2;
    size;
    keyboardInput1;
    keyboardInput2;
    stepComponents = [];
    killList;

    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.size = [canvas.width, canvas.height];
    }
    getContactListener() {
        // const w = this.world;
        
        var contactListener = new Box2D.JSContactListener();

        contactListener.BeginContact =  (contact) => {
            contact = Box2D.wrapPointer(contact, Box2D.b2Contact);
            const bodyA = contact.GetFixtureA().GetBody();
            const bodyB = contact.GetFixtureB().GetBody();

            if (bodyA.IsBullet()) {
                // w.DestroyBody(bodyA);
                this.killList.add(bodyA);
            }
            if (bodyB.IsBullet()) {
                // w.DestroyBody(bodyB);
                this.killList.add(bodyB);
            }
            //[contact logic here]
        }

        contactListener.EndContact = (contact) =>{
            contact = Box2D.wrapPointer(contact, Box2D.b2Contact);
            //[contact logic here]
        }

        contactListener.PreSolve =  (contact, oldManifold)=> {
            contact = Box2D.wrapPointer(contact, Box2D.b2Contact);
            oldManifold = Box2D.wrapPointer(oldManifold, Box2D.b2Manifold);
            //[contact logic here]
        }

        contactListener.PostSolve = (contact, impulse) => {
            contact = Box2D.wrapPointer(contact, Box2D.b2Contact);
            impulse = Box2D.wrapPointer(impulse, Box2D.b2ContactImpulse);
            //[contact logic here]
        }

        return contactListener;
    }

    setup() {
        this.killList = new Set();
        this.renderer = new DebugRender();

        var gravity = new Box2D.b2Vec2(0, -10);
        this.world = new Box2D.b2World(gravity, true);
        this.world.SetContactListener(this.getContactListener())
        this.renderer.setup(this.context, this.world);

        this.createGround();

        this.player1 = new Player(this.world, { x: 15, y: 20 });
        this.player2 = new Player(this.world, { x: 35, y: 20 });

        this.keyboardInput1 = new KeyboardInput(this.player1, KEY_A, KEY_D, KEY_W, KEY_S);
        this.keyboardInput2 = new KeyboardInput(this.player2, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN);
        this.keyboardInput1.setup(this.canvas, window.document);
        this.keyboardInput2.setup(this.canvas, window.document);
        this.stepComponents.push(this.keyboardInput1);
        this.stepComponents.push(this.keyboardInput2);
        this.stepComponents.push(this.player1);
        this.stepComponents.push(this.player2);
        this.step();
    }

    createGround() {
        var bd_ground = new Box2D.b2BodyDef();
        var groundBody = this.world.CreateBody(bd_ground);

        //ground edges
        var shape0 = new Box2D.b2EdgeShape();

        var fd = new Box2D.b2FixtureDef();
        fd.set_density(1.0);
        fd.set_friction(1.0);

        const w = 60;
        const steps = 30;
        const step = w / steps;
        let currentH = 10;
        for (var i = 0; i <= steps; i++) {
            var yStep = (Math.random() * 2) - 1;

            shape0.Set(new Box2D.b2Vec2(step * (i - 1), currentH), new Box2D.b2Vec2(step * (i), currentH + yStep));
            currentH += yStep;
            fd.set_shape(shape0);
            groundBody.CreateFixture(fd);
        }

        shape0.Set(new Box2D.b2Vec2(1.0, 25.0), new Box2D.b2Vec2(1.0, 0.0));
        fd.set_shape(shape0);
        groundBody.CreateFixture(fd);

        shape0.Set(new Box2D.b2Vec2(w, 25.0), new Box2D.b2Vec2(w, 0.0));
        fd.set_shape(shape0);
        groundBody.CreateFixture(fd);

        groundBody.SetAwake(1);
        groundBody.SetActive(1);
        // groundBody.set_density(2.0);
        // groundBody.set_friction(0.9);

        for (var i = 0; i < 5; ++i) {
            var shape = new Box2D.b2CircleShape();
            const r = Math.random();
            shape.set_m_radius(1 + r * 1.0);

            var bd = new Box2D.b2BodyDef();
            // bd.set_type(b2_dynamicBody);
            bd.set_type(Box2D.b2_dynamicBody);
            bd.set_position(new Box2D.b2Vec2(5.9 + 0.6 * i, 12.4 + Math.random() * 13.0));

            var body = this.world.CreateBody(bd);
            body.CreateFixture(shape, r * 10.0);
        }

    }

    step() {
        this.stepComponents.forEach(s => s.step());

        this.world.Step(1.0 / 60.0, 10, 5);

        this.killList.forEach(k => {
            console.log('kill', k)
            this.world.DestroyBody(k)
        })
        this.killList.clear();

        this.context.save();
        this.context.fillStyle = `#000`;
        this.context.fillRect(0, 0, ...this.size);

        this.context.translate(0, this.canvas.height);
        this.context.scale(1, -1);
        this.context.scale(PTM, PTM);


        this.renderer.render()

        this.context.restore();

        requestAnimationFrame(() => {
            this.step();
        });
    }
}

window.Game2 = Game2;
