import App, { Components, Entity } 	from "../fungi/engine/App.js";
import Quat		from "../fungi/maths/Quat.js";

//#########################################################################
class RotateTo{
	static $( e ){
		if( !e.RotateTo ) Entity.com_fromName( e, "RotateTo" );
		return e;
	}

	constructor(){
		this.rot 		= new Quat();
		this.mode 		= RotateTo.OFF;
		this.locomotion = null; //Funtion of how to Handle Motion
	}

	go( v ){ this.rot.copy( v ); this.mode = RotateTo.TARGET; return this; }

	loco( n ){ this.locomotion = new Locomotion[ n ](); return this; }

} Components( RotateTo );

// CONSTANTS
RotateTo.OFF		= 0;
RotateTo.CONSTANT	= 1;
RotateTo.TARGET		= 2;


//#########################################################################
class RotateToSystem{
	static init( ecs, priority=700, isActive=true ){ ecs.sys_add( new RotateToSystem(), priority, isActive ); }

	run( ecs ){
		let list	= ecs.query_comp( "RotateTo" ),
			q		= new Quat(),
			dt		= App.deltaTime,
			m, e;

		if( list == null ) return;

		for( m of list ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			if( m.mode == RotateTo.OFF ) continue;

			e = ecs.entities[ m.entityID ];
			if( !e.info.active ) continue;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			switch( m.mode ){
				//................................
				case RotateTo.CONSTANT:
					q[0] = m.rot[0] * dt; 
					q[1] = m.rot[1] * dt; 
					q[2] = m.rot[2] * dt; 
					q[3] = m.rot[3] * dt;
					q.normalize();

					e.Node.local.rot.pmul( q );
					e.Node.isModified = true;
					break;

				//................................
				case RotateTo.TARGET:
					if( m.locomotion.run( e, dt ) ){
						m.mode = RotateTo.OFF;
						e.Node.local.rot.copy( m.rot );
					}
					break;
			}
			
		}
	}
}


//#########################################################################
// LOCOMOTION METHODS

class Loco_Linear{
	constructor( sp = 2.7 ){ this.speed = sp; }

	run( e, dt ){ 
		let lq	= e.Node.local.rot,
			dot	= Quat.dot( lq, e.RotateTo.rot ),
			q 	= new Quat();

		if( dot < 0 ) e.RotateTo.rot.negate();			// Shortest rotation

		Quat.mul( lq.invert( q ), e.RotateTo.rot, q ); 	// Get the Rotation Difference between current and target

		let aa 	= q.getAxisAngle(),						// Get Axis of Rotation
			rad	= Math.min( aa[3], this.speed * dt );	// Pix the shortest Angle or rotation.

		lq.mul( q.setAxisAngle( aa, rad ) );			// Reuse Axis but with new rotation angle.
		e.Node.isModified = true;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		return ( Quat.dot( lq, e.RotateTo.rot  ) >= 0.9999 );
	}
}

class Loco_Springy{
	constructor( stiff = 0.1, damp = 0.3, dtScale = 20 ){
		this.vel 		= new Float32Array( [0,0,0,0] );
		this.dtScale	= dtScale;
		this.frameRate	= 60;
		this.stiffness 	= stiff;
		this.damping 	= damp;
		this.D			= 1 - damp / this.frameRate;
	}

	_velLenSqr(){ return this.vel[0] ** 2 + this.vel[1] ** 2 + this.vel[2] ** 2 + this.vel[3] ** 2; }
	run( e, dt ){
		// NOTE- NEW VEL IS CALC, IN OTHER VEL IS ACCUMILATED ( v = , v += )
		// dt *= scale;
		// accel = -this.stiffness * ( at - to );
		// vel = ( this.vel + accel * dt ) * Math.pow( 1 - this.damping / this.frameRate, this.frameRate * dt ); 
		// at = at + vel * dt;
		dt *= this.dtScale;

		let lq	= e.Node.local.rot,
			tq	= e.RotateTo.rot,
			d	= Math.pow( this.D, this.frameRate * dt );

		if( Quat.dot( lq, tq ) < 0 ) tq.negate(); // Shortest rotation
	    
    	this.vel[ 0 ] = ( this.vel[ 0 ] + ( -this.stiffness * ( lq[ 0 ] - tq[ 0 ] ) * dt ) ) * d;
    	this.vel[ 1 ] = ( this.vel[ 1 ] + ( -this.stiffness * ( lq[ 1 ] - tq[ 1 ] ) * dt ) ) * d;
    	this.vel[ 2 ] = ( this.vel[ 2 ] + ( -this.stiffness * ( lq[ 2 ] - tq[ 2 ] ) * dt ) ) * d;
    	this.vel[ 3 ] = ( this.vel[ 3 ] + ( -this.stiffness * ( lq[ 3 ] - tq[ 3 ] ) * dt ) ) * d;
 	
 		lq[ 0 ] += this.vel[ 0 ] * dt;
    	lq[ 1 ] += this.vel[ 1 ] * dt;
    	lq[ 2 ] += this.vel[ 2 ] * dt;
    	lq[ 3 ] += this.vel[ 3 ] * dt;
    	lq.normalize();
    	
    	e.Node.isModified = true;
		return ( Quat.dot( lq, tq ) >= 0.999999  && this._velLenSqr() < 0.000001 );
	}
}

class Loco_SpringAccel{
	constructor( stiff = 8, damp = 2.7 ){
		this.vel 		= new Float32Array( [0,0,0,0] );
		this.stiffness 	= stiff;
		this.damping 	= damp;
	}

	_velLenSqr(){ return this.vel[0] ** 2 + this.vel[1] ** 2 + this.vel[2] ** 2 + this.vel[3] ** 2; }
	run( e, dt ){
		// let accel = -this.stiffness * ( this.at - this.to ); // Accell = Force / Mass, but not using mass.
    	// this.vel += ( accel - this.damping * this.vel ) * dt;
    	// this.at = this.at + this.vel * dt;

    	let lq = e.Node.local.rot,
    		tq = e.RotateTo.rot;

		if( Quat.dot( lq, tq ) < 0 ) tq.negate(); // Shortest rotation

    	this.vel[ 0 ] += ( -this.stiffness * ( lq[ 0 ] - tq[ 0 ] ) - this.damping * this.vel[ 0 ] ) * dt;
    	this.vel[ 1 ] += ( -this.stiffness * ( lq[ 1 ] - tq[ 1 ] ) - this.damping * this.vel[ 1 ] ) * dt;
    	this.vel[ 2 ] += ( -this.stiffness * ( lq[ 2 ] - tq[ 2 ] ) - this.damping * this.vel[ 2 ] ) * dt;
    	this.vel[ 3 ] += ( -this.stiffness * ( lq[ 3 ] - tq[ 3 ] ) - this.damping * this.vel[ 3 ] ) * dt;
 		
 		lq[ 0 ] += this.vel[ 0 ] * dt;
    	lq[ 1 ] += this.vel[ 1 ] * dt;
    	lq[ 2 ] += this.vel[ 2 ] * dt;
    	lq[ 3 ] += this.vel[ 3 ] * dt;
    	lq.normalize();

    	e.Node.isModified = true;
		return ( Quat.dot( lq, tq ) >= 0.9999  && this._velLenSqr() < 0.00001 );
	}
}

const Locomotion = { 
	Linear		: Loco_Linear,
	Springy		: Loco_Springy,
	SpringAccel	: Loco_SpringAccel,
};

//#########################################################################
export default RotateTo;
export { RotateToSystem };