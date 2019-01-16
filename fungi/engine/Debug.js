import App	from "./App.js";
import Vec3	from "../maths/Vec3.js";
import DVerts, { DynamicVertsSystem } from "./ecs/DynamicVerts.js";


//#########################################################################
// Private Entity References
let eLine, ePoint;


//#########################################################################
class Debug{
	static init( ecs, priority=1 ){
		ePoint	= DVerts.build( App.newDraw( "Debug_Point" ), "Debug_Points", "VecWColor", 0 );
		eLine	= DVerts.build( App.newDraw( "Debug_Line" ), "Debug_Lines", "VecWColor", 1 );
		DynamicVertsSystem.init( ecs, priority );
	}

	////////////////////////////////////////////////////////////////////
	// POINTS
	////////////////////////////////////////////////////////////////////
		static point( v, color = 0 ){ DVerts.vecPoint( ePoint, v, color ); return Debug; }
		static rawPoint( x, y, z, color ){ DVerts.rawPoint( ePoint, x, y, z, color); return Debug; }


	////////////////////////////////////////////////////////////////////
	// LINES
	////////////////////////////////////////////////////////////////////
		static line(v0, v1, color = 0){ DVerts.vecLine( eLine, v0, v1, color); return Debug; }


	////////////////////////////////////////////////////////////////////
	// MISC
	////////////////////////////////////////////////////////////////////
		static reset( flag = 3 ){
			if( (flag & 1) != 0 ) DVerts.reset( ePoint );
			if( (flag & 2) != 0 ) DVerts.reset( eLine );
			return Debug;
		}

		static quat( q, offset = null ){
			let v = new Vec3();
			offset = offset || Vec3.ZERO;
			Debug
				.line( offset, Vec3.transformQuat(Vec3.FORWARD, q, v).add( offset ), 1 )
				.line( offset, Vec3.transformQuat(Vec3.UP, q, v).add( offset ), 2 )
				.line( offset, Vec3.transformQuat(Vec3.LEFT, q, v).add( offset ), 0 );

			return Debug;
	}
}


//#########################################################################
App.debug = Debug;
export default Debug;