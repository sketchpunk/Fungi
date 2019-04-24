import App, { Vao } 	from "../fungi/engine/App.js";
import Camera 			from "../fungi/engine/ecs/Camera.js";
import Maths, { Vec3 }	from "../fungi/maths/Maths.js";
import AABB				from "../fungi.physics/AABB.js";
import Ray 				from "../fungi.ray/Ray.js";


//##############################################################################################
const OUTER_CUBE	= 1.0;
const INNER_CUBE	= 0.1;
const QUAD_SIZE 	= 0.3;
const UNIT_AXIS		= [ Vec3.FORWARD, Vec3.LEFT, Vec3.UP ];
const QUAD_X = [
	new Vec3( 0, QUAD_SIZE, 0 ),
	new Vec3( 0, 0, 0 ),
	new Vec3( QUAD_SIZE, 0, 0 ),
	new Vec3( QUAD_SIZE, QUAD_SIZE, 0 ),
];

const QUAD_Y = [
	new Vec3( 0, 0, 0 ),
	new Vec3( 0, 0, QUAD_SIZE ),
	new Vec3( QUAD_SIZE, 0, QUAD_SIZE ),
	new Vec3( QUAD_SIZE, 0, 0 ),
];

const QUAD_Z = [
	new Vec3( 0, QUAD_SIZE, QUAD_SIZE ),
	new Vec3( 0, 0, QUAD_SIZE ),
	new Vec3( 0, 0, 0 ),
	new Vec3( 0, QUAD_SIZE, 0 ),
];

const TRANSLATE_SCALE 		= 0.3;
const TRANSLATE_SNAP		= 0.2;
const TRANSLATE_SNAP_INV 	= 1 / TRANSLATE_SNAP;

const AXIS_MIN_RNG			= 0.001;


//##############################################################################################
class TranslateGizmo{
	constructor(){
		this.innerCube	= new AABB( 0,0,0, INNER_CUBE, INNER_CUBE, INNER_CUBE );
		//this.seg 		= null; // 2D Segment Line used for Tracking mouse movement
		
		this.segCnt 	= 0;
		this.seg 		= [
			{ mx:0, my:0, ex:0, ey:0, axis:null },
			{ mx:0, my:0, ex:0, ey:0, axis:null },
		];
	}

	static getCollider(){ return new AABB( 0,0,0, OUTER_CUBE, OUTER_CUBE, OUTER_CUBE ); }

