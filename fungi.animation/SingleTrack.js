import { Quat, Vec3 }	from "../fungi/maths/Maths.js";
import { AnimUtil }		from "./Animation.js";

//################################################################################
class SingleTrack{
	constructor(){
		this.anim 	= null;
		this.clock	= 0;
		this.handler = null;
	}

	////////////////////////////////////////////////////////////////////
	// INSTANCE OPERATORS
	////////////////////////////////////////////////////////////////////
		set( a ){ this.anim = a; return this; }

		set_handler( h ){ 
			if( this.handler ) this.handler.dispose();
			this.handler = h;
			return this;
		}

	////////////////////////////////////////////////////////////////////
	// 
	////////////////////////////////////////////////////////////////////
		next_frame( dt ){ 
			if( dt ) this.clock = (this.clock + dt) % this.anim.time_max;
			return this;
		}

		run( offset_frame=null ){
			let clock = ( !offset_frame )? 
				this.clock : 
				( this.clock + this.anim.times[0][offset_frame] ) % this.anim.time_max;

			let frame = this.find_frame( clock );  //[ FA_IDX, FB_IDX, NORM_TIME ]
			let track = this.anim.tracks[ 0 ];

			switch( track.type ){
				case "rot":
					let q = new Quat();
					AnimUtil.quat_buf_blend( track.data, frame[0]*4, frame[1]*4, frame[2], q );
					
					if( this.handler ) this.handler.quat( q, track );
					return q;
				case "pos":
					let v = new Vec3();
					AnimUtil.vec3_buf_lerp( track.data, frame[0]*3, frame[1]*3, frame[2], v );
					if( this.handler ) this.handler.vec3( v, track );
					return v;
			}
		}


	////////////////////////////////////////////////////////////////////
	// 
	////////////////////////////////////////////////////////////////////
		find_frame( clock ){
			let i, time = this.anim.times[ 0 ];

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Find the first frame that is less then the clock.
			let fa = 0;
			for( i=time.length-2; i > 0; i-- ){
				if( time[i] < clock ){ fa = i; break; }
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Normalize Time Between Frames
			let fb = fa + 1;
			let ft = ( clock - time[ fa ] ) / ( time[ fb ] - time[ fa ] );
			//ft = ( data.clock - time[ fa ] ) * frame_inc[ fa ];
			return [ fa, fb, ft ];
		}
}


//################################################################################
export default SingleTrack;