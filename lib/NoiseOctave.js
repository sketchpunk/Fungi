


//https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
//https://en.wikipedia.org/wiki/Lehmer_random_number_generator
function LCG(seed) {
    function lcg(a) {return a * 48271 % 2147483647}
    seed = seed ? lcg(seed) : lcg(Math.random());
    return function(){ return (seed = lcg(seed)) / 2147483648; }
}


class NOctave{
	//getOctave3(xx, yy, oct=4, persistance=0.5, lacunarity=2, freq=0.1){

	// persistance : decrease amptitude 0 -> 1
	// lacunarity : increase freq >= 1
	static fullMap(nFunc, w, h, seed, scale = 1, octaves = 1, persistance = 1, lacunarity = 1, offsetX = 0, offsetY = 0){
		var out = new Array(h);
		var x, y, o, nx, ny, nValue;
		var freq, amp,
			nMin = Number.MAX_VALUE, 
			nMax = Number.MIN_VALUE;

		//.............................
		var octXOffset	= new Array(octaves),
			octYOffset	= new Array(octaves),
			lcg			= LCG(seed);

		for(o=0; o < octaves; o++){
			octXOffset[o] = (lcg() * 20000 - 10000) + offsetX;
			octYOffset[o] = (lcg() * 20000 - 10000) + offsetY;
		}

		var wHalf = w * 0.5,
			hHalf = h * 0.5;

		//https://www.youtube.com/watch?v=MRNFcywkUSA&list=PLFt_AvWsXl0eBW2EiBtl_sxmDtSgZBxB3&index=3

		for(y=0; y < h; y++){
			out[y] = new Array(w);
			
			for(x=0; x < w; x++){				
				nx		= (x - wHalf) / scale;
				ny		= (y - hHalf) / scale;
				freq	= 1;
				amp		= 1;
				nValue	= 0;

				for(o=0; o < octaves; o++){
					nValue	+= nFunc(
									nx * freq + octXOffset[o], 
									ny * freq + octYOffset[o]
								) * amp;
					amp		*= persistance
					freq	*= lacunarity
				}

				//Keep track of Min/Max to normalize data later.
				if(nValue > nMax)		nMax = nValue;
				else if(nValue < nMin)	nMin = nValue;

				//Save
				out[y][x] = nValue;
			}
		}

		//Normalize Data : (n - nMin) / (nMax - nMin)
		var rng = (nMax - nMin); //Range
		for(y=0; y < h; y++){
			for(x=0; x < w; x++) out[y][x] = ( out[y][x] - nMin ) / rng;
		}

		return out;

/*

		let freq, apt, nValue, x, y, o;

		let out = new Array(h),
			min = Number.MAX_VALUE,
			max = Number.MIN_VALUE;

		for(y=0; y < h; y++){
			out[y] = new Array(w);
			for(x=0; x < w; x++){
				freq	= 1;
				apt 	= 1;
				nValue	= 0;

				//Calculate Octave Noise
				for(o=0; o < octaves; o++){
					nValue	+=	nFunc( 
									x * freq * scale + offsetX, 
									y * freq * scale + offsetY
								) * apt;
					freq	*= lacunarity;	//Increase Frequency
					apt		*= persistance;	//Decrease Aptitude
				}

				//Keep track of Min/Max to normalize data later.
				if(nValue > max)		max = nValue;
				else if(nValue < min)	min = nValue

				//Save Octive Noise Value
				out[y][x] = nValue;
			}
		}
*/

/*
		float[,] noiseMap = new float[mapWidth,mapHeight];

		System.Random prng = new System.Random (seed);
		Vector2[] octaveOffsets = new Vector2[octaves];
		for (int i = 0; i < octaves; i++) {
			float offsetX = prng.Next (-100000, 100000) + offset.x;
			float offsetY = prng.Next (-100000, 100000) + offset.y;
			octaveOffsets [i] = new Vector2 (offsetX, offsetY);
		}

		if (scale <= 0) {
			scale = 0.0001f;
		}

		float maxNoiseHeight = float.MinValue;
		float minNoiseHeight = float.MaxValue;

		float halfWidth = mapWidth / 2f;
		float halfHeight = mapHeight / 2f;


		for (int y = 0; y < mapHeight; y++) {
			for (int x = 0; x < mapWidth; x++) {
		
				float amplitude = 1;
				float frequency = 1;
				float noiseHeight = 0;

				for (int i = 0; i < octaves; i++) {
					float sampleX = (x-halfWidth) / scale * frequency + octaveOffsets[i].x;
					float sampleY = (y-halfHeight) / scale * frequency + octaveOffsets[i].y;

					float perlinValue = Mathf.PerlinNoise (sampleX, sampleY) * 2 - 1;
					noiseHeight += perlinValue * amplitude;

					amplitude *= persistance;
					frequency *= lacunarity;
				}

				if (noiseHeight > maxNoiseHeight) {
					maxNoiseHeight = noiseHeight;
				} else if (noiseHeight < minNoiseHeight) {
					minNoiseHeight = noiseHeight;
				}
				noiseMap [x, y] = noiseHeight;
			}
		}

		for (int y = 0; y < mapHeight; y++) {
			for (int x = 0; x < mapWidth; x++) {
				noiseMap [x, y] = Mathf.InverseLerp (minNoiseHeight, maxNoiseHeight, noiseMap [x, y]);
			}
		}

		return noiseMap;
		*/
	}
}


