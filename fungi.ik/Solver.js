import Maths, { Vec3, Quat } from "../fungi/maths/Maths.js";


//#####################################################################
const QUAT_FWD2UP = [0.7071067690849304, 0, 0, 0.7071067690849304]; //new Quat().setAxisAngle(Vec3.LEFT, Maths.toRad(90));

class Solver{
	///////////////////////////////////////////////////////////////////
	// Single Bone Solvers
	///////////////////////////////////////////////////////////////////
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

	///////////////////////////////////////////////////////////////////
	// Multi Bone Solvers
	///////////////////////////////////////////////////////////////////
		static limb( chain, pose, doOffset=false ){
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
}


//#####################################################################
export default Solver;