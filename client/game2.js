import { KeyboardInput, KEY_A, KEY_D, KEY_LEFT, KEY_RIGHT, KEY_W, KEY_UP, KEY_DOWN, KEY_S, KEY_SPACE } from './keyboardInput.js';
import { Player } from './player.js';
import { ParticleSystem } from './particleSystem.js';
import { LevelGenerator } from './levels.js';
import { Network } from './network.js';

// module aliases
const Engine = Matter.Engine,
    Render = Matter.Render,
    Events = Matter.Events,
    Runner = Matter.Runner,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

const PTM = 32;

class Game {
    dummy=0;
    canvas;
    context;
    player;
    size;
    keyboardInput1;
    keyboardInput2;
    particleSystem;
    levelGenerator;
    networkPlayers = {};
    stepComponents = [];
    network;
    killList;

    constructor() {

        this.levelGenerator = new LevelGenerator();
        this.network = new Network('localhost:8080', () => this.setup(), Math.floor(Math.random() * 100000));

        // create an engine
        const engine = this.engine = Engine.create();
        this.world = engine.world;

        var boxA = Bodies.rectangle(400, 200, 60, 60);
        var boxB = Bodies.rectangle(450, 50, 60, 60);
        var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
        //Body.setAngle(ground, 1);

        // add all of the bodies to the world
        Composite.add(this.world, [boxA, boxB, ground]);

        // create a renderer
        var render = Render.create({
            element: document.body,
            engine: engine,
            options: {
                width: 1024,
                height: 768,
                showAngleIndicator: false,
                wireframes: false,
                showCollisions: true
            }
        });

        Render.run(render);

        var runner = Runner.create();
        Runner.run(runner, engine);

        Events.on(engine, 'beforeUpdate', e => { this.step(); });

    }
    getContactListener() {
        // const w = this.world;

        var contactListener = new Box2D.JSContactListener();

        contactListener.BeginContact = (contact) => {
            contact = Box2D.wrapPointer(contact, Box2D.b2Contact);
            const bodyA = contact.GetFixtureA().GetBody();
            const bodyB = contact.GetFixtureB().GetBody();

            if (bodyA.IsBullet()) {
                // w.DestroyBody(bodyA);
                console.log(contact.GetFixtureA().GetUserData());

                this.killList.add(bodyA);
            }
            if (bodyB.IsBullet()) {
                // w.DestroyBody(bodyB);
                this.killList.add(bodyB);
            }
            //[contact logic here]
        }

        contactListener.EndContact = (contact) => {
            contact = Box2D.wrapPointer(contact, Box2D.b2Contact);
            //[contact logic here]
        }

        contactListener.PreSolve = (contact, oldManifold) => {
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


        this.particleSystem = new ParticleSystem(this.world);

        this.createGround();

        const player1 = this.player = new Player(this.world, this.particleSystem, { x: 100 + Math.random() * 500, y: 20 });
        this.player = player1;
        //const player2 = new Player(this.world, this.particleSystem, { x: 500, y: 20 });

        const keyboardInput1 = new KeyboardInput(player1, KEY_A, KEY_D, KEY_W, KEY_S, KEY_SPACE);
        //const keyboardInput2 = new KeyboardInput(player2, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_RIGHT);
        keyboardInput1.setup();
        //keyboardInput2.setup();
        this.stepComponents.push(keyboardInput1);
        //this.stepComponents.push(keyboardInput2);
        this.stepComponents.push(player1);
        //this.stepComponents.push(player2);
        this.stepComponents.push(this.particleSystem);
        this.step();
    }

    createGround() {
        const vertexSets = this.levelGenerator.generate(1024, 140);

        var terrain = Bodies.fromVertices(512, 384, vertexSets, {
            isStatic: true,
            render: {
                fillStyle: '#ff0000',
                //strokeStyle: 'none',
                //lineWidth: 0
            }
        },false);

        console.log(vertexSets);

        Body.setCentre(terrain, terrain.bounds.min, false)
        Body.setPosition(terrain, { x: 0, y: 500 })

        Composite.add(this.world, terrain);

        // var bodyOptions = {
        //     frictionAir: 0, 
        //     friction: 0.0001,
        //     restitution: 0.6
        // };

        // Composite.add(this.world, Composites.stack(80, 100, 20, 20, 10, 10, function(x, y) {
        //     if (Query.point([terrain], { x: x, y: y }).length === 0) {
        //         return Bodies.polygon(x, y, 5, 12, bodyOptions);
        //     }
        // }));
    }

    step() {
        this.stepComponents.forEach(s => s.step());

        
        //if (this.dummy++ % 50 == 0) {
            this.network.sendMetrics(this.player.getMetrics());
        //}
        const events = this.network.getEvents();
        events.forEach(m => {
            if (m.playerDisconnected) {
                console.log('player disconnected', m);
                this.stepComponents = this.stepComponents.filter(c => c.uid !== m.playerDisconnected)
                const player = this.networkPlayers[m.playerDisconnected];
                if (player) {
                    player.remove();
                }
                // delete (this.networkPlayers[m.playerDisconnected]);
            } else if (m.playerConnected) {
                console.log('player connected', m);
                const other = new Player(this.world, this.particleSystem, m.metrics.pos);
                this.networkPlayers[m.playerConnected] = other;
                this.stepComponents.push(other);
            }
            else {
                const p = this.networkPlayers[m.uid];
                if (p) {
                    p.update(m);
                }
            }
        });
    }
};

const game = new Game();