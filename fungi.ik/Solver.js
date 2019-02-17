import Maths, { Vec3, Quat } from "../fungi/maths/Maths.js";

import App from "../fungi/engine/App.js"; //TODO Delete
import Axis from "../fungi/maths/Axis.js";


//#####################################################################
const QUAT_FWD2UP = [0.7071067690849304, 0, 0, 0.7071067690849304]; //new Quat().setAxisAngle(Vec3.LEFT, Maths.toRad(90));

class IKTarget{
	constructor(){
		this.startPos		= new Vec3();	// World Position start of an IK Chain
		this.endPos			= new Vec3();	// The End Effector ( Target Position )
		this.axis 			= new Axis();	// Target Axis, Defines Forward and Up mainly.

		this.distanceSqr	= 0;			// Distance Squared from Start to End, Faster to check lengths by Squared  to avoid using Sqrt to get real lengths.
	}

	/////////////////////////////////////////////////////////////////////
	// GETTERS - SETTERS
	/////////////////////////////////////////////////////////////////////	
		/** Define the target based on a Start and End Position along with
			Up direction or the direction of the bend. */
		byPos( pA, pB, upDir ){
			this.startPos.copy( pA );
			this.endPos.copy( pB );

			this.distanceSqr = Vec3.sub( pB, pA, this.axis.z ).lengthSqr();
			this.axis.fromDir( this.axis.z, upDir );

			return this;
		}

	/////////////////////////////////////////////////////////////////////
	// STATIC
	/////////////////////////////////////////////////////////////////////
		/** Visually see the Target information */
		static debug( d, t, scl=1.0 ){ 
			Axis.debug( d, t.axis, t.startPos, scl );
			d.point( t.startPos, 6 ).point( t.endPos, 0 );
			return this;
		}
}


class Solver{
	///////////////////////////////////////////////////////////////////
	// Single Bone Solvers
	///////////////////////////////////////////////////////////////////
		static aim( chain, target, pose, wt, doUpFix=true ){
			let bIdx	= chain.idx[ 0 ],
				rot 	= target.axis.toQuat(),
				q		= new Quat();

			// Use Target Axis as the starting rotation Axis.
			// Then using the AxisX, rotate by 90 degrees to make Forward UP
			// Then need to preMultiple the inverse parent world rotation to set the proper heirachy offset.
			if( doUpFix ) rot.pmul( Quat.axisAngle( target.axis.x, Maths.PI_H, q ) )
			rot.pmul( Quat.invert( wt.rot, q ));

			if( pose )	pose.updateBone( bIdx, rot );
			else 		chain.updateBone( bIdx, rot);

			return this;
		}

		/*
		static aim( chain, pose, doOffset=false ){
			// parentRotInv * lookRot * bindRot * FwdUpOffset
			// Need to basicly  to LookRot - ParentRot, Gives an offset to rotate to Look.
			// We add that offset to the bindRotation, then if needed, the Fwd to Up Fix rotation, because bones's real forward is up.
			let q = Quat.invert( chain.world.rot )
					.mul( Quat.lookRotation( chain.targetDir, Vec3.UP ) )									
					.mul( chain.getBone(0).Bone.initial.rot );

			if( doOffset ) q.mul( QUAT_FWD2UP );

			pose.updateBone( chain.idx[0], q );
			return this;
		}
		*/

	///////////////////////////////////////////////////////////////////
	// Multi Bone Solvers
	///////////////////////////////////////////////////////////////////
		
		static limb( chain, target, pose, wt, doUpFix=true ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Using law of cos SSS, so need the length of all sides of the triangle
			let aLen	= chain.lens[ 0 ],
				bLen	= chain.lens[ 1 ],
				cLen	= Math.sqrt( target.distanceSqr ),
				q 		= new Quat();

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Solve angle for the second bone
			q.setAxisAngle( Vec3.RIGHT, Math.PI - Maths.lawcos_sss( aLen, bLen, cLen ) ); //Up is Forward Fix ( PI - angle )
			if( pose )	pose.updateBone( chain.idx[ 1 ], q );
			else		chain.updateBone( chain.idx[ 1 ], q );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Solve for first Bone
			let x	= -Maths.lawcos_sss( aLen, cLen, bLen ),
				rot	= target.axis.toQuat();

			//rot.pmul( Quat.axisAngle( target.axis.x, Maths.PI_H + x, q ) )
			//rot.pmul( Quat.invert( wt.rot, q ));
			//rot.pmul( Quat.invert( chain.getBone(0).Bone.initial.rot ) );

			//if( pose )	pose.updateBone( chain.idx[ 0 ], rot );
			//else		chain.updateBone( chain.idx[ 0 ], rot );

			return this;
		}

		/*
		static limbORG( chain, pose, doOffset=false ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Using law of cos SSS, so need the length of all sides of the triangle
			let aLen	= chain.lens[ 0 ],
				bLen	= chain.lens[ 1 ],
				cLen	= Math.sqrt( chain.targetLenStr ),
				rot 	= new Quat(),
				angle	= new Quat();

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Solve angle for the second bone

			angle.setAxisAngle( Vec3.LEFT, Math.PI - Maths.lawcos_sss( aLen, bLen, cLen ) ); //Up is Forward Fix ( PI - angle )
			pose.updateBone( chain.idx[ 1 ], angle );

			//.......................................
			// Solve for first Bone
			let x = -Maths.lawcos_sss( aLen, cLen, bLen );
			if( doOffset ) x += Maths.PI_H;						// Up is Forward Fix, Do this to avoid using QUAT_FWD2UP

			Quat.lookRotation( chain.targetDir, Vec3.UP, rot )	// Look Direction toward the Target
				.pmul( Quat.invert( chain.world.rot ) )			// Pre Multiple by Parent Rotation
				.mul( angle.setAxisAngle( Vec3.LEFT, x ) );		// Move by the Angle of A and C
				//.mul( chain.getBone(0).Bone.initial.rot );	// Add Bone's Bind Rotation

			//if( doOffset ) rot.mul( QUAT_FWD2UP );				

			//.......................................
			pose.updateBone( chain.idx[ 0 ], rot );
			return this;
		}
		*/
}


//#####################################################################
export { Solver, IKTarget };