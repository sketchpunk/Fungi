/*
// Create Curve
let cnt = 30;
let kb = new KochanekBartels( 7 );
kb	.set( 1, null, null, null, 1.0 )
	.set( 2, null, null, 0.4, 1.0 )
	//.set( 2, null, null, 0.4, 1.0, 2.0, 5.0 )
	.set( 3, null, null, -0.2 )
	.set( 4, null, null, 0.1 );
kb.debug( cnt );
*/
import Vec3 from "../fungi/maths/Vec3.js";
import KB 	from "./KochanekBartels.js";


class KBSpline{
	constructor( pCnt=4, t=0, b=0, c=0 ){
		this.pnts		= new Array();
		this.curveCnt	= (pCnt - 3);

		let i,v;
		for( i=0; i < pCnt; i++ ){
			v = new Vec3( i*0.3, 0, 0 );
			v.t = t;
			v.b = b;
			v.c = c;
			this.pnts.push( v );
		}

		this.T 			= 0;
		this.tension 	= 0;
		this.bias 		= 0;
		this.continuity = 0;
	}

	/////////////////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////////////////
		_calcParams( t ){
			let i;

			if(t >= 1){					// Final Curve in the spline
				this.T = 1;
				i = this.pnts.length - 4;
			}else if( t <= 0 ){			// First Curve in the Spine
				this.T = 0;
				i = 0;
			}else{ 						// Determine which curve is being accessed.
				this.T	= t * this.curveCnt;
				i 		= this.T | 0;	// Curve index by stripping out the decimal, BitwiseOR 0 same op as Floor
				this.T	-= i;			// Strip out the whole number to get the decimal norm to be used for the curve ( FRACT )
			}

			let ti 	= ( 1-this.T ),
				ii 	= i + 1,
				iii	= i + 2;

			this.tension	= ti * this.pnts[ ii ].t  + this.T * this.pnts[ iii ].t;
			this.bias 		= ti * this.pnts[ ii ].b  + this.T * this.pnts[ iii ].b;
			this.continuity	= ti * this.pnts[ ii ].c  + this.T * this.pnts[ iii ].c;

			return i;
		}

		set( i, x=null, y=null, z=null, t=null, b=null, c=null ){
			let p;

			if( i == null ){
				p = new Vec3();
				p.t = 0;
				p.b = 0;
				p.c = 0;
				this.pnts.push( p );
				this.curveCnt = this.pnts.length - 3;

				console.log( this.pnts.length );
			} else p = this.pnts[ i ];

			if( x != null ) p[0] = x;
			if( y != null ) p[1] = y;
			if( z != null ) p[2] = z;
			if( t != null ) p.t = t;
			if( b != null ) p.b = b;
			if( c != null ) p.c = c;

			return this;
		}

		at( t=0, out=null, dxOut = null ){
			let i 	= this._calcParams( t );
			out 	= out || new Vec3();

			// If DxDy out is available to save time from calcuting all the parameters for the segment
			if( dxOut ) KB.dxdy( this.pnts[i], this.pnts[i+1], this.pnts[i+2], this.pnts[i+3], this.T, this.tension, bias, this.continuity, dxOut );

			// Get Position on Curve
			return KB.at( this.pnts[i], this.pnts[i+1], this.pnts[i+2], this.pnts[i+3], this.T, this.tension, this.bias, this.continuity,  out );
		}

		dxdy( t, out = null ){
			let i 	= this._calcParams( t );
			out 	= out || new THREE.Vector3();

			return KochanekBartels.dxdy( this.points[i], this.points[i+1], this.points[i+2], this.points[i+3], this.T, this.tension, this.bias, this.continuity, out );
		}

		samples( s ){
			let out	= new Array( s+1 ),
				si 	= 1 / s,
				i;

			for( i=0; i <= s; i++ ) out[ i ] = this.at( i * si );
			return out;
		}

	/////////////////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////////////////
		debug( pl, s = 10 ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Display Points
			let last	= this.pnts.length - 1,
				i		= 0, 
				c;

			for( i=0; i < this.pnts.length; i++ ) pl.point( this.pnts[ i ], ( i == 0 || i == last )? 0 : 1 );


			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			let v0 = new Vec3(),
				v1 = new Vec3(),
				//d  = new Vec3(),
				//dd = new Vec3(),
				si = 1 / s,
				t;

			this.at( 0, v0 );
			for( i=1; i <= s; i++ ){
				t = i * si;

				this.at( t, v1 );
				pl.line( v0, v1, 0 ).point( v1, 4 );

				//this.dxdy( t, d ).normalize().multiplyScalar(0.2);
				//gDebug.lineVec( v1, dd.addVectors( v1, d ), 0x00ffff );

				v0.copy( v1 );
			}

			return this;
		}
}

export default KBSpline;