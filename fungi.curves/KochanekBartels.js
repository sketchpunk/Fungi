import Vec3 from "../fungi/maths/Vec3.js";

//################################################################################
// https://en.wikipedia.org/wiki/Kochanek%E2%80%93Bartels_spline
// Tension = Curveness, Bias = Over Shoot, Continuity = Breaks out the curve between points
function kochanek_bartels_at( p0, p1, p2, p3, t, tension=0, bias=0, continuity=0, out=null ){
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// OPTIMIZATION NOTES :
	// If interpolating a curve, TCB and Tangents shouldn't be calc for each point.
	// Precalc then reuse values for each t of the curve.
	// FOR splines, d0a, d0b, d1a, d1b Can be calced for all curves, then just do the tangents per curve.
	let d0a = ((1 - tension) * ( 1 + bias ) * ( 1 + continuity)) * 0.5,
		d0b = ((1 - tension) * ( 1 - bias ) * ( 1 - continuity)) * 0.5,
		d1a = ((1 - tension) * ( 1 + bias ) * ( 1 - continuity)) * 0.5,
		d1b = ((1 - tension) * ( 1 - bias ) * ( 1 + continuity)) * 0.5,

		d0x = d0a * ( p1[0] - p0[0] ) + d0b * ( p2[0] - p1[0] ),	// Incoming Tangent
		d0y = d0a * ( p1[1] - p0[1] ) + d0b * ( p2[1] - p1[1] ),
		d0z = d0a * ( p1[2] - p0[2] ) + d0b * ( p2[2] - p1[2] ),

		d1x = d1a * ( p2[0] - p1[0] ) + d1b * ( p3[0] - p2[0] ),	// Outgoing Tangent
		d1y = d1a * ( p2[1] - p1[1] ) + d1b * ( p3[1] - p2[1] ),
		d1z = d1a * ( p2[2] - p1[2] ) + d1b * ( p3[2] - p2[2] );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Interpolate a point on the curve
	let tt 	= t * t,
		ttt = tt * t;

	out = out || new Vec3();
	out[0] = p1[0] + d0x * t + (- 3 * p1[0] + 3 * p2[0] - 2 * d0x - d1x) * tt + ( 2 * p1[0] - 2 * p2[0] + d0x + d1x) * ttt;
	out[1] = p1[1] + d0y * t + (- 3 * p1[1] + 3 * p2[1] - 2 * d0y - d1y) * tt + ( 2 * p1[1] - 2 * p2[1] + d0y + d1y) * ttt;
	out[2] = p1[2] + d0z * t + (- 3 * p1[2] + 3 * p2[2] - 2 * d0z - d1z) * tt + ( 2 * p1[2] - 2 * p2[2] + d0z + d1z) * ttt;
	return out;
}


//################################################################################
function kochanek_bartels_dxdy( p0, p1, p2, p3, t, tension=0, bias=0, continuity=0, out=null ){
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// OPTIMIZATION NOTES :
	// If interpolating a curve, TCB and Tangents shouldn't be calc for each point.
	// Precalc then reuse values for each t of the curve.
	// FOR splines, d0a, d0b, d1a, d1b Can be calced for all curves, then just do the tangents per curve.
	let d0a = ((1 - tension) * ( 1 + bias ) * ( 1 + continuity)) * 0.5,
		d0b = ((1 - tension) * ( 1 - bias ) * ( 1 - continuity)) * 0.5,
		d1a = ((1 - tension) * ( 1 + bias ) * ( 1 - continuity)) * 0.5,
		d1b = ((1 - tension) * ( 1 - bias ) * ( 1 + continuity)) * 0.5,

		d0x = d0a * ( p1[0] - p0[0] ) + d0b * ( p2[0] - p1[0] ),	// Incoming Tangent
		d0y = d0a * ( p1[1] - p0[1] ) + d0b * ( p2[1] - p1[1] ),
		d0z = d0a * ( p1[2] - p0[2] ) + d0b * ( p2[2] - p1[2] ),

		d1x = d1a * ( p2[0] - p1[0] ) + d1b * ( p3[0] - p2[0] ),	// Outgoing Tangent
		d1y = d1a * ( p2[1] - p1[1] ) + d1b * ( p3[1] - p2[1] ),
		d1z = d1a * ( p2[2] - p1[2] ) + d1b * ( p3[2] - p2[2] );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Interpolate a point on the curve
	let tt 	= t * t,
		t2 	= 2 * t,
		tt3 = 3 * tt;

	out = out || new THREE.Vector3();
	out.x = d0x + (- 3 * p1[0] + 3 * p2[0] - 2 * d0x - d1x) * t2 + ( 2 * p1[0] - 2 * p2[0] + d0x + d1x) * tt3;
	out.y = d0y + (- 3 * p1[1] + 3 * p2[1] - 2 * d0y - d1y) * t2 + ( 2 * p1[1] - 2 * p2[1] + d0y + d1y) * tt3;
	out.z = d0z + (- 3 * p1[2] + 3 * p2[2] - 2 * d0z - d1z) * t2 + ( 2 * p1[2] - 2 * p2[2] + d0z + d1z) * tt3;

	return out;
}


//################################################################################
export default { at: kochanek_bartels_at, dxdy: kochanek_bartels_dxdy };