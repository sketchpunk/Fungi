import Maths, { Quat } 		from "../fungi/maths/Maths.js";

function sort_func( a, b ){ return (a.time == b.time)? 0 : (a.time < b.time) ? -1 : 1; }
function mod( a, b ){ //TODO Add this to Maths
	let v = a % b;
	return ( v < 0 )? b+v : v;
}

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

	get_t(){ return this.time / (this.time_max + this.time_loop); }

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

		if( this.time > this.frames[ i ].time ){
			
			//.....................................
			if( this.time_loop == 0 ){
				this.handler.use_frame( this.frames[ i ] );
				return;
			}

			//.....................................
			let et = this.time_max + this.time_loop;	// Extra time

			if( this.time > et ){						// Reset back to first frame and let function continue
				this.time		= (this.time - et) % this.time_max;
				this.curr_idx	= 0;
			}else{										// Lerp Between Last to First frame
				let t = (this.time - this.time_max) / this.time_loop;
				this.handler.lerp_frame( t, this.last_idx, 0, this );
				return;
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Check if still between the current frame, else find frames to use.
		i = this.curr_idx;
		if( this.time < this.frames[i].time  || this.time > this.frames[i+1].time ){
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

		//this.handler.lerp_frame( t, f0, f1 );
		this.handler.lerp_frame( t, i, i+1, this );
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


// TODO be able to pass in Bone Index, so to only lerp specific things, not everything.
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

	lerp_frame( t, ai, bi, track ){
		let aai = mod( ai-1, track.frames.length ),	// Get Frame Before A
			bbi	= mod( bi+1, track.frames.length ),	// Get Frame After B
			bn	= this.arm.bones,
			len	= bn.length,
			i;

		let fa = track.frames[ aai ],
			fb = track.frames[ ai ],
			fc = track.frames[ bi ],
			fd = track.frames[ bbi ];

		for(i=-5; i < 6; i++) mod( i, track.frames.length );

		for( i=0; i < len; i++ ){
			//Lerp.linear_quat( t, fb.bones[i], fc.bones[i], bn[i].Node.local.rot );
			//Lerp.cubic_quat( t, fb.bones[i], fc.bones[i], bn[i].Node.local.rot );
			//Lerp.cosine_quat( t, fb.bones[i], fc.bones[i], bn[i].Node.local.rot );
			
			//Lerp.catmull_quat( t, fa.bones[i], fb.bones[i], fc.bones[i],  fd.bones[i], bn[i].Node.local.rot );			// Good	
			Lerp.cubic_spline_quat( t, fa.bones[i], fb.bones[i], fc.bones[i], fd.bones[i], bn[i].Node.local.rot );			// Good (Simpler)
			//Lerp.hermite_quat( t, fa.bones[i], fb.bones[i], fc.bones[i], fd.bones[i], -0.8, -0.1, bn[i].Node.local.rot );	// Good (Need config)

			bn[i].Node.isModified = true;
		}

		this.arm.isModified = true;
	}
}


/*
	//This mod handles negatives as reverse modulas
	function mod( a, b ){
		let v = a % b;
		return ( v < 0 )? b+v : v;
	}


	function smoothstep( t ){ return 3*t**2 - 2*t**3; }
	static smoothTStep(t){ return (t**2) * (3 - 2 * t); }
	static smoothStep(edge1, edge2, val){ //https://en.wikipedia.org/wiki/Smoothstep
		var x = Math.max(0, Math.min(1, (val-edge1)/(edge2-edge1)));
		return x*x*(3-2*x);
	}


	//https://www.desmos.com/calculator/3zhzwbfrxd
	function something( t, p, s ){
		let c = (2 / (1-s)) - 1;
		if( t > p ){
			t = 1 - t;
			p = 1 - p;
		}
		return (t**c) / (p**(c-1));
	}

	//https://stackoverflow.com/questions/13097005/easing-functions-for-bell-curves
	//https://en.wikipedia.org/wiki/Beta_distribution
	function bell_curve(t){
		return ( Math.sin(2 * Math.PI * (t - 0.25)) + 1) * 0.5;
	}

	function beta_dist_curve( t, a ){ // 1.5, 2, 4, 9
		return 4**a * (t * (1-t))**a;
	}

	function prob_density( t, a, b ){
		return ( t**(a-1) * (1-t)**(b-1) ) / ( Math.log(a) * Math.log(b) / ( Math.log( a + b )) ); //NOT log, needs to be Gamma https://github.com/substack/gamma.js/blob/master/index.js
	}

	function triangle_wave( t ){
		t -= Math.floor( t * 0.5 ) * 2;
		t = Math.min(Math.max(t,0),2);
		return 1 - Math.abs( t - 1 );
	}

 */

/* [[ RESOURCES ]] 
http://archive.gamedev.net/archive/reference/articles/article1497.html
http://paulbourke.net/miscellaneous/interpolation/
https://codeplea.com/simple-interpolation
https://codeplea.com/introduction-to-splines
https://codeplea.com/triangular-interpolation // Barycentric Coordinates and Alternatives
*/
class Lerp{
	////////////////////////////////////////////////////////////////
	// Linear
	////////////////////////////////////////////////////////////////
		static linear( t, a, b ){ return (1-t) * a + t * b; }

		static linear_quat( t, a, b, out ){
			let ti = 1 - t;
			out[0] = a[0] * ti + b[0] * t;
			out[1] = a[1] * ti + b[1] * t;
			out[2] = a[2] * ti + b[2] * t;
			out[3] = a[3] * ti + b[3] * t;
			return out.normalize();
		}

		static linear_vec3( t, a, b, out ){
			let ti = 1 - t;
			out[0] = a[0] * ti + b[0] * t;
			out[1] = a[1] * ti + b[1] * t;
			out[2] = a[2] * ti + b[2] * t;
			return out;
		}


	////////////////////////////////////////////////////////////////
	// Hermite Spline
	////////////////////////////////////////////////////////////////
		
		// http://paulbourke.net/miscellaneous/interpolation/
		static hermite( t, a, b, c, d, tension, bias ){
		   	let m0  = (b-a) * (1+bias) * (1-tension) * 0.5;
				m0 += (c-b) * (1-bias) * (1-tension) * 0.5;
			let m1  = (c-b) * (1+bias) * (1-tension) * 0.5;
				m1 += (d-c) * (1-bias) * (1-tension) * 0.5;

			let t2 = t * t;
			let t3 = t2 * t;
			let a0 = 2*t3 - 3*t2 + 1;
			let a1 = t3 - 2*t2 + t;
			let a2 = t3 - t2;
			let a3 = -2*t3 + 3*t2;

			return a0*b + a1*m0 + a2*m1 + a3*c ;
		}

		// Optimized to compute a quaternion without repeating many operations
		static hermite_quat( t, a, b, c, d, tension, bias, out ){
			let btn	= (1-bias) * (1-tension) * 0.5,
				btp	= (1+bias) * (1-tension) * 0.5,
				t2	= t * t,
				t3	= t2 * t,
				a0	= 2*t3 - 3*t2 + 1,
				a1	= t3 - 2*t2 + t,
				a2	= t3 - t2,
				a3	= -2*t3 + 3*t2;

			out[0] = a0*b[0] + a1 * ( (b[0]-a[0]) * btp + (c[0]-b[0]) * btn ) + a2 * ( (c[0]-b[0]) * btp + (d[0]-c[0]) * btn ) + a3*c[0];
			out[1] = a0*b[1] + a1 * ( (b[1]-a[1]) * btp + (c[1]-b[1]) * btn ) + a2 * ( (c[1]-b[1]) * btp + (d[1]-c[1]) * btn ) + a3*c[1];
			out[2] = a0*b[2] + a1 * ( (b[2]-a[2]) * btp + (c[2]-b[2]) * btn ) + a2 * ( (c[2]-b[2]) * btp + (d[2]-c[2]) * btn ) + a3*c[2];
			out[3] = a0*b[3] + a1 * ( (b[3]-a[3]) * btp + (c[3]-b[3]) * btn ) + a2 * ( (c[3]-b[3]) * btp + (d[3]-c[3]) * btn ) + a3*c[3];
			return out.normalize();
		}


	////////////////////////////////////////////////////////////////
	// Catmull-Rom
	////////////////////////////////////////////////////////////////
		// http://paulbourke.net/miscellaneous/interpolation/
		static catmull( t, a, b, c, d ){
			let t2 = t*t;
			let a0 = -0.5*a + 1.5*b - 1.5*c + 0.5*d;
			let a1 = a - 2.5*b + 2*c - 0.5*d;
			let a2 = -0.5*a + 0.5*c;
			let a3 = b;

			return a0*t*t2 + a1*t2 + a2*t + a3;
		}

		static catmull_quat( t, a, b, c, d, out ){
			let t2 = t * t,
				t3 = t * t2;

			out[0] = ( -0.5*a[0] + 1.5*b[0] - 1.5*c[0] + 0.5*d[0] )*t3 + ( a[0] - 2.5*b[0] + 2*c[0] - 0.5*d[0] )*t2 + ( -0.5*a[0] + 0.5*c[0] )*t + b[0];
			out[1] = ( -0.5*a[1] + 1.5*b[1] - 1.5*c[1] + 0.5*d[1] )*t3 + ( a[1] - 2.5*b[1] + 2*c[1] - 0.5*d[1] )*t2 + ( -0.5*a[1] + 0.5*c[1] )*t + b[1];
			out[2] = ( -0.5*a[2] + 1.5*b[2] - 1.5*c[2] + 0.5*d[2] )*t3 + ( a[2] - 2.5*b[2] + 2*c[2] - 0.5*d[2] )*t2 + ( -0.5*a[2] + 0.5*c[2] )*t + b[2];
			out[3] = ( -0.5*a[3] + 1.5*b[3] - 1.5*c[3] + 0.5*d[3] )*t3 + ( a[3] - 2.5*b[3] + 2*c[3] - 0.5*d[3] )*t2 + ( -0.5*a[3] + 0.5*c[3] )*t + b[3];			
			return out.normalize();
		}

		// http://archive.gamedev.net/archive/reference/articles/article1497.html
		// ta > td is the time value of the specific key frames the values belong to.
		static catmull_irregular_frames( t, a, b, c, d, ta, tb, tc, td ){
			//let bb = ((b-a) / (tb-ta)) * 0.5 + ((c-b) / (tb-ta)) * 0.5;	// Original but the second denom seems wrong.
			//let cc = ((c-a) / (tc-tb)) * 0.5 + ((d-c) / (tc-tb)) * 0.5;
			let t2 = t * t;
			let t3 = t * t2;
			let bb = ((b-a) / (tb-ta)) * 0.5 + ((c-b) / (tc-tb)) * 0.5;	// Tangent at b
			let cc = ((c-a) / (tc-tb)) * 0.5 + ((d-c) / (td-tc)) * 0.5;	// Tangent at c
			let ti = 1.0; //tc - tb;	// This hurts the animation with the BB, CC change
			return	b * (2 * t3 - 3 * t2 + 1) +
					c * (3 * t2 - 2* t3) +
					bb * ti * (t3 - 2 * t2 + t) +
					cc * ti * (t3 - t2);
		}


	////////////////////////////////////////////////////////////////
	// Cubic
	////////////////////////////////////////////////////////////////
	
		// http://archive.gamedev.net/archive/reference/articles/article1497.html
		static cubic( t, a, b ){
			let t2 = t * t,
				t3 = t2 * t;
			return a * ( 2*t3 - 3*t2 + 1 ) + b * ( 3 * t2 - 2 * t3 );
		}

		static cubic_quat( t, a, b, out ){
			//a * ( 2*t3 - 3*t2 + 1 ) + b * ( 3 * t2 - 2 * t3 );
			let t2 = t * t,
				t3 = t * t2,
				aa = ( 2*t3 - 3*t2 + 1 ),
				bb = ( 3 * t2 - 2 * t3 );

			out[0] = a[0] * aa + b[0] * bb;
			out[1] = a[1] * aa + b[1] * bb;
			out[2] = a[2] * aa + b[2] * bb;
			out[3] = a[3] * aa + b[3] * bb;
			return out.normalize();
		}

		// http://paulbourke.net/miscellaneous/interpolation/
		static cubic_spline( t, a, b, c, d ){
			let t2 = t*t;
			let a0 = d - c - a + b;
			let a1 = a - b - a0;
			let a2 = c - a;
			let a3 = b;
			return a0*t*t2 + a1*t2 + a2*t + a3;
		}

		static cubic_spline_quat( t, a, b, c, d, out ){
			let t2 = t * t,
				t3 = t * t2,
				a0 = d[0] - c[0] - a[0] + b[0],
				a1 = d[1] - c[1] - a[1] + b[1],
				a2 = d[2] - c[2] - a[2] + b[2],
				a3 = d[3] - c[3] - a[3] + b[3];

			out[0] = a0*t3 + ( a[0] - b[0] - a0 )*t2 + ( c[0] - a[0] )*t + b[0];
			out[1] = a1*t3 + ( a[1] - b[1] - a1 )*t2 + ( c[1] - a[1] )*t + b[1];
			out[2] = a2*t3 + ( a[2] - b[2] - a2 )*t2 + ( c[2] - a[2] )*t + b[2];
			out[3] = a3*t3 + ( a[3] - b[3] - a3 )*t2 + ( c[3] - a[3] )*t + b[3];
			return out.normalize();
		}

		static cubic_spline_vec3( t, a, b, c, d, out ){
			let t2 = t * t,
				t3 = t * t2,
				a0 = d[0] - c[0] - a[0] + b[0],
				a1 = d[1] - c[1] - a[1] + b[1],
				a2 = d[2] - c[2] - a[2] + b[2];

			out[0] = a0*t3 + ( a[0] - b[0] - a0 )*t2 + ( c[0] - a[0] )*t + b[0];
			out[1] = a1*t3 + ( a[1] - b[1] - a1 )*t2 + ( c[1] - a[1] )*t + b[1];
			out[2] = a2*t3 + ( a[2] - b[2] - a2 )*t2 + ( c[2] - a[2] )*t + b[2];
			return out;
		}


	////////////////////////////////////////////////////////////////
	// Cosine
	////////////////////////////////////////////////////////////////
		// NOTE : Can calulate about the same curve without cos by using smoothstep equations which would be better
		// smoothstep( t ){ return 3*t**2 - 2*t**3; }
		// smoothTStep(t){ return (t**2) * (3 - 2 * t); }

		// http://paulbourke.net/miscellaneous/interpolation/
		static cosine( t, a, b ){
			t = (1 - Math.cos( t * Math.PI)) / 2;
		   	return a * (1-t) + b * t;
		}

		static cosine_quat( t, a, b, out ){
			let tt	= ( 1 - Math.cos( t * Math.PI ) ) * 0.5,
				ti	= 1 - tt;

			out[0] = a[0] * ti + b[0] * tt;
			out[1] = a[1] * ti + b[1] * tt;
			out[2] = a[2] * ti + b[2] * tt;
			out[3] = a[3] * ti + b[3] * tt;
			return out.normalize();
		}
}

export default Track;
export { FramePose, FramePoseHandler };