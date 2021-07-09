const DEGTORAD = Math.PI / 180.0;

function createPolygonShape(vertices) {
    var shape = new Box2D.b2PolygonShape();
    var buffer = Box2D._malloc(vertices.length * 8);
    var offset = 0;
    for (var i = 0; i < vertices.length; i++) {
        Box2D.HEAPF32[buffer + offset >> 2] = vertices[i].get_x();
        Box2D.HEAPF32[buffer + (offset + 4) >> 2] = vertices[i].get_y();
        offset += 8;
    }
    var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
    shape.Set(ptr_wrapped, vertices.length);
    return shape;
}

export class Player {
    carBody;
    rearWheelJoint;
    wheelJoint2;
    motion;
    cannonMotion;
    world;
    lastFire;
    particleSystem;

    constructor(world, particleSystem, pos) {
        this.world = world;
        this.motion = 0;
        this.cannonMotion = 0;
        this.lastFire = 0;
        this.particleSystem = particleSystem;

        var carVerts = [
            new Box2D.b2Vec2(-1.5, -0.5),
            new Box2D.b2Vec2(1.5, -0.5),
            new Box2D.b2Vec2(1.5, 0.5),
            new Box2D.b2Vec2(1.2, 0.9),
            new Box2D.b2Vec2(-1.2, 0.9),
            new Box2D.b2Vec2(-1.5, 0.5)];
        var chassisShape = new createPolygonShape(carVerts);

        var circleShape = new Box2D.b2CircleShape();
        circleShape.set_m_radius(0.6);

        var bd = new Box2D.b2BodyDef();
        // bd.set_type(b2_dynamicBody);
        bd.set_type(Module.b2_dynamicBody);
        bd.set_position(new Box2D.b2Vec2(pos.x, pos.y));
        this.carBody = world.CreateBody(bd);
        this.carBody.CreateFixture(chassisShape, 2);

        var fd = new Box2D.b2FixtureDef();
        fd.set_shape(circleShape);
        fd.set_density(1.0);
        fd.set_friction(0.99);

        bd.set_position(new Box2D.b2Vec2(pos.x - 1.5, pos.y - 0.5));
        var wheelBody1 = world.CreateBody(bd);
        wheelBody1.CreateFixture(fd);

        bd.set_position(new Box2D.b2Vec2(pos.x + 1.5, pos.y - 0.5));
        var wheelBody2 = world.CreateBody(bd);
        wheelBody2.CreateFixture(fd);

        var m_hz = 4.0;
        var m_zeta = 0.5;

        const createJoin = (body) => {
            var jd = new Box2D.b2WheelJointDef();
            var axis = new Box2D.b2Vec2(0.0, 1.0);

            jd.Initialize(this.carBody, body, body.GetPosition(), axis);
            jd.set_motorSpeed(0.0);
            jd.set_maxMotorTorque(45.0);
            jd.set_enableMotor(true);
            jd.set_frequencyHz(m_hz);
            jd.set_dampingRatio(m_zeta);
            return jd;
        }


        this.rearWheelJoint = Box2D.castObject(world.CreateJoint(createJoin(wheelBody1)), Box2D.b2WheelJoint);

        this.wheelJoint2 = Box2D.castObject(world.CreateJoint(createJoin(wheelBody2)), Box2D.b2WheelJoint);


        bd = new Box2D.b2BodyDef();
        bd.set_position(new Box2D.b2Vec2(pos.x - 0.7, pos.y + 1.0));
        // bd.set_type(b2_dynamicBody);
        bd.set_type(Box2D.b2_dynamicBody);
        this.cannonBody = world.CreateBody(bd);

        var box = new Box2D.b2PolygonShape();

        box.SetAsBox(1., 0.25);
        this.cannonBody.CreateFixture(box, 1);

        this.cannonJoint = new Box2D.b2RevoluteJointDef();
        this.cannonJoint.Initialize(this.carBody, this.cannonBody, new Box2D.b2Vec2(pos.x, pos.y + 1.0));
        this.cannonJoint.set_lowerAngle(-170 * DEGTORAD);
        this.cannonJoint.set_upperAngle(10 * DEGTORAD);
        this.cannonJoint.set_enableMotor(true);
        this.cannonJoint.set_maxMotorTorque(70);
        //this.cannonJoint.set_enableLimit(true);
        world.CreateJoint(this.cannonJoint);


    }
    fire() {
        const T = Date.now();
        const DT = T - this.lastFire;
        if (DT < 100) {
            return;
        }
        this.lastFire = T;

        const pos = this.cannonBody.GetWorldPoint(new Box2D.b2Vec2(-1.5, 0));
        const angle = this.cannonBody.GetWorldVector(new Box2D.b2Vec2(-1, 0));

        var circleShape = new Box2D.b2CircleShape();
        circleShape.set_m_radius(0.2);

        var bd = new Box2D.b2BodyDef();
        bd.bullet = true;

        bd.set_position(new Box2D.b2Vec2(pos.x, pos.y));
        bd.set_type(Box2D.b2_dynamicBody);

        var fd = new Box2D.b2FixtureDef();
        fd.set_shape(circleShape);
        fd.set_density(5);
        fd.set_friction(0.7);

        const body = this.world.CreateBody(bd);
        body.CreateFixture(fd);
        body.ApplyForce(new Box2D.b2Vec2(angle.x * 500, angle.y * 500), new Box2D.b2Vec2(0, 0), true);


        // const force = 200;

        // var circleShape2 = new Box2D.b2CircleShape();
        // circleShape2.set_m_radius(0.1);

        // var bd2 = new Box2D.b2BodyDef();
        // // bd2.bullet = true;

        // bd2.set_position(new Box2D.b2Vec2(pos.x - 1.0 + Math.random() * 2.0, pos.y - 1.0 + Math.random() * 2.0));
        // bd2.set_type(Box2D.b2_dynamicBody);

        // var fd2 = new Box2D.b2FixtureDef();
        // fd2.set_shape(circleShape2);
        // fd2.set_density(15);
        // fd2.set_friction(0.2);
        // fd2.filter.categoryBits = 1;
        // fd2.filter.maskBits = 2 | 1; // 0xFFFF & ~2;
        // fd2.set_userData(42);


        // const body2 = this.world.CreateBody(bd2);
        // body2.CreateFixture(fd2);
        // body2.ApplyForce(new Box2D.b2Vec2(angle.x*force - 100.0 + Math.random() * 200.0, angle.y*force - 100.0 + Math.random() * 200.0), new Box2D.b2Vec2(-1.0 + Math.random() * 2.0, -1.0 + Math.random() * 2.0), true);

        this.particleSystem.emit(pos, angle);
    }

    updateMotorSpeed(motorSpeed) {
        this.rearWheelJoint.SetMotorSpeed(motorSpeed);
        this.wheelJoint2.SetMotorSpeed(motorSpeed);
    }

    update(data) {
        this.motion = data.metrics.m;
        this.cannonMotion = data.metrics.c;
    }

    getJson(v) {
        return {x:v.x,y:v.y};
    }

    getMetrics() {
        return { pos: this.getJson(this.carBody.GetPosition()), m: this.motion, c: this.cannonMotion };
    }

    step() {
        this.updateMotorSpeed(-this.motion * 20);
        // console.log(this.cannonJoint);
        //this.cannonJoint.set_motorSpeed(this.cannonMotion*400);
        this.cannonBody.ApplyAngularImpulse(this.cannonMotion * 5, true);
    }

}