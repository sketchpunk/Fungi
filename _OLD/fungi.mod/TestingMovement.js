import { Cycle } from "./Timing.js";
import Maths, { Vec3 } from "../fungi/Maths.js";

class TestingMovement{
	constructor( sec=4, cOffset = 0 ){
		this.cycle	= new Cycle( sec );
		this.cycle.value = cOffset;
		
		this.posA	= new Vec3( -1, 0, 0 );
		this.posB	= new Vec3( 1, 0, 0 );

		this.axis 	= new Vec3( 0, 0, 1 );
		this.angleA	= Maths.toRad( -45 );
		this.angleB	= Maths.toRad( 45 );
	}

	setAngles( a, b ){ this.angleA = a; this.angleB = b; return this; }
	setAxis( v ){ this.axis.copy(v); return this; }
	setPos(a, b){ this.posA.copy(a); this.posB.copy(b); return this; }
	setRadius( v ){ this.radius = v; return this; }

	speedGrad010(s){
		let t = ((this.cycle.value * s) % Maths.PI_2) * Maths.PI_2_INV * 2;
		return (t > 1)? 1 - (t - 1) : t;
	}

	update(){ this.cycle.next(); return this; }

	move( e, speed=1 ){
		let ct	= e.com.Transform,
			t	= this.speedGrad010( 1 );

		Vec3.lerp( this.posA, this.posB, t, ct.position );
		ct.isModified = true;
		return this;
	}

	orbit( e, radius=1 ){
		let ct = e.com.Transform;
		ct.position.x = radius * Math.cos( this.cycle.value );
		ct.position.z = radius * Math.sin( this.cycle.value );
		ct.isModified = true;
		return this;
	}

	rotate( e, speed = 1, infinite=true ){
		let ct = e.com.Transform;
		let ang;

		if(infinite) ang = this.cycle.value * speed % Maths.PI_2;
		else{
			let t = (this.cycle.value * speed % Maths.PI_2) * Maths.PI_2_INV * 2;
			if( t > 1) t = 1 - (t - 1); //Grad 0 1 0;

			ang = this.angleA + (this.angleB - this.angleA) * t;
		}

		ct.rotation.setAxisAngle( this.axis, ang );
		ct.isModified = true;
		return this;
	}

	randomRotation( e ){
		let ct = e.com.Transform,
			u1 = Math.random(),
			u2 = Math.random(),
			u3 = Math.random(),
			r1 = Math.sqrt( 1-u1 ),
			r2 = Math.sqrt( u1 );

		ct.rotation[0]	= r1 * Math.sin( Maths.PI_2 * u2 );
		ct.rotation[1]	= r1 * Math.cos( Maths.PI_2 * u2 );
		ct.rotation[2]	= r2 * Math.sin( Maths.PI_2 * u3 );
		ct.rotation[3]	= r2 * Math.cos( Maths.PI_2 * u3 );
		ct.isModified	= true;
		return this;
	}
}

export default TestingMovement;