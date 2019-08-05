class FlatVectorArray{
	constructor( elmCnt=1, compLen=3, type=null ){
		this.elmCnt 	= elmCnt;
		this.compLen 	= compLen;
		this.aryLen		= elmCnt * compLen;
		this.count		= 0;

		if( !type ){
			this.aryType	= Float32Array;
			this.data		= new Float32Array( this.aryLen );
		}else{
			this.aryType	= type;
			this.data 		= new type( this.aryLen );
		}
	}

	setComp( i, v, step=0 ){ this.data[ i * this.compLen + step ] = v; return this; }
	set( i, d ){
		let ii, itm, a;
		i *= this.compLen;

		for( ii=1; ii < arguments.length; ii++ ){
			itm = arguments[ ii ];

			if( itm instanceof this.aryType || Array.isArray( itm ) ){
				for( a of itm ) this.data[ i++ ] = a;
			}else if( typeof itm == "number" ){
				this.data[ i++ ] = itm;
			}
		}

		return this;
	}

	push2( x, y ){
		let i = this.count++ * this.compLen;
		this.data[ i ]		= x;
		this.data[ i+1 ]	= y;
		return this;
	}

	push3( x, y, z ){
		let i = this.count++ * this.compLen;
		this.data[ i ]		= x;
		this.data[ i+1 ]	= y;
		this.data[ i+2 ]	= z;
		return this;
	}

	get( i, out=null ){
		let ii;
		out	=	out || new this.aryType( this.compLen );
		i	*=	this.compLen;

		for( ii=0; ii < this.compLen; ii++ ){
			this.out[ ii ] = this.data[ i++ ];
		}

		return out;
	}
}