class NoiseOctave{
	constructor(nfunc, dim = 2){
		this.nFunc		= nfunc;	//Noise function to use.
		this.nSeed		= 0;		//TODO Noise Functions need to hold a different seed per instance, right now its global

		this.nDim		= new Array(dim);
		this.nDimNum	= new Array(dim);
		for(var i=0; i < dim; i++) this.nDim[i] = { freq:1, offset:0, aptitude:1 };

		/*[[[ NOTES ]]]
			.freq : How to increment when stepping through the noise functions.
			.offset : Starting point of a dimension. Instead of starting at 0, start at 2 for example.
			.aptitude : scale the dimension value before passing it to the noise function. (Like zooming in/out)
		*/
	}

	get(){
		//Calc the value for each dimension then cache in array to send to noise function.
		for(var i=0; i < arguments.length; i++){
			this.nDimNum[i] = arguments[i] * this.nDim[i].freq * this.nDim[i].aptitude;
		}
		return this.nFunc.apply(null, this.nDimNum);
	}

	getOctave(x, y, oct=3, persistance=0.5, lacunarity=1.6, freq=0.1){
		var tNoise	= 0, //freq 0.035,
			tAmp	= 0,
			amp		= 1;

		for(var i=0; i < oct; i++){
			tNoise	+= this.nFunc(x * freq, y * freq) * amp;
			tAmp	+= amp;
			amp		*= persistance;	//Decrease Amp , This is the weighted noise, less influence
			freq	*= lacunarity;	//Increase Freq, zooming out.
		}

		return tNoise / tAmp;
	}

	getOctave2(x, y, oct=3, persistance=0.5, lacunarity=1.6, freq=0.1){
		var n,
			lac,
			nTotal = 0,
			nMax = -1000,
			nMin = 1000;

		//var weight = 0.5;

		for(var o=0; o < oct; o++){
			lac = Math.pow(lacunarity,o);
			n = this.nFunc(x * freq * lac, y * freq * lac) * Math.pow(persistance,o);
			//n *= Math.pow(weight,o);

			if(n < nMin) nMin = n;
			if(n > nMax) nMax = n;

			nTotal += n;
		}

		//nTotal /= oct;
		return (nTotal - nMin) / (nMax - nMin);
	}

	getOctave3(xx, yy, oct=4, persistance=0.5, lacunarity=2, freq=0.1){
		var x, y, n, f, a, nMax = -1000, nMin = 1000;
		
		var ary = new Array(yy);
		for(y=0; y < yy; y++){
			ary[y] = new Array(xx);

			for(x=0; x < xx; x++){
				n = 0;		//noise
				a = 1;		//amptitude
				f = freq;	//frequency
				
				//Create Octave Noise Value
				for(var o=0; o < oct; o++){
					n += this.nFunc(x * f, y * f) * a;
					a *= persistance;	//Decrease Amp
					f *= lacunarity;	//Increase Freq
				}

				//Keep track of Min/Max to normalize data later.
				if(n < nMin) nMin = n;
				if(n > nMax) nMax = n;

				//Save Octive Noise Value
				ary[y][x] = n;
			}
		}

		//Normalize Data : (n - nMin) / (nMax - nMin)
		var rng = 1 / (nMax - nMin); //Range
		for(y=0; y < yy; y++){
			for(x=0; x < xx; x++) ary[y][x] = ( ary[y][x] - nMin ) * rng; /// rng
		}
		return ary;
	}

	//======================================================
	setFreq(){		return this.set(arguments,"freq"); }
	setAptitude(){	return this.set(arguments,"aptitude"); }
	set(ary,prop){
		if(ary.length == 1) for(var i=0; i < this.nDim.length; i++)		this.nDim[i][prop] = ary[0];
		else 				for(var i=0; i < ary.length; i++)			this.nDim[i][prop] = ary[i];
		return this;
	}
}

export default NoiseOctave;
export { NOctave };