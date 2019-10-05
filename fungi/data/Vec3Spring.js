import { Vec3 } from "../maths/Maths.js";

class Vec3Spring{
	constructor( osc_ps=1, damp_ratio=1, pos=null ){
		this.vel = new Vec3();
		this.pos = new Vec3( pos );
		this.tar = new Vec3();

		this.damp_ratio	= damp_ratio;
		this.osc_ps		= Math.PI * 2 * osc_ps; 
	}

	/////////////////////////////////////////////////////////////////
	// Setters
	/////////////////////////////////////////////////////////////////
		set_pos( p ){ this.pos.copy( p ); return this; }
		set_target( p ){ this.tar.copy(p); return this; }
		set_ocs( i ){ this.osc_ps = Math.PI * 2 * i; return this; }
		set_damp_raw( damp ){ this.damp_ratio = damp; return this; }
		set_damp( damp, damp_time ){ 
			// Damp_ratio = Log(damp) / ( -osc_ps * damp_time ) 
			// Damp Time, in seconds to damp. So damp 0.5 for every 2 seconds.
			// Damp needs to be a value between 0 and 1, if 1, creates criticle clamping.
			this.damp_ratio = Math.log(damp) / ( -this.osc_ps * damp_time ); 
			return this; 
		}

	/////////////////////////////////////////////////////////////////
	//
	/////////////////////////////////////////////////////////////////
		update( dt ){
			let a = -2.0 * dt * this.damp_ratio * this.osc_ps,
				b = dt * this.osc_ps * this.osc_ps;

			this.vel[0] += a * this.vel[0] + b * ( this.tar[0] - this.pos[0] );
			this.vel[1] += a * this.vel[1] + b * ( this.tar[1] - this.pos[1] );
			this.vel[2] += a * this.vel[2] + b * ( this.tar[2] - this.pos[2] );

			this.pos[0] += dt * this.vel[0];
			this.pos[1] += dt * this.vel[1];
			this.pos[2] += dt * this.vel[2];

			return this.pos;
		}
}

export default Vec3Spring;