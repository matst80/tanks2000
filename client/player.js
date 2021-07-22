const Body = Matter.Body,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Constraint = Matter.Constraint;

const DEGTORAD = Math.PI / 180.0;

function car(xx, yy, width, height, wheelSize) {

    const group = Body.nextGroup(true),
        wheels = Body.nextGroup(true),
        wheelBase = 20,
        wheelAOffset = -width * 0.5 + wheelBase,
        wheelBOffset = width * 0.5 - wheelBase,
        wheelYOffset = 0;

    const car = Composite.create({ label: 'Car' }),
        body = Bodies.rectangle(xx, yy, width, height, {
            collisionFilter: {
                group: group
            },
            chamfer: {
                radius: height * 0.5
            },
            density: 0.2
        });

    const wheelA = Bodies.circle(xx + wheelAOffset, yy + wheelYOffset, wheelSize, {
        collisionFilter: {
            group: group
        },
        density: 0.2,
        friction: 0.8
    });

    const wheelB = Bodies.circle(xx + wheelBOffset, yy + wheelYOffset, wheelSize, {
        collisionFilter: {
            group: group
        },
        density: 0.2,
        friction: 0.8
    });

    const axelA = Constraint.create({
        bodyB: body,
        pointB: { x: wheelAOffset, y: wheelYOffset },
        bodyA: wheelA,
        stiffness: 1,
        // damping: 0.2,
        length: 0,
        // angleA: -Math.PI,
        // angleB: Math.PI,
        // angularStiffness: 0.2,
    });

    const axelB = Constraint.create({
        bodyB: body,
        pointB: { x: wheelBOffset, y: wheelYOffset },
        bodyA: wheelB,
        stiffness: 1.0,
        // damping: 0.2,
        length: 0,
        // angleA: 0,
        // angleB: Math.PI,
        // angularStiffness: 0.2,
    });

    const cannonWidth = width / 7;
    const cannon = Bodies.rectangle(xx + (width / 2) - cannonWidth, yy + width / 2, cannonWidth, height * 7, {
        collisionFilter: {
            group: group
        },
        friction: 0.8,
        density: 0.0002
    });

    // Tråd med exempel på angular joint: https://github.com/liabru/matter-js/pull/837
    const cannonJoin = Constraint.create({
        bodyB: body,
        pointA: { x: 0, y: height * 3.5 },
        bodyA: cannon,
        stiffness: 1,
        length: 1,
        // angleA: -Math.PI,
        // angleAMin: 0.1,
        // angleAMax: -0.1,
        // // angleB: 0.5,
        // // angleBMin: 0.5,
        // // angleBMax: -0.5,
        // angularStiffness: 0.6,

    });

    Composite.addBody(car, body);
    Composite.addBody(car, wheelA);
    Composite.addBody(car, wheelB);
    Composite.addBody(car, cannon);
    Composite.addConstraint(car, cannonJoin);
    Composite.addConstraint(car, axelA);
    Composite.addConstraint(car, axelB);



    return { car, wheelA, wheelB, cannon, body };
};

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
        this.currentMotion = 0;
        this.motion = 0;
        this.cannonMotion = 0;
        this.lastFire = 0;
        this.particleSystem = particleSystem;

        const body = car(pos.x, pos.y, 120, 10, 20);
        this.wheelA = body.wheelA;
        this.wheelB = body.wheelB;
        this.cannon = body.cannon;
        this.body = body.body;
        console.log(body);
        Composite.add(world, body.car);

    }
    fire() {
        const T = Date.now();
        const DT = T - this.lastFire;
        if (DT < 100) {
            return;
        }
        this.lastFire = T;

        const angle = this.cannon.angle;
        const pos = this.cannon.position;
        const axes = this.cannon.axes;
        const force = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };

        console.log({axes, angle,force, pos});

        


        const bullet = Bodies.circle(pos.x - axes[0].x * 35.0, pos.y - axes[0].y * 35.0, 5 + Math.random() * 10, {});
        Body.applyForce(bullet, bullet.position, { x: -axes[0].x / 100.0, y: -axes[0].y / 100.0 });
        Composite.addBody(this.world, bullet);

        //this.particleSystem.emit(pos, angle);
    }

    updateMotorSpeed(motorSpeed) {
        // console.log('rotera',motorSpeed);
        Body.setAngularVelocity(this.wheelA, motorSpeed * 3.0);
        Body.setAngularVelocity(this.wheelB, motorSpeed * 3.0);
        Body.setAngularVelocity(this.cannon, this.cannonMotion / 5.0);

        // fulhack
        var compositeAngle = this.body.angle // + this.cannon.angle;
        if (this.cannon.angle < compositeAngle - 0.8) Body.setAngle(this.cannon, compositeAngle - 0.8);
        if (this.cannon.angle > compositeAngle + 0.8) Body.setAngle(this.cannon, compositeAngle + 0.8);
    }

    update(data) {

    }

    getJson(v) {
        return { x: v.x, y: v.y };
    }

    getMetrics() {
        return {};
        //return { pos: this.getJson(this.carBody.GetPosition()), m: this.motion, c: this.cannonMotion };
    }

    step() {
        this.currentMotion += (this.motion - this.currentMotion) * 0.1;

        this.updateMotorSpeed(this.currentMotion / 5.0);
        // console.log(this.cannonJoint);
        //this.cannonJoint.set_motorSpeed(this.cannonMotion*400);

        
    }

}