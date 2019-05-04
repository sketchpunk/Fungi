import Vec3 from "../fungi/maths/Vec3.js";

class CurveCache{
	constructor(){
		this.samples 		= new Array();
		this.sampleCnt 		= 0;
		this.sampleCntInv 	= 0;
	}
	
	fromCurve( c, s ){
		let i;
		for(i=0; i <= s; i++) this.samples.push( c.at( i / s ) );
			
		this.sampleCnt		= this.samples.length - 1;
		this.sampleCntInv 	= 1 / this.sampleCnt;
	}

	at( t, out=null ){
		out = out || new THREE.Vector3();
		if( t <= 0 ) return out.copy( this.samples[ 0 ] );
		if( t >= 1 ) return out.copy( this.samples[ this.sampleCnt ] );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let i;
		t = this.sampleCnt * t;
		i = t | 0;

		return out.lerpVectors( this.samples[i], this.samples[i+1], t - i );
	}
}

export default CurveCache;