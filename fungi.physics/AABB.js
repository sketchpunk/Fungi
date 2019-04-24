import { Vec3 }		from "../fungi/maths/Maths.js";
import Transform	from "../fungi/maths/Transform.js";

//############################################################################
class AABB{
	constructor(){
		this.name = "AABB";

		this.localBounds = [ new Vec3(), new Vec3() ]; // Local Space Bound Positions
		this.worldBounds = [ new Vec3(), new Vec3() ]; // World Space Bound Position with target position added to local
		this.target = null;

		if(arguments.length == 1){			// Passing in Target
			this.setTarget(arguments[0]);
		}else if(arguments.length == 2){	// Passing in two Vec3 / arrays
			this.localBounds[0].copy( arguments[0] );
			this.localBounds[1].copy( arguments[1] );
			this.worldBounds[0].copy( arguments[0] );
			this.worldBounds[1].copy( arguments[1] );
		}else if(arguments.length == 6){	// Passing in raw values for bounds.
			this.localBounds[0].set( arguments[0], arguments[1], arguments[2] );
			this.localBounds[1].set( arguments[3], arguments[4], arguments[5] );
			this.worldBounds[0].set( arguments[0], arguments[1], arguments[2] );
			this.worldBounds[1].set( arguments[3], arguments[4], arguments[5] );
		}
	}

	setTarget( t ){
		this.target = t;
		if(t.bounds != undefined){
			this.localBounds[0].copy( t.bounds[0] );
			this.localBounds[1].copy( t.bounds[1] );
		}
		return this;
	}

	setWorldPos( p ){
		this.localBounds[0].add( p, this.worldBounds[0] );
		this.localBounds[1].add( p, this.worldBounds[1] );
		return this;
	}

	setWorldTransform( wt ){
		wt.transformVec( this.localBounds[0], this.worldBounds[0] );
		wt.transformVec( this.localBounds[1], this.worldBounds[1] );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Scaling in the negative direction screws up the min -> max bounds.
		// Check each axis and if the scale is negative, flip the values
		let tmp, i = 0;
		for( i=0; i < 3; i++ ){
			if( wt.scl[i] < 0 ){
				tmp = this.worldBounds[1][i];
				this.worldBounds[1][i] = this.worldBounds[0][i];
				this.worldBounds[0][i] = tmp;
			}
		}

		return this;	
	}

	//TODO this won't work well with child renderables. May need to pull translation from worldMatrix.
	update(){
		this.setWorldPos( this.target.Node.local.pos );
		return this;
	}
}


//############################################################################
export default AABB;