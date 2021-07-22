import { KeyboardInput, KEY_A, KEY_D, KEY_LEFT, KEY_RIGHT, KEY_W, KEY_UP, KEY_DOWN, KEY_S, KEY_SPACE } from './keyboardInput.js';
import { Player } from './player.js';
import { ParticleSystem } from './particleSystem.js';
import { DebugRender } from './debugRender.js';
import { LevelGenerator } from './levels.js';
import { Network } from './network.js';

// module aliases
const Engine = Matter.Engine,
    Render = Matter.Render,
    Events = Matter.Events,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

const PTM = 32;

class Game {
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
        this.network = new Network('localhost:8080', () => this.setup(), Math.random() * 100000);

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
                showAngleIndicator: true,
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

        const player1 = this.player = new Player(this.world, this.particleSystem, { x: 180, y: 20 });
        const player2 = new Player(this.world, this.particleSystem, { x: 500, y: 20 });

        const keyboardInput1 = new KeyboardInput(player1, KEY_A, KEY_D, KEY_W, KEY_S, KEY_SPACE);
        const keyboardInput2 = new KeyboardInput(player2, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_RIGHT);
        keyboardInput1.setup();
        keyboardInput2.setup();
        this.stepComponents.push(keyboardInput1);
        this.stepComponents.push(keyboardInput2);
        this.stepComponents.push(player1);
        this.stepComponents.push(player2);
        this.stepComponents.push(this.particleSystem);
        this.step();
    }

    createGround() {
        const vertexSets = this.levelGenerator.generate(100,40);
        var terrain = Bodies.fromVertices(512, 384, vertexSets, {
            isStatic: true,
            render: {   
                fillStyle: '#060a19',
                strokeStyle: '#060a19',
                lineWidth: 3
            }
        }, true);

        console.log(vertexSets);

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

        const events = this.network.getEvents();
        events.forEach(m => {
            if (m.playerConnected) {
                console.log(m);
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