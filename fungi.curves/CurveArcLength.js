class CurveArcLength{
	constructor(){
		this.samples		= null;
		this.sampleCnt		= 0;
		this.sampleCntInv	= 0;
		this.arcLength		= 0;
	}

	fromCurve( c, s=null ){
		// Change Sample Count
		if( s ){
			this.sampleCnt 		= s;
			this.sampleCntInv 	= 1 / s;
		}

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let p0 = [ 0, 0 ],
			p1 = [ 0, 0 ],
			i;

		c.at( 0 , p0 );							// Save point at Time Zero
		this.samples		= new Array( this.sampleCnt+1 );	// New Sample Array
		this.samples[ 0 ]	= 0;				// First Value is zero.
		this.arcLength		= 0;				// Reset Arc Length

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( i=1; i <= s; i++ ){
			c.at( i * this.sampleCntInv , p1 );
			this.arcLength 		+= Math.sqrt( (p1[0] - p0[0]) ** 2 + (p1[1] - p0[1]) ** 2 );
			this.samples[ i ] 	=  this.arcLength;

			p0[ 0 ] = p1[ 0 ];	// Save point for next loop
			p0[ 1 ] = p1[ 1 ];
		}

		return this;
	}

	mapT( t ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Return Extremes, else set variables
		if(t <= 0) return 0;
		if(t >= 1) return 1;
		
		let targetLen	= t * this.arcLength,
			minIdx 		= 0,
			min 		= 0,
			max 		= this.sampleCnt;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Binary Search to find the idx of a sample
		// that is just below the target length so if the target is 10, 
		// find index that has a length at 10 or ver close on the min side,like 9
		while( min < max ){
			minIdx = min + ( ((max - min) * 0.5) | 0 ); //get mid index, use pipe for same op as Math.floor()
			
			// if sample is under target, use mid index+1 as new min
			// else sample is over target, use index as max for next iteration
			if(this.samples[ minIdx ] < targetLen)	min	= minIdx + 1;
			else 									max	= minIdx;
		}

		// if by chance sample is over target because we ended up with max index, go back one.
		if( this.samples[ minIdx ] > targetLen ) minIdx--;

		//Check if the idex is within bounds
		if( minIdx < 0 )					return 0;	// Well, can't have less then 0 as an index :)
		if( minIdx >= this.sampleCnt )		return 1;	// if the max value is less then target, just return 1;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Interpolate between the min and max indexes.
		let minLen = this.samples[ minIdx ];
		if( minLen == targetLen )	return minIdx * this.sampleCntInv;

		// Where does the targetLen exist between the min and maxLen... this t is the
		// Length interplation between the two sample points. Since Each sample point
		// itself is the t of the curve. So for example,
		// minIdx is 2 and we have 10 samples,  So we can get the curve t by doing minIdx / SampleCnt
		// Now are target leng lives between  index 2 and 3... So by finding the gradient  value between
		// for example 0.5...   So we're on index 2 but we need an extra half of index... So 2.5 sample index
		// We take that value and divide - 2.5 / sampleCnt = t of curve in relation to arc length.
		let maxLen	= this.samples[ minIdx + 1 ],
			tLen	= (targetLen - minLen) / ( maxLen - minLen );

		return ( minIdx + tLen ) * this.sampleCntInv;
	}
}

export default CurveArcLength;