import { AnimUtil } from "./Animation.js";

//#################################################################################

class AnimationHandler{
	constructor(){}
	dispose(){}
	vec3( v, t ){ console.log( v ); }
	quat( q, t ){ console.log( q ); }
}


class AHandler_Node extends AnimationHandler{
	constructor( e ){ super(); this.node = e.Node; }
	dispose(){ delete this.node; }
	vec3( v, t ){ this.node.setPos( v ); }
	quat( v, t ){ this.node.setRot( v ); }
}


//#################################################################################
//Save the Spline Stuff with this for future addition to CubicSpline interp
class AnimationState{
	constructor(){
		this.current	= null;
		this.cross_to	= null;
		this.cross_t 	= 0;
		this.stack		= {};
		this.handler	= null;
	}

	/////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////
		
		// Add a new Animation to the Stack
		add_stack( name, data ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Get the Max Key Frame Count
			let t, max = 0;
			for( t of data.times ) max = Math.max( max, t.length );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			this.stack[ name ] = { clock:0, key_frame_cnt:max, anim:data }; 

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

			if( !this.current ) this.current = this.stack[ name ];
			return this;
		}

		// Cross Fade into a new Animation
		fade_to( name ){
			let a = this.stack[ name ];
			if( !a ){ console.log("Animation not found on stack: %s", name); return this; }

			a.clock = 0;
			if( !this.current ){ this.current = a; return this; }

			this.cross_to	= a;
			this.cross_t	= 0;
			return this;
		}

		set_handler( h ){ 
			if( this.handler ) this.handler.dispose();
			this.handler = h;
			return this;
		}

		use_node_handler( e ){ this.set_handler( new AHandler_Node( e ) ); return this; }


	/////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////

		key_frame( ti ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			if( ti >= this.current.anim.frame_cnt ){
				console.log("key frame index exceeds total key frames.");
				return this;
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			let anim	= this.current.anim,
				q		= new Quat(),
				v		= new Vec3(),
				qi 		= ti*4,
				vi 		= vi*3,
				track;

			for( track of anim.tracks ){
				if( ti >= anim.times[ track.time_idx ].length ) continue;

				switch( track.type ){
					case "rot": this.handler.quat( AnimUtil.quat_buf_copy( track.data, q, qi ), track ); break;
					case "pos": this.handler.vec3( AnimUtil.vec3_buf_copy( track.data, v, vi ), track ); break;
				}
			}
		}

		// Run animation and save results to pose object
		run( dt ){
			if( !dt ) return;

			let f_times	= this.frame_times( dt, this.current ),
				anim	= this.current.anim,
				q 		= new Quat(),
				v		= [0,0,0],
				track, frame;

			for( track of anim.tracks ){
				if( track.interp == "STEP" ) continue; //TODO, add support for this

				frame = f_times[ track.time_idx ]; // [ FA_IDX, FB_IDX, NORM_TIME ]

				switch( track.type ){
					case "rot":
						AnimUtil.quat_buf_blend( track.data, frame[0]*4, frame[1]*4, frame[2], q );
						this.handler.quat( q, track );
						break;
					case "pos":
						AnimUtil.vec3_buf_lerp( track.data, frame[0]*3, frame[1]*3, frame[2], v );
						this.handler.vec3( v, track );
						break;
				}
			}
		}

		// Every animation can have multiple shared time tracks.
		// So we incrmement our animation clock, then for each time
		// track we find between which two frames does the time exist.
		// Then we normalized the time between the two frames.
		// Return: [ [ FA_IDX, FB_IDX, NORM_TIME ], ... ];
		frame_times( dt, data ){
			// Move time forward, loop back on overflow.
			data.clock = (data.clock + dt) % data.anim.time_max;

			// Find the Frames for each group time.
			let j, i, time, fa, fb, ft,
				times	= data.anim.times,
				rtn		= new Array( times.length );

			for( j=0; j < times.length; j++ ){
				time = times[ j ];

				//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
				// Find the first frame that is less then the clock.
				fa = 0;
				for( i=time.length-2; i > 0; i-- )
					if( time[i] < data.clock ){ fa = i; break; }

				//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
				// Normalize Time Between Frames
				fb = fa + 1;
				ft = ( data.clock - time[ fa ] ) / ( time[ fb ] - time[ fa ] );
				//ft = ( data.clock - time[ fa ] ) * frame_inc[ fa ];
				rtn[ j ] = [ fa, fb, ft ];
			}

			return rtn;
		}
}


//#################################################################################
export default AnimationState;