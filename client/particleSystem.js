export class ParticleSystem {
    particles = [];
    constructor(world) {
        this.world = world;
    }
    step() {
        this.particles.forEach(p=>{
            p.life--;
            if (p.life < 1) {
                this.world.DestroyBody(p.body)
            }
        });
        this.particles = [...this.particles.filter(d=>d.life>0)];
    }
    emit(pos, angle, life = 300) {

        const force = 200;
        
        var circleShape2 = new Box2D.b2CircleShape();
        circleShape2.set_m_radius(0.1);

        var bd2 = new Box2D.b2BodyDef();
        
        bd2.set_position(new Box2D.b2Vec2(pos.x - 1.0 + Math.random() * 2.0, pos.y - 1.0 + Math.random() * 2.0));
        bd2.set_type(Box2D.b2_dynamicBody);

        var fd2 = new Box2D.b2FixtureDef();
        fd2.set_shape(circleShape2);
        fd2.set_density(15);
        fd2.set_friction(0.2);
        fd2.filter.categoryBits = 1;
        fd2.filter.maskBits = 2; // 0xFFFF & ~2;
        fd2.set_userData(42);
        
        const body = this.world.CreateBody(bd2);
        body.CreateFixture(fd2);
        body.ApplyForce(new Box2D.b2Vec2(angle.x*force - 100.0 + Math.random() * 200.0, angle.y*force - 100.0 + Math.random() * 200.0), new Box2D.b2Vec2(-1.0 + Math.random() * 2.0, -1.0 + Math.random() * 2.0), true);
        
        this.particles.push({
            life,
            body
        });
    }
}