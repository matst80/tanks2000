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

    constructor(world, pos) {
        this.motion = 0;
        this.cannonMotion = 0;

        
        
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

            var jd = new Box2D.b2WheelJointDef();
            var axis = new Box2D.b2Vec2(0.0, 1.0);

            jd.Initialize(this.carBody, wheelBody1, wheelBody1.GetPosition(), axis);
            jd.set_motorSpeed(0.0);
            jd.set_maxMotorTorque(45.0);
            jd.set_enableMotor(true);
            jd.set_frequencyHz(m_hz);
            jd.set_dampingRatio(m_zeta);
            this.rearWheelJoint = Box2D.castObject(world.CreateJoint(jd), Box2D.b2WheelJoint);

            jd.Initialize(this.carBody, wheelBody2, wheelBody2.GetPosition(), axis);
            jd.set_motorSpeed(0.0);
            jd.set_maxMotorTorque(45.0);
            jd.set_enableMotor(true);
            jd.set_frequencyHz(m_hz);
            jd.set_dampingRatio(m_zeta);
            this.wheelJoint2 = Box2D.castObject(world.CreateJoint(jd), Box2D.b2WheelJoint);
        


        bd = new Box2D.b2BodyDef();
        bd.set_position(new Box2D.b2Vec2(pos.x + 0.0, pos.y + 1.0));
        // bd.set_type(b2_dynamicBody);
        bd.set_type(Box2D.b2_dynamicBody);
        this.cannonBody = world.CreateBody(bd);

        var box = new Box2D.b2PolygonShape();

        box.SetAsBox(1., 0.25);
        this.cannonBody.CreateFixture(box, 1);

        this.cannonJoint = new Box2D.b2RevoluteJointDef();
        this.cannonJoint.Initialize(this.carBody, this.cannonBody, new Box2D.b2Vec2(pos.x + 0.5, pos.y + 1.0));
        this.cannonJoint.set_lowerAngle(-170 * DEGTORAD);
        this.cannonJoint.set_upperAngle(10 * DEGTORAD);
        this.cannonJoint.set_enableMotor(true);
        this.cannonJoint.set_maxMotorTorque(10);
        this.cannonJoint.set_enableLimit(true);
        world.CreateJoint(this.cannonJoint);


    }

    updateMotorSpeed(motorSpeed) {
        this.rearWheelJoint.SetMotorSpeed(motorSpeed);
        this.wheelJoint2.SetMotorSpeed(motorSpeed);
    }
    
    step() {
        this.updateMotorSpeed(-this.motion * 20);
        // console.log(this.cannonJoint);
        //this.cannonJoint.set_motorSpeed(this.cannonMotion*40);
        this.cannonBody.ApplyAngularImpulse(this.cannonMotion, true);
    }

}