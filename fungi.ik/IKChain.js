import Transform 	from "../fungi/maths/Transform.js";
import Vec3			from "../fungi/maths/Vec3.js";
import Armature		from "../fungi.armature/Armature.js";


//#####################################################################
class IKChain{
	constructor( arm, bNames ){
		this.arm	= arm;			// Reference to Armature Object
		this.idx	= new Array();	// List of Index values to the armature Bones that make up a chain
		this.lens 	= new Array();	// Cache Bone Lengths to make things easier for IK.
		this.cnt	= 0;			// How many Bones in the chain
		this.len 	= 0;			// Chain Length
		this.lenStr	= 0;			// Chain Length Squared, Cached for Checks without SQRT
		
		this.world			= new Transform();	// Starting World Transform, Parent Bone or Entity Model
		this.transform		= new Transform();	// Chain's Root World Transform

		this.targetPos		= new Vec3();
		this.targetDir		= new Vec3();
		this.targetLenStr	= 0;
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Get The Bone Indices and
		let e, n;
		for( n of bNames ){
			e = Armature.getBone( arm, n );
			if( !e ){ console.error("Bone not found: ", n ); return; }

			this.len += e.Bone.length;
			this.idx.push( e.Bone.order );
			this.lens.push( e.Bone.length );
		}

		this.lenStr	= this.len * this.len;
		this.cnt	= this.idx.length;
	}

	/////////////////////////////////////////////////////////////////////
	// SET IK TARGET
	/////////////////////////////////////////////////////////////////////
		targetPoint( pos, tran=null ){
			this.targetPos.copy( pos );										// Copy Position

			if( tran )	this.world.copy( tran );							// Starting Transform
			else		this.world.clear();

			Transform.add(	this.world,										// Add Trasform and Bone Local to get World position
							this.getBone( 0 ).Node.local,
							this.transform );

			Vec3.sub( this.targetPos, this.transform.pos, this.targetDir );	// Get Direction
			this.targetLenStr = this.targetDir.lengthSqr();					// Get Distance to Target from the root of the chain.

			if( this.targetLenStr >= this.lenStr ) return false;			// Check if target is within the range of the chain.

			this.targetDir.normalize();										// Make direction a unit vector
			return true;
		}

	/////////////////////////////////////////////////////////////////////
	// GETTERS
	/////////////////////////////////////////////////////////////////////
		getBone( i ){ return this.arm.bones[ this.idx[ i ] ]; }

		getTipTransformByPose( pose, out=null ){
			out = out || new Transform();
			out.copy( this.world );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Build Up Transform
			let i;
			for( i of this.idx ){
				out.add( pose.bones[ i ].local );
				//App.debug.point( out.pos, 2 );
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Bones have length, so need to calculate the end Tip
			i = this.idx[ this.cnt-1 ];
			let bLen = this.arm.bones[ i ].Bone.length;

			out.add( pose.bones[ i ].local.rot, [ 0, bLen, 0 ], pose.bones[ i ].local.scl );
			//App.debug.point( out.pos, 6 );

			return out;
		}

		getPositionsByPose( pose ){
			let t	= new Transform(),
				out	= new Array(),
				i;

			for( i of this.idx ){
				t.add( pose.bones[ i ].local );
				out.push( new Vec3( t.pos ) );
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Bones have length, so need to calculate the end Tip
			i = this.idx[ this.cnt-1 ];
			let bLen = this.arm.bones[ i ].Bone.length;
			t.add( pose.bones[ i ].local.rot, [ 0, bLen, 0 ], pose.bones[ i ].local.scl );

			out.push( new Vec3( t.pos ) );
			return out;
		}

	/////////////////////////////////////////////////////////////////////
	// METHODS
	/////////////////////////////////////////////////////////////////////
		resetPose( pose, ia, ib=null ){
			if( ib == null ) ib = this.cnt-1;

			let i, ary = this.arm.bones;
			for( ia; ia <= ib; ia++ ){
				i = this.idx[ ia ];
				pose.updateBone( i, ary[ i ].Bone.initial.rot );
			}

			return this;
		}
}


//#####################################################################
export default IKChain;