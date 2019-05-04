import App, { Entity, Components, System } from "../fungi/engine/App.js";
import Vec3 from "../fungi/maths/Vec3.js";
import Transform from "../fungi/maths/Transform.js";

import TranslateGizmo from "./TranslateGizmo.js";
import Collider from "../fungi.physics/Collider.js";



//##############################################################################################
class Gizmo{
	static $( e ){
		if( !e.Gizmo ) Entity.com_fromName( e, "Gizmo" );
		return e;
	}

	constructor(){
		this.target	= null;
		this.state 	= null;
	}

	static cameraAdjust( e ){
		const MIN_ADJUST = -0.2;

		let vEye	= Vec3.sub( App.camera.Node.local.pos, e.Node.local.pos ),
			eyeLen 	= vEye.length(),
			scl 	= e.Node.local.scl;

		vEye.normalize();
		scl.set( 1, 1, 1 ).scale( eyeLen / GizmoSystem.CameraScale );

		if( vEye.dot( Vec3.LEFT ) < MIN_ADJUST )	scl.x *= -1;
		if( vEye.dot( Vec3.FORWARD ) < MIN_ADJUST )	scl.z *= -1;
		if( vEye.dot( Vec3.UP ) < MIN_ADJUST )		scl.y *= -1;
		
		e.Node.isModified = true;
	}
} Components( Gizmo );



//##############################################################################################
class GizmoSystem extends System{
	static init( ecs, priority = 51 ){
		let sys = new GizmoSystem();
		ecs.sys_add( sys, priority );
		return sys;
	}

	constructor(){ 
		super();

		this.gizmos = {
			translate: TranslateGizmo.init(),
		};

		this.onRayBind		= this.onRay.bind( this );
		this.initial 		= new Transform();
		this.selectedItem	= null;
		this.useSnap		= false;
	}

	//////////////////////////////////////////////////////////
	//
	//////////////////////////////////////////////////////////
		onRay( r, e ){
			if( TranslateGizmo.isHit( e, r ) ){
				console.log("HIT !!");
				this.selectedItem = e;
				this.initial.copy( e.Node.local );
				return true;
			}
			return false;
		}

	//////////////////////////////////////////////////////////
	//
	//////////////////////////////////////////////////////////
		run( ecs ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Handle Selected Gizmo
			if( this.selectedItem ){
				if( App.input.isMouseActive ){
					// TODO : Need to change this when there is more then one Gizmo
					TranslateGizmo.handleMouse( this.selectedItem, App.input.coord.x, App.input.coord.y, this.initial, this.useSnap );
					return;
				}else this.selectedItem	= null;
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Update Camera Scale on Gizmos
			if( App.camera.Node.isModified ){
				let c, list = ecs.query_comp( "Gizmo" );

				for( c of list ) Gizmo.cameraAdjust( ecs.entities[ c.entityID ] );
			}
		}

	//////////////////////////////////////////////////////////
	//
	//////////////////////////////////////////////////////////
		entity( gType="translate" ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			if( !this.gizmos[ gType ] ){
				console.error( "Gizmo type not known", gType );
				return null;
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// TODO - FIX Material, Maybe create a new one for Gizmo
			let gt	= this.gizmos[ gType ],
				mat	= App.cache.getMaterial("VecWColor"),
				e	= Collider.$( Gizmo.$( App.$Draw( "gizmo_" + gType ) ) );

			mat.options.cullFace = false;
			e.Collider.type = gt.getCollider();

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			e.Gizmo.state = new gt();
			for( let i of gt.drawItems ){
				e.Draw.add( i.vao, mat, i.drawMode );
			}

			return e;
		}
}

GizmoSystem.CameraScale = 8;


//##############################################################################################
export default Gizmo;
export { GizmoSystem };