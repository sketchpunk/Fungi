/*
animation = {
	frame_cnt_max	: int
	time_max		: float,
	times			: [ float32array, float32array, etc ],
	frame_inv		: [ float32array, float32array, etc ],
	tracks			: [
		{ 
			type		: "rot || pos || scl",
			time_idx 	: 0,
			joint_idx	: 0,
			lerp 		: "LERP",
			data		: float32array,
		},
	]
}
*/

//Animation in Animation_path was improved.
class AnimationMachine{
	constructor(){
		this.current	= null;
		this.cross_to	= null;
		this.cross_t 	= 0;
		this.stack		= {};
	}

	/////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////
		
		// Add a new Animation to the Stack
		set( name, data ){
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


	/////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////

		key_frame( ti, pose ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			if( ti >= this.current.anim.key_frame_cnt ){
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
					case "rot": pose.set_bone( track.joint_idx, this.quat_buf_copy( track.data, q, qi ) ); break;
					case "pos": pose.set_bone( track.joint_idx, null, this.vec3_buf_copy( track.data, v, vi ) ); break;
				}
			}
		}

		// Run animation and save results to pose object
		run( dt, pose ){
			let f_times	= this.frame_times( dt, this.current ),
				anim	= this.current.anim,
				q 		= new Quat(),
				v		= [0,0,0],
				track, frame;

			for( track of anim.tracks ){
				if( track.lerp == "STEP" ) continue; //TODO, add support for this

				frame = f_times[ track.time_idx ]; // [ FA_IDX, FB_IDX, NORM_TIME ]

				switch( track.type ){
					case "rot":
						this.quat_buf_blend( track.data, frame[0]*4, frame[1]*4, frame[2], q );
						pose.set_bone( track.joint_idx, q );
						break;
					case "pos":
						this.vec3_buf_lerp( track.data, frame[0]*3, frame[1]*3, frame[2], v );
						pose.set_bone( track.joint_idx, null, v );
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
				ft = ( data.clock - time[ fa ] ) / ( time[fb] - time[ fa ] );
				//ft = ( anim.clock - time[ fa ] ) * frame_inc[ fa ];
				rtn[ j ] = [ fa, fb, ft ];
			}

			return rtn;
		}


	/*///////////////////////////////////////////////////////////////
	Animation data is saved in a flat array for simplicity & memory sake. 
	Because of that can not easily use Quaternion / Vector functions. So 
	recreate any functions needed to work with a flat data buffer.
	///////////////////////////////////////////////////////////////*/

		quat_buf_copy( buf, q, i ){ return q.set( buf[ i ], buf[ i+1 ], buf[ i+2 ], buf[ i+3 ] ); }

		// Special Quaternion NLerp Function. Does DOT checking & Fix
		quat_buf_blend( buf, ai, bi, t, out ){
			let a_x = buf[ ai ],	// Quaternion From
				a_y = buf[ ai+1 ],
				a_z = buf[ ai+2 ],
				a_w = buf[ ai+3 ],
				b_x = buf[ bi ],	// Quaternion To
				b_y = buf[ bi+1 ],
				b_z = buf[ bi+2 ],
				b_w = buf[ bi+3 ],
				dot = a_x * b_x + a_y * b_y + a_z * b_z + a_w * b_w,
				ti 	= 1 - t,
				s 	= 1;

		    // if Rotations with a dot less then 0 causes artifacts when lerping,
		    // Can fix this by switching the sign of the To Quaternion.
		    if( dot < 0 ) s = -1;
			out[ 0 ] = ti * a_x + t * b_x * s;
			out[ 1 ] = ti * a_y + t * b_y * s;
			out[ 2 ] = ti * a_z + t * b_z * s;
			out[ 3 ] = ti * a_w + t * b_w * s;
			//console.log( "x", out );
			return out.norm();
		}

		//#############################################################

		vec3_buf_copy( buf, v, i ){ return v.set( buf[ i ], buf[ i+1 ], buf[ i+2 ] ); }

		// basic vec3 lerp
		vec3_buf_lerp( buf, ai, bi, t, out ){
			let ti = 1 - t;
			out[ 0 ] = ti * buf[ ai ]		+ t * buf[ bi ];
			out[ 1 ] = ti * buf[ ai + 1 ]	+ t * buf[ bi + 1 ];
			out[ 2 ] = ti * buf[ ai + 2 ]	+ t * buf[ bi + 2 ];
			return out;
		}
}

export default AnimationMachine;