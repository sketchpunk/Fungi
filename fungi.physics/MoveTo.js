import App, { Components, Entity } 	from "../fungi/engine/App.js";
import Vec3	from "../fungi/maths/Vec3.js";


//#########################################################################
class MoveTo{
	static $( e ){
		if( !e.MoveTo ) Entity.com_fromName( e, "MoveTo" );
		return e;
	}

	constructor(){
		this.vel 		= new Vec3();
		this.target 	= new Vec3();
		this.mode 		= MoveTo.OFF;
		this.locomotion = null; //Funtion of how to Handle Motion
	}

	go( v ){ this.target.copy( v ); this.mode = MoveTo.TARGET; return this; }

	loco( n ){ this.locomotion = new Locomotion[ n ](); return this; }

} Components( MoveTo );

// CONSTANTS
MoveTo.OFF		= 0;
MoveTo.CONSTANT	= 1;
MoveTo.TARGET	= 2;


//#########################################################################
class MoveToSystem{
	static init( ecs, priority=700, isActive=true ){ ecs.sys_add( new MoveToSystem(), priority, isActive ); }

	run( ecs ){
		let list	= ecs.query_comp( "MoveTo" ),
			v		= new Vec3(),
			dt		= App.deltaTime,
			m, e;

		if( list == null ) return;

		for( m of list ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			if( m.mode == MoveTo.OFF ) continue;

			e = ecs.entities[ m.entityID ];
			if( !e.info.active ) continue;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			switch( m.mode ){
				//................................
				case MoveTo.CONSTANT: 
					e.Node.addPos( m.vel.scale( dt, v ) );
					break;

				//................................
				case MoveTo.TARGET:
					m.locomotion.run( e, dt );

					if( m.vel.lengthSqr() < 0.00001 && Vec3.lenSqr( e.Node.local.pos, m.target ) < 0.00001 ){
						m.mode = MoveTo.OFF;
						e.Node.local.pos.copy( m.target );
					}
					break;
			}
			
		}
	}
}


//#########################################################################
// LOCOMOTION METHODS

class Loco_Linear{
	constructor( sp = 0.2 ){ this.speed = sp; }
	run( e, dt ){ e.Node.addPos( Vec3.sub( e.MoveTo.target, e.Node.local.pos ).normalize().scale( this.speed * dt ) ); }
}

class Loco_Springy{
	constructor( stiff = 0.1, damp = 0.3, dtScale = 40 ){
		this.dtScale	= dtScale;
		this.frameRate	= 60;
		this.stiffness 	= stiff;
		this.damping 	= damp;
		this.D			= 1 - damp / this.frameRate;
	}

	run( e, dt ){
		// dt *= scale;
		// accel = -this.stiffness * ( at - to );
		// vel = ( this.vel + accel * dt ) * Math.pow( 1 - this.damping / this.frameRate, this.frameRate * dt ); 
		// at = at + vel * dt;
		dt *= this.dtScale;

		let m	= e.MoveTo,
			lp	= e.Node.local.pos,
			v	= Vec3.sub( lp, m.target ).scale( -this.stiffness ),
			d	= Math.pow( this.D, this.frameRate * dt );

		v.scale( dt ).add( m.vel ).scale( d, m.vel );
		lp.add( m.vel.scale( dt, v ) );

		e.Node.isModified = true;
	}
}

class Loco_SpringAccel{
	constructor( stiff = 1, damp = 1.3 ){
		this.stiffness 	= stiff;
		this.damping 	= damp;
	}

	run( e, dt ){
		// GOOD, Slow accell and decell.
		// let accel = -this.stiffness * ( this.at - this.to ); // Accell = Force / Mass, but not using mass.
    	// this.vel += ( accel - this.damping * this.vel ) * dt;
    	// this.at = this.at + this.vel * dt;

		let m		= e.MoveTo,
			lp		= e.Node.local.pos,
			accel 	= Vec3.sub( lp, m.target ).scale( -this.stiffness ),
			v		= Vec3.scale( m.vel, this.damping );

		m.vel.add( accel.sub( v ).scale( dt ) );
		lp.add( m.vel.scale( dt, v ) );

		e.Node.isModified = true;
	}
}

const Locomotion = { 
	Linear		: Loco_Linear,
	Springy		: Loco_Springy,
	SpringAccel	: Loco_SpringAccel,
};

//#########################################################################
export default MoveTo;
export { MoveToSystem };