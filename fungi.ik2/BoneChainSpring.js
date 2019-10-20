import Maths, { Vec3, Quat }	from "../fungi/maths/Maths.js";
import Transform				from "../fungi/maths/Transform.js";
import Vec3Spring				from "../fungi/data/Vec3Spring.js";

class BoneChainSpring{
	constructor( chain ){
		this.nodes = new Array( chain.cnt );

		let i;
		for( i=0; i < chain.cnt; i++ ){
			this.nodes[ i ] = {
				idx		: chain.bones[ i ],
				spring	: new Vec3Spring(),
			};
		}
	}

	/////////////////////////////////////////////////////////////////////
	// GETTERS - SETTERS
	/////////////////////////////////////////////////////////////////////	
		use_euler( damp=0.5, damp_inc=0.1, osc=1, osc_inc=0.2 ){
			let i;
			for( i=0; i < this.nodes.length; i++ ){
				this.nodes[ i ].spring.use_euler(  osc + osc_inc*i, damp + damp_inc * i );
			}
			return this;
		}

		set_pos( pose ){
			let i, b, pos = new Vec3();
			for( i of this.nodes ){
				b = pose.bones[ i.idx ];
				pos.set( 0, b.len, 0 );

				b.world.transform_vec( pos );
				i.spring.set_pos( pos );  // save trail position.

				//App.debug.point( pos,1 );
			}
			return this;
		}

	/////////////////////////////////////////////////////////////////////
	//
	/////////////////////////////////////////////////////////////////////	
		update( bind, pose, dt ){
			let pt			= new Transform(),
				ct			= new Transform(),
				tail_pos	= new Vec3(),
				ray_a		= new Vec3(),
				ray_b		= new Vec3(),
				rot			= new Quat(),
				bone, i, s_pos;

			// Set the Starting Parent World Transform
			bone = pose.bones[ this.nodes[0].idx ];
			pt.copy( pose.bones[ bone.p_idx ].world );

			for( i of this.nodes ){
				bone = bind.bones[ i.idx ];		// Get Bone

				ct.from_add( pt, bone.local );	// Calc is World Space Transform
				
				tail_pos.set( 0, bone.len, 0 );	// Calc the Bone Tail BIND World Transform, this is our target point
				ct.transform_vec( tail_pos );

				// Pass updated target to spring and update
				s_pos = i.spring.set_target( tail_pos ).update( dt );
				

				ray_a.from_sub( tail_pos, ct.pos ).norm();		// Create Ray to spring position
				ray_b.from_sub( s_pos, ct.pos ).norm();			// And to Target

				rot .from_unit_vecs( ray_a, ray_b )				// Create Rotation based on Rays
					.mul( ct.rot )								// Apply it to WS Bind Transfrom
					.pmul_invert( pt.rot );						// Convert it to local Space

				pose.set_bone( bone.idx, rot );					// Save Results
				pt.add( rot, bone.local.pos, bone.local.scl );	// Use new rotation to build the next parent ws transform for next bone
			}

			pose.apply();
		}
}

export default BoneChainSpring;