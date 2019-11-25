import Vec3Buffer	from "../maths/Vec3Buffer.js";
import GeoUtil		from "./GeoUtil.js";

function Cylinder(){
}

Cylinder.verts = function( div=5, radius=0.5){
	let arc = GeoUtil.arc_verts( Math.PI * 0.5, 0, div, radius, 1 );
	let meh = GeoUtil.lathe( arc, 2, "y" );

	meh.expand_by( 1 ).push_raw( 0, 0.5, 0 );

	return meh;
}





export default Cylinder;