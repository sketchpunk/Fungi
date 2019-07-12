/* NOTES
FRAME RATE DAMPING 
http://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
http://mathproofs.blogspot.com/2013/07/critically-damped-spring-smoothing.html
*/

class Damp{
	//http://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
	// Damping from A to B.
	// Smoothing rate dictates the proportion of source remaining after one second
	static lerp_pow( a, b, damp, dt ){
		let ti	= damp ** dt,
			t	= 1 - ti;
		return a * ti + b * t;
	}

	// should create about the same results as lerp_pow
	static lerp_exp( a, b, damp, dt ){
		let ti 	= Math.exp( -damp * dt ),
			t 	= 1 - ti;
		return a * ti + b * t;
	}

	//http://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
	// Damp a value toward zero
	static to_zero( val, damp, dt ){ return val * damp**dt ; }

	// http://lolengine.net/blog/2015/05/03/damping-with-delta-time
	// Lock damping to a specific framerate.
	// This can be optimized with making (1 - d / fr) as a constant.
	static frame_rate( damp, dt, fr ){
		return ( 1 - damp / fr ) ** ( fr * delta_time );
	}

	static lerp_fr( a, b, damp, dt, fr ){
		let ti	= this.frame_rate( damp, dt, fr ),
			t 	= 1 - ti;
		return a * ti + b * t;
	}
}