	static handleMouse( e, ix, iy, tran, snap ){
		let o		= e.Gizmo.state,
			len		= o.segCnt,
			ary		= o.seg,
			v		= new Vec3(),
			move	= new Vec3(),
			i, t, seg;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( i=0; i < len; i++ ){
			seg	= ary[ i ];
			t	= Maths.closestPointToLine2D( seg.mx, seg.my, seg.ex, seg.ey, ix, iy );
			Vec3.scale( seg.axis, t * TRANSLATE_SCALE, v );

			if( snap ) v.scale( TRANSLATE_SNAP_INV ).floor().scale( TRANSLATE_SNAP );
			move.add( v );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		move.add( tran.pos, e.Node.local.pos );
		e.Node.isModified = true;
		return;
	}

	//////////////////////////////////////////////////////////
	// Hit Detection
	//////////////////////////////////////////////////////////
		static isHit( e, ray ){
			//App.debug.reset();
			//App.debug.line( ray.origin, ray.end, 6 );
			let bHit;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Check the Gizmo's Bounding Box first.
			//bHit = this.rayToBox( ray, e.Gizmo.state.outerCube, e.Node.local );
			//App.debug.box( e.Gizmo.type.outerCube.worldBounds[0], e.Gizmo.type.outerCube.worldBounds[1] );
			//if( !bHit ){
			//	console.log("Gizmo Bound Not Hit");
			//	return false;
			//}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Test Inner Cube for Camera Axis Use.
			bHit = this.rayToBox( ray, e.Gizmo.state.innerCube, e.Node.local );
			if( bHit ){
				this.set2DSegment( e, App.node.getMatrixDir( App.camera, 2 ), ray, 0 ); // Up
				this.set2DSegment( e, App.node.getMatrixDir( App.camera, 1 ), ray, 1 ); // Left
				e.Gizmo.state.segCnt = 2;
				//console.log(" Camera Axis Transform ");
				//console.log( e.Gizmo.state.seg );
				return true;
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Axis Lines
			let iAxis = this.rayToAxisSegments( ray, e.Node.local );
			if( iAxis != -1 ){
				this.set2DSegment( e, UNIT_AXIS[iAxis], ray, 0 );
				e.Gizmo.state.segCnt = 1;
				//console.log("Axis Hit", iAxis, UNIT_AXIS[ iAxis ] );
				/*
				let d = document.createElement( "div" );
				d.style.backgroundColor = "black";
				d.style.position = "absolute";
				d.style.width = "40px";
				d.style.height = "40px";
				d.style.left = p1[0] + "px";
				d.style.top = p1[1] + "px";
				d.innerText= "TEST";
				d.style.zIndex = 1000;
				document.body.appendChild( d );
				console.log( d );
				*/
				return true;
			}
			
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			/* Axis Quads*/
			if( this.rayToQuad( ray, QUAD_Z, e.Node.local ) ){
				this.set2DSegment( e, UNIT_AXIS[0], ray, 0 );
				this.set2DSegment( e, UNIT_AXIS[2], ray, 1 );
				e.Gizmo.state.segCnt = 2;
				return true;

			}else if( this.rayToQuad( ray, QUAD_Y, e.Node.local ) ){
				this.set2DSegment( e, UNIT_AXIS[0], ray, 0 );
				this.set2DSegment( e, UNIT_AXIS[1], ray, 1 );
				e.Gizmo.state.segCnt = 2;
				return true;

			}else if( this.rayToQuad( ray, QUAD_X, e.Node.local ) ){
				//const UNIT_AXIS		= [ Vec3.FORWARD, Vec3.LEFT, Vec3.UP ];
				this.set2DSegment( e, UNIT_AXIS[1], ray, 0 );
				this.set2DSegment( e, UNIT_AXIS[2], ray, 1 );
				e.Gizmo.state.segCnt = 2;
				return true;
			}

			return false;
		}

		static rayToBox( ray, box, wt ){
			var info = {};

			box.setWorldTransform( wt );
			if( Ray.inAABB( ray, box, info ) ){
				return true; //App.debug.point( ray.getPos( info.min ), 0 );
			}

			return false;
		}

		static rayToQuad( ray, quad, wt ){
			let a = wt.transformVec( quad[0], new Vec3() ),
				b = wt.transformVec( quad[1], new Vec3() ),
				c = wt.transformVec( quad[2], new Vec3() ),
				d = wt.transformVec( quad[3], new Vec3() );

			let t = Ray.inQuadRaw( ray, a, b, c, d );
			if( t != null ) return true;

			return false;	
		}

		static rayToAxisSegments( ray, wt ){
			let p 		= new Vec3(),
				minLen	= Infinity,
				minAxis	= -1,
				i, info, len;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			for( i=0; i < 3; i++ ){
				// Get Axis End Point at World Space Scale.
				// Axis gets Camera Adjusted, so by taking the scale of a unit axis works.
				Vec3.mul( UNIT_AXIS[ i ], wt.scl, p ).add( wt.pos );

				// Get the closest two points between the ray and the axis line
				info = Ray.nearSegmentPoints( ray, wt.pos, p );
				if( info != null ){
					len = info[0].lengthSqr( info[1] );
					if( len <= AXIS_MIN_RNG && len < minLen ){
						minLen	= len;
						minAxis	= i;
					}
				}
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			return minAxis;
		}

		static set2DSegment( e, axis, ray, iSeg ){
			// Create Axis Segment, Then translate it to Screen Space.
			let v0 = new Vec3( axis ).scale( 0.2 ).add( e.Node.local.pos ),
				v1 = new Vec3( axis ).scale( -0.2 ).add( e.Node.local.pos ),
				p0 = Camera.worldToScreen( App.camera, v0 ),	// Positive Direction on Axis
				p1 = Camera.worldToScreen( App.camera, v1 ),	// Negative Direction on Axis
				dx  = p0[0] - p1[0],							// Delta in Screen Space
				dy 	= p0[1] - p1[1];

			// The idea is to create a screen space line segment that starts at the mouse
			// down position and extends in the direction that goes toward the positive axis direction.
			// So when doing a closestPointToLine call, We get the T value of the line. Positive / Negative
			// will then scale the 3d axis movement correctly. 
			let seg = e.Gizmo.state.seg[ iSeg ];
			seg.mx		= ray.mouse[ 0 ];
			seg.my		= ray.mouse[ 1 ];
			seg.ex		= ray.mouse[ 0 ] + dx;
			seg.ey		= ray.mouse[ 1 ] + dy;
			seg.axis	= axis;
		}

	//////////////////////////////////////////////////////////
	// Mesh Data
	//////////////////////////////////////////////////////////
		static init(){
			this.drawItems = this.getGeo();
			return this;
		}

		static getGeo(){
			let w, u, vert, idx, ary = [];

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Lines
			if( (this.DrawConfig & 1) != 0 ){
				w = 1;
				vert = [
					0, 0, 0, 1,
					0, 0, w, 1,

					0, 0, 0, 0,
					w, 0, 0, 0,
					
					0, 0, 0, 2,
					0, w, 0, 2,
				];

				ary.push( { drawMode:1, vao:Vao.buildStandard( "gizmo_tranLine", 4, vert, null, null, null ) } );
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Quads
			if( (this.DrawConfig & 2) != 0 ){
				w = 0.3;
				u = 0.1;
				vert = [
					0,0,0,0,
					w,0,0,0,
					w,w,0,0,
					0,w,0,0,

					0,0,0,1,
					0,0,w,1,
					0,w,w,1,
					0,w,0,1,

					0,0,0,2,
					0,0,w,2,
					w,0,w,2,
					w,0,0,2,

					0,0,u,3,
					u,0,u,3,
					u,u,u,3,
					0,u,u,3,

					u,0,u,3,
					u,0,0,3,
					u,u,0,3,
					u,u,u,3,

					0,u,u,3,
					u,u,u,3,
					u,u,0,3,
					0,u,0,3,
				];

				idx = [ 
					0,1,2, 2,3,0,
					4,5,6, 6,7,4,
					8,9,10, 10,11,8,
					12,13,14, 14,15,12,
					16,17,18, 18,19,16,
					20,21,22, 22,23,20,
				];

				ary.push( { drawMode:4, vao:Vao.buildStandard( "gizmo_tranQuad", 4, vert, null, null, idx ) } );
			}
			return ary;
		}
}

TranslateGizmo.DrawConfig = 3;

export default TranslateGizmo;