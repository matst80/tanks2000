var myDebugDraw;
var PTM = 32;
var world;
var playerBody;

function copyVec2(vec) {
    return new Box2D.b2Vec2(vec.get_x(), vec.get_y());
}

//to replace original C++ operator * (float)
function scaleVec2(vec, scale) {
    vec.set_x(scale * vec.get_x());
    vec.set_y(scale * vec.get_y());
}

//to replace original C++ operator *= (float)
function scaledVec2(vec, scale) {
    return new Box2D.b2Vec2(scale * vec.get_x(), scale * vec.get_y());
}


function createGround(world) {



    var bd_ground = new Box2D.b2BodyDef();
    var groundBody = world.CreateBody(bd_ground);

    //ground edges
    var shape0 = new Box2D.b2EdgeShape();

    const w = 60;
    const steps = 30;
    const step = w / steps;
    let currentH = 10;
    for (var i = 0; i <= steps; i++) {
        var yStep = (Math.random() * 2) - 1;

        shape0.Set(new Box2D.b2Vec2(step * (i - 1), currentH), new Box2D.b2Vec2(step * (i), currentH + yStep));
        currentH += yStep;
        groundBody.CreateFixture(shape0, 0.0);
    }

    shape0.Set(new Box2D.b2Vec2(1.0, 25.0), new Box2D.b2Vec2(1.0, 0.0));
    groundBody.CreateFixture(shape0, 0.0);

   
    shape0.Set(new Box2D.b2Vec2(w, 25.0), new Box2D.b2Vec2(w, 0.0));
    groundBody.CreateFixture(shape0, 0.0);


    groundBody.SetAwake(1);
    groundBody.SetActive(1);


    for (var i = 0; i < 24; ++i) {
        var shape = new Box2D.b2CircleShape();
        const r = Math.random();
        shape.set_m_radius(1 + r * 1.0);

        var bd = new Box2D.b2BodyDef();
        // bd.set_type(b2_dynamicBody);
        bd.set_type(Box2D.b2_dynamicBody);
        bd.set_position(new Box2D.b2Vec2(5.9 + 0.6 * i, 12.4 + Math.random() * 13.0));

        var body = world.CreateBody(bd);
        body.CreateFixture(shape, r*10.0);

        if (i === 0) {
            playerBody = body;
        }
    }

}

function step() {
    world.Step(1.0 / 60.0, 3, 2);
    // world.ClearForces();

    context.save();

	if (pushing) {
		playerBody.ApplyLinearImpulse(
            new Box2D.b2Vec2(
                -100 + Math.random() * 200,
                0 + Math.random() * 200
            ),
            playerBody.GetWorldCenter(),
            true
        );
	}

    //first clear the canvas

    // context.fillStyle = `rgb(255,255,${Math.floor(128 + Math.random() * 64)})`;
    context.fillStyle = `#fff`
    // rgb(255,255,${Math.floor(128 + Math.random() * 64)})`;
    context.fillRect(0, 0, 1920, 1080);
    // ctx.clearRect( 0 , 0 , 640, 480 );

    // //drawLevel(ctx, world);
    // //drawPlayer(ctx, world);



    context.translate(0, canvas.height);
    context.scale(1, -1);
    context.scale(PTM, PTM);
    context.lineWidth /= PTM;

    drawAxes(context);

    // context.fillStyle = 'rgb(255,255,0)';
    world.DrawDebugData();

    context.restore();

    requestAnimationFrame(() => step());
}

var pushing = false;

// https://github.com/kripken/box2d.js/blob/1e6e9da36a3160a9f40cda4cddcb4f83abb4d82c/demo/html5canvas/tests/car.js 

function startGame(ctx) {

    document.addEventListener('keyup', (e) => {
        console.log(e.keyCode);
        let xForce = 0;
        if (e.keyCode == 39) {
            xForce = 2000;
        }
        else if (e.keyCode == 37) {
            xForce = -2000;
        }
        playerBody.ApplyLinearImpulse(
            new Box2D.b2Vec2(
                xForce,
                0
            ),
            playerBody.GetWorldCenter(),
            true
        );
		e.cancelBubble = true;
		e.stopPropagation();
		return false;
    });

    canvas.addEventListener('mousedown', () => {
        pushing = true;
    })

    canvas.addEventListener('mouseup', () => {
        pushing = false;
    })

    var gravity = new Box2D.b2Vec2(0, -10);

    myDebugDraw = getCanvasDebugDraw();
    var flags = 0;
    // flags |= Box2D.e_shapeBit;
    // flags |= Box2D.e_jointBit;
    // flags |= Box2D.e_aabbBit;
    // flags |= Box2D.e_pairBit;
    // flags |= Box2D.e_centerOfMassBit;
    flags = 0xFFFF;
    myDebugDraw.SetFlags(flags);

    world = new Box2D.b2World(gravity, true);
    world.SetDebugDraw(myDebugDraw);





	let listener = new Box2D.JSContactListener();
	listener.BeginContact = function (contactPtr) {
		// var contact = Box2D.wrapPointer( contactPtr, Box2D.b2Contact );
		// var fixtureA = contact.GetFixtureA();
		// var fixtureB = contact.GetFixtureB();

		// console.log('contact', contactPtr)

		// now do what you wish with the fixtures
	}

	// Empty implementations for unused methods.
	listener.EndContact = function() {};
	listener.PreSolve = function() {};
	listener.PostSolve = function() {};

	world.SetContactListener( listener );



    createGround(world);



    step(ctx);
}