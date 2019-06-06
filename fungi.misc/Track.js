import Maths, { Quat } 		from "../fungi/maths/Maths.js";

function sort_func( a, b ){ return (a.time == b.time)? 0 : (a.time < b.time) ? -1 : 1; }

class Track{
	constructor( h, tLoop = 0 ){ 
		this.frames		= new Array();
		this.handler	= h;
		this.time		= 0;
		this.time_max	= 0;
		this.last_idx	= 0;
		this.curr_idx	= 0;
		this.time_loop	= tLoop;
	}

	sort(){ 
		this.frames.sort( sort_func );
		this.last_idx = this.frames.length - 1;
		return this;
	}

	add(){ 
		for( let i=0; i < arguments.length; i++ ){
			this.frames.push( arguments[i] );
			if( arguments[i].time > this.time_max ) this.time_max = arguments[i].time;
		}
		return this;
	}

	next( dt ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Handle final Frame
		this.time += dt;
		let i = this.last_idx;

		if( this.time >= this.frames[ i ].time ){
			
			//.....................................
			if( this.time_loop == 0 ){
				this.handler.use_frame( this.frames[ i ] );
				return;
			}

			//.....................................
			let et = this.time_max + this.time_loop;	// Extra time

			if( this.time >= et ){						// Reset back to first frame and let function continue
				this.time		= (this.time - et) % this.time_max;
				this.curr_idx	= 0;
			}else{										// Lerp Between Last to First frame
				let t = (this.time - this.time_max) / this.time_loop;
				this.handler.lerp_frame( t, this.frames[ this.last_idx ], this.frames[ 0 ] );
				return;
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Check if still between the current frame, else find frames to use.
		i = this.curr_idx;
		if( this.time < this.frames[i].time  || this.time >= this.frames[i+1].time ){
			for( let j = this.last_idx-1; j > -1; j-- ){

				// If we find the exact time, Just exit
				if( this.frames[j].time == this.time ){
					this.curr_idx = j;
					this.hander.use_frame( this.frames[j] );
					return;
				}

				// Found the fames
				if( this.time > this.frames[j].time ){ this.curr_idx = i = j; break; }
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Lerp Between Frames
		let f0	= this.frames[i],
			f1	= this.frames[i+1],
			t	= ( this.time - f0.time ) / ( f1.time - f0.time );

		this.handler.lerp_frame( t, f0, f1 );
	}
}

class FramePose{
	constructor( t ){
		this.bones	= null;
		this.time	= t;
	}

	use_arm( arm ){
		let bLen = arm.bones.length;
		this.bones = new Array( bLen );

		for( let i=0; i < bLen; i++ ) 
			this.bones[i] = arm.bones[i].Node.local.rot.clone();

		return this;
	}

	copy( to, pose, from, mirror=false ){
		let len = to.length;
		for( let i=0; i < len; i++ ){
			this.bones[ to[i] ].copy( pose.bones[ from[i] ].local.rot );
			if( mirror ) this.bones[ to[i] ].mirror_x();
		}

		return this;
	}
}

class FramePoseHandler{
	constructor( arm ){
		this.arm = arm;
	}

	use_frame( f ){
		let b 	= this.arm.bones,
			len = b.length,
			i;

		for( i=0; i < len; i++ ) b[i].Node.setRot( f.bones[i] );
		this.arm.isModified = true;
	}

	lerp_frame( t, f0, f1 ){
		let b 	= this.arm.bones,
			len = b.length,
			i;

		for( i=0; i < len; i++ ){
			Quat.lerp( 
				f0.bones[i], 
				f1.bones[i],
				t, 
				b[i].Node.local.rot
			).normalize();

			b[i].Node.isModified = true;
		}
		this.arm.isModified = true;
	}
}

export default Track;
export { FramePose, FramePoseHandler };