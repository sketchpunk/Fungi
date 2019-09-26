import App						from "../fungi/engine/App.js";
import Maths, { Quat, Vec3 }	from "../fungi/maths/Maths.js";
import Transform				from "../fungi/maths/Transform.js";
import Axis						from "../fungi/maths/Axis.js";


//##################################################################################
class IKTarget{
	constructor(){
		this.start_pos		= new Vec3();	// World Position start of an IK Chain
		this.end_pos		= new Vec3();	// The End Effector ( Target Position )
		this.axis 			= new Axis();	// Target Axis, Defines Forward and Up mainly.
		this.len_sqr		= 0;			// Distance Squared from Start to End, Faster to check lengths by Squared to avoid using Sqrt to get real lengths.
		this.len			= 0;
	}

	/////////////////////////////////////////////////////////////////////
	// GETTERS - SETTERS
	/////////////////////////////////////////////////////////////////////	
		/** Define the target based on a Start and End Position along with
			Up direction or the direction of the bend. */
		from_pos( pA, pB, up_dir ){
			this.start_pos.copy( pA );
			this.end_pos.copy( pB );

			this.len_sqr	= this.axis.z.from_sub( pB, pA ).len_sqr();
			this.len		= Math.sqrt( this.len_sqr );

			this.axis.from_dir( this.axis.z, up_dir );
			return this;
		}

		//get_rot( out ){ return out.from_axis( this.axis.x, this.axis.y, this.axis.z ); }


	/////////////////////////////////////////////////////////////////////
	// STATIC
	/////////////////////////////////////////////////////////////////////
		/** Visually see the Target information */
		static debug( d, t, scl=1.0 ){ 
			Axis.debug( d, t.axis, t.start_pos, scl );
			d.point( t.start_pos, 6 ).point( t.end_pos, 0 );
			return this;
		}


	///////////////////////////////////////////////////////////////////
	// Single Bone Solvers
	///////////////////////////////////////////////////////////////////
		_aim_bone( chain, pose, wt, out ){
			/*
			The idea is to Aim the root bone in the direction of the target. Originally used a lookAt rotation 
			then correcting it to take in account the bone's points up, not forward.

			Instead, Build a rotation based on axis direction. Start by using target's fwd dir as the bone's up dir.
			To Help keep orientation, use the bone's Bind( or TPose ) world space fwd as a starting point to help get
			the left dir. With UP and Left, do another cross product for fwd to keep the axis orthogonal.

			This aims the limb pretty well at the target. The final step is to twist the limb so its joint (elbow, knee)
			is pointing at the UP dir of the target axis. This helps define how much twisting we need to apply to the bone.
			Arm and Knees tend to have different natural pose. The leg's fwd is fwd but the arm's fwd may be point down or back,
			all depends on how the rigging was setup.

			Since he bone is now aligned to the target, it shares the same Direction axis that we can then easily apply a twist
			rotation. The target's UP is final dir, so we take the lumb's aligning axis's world space dire and simply use 
			Quat.rotateTo( v1, v2 ). This function creates a rotation needed to get from One Vector dir to the other.
			*/
			
			let rot		= Quat.mul( wt.rot, pose.get_local_rot( chain.bones[0] ) ),	// Get World Space Rotation for Bone
				f_dir	= Vec3.transform_quat( Vec3.FORWARD, rot ),					// Get Bone's WS Forward Dir
				l_dir	= Vec3.cross( this.axis.z, f_dir ).norm();					// WS Left Dir

			f_dir.from_cross( l_dir, this.axis.z ).norm();							// Realign forward to keep axis orthogonal for proper rotation

			out.from_axis( l_dir, this.axis.z, f_dir );								// Final World Space Rotation
			if( Quat.dot( out, rot ) < 0 ) out.negate();							// If axis is point in the opposite direction of the bind rot, flip the signs : Thx @gszauer

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Need to apply a twist rotation to aim the bending joint 
			// (elbow,knee) in the direction of the IK Target UP Axis.

			let align_dir;
			switch( chain.ik_align_axis ){ // Arm/Legs have different Axis to align to Twisting.
				case "x": align_dir = l_dir; break;
				case "z": align_dir = f_dir; break;
			}

			// Shortest Twisting Direction
			if( Vec3.dot( align_dir, this.axis.y ) < 0 ) align_dir.invert();

			// Create and apply twist rotation.
			rot.from_unit_vecs( align_dir, this.axis.y );
			out.pmul( rot );
			return out;
		}

		aim( chain, bind_pose, pose, wt ){
			let rot = new Quat();
			this._aim_bone( chain, bind_pose, wt, rot );
			//rot.pmul( Quat.invert( wt.rot ) );	
			rot.pmul_invert( wt.rot ); // Convert to Bone's Local Space by mul invert of parent bone rotation
			pose.set_bone( chain.bones[ 0 ], rot );
		}


	///////////////////////////////////////////////////////////////////
	// Multi Bone Solvers
	///////////////////////////////////////////////////////////////////

		limb( chain, bind_pose, pose, wt ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Using law of cos SSS, so need the length of all sides of the triangle
			let bone_a 	= bind_pose.bones[ chain.bones[0] ],
				bone_b	= bind_pose.bones[ chain.bones[1] ],
				aLen	= bone_a.len,
				bLen	= bone_b.len,
				cLen	= Math.sqrt( this.len_sqr ),
				wq 		= new Quat(),
				rot 	= new Quat(),	
				tmp		= new Quat(), // Can probably get rid of this if the new quaternion functions work well.
				rad;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// FIRST BONE - Aim then rotate by the angle.
			this._aim_bone( chain, bind_pose, wt, rot );			// Aim the first bone toward the target oriented with the bend direction.
			
			rad	= Maths.lawcos_sss( aLen, cLen, bLen );					// Get the Angle between First Bone and Target.
			
			rot.pmul_axis_angle( this.axis.x, -rad );				// Use the Target's X axis for rotation along with the angle from SSS
			wq.copy( rot );											// Save a Copy as World Rotation before converting to local space
			rot.pmul_invert( wt.rot );								// Convert to Bone's Local Space by mul invert of parent bone rotation

			pose.set_bone( bone_a.idx, rot );						// Save result to bone.

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// SECOND BONE
			// Need to rotate from Right to Left, So take the angle and subtract it from 180 to rotate from 
			// the other direction. Ex. L->R 70 degrees == R->L 110 degrees
			rad	= Math.PI - Maths.lawcos_sss( aLen, bLen, cLen );
			
			rot .from_mul( wq, bone_b.local.rot )					// Add Bone 2's Local Bind Rotation to Bone 1's new World Rotation.
				.pmul_axis_angle( this.axis.x, rad )				// Rotate it by the target's x-axis
				.pmul_invert( wq );									// Convert to Bone's Local Space

			pose.set_bone( bone_b.idx, rot );	
		}

		three_bone( chain, bind_pose, pose, wt ){
			//------------------------------------
			// Get the length of the bones, the calculate the ratio length for the bones based on the chain length
			// The 3 bones when placed in a zig-zag pattern creates a Parallelogram shape. We can break the shape down into two triangles
			// By using the ratio of the Target length divided between the 2 triangles, then using the first bone + half of the second bound
			// to solve for the top 2 joiints, then uing the half of the second bone + 3rd bone to solve for the bottom joint.
			// If all bones are equal length,  then we only need to use half of the target length and only test one triangle and use that for
			// both triangles, but if bones are uneven, then we need to solve an angle for each triangle which this function does.	

			//------------------------------------
			let bone_a 	= bind_pose.bones[ chain.bones[0] ],	// Bone Reference
				bone_b	= bind_pose.bones[ chain.bones[1] ],
				bone_c	= bind_pose.bones[ chain.bones[2] ],

				a_len	= bone_a.len,							// First Bone length
				b_len 	= bone_b.len,							// Second Bone Length
				c_len	= bone_c.len,							// Third Bone Length
				bh_len 	= bone_b.len * 0.5,				// How Much of Bone 2 to use with Bone 1

				t_ratio	= ( a_len + bh_len ) / ( a_len + b_len + c_len ),
				ta_len = this.len * t_ratio,
				tb_len = this.len - ta_len,

				rot 	= new Quat(),
				tmp 	= new Quat(),
				wq		= new Quat(),
				rad;
				
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Bone A 
			this._aim_bone( chain, bind_pose, wt, rot );	// Aim the first bone toward the target oriented with the bend direction.

			rad	= Maths.lawcos_sss( a_len, ta_len, bh_len );		// Get the Angle between First Bone and Target.
			rot.pmul_axis_angle( this.axis.x, -rad );		// Rotate the the aimed bone by the angle from SSS
			wq.copy( rot );									// Save a Copy as World Rotation for later use

			rot.pmul_invert( wt.rot );						// Convert to Bone's Local Space by mul invert of parent bone rotation
			pose.set_bone( bone_a.idx, rot );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Bone B
			rad = Math.PI - Maths.lawcos_sss( a_len, bh_len, ta_len );

			rot .from_mul( wq, bone_b.local.rot )		// Add Bone Local to get its WS rot
				.pmul_axis_angle( this.axis.x, rad );	// Rotate it by the target's x-axis .pmul( tmp.from_axis_angle( this.axis.x, rad ) )

			tmp.from_invert( wq ).mul( rot );			// Convert to Local Space in temp to save WS rot for next bone.
			pose.set_bone( bone_b.idx, tmp );

			wq.copy( rot );								// Save to invert for next bone

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Bone C
			rad = Math.PI - Maths.lawcos_sss( c_len, bh_len, tb_len );
			rot	.mul( bone_c.local.rot )				// Still contains WS from previous bone, Add next bone's local
				.pmul_axis_angle( this.axis.x, -rad )	// Rotate it by the target's x-axis
				.pmul_invert( wq );						// Convert to Bone's Local Space

			pose.set_bone( bone_c.idx, rot );
		}

		three_bone_adv( chain, bind_pose, pose, wt ){
			let bone_ratio	= 0.8;
			let t_ratio		= null; //0.4;

			let bone_a 	= bind_pose.bones[ chain.bones[0] ],	// Bone Reference
				bone_b	= bind_pose.bones[ chain.bones[1] ],
				bone_c	= bind_pose.bones[ chain.bones[2] ],
				a_len	= bone_a.len,							// First Bone length
				b_len 	= bone_b.len,							// Second Bone Length
				c_len	= bone_c.len,							// Third Bone Length
				ba_len 	= bone_b.len * bone_ratio,				// How Much of Bone 2 to use with Bone 1
				bc_len	= bone_b.len - ba_len,					// How Much of Bone 2 to use with Bone 3
				//wt_a	= new Transform( wt ),
				wtran	= new Transform( wt ),
				//wt_c	= new Transform(),
				rot 	= new Quat(),
				rad;

			// OPTIIZE, Can probably do everything with one transform object, get rid of 2 but need to store the
			// initial wrot of bone A so tht it can be rotated later.

			// How much of target length to use for the first 2 bones. For the 2nd and 3rd bone we can use 1-ratio.
			// We Take the full length of the first bone and only half of the second bone over total chain length
			t_ratio = t_ratio || ( a_len + ba_len ) / ( a_len + b_len + c_len );

			let ta_len = this.len * t_ratio,
				tb_len = this.len - ta_len;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Bone A - Just align it in the correct direction and orientation for now.

			this._aim_bone( chain, bind_pose, wt, rot );			// Aim the first bone toward the target oriented with the bend direction.
			
			rad	= Maths.lawcos_sss( a_len, ta_len, ba_len );		// Get the Angle between First Bone and Target.
			rot.pmul_axis_angle( this.axis.x, -rad )				// Rotate the the aimed bone by the angle from SSS
				.pmul_invert( wtran.rot );

			pose.set_bone( bone_a.idx, rot );
			wtran.add( rot, bone_a.local.pos, bone_a.local.scl );	// New Model Space of First Bone

			let ba_rot = wtran.rot.clone();
			App.debug.point( wtran.pos, 6 );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Bone B
			rad = Math.PI - Maths.lawcos_sss( a_len, ba_len, ta_len );

			rot .from_mul( wtran.rot, bone_b.local.rot )	// Add to previous bone
				.pmul_axis_angle( this.axis.x, rad )		// Rotate it by the target's x-axis .pmul( tmp.from_axis_angle( this.axis.x, rad ) )
				.pmul_invert( wtran.rot );					// To Local Space
			
			pose.set_bone( bone_b.idx, rot );

			wtran.add( rot, bone_b.local.pos, bone_b.local.scl ); // Model Space of Bone B.
			App.debug.point( wtran.pos, 8 );


			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Bone C

			let v_bone_len	= new Vec3( 0, bone_c.len, 0 );
			let epos 		= new Vec3( );
			let to_local	= Quat.invert( wtran.rot );

			let xtran = new Transform( wtran );

			xtran
				.add( bone_c.local )
				.transform_vec( v_bone_len, epos );

			App.debug.point( xtran.pos, 2 );
			App.debug.point( epos, 7 );


			let dir_a = Vec3.sub( this.end_pos, xtran.pos ),
				dir_b = Vec3.sub( epos, xtran.pos );


			rad = Vec3.angle( dir_a, dir_b );

			rot.copy( xtran.rot )
				.pmul_axis_angle( this.axis.x, -rad )
				.pmul( to_local );

			wtran
				.add( rot, bone_c.local.pos, bone_c.local.scl )
				.transform_vec( v_bone_len, epos ); 
			App.debug.point( epos, 7 );

			//wtran.add( rot, new Vec3( 0, bone_c.len, 0 ) );

			//App.debug.point( wtran.pos, 7 );

			pose.set_bone( bone_c.idx, rot );

			
			dir_a.from_sub( epos, this.start_pos );
			rad = Vec3.angle( dir_a, this.axis.z );

			console.log( rad, rad * 180 / Math.PI );
			const align_rad_min = 5 * Math.PI / 180;
			
			if( rad >= align_rad_min ){	
				console.log("fix align");
				ba_rot
					.pmul_axis_angle( this.axis.x, -rad )
					.pmul_invert( wt.rot );

				pose.set_bone( bone_a.idx, ba_rot );
			}


			/*
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Bone C
			rad = Math.PI - Maths.lawcos_sss( c_len, bc_len, tb_len );
			rot	.from_mul( wt_b.rot, bone_c.local.rot )
				.pmul_axis_angle( this.axis.x, -rad )
				.pmul_invert( wt_b.rot );

			pose.set_bone( bone_c.idx, rot );

			wt_c
				.copy( wt_b )
				.add( rot, bone_c.local.pos, bone_c.local.scl );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Align Bone A
			let epos = new Vec3( 0, bone_c.len, 0 );
			wt_c.transform_vec( epos );

			App.debug.point( wt_c.pos, 8 );
			App.debug.point( epos, 2 );

			epos.from_sub( epos, this.start_pos );
			rad = Vec3.angle( epos, this.axis.z );

			wt_a.rot
				.pmul_axis_angle( this.axis.x, -rad )
				.pmul_invert( wt.rot );

			//pose.set_bone( bone_a.idx, wt_a.rot );

			*/
		}
}

//##################################################################################

export default IKTarget;