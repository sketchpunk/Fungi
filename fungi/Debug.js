import Fungi	from "./Fungi.js";
import Api		from "./Api.js";
import DVao		from "./components/DynamicVao.js";
import DynamicVaoSystem from "./systems/DynamicVaoSystem.js";
import { Vec3 }	from "./Maths.js";


let ePoint, eLine;

class Debug{
	static init( priority=21 ){
		ePoint	= DVao.initPoint( Api.newDraw("ePoint", "VecWColor") );
		eLine	= DVao.initLine( Api.newDraw("eLine", "VecWColor") );
		Fungi.ecs.addSystem( new DynamicVaoSystem(), priority );
	}

	static point(v, color = 0){ DVao.vecPoint( ePoint, v, color ); return Debug; }

	static line(v0, v1, color = 0){ DVao.vecLine( eLine, v0, v1, color); return Debug; }

	static reset( flag = 3 ){
		if( (flag & 1) != 0 ) DVao.reset( ePoint );
		if( (flag & 2) != 0 ) DVao.reset( eLine );
		return Debug;
	}

	static quat(q, offset = null){
		let v = new Vec3();
		offset = offset || Vec3.ZERO;
		Debug
			.line( offset, Vec3.transformQuat(Vec3.FORWARD, q, v).add( offset ), 1 )
			.line( offset, Vec3.transformQuat(Vec3.UP, q, v).add( offset ), 2 )
			.line( offset, Vec3.transformQuat(Vec3.LEFT, q, v).add( offset ), 0 );

		return Debug;
	}
}

export default Debug;