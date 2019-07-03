import { Perlin } from "../lib/Noise1D.js";

class NoiseCycle{
	constructor( fps = 0.1 ){
		this.func 		= new Perlin();
		this.freq_ps	= fps;
		this.freq_pos	= 0;
	}

	next( dt = null ){ 
		this.freq_pos += this.freq_ps * ( dt || Fungi.deltaTime );
		return this;
	}

	get( is01 = false, s = 1, a = 0 ){ // Scale, Additive
		return ( !is01 )?
			this.func.get( this.freq_pos * s + a ) :
			this.func.get( this.freq_pos * s + a ) * 0.5 + 0.5;
	}

	lerp( v0, v1, s=1, a=0 ){
		let t	= this.func.get( this.freq_pos * s + a ) * 0.5 + 0.5,
			ti	= 1 - t;
		return v0 * ti + v1 * t;
	}
}

export default NoiseCycle;