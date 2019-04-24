import App, { gl } from "../fungi/engine/App.js";

import Ray from "./Ray.js";


//############################################################################
class RayIntersectSystem{
	static init( ecs, priority = 50, cb = null ){
		let sys = new RayIntersectSystem( cb );
		ecs.addSystem( sys, priority );
		return sys;
	}

	constructor( cb=null ){
		this.queue		= new Array();
		this.callback	= cb;
		gl.ctx.canvas.addEventListener( "mousedown", this.onRightClick.bind( this ) );
	}

	update( ecs ){
		if( this.queue.length == 0 ) return;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let ray, c, e, isHit, list = ecs.queryEntities( ["Collider"] );
		let queue = this.queue.splice( 0, this.queue.length );

		// TODO, Better to get distance from Ray Origin, then sort by distance.
		// So the first complete hit test ends that ray.

		for( e of list ){
			c = e.Collider;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Do any Prep
			switch( c.type.name ){
				case "AABB": c.type.setWorldTransform( e.Node.local ); break;
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Execute all Cached Rays
			for( ray of queue ){
				isHit = false;

				switch( c.type.name ){
					case "AABB": isHit = Ray.inAABB( ray, c.type ); break;
				}

				if( isHit ){
					console.log( "Hit on", e.info.name );
					if( this.callback ) this.callback( ray, e );
				}
			}

		}
	}

	onRightClick( e ){
		if( e.button != 2 ) return;
		e.preventDefault(); e.stopPropagation();

		let pos = App.input.toCoord( e );
		//console.log("RightClick");
		this.queue.push( Ray.MouseSegment( pos[0], pos[1], null, true ) );
	}
}


//############################################################################
export default RayIntersectSystem;