class NumberCycle{
	constructor( nps = 0.2 ){
		this.num_ps	= nps;
		this.value 	= 0.0;
	}

	next( dt = null ){ this.value += this.num_ps * (dt || App.deltaTime); return this; }
	
	floor(){ return Math.floor( this.value ); }
	fract(){ return this.value - Math.floor(this.value); }
}


export default NumberCycle;