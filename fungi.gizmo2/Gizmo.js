import App, { Entity, Components, System, Material } from "../fungi/engine/App.js";
import Vec3 			from "../fungi/maths/Vec3.js";
import Transform 		from "../fungi/maths/Transform.js";

import TranslateGizmo 	from "./TranslateGizmo.js";

//import Collider from "../fungi.physics/Collider.js";



//##############################################################################################
class Gizmo{
	static $( e=null, type="translate" ){
		if( !e ){
			e = App.$Draw( "Gizmo_" + type );
			Entity.com_fromName( e, "Gizmo" );
		} else if( !e.Gizmo ){
			Entity.com_fromName( e, "Gizmo" );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let gt	= this.Types[ type ];
		e.Gizmo.state = new gt();
		
		for( let i of gt.draw_items ){
			e.Draw.add( i.vao, Gizmo.Material, i.draw_mode );
		}

		e.Gizmo.entity	= e;
		e.Gizmo.type	= type;
		return e;
	}

	static setup_task( t_config=3 ){
		return async()=>{
			TranslateGizmo.DrawConfig = t_config;

			Gizmo.Sys	= GizmoSystem.init( App.ecs );
			Gizmo.Types	= {
				translate	: TranslateGizmo.init(),
			};

			let mat = new Material( "Fungi_Gizmo", "VecWColor" );
			mat.options.cullFace = false;
			mat.add_uniform( "u_colorAry", ["ff0000","00dd00","0000ff","555555"] );
			Gizmo.Material = mat;

			console.log("Gizmo Loaded.");
			return true;
		};
	}

	constructor(){
		this.entity = null;
		this.state 	= null;
		this.type	= null;
		this.target	= null;
	}

	is_ray_hit( ray ){ return Gizmo.Types[ this.type ].is_ray_hit( this.entity, ray ); }
	handle_mouse( ix, iy, tran, snap ){ return Gizmo.Types[ this.type ].handle_mouse( this.entity, ix, iy, tran, snap ); }
} Components( Gizmo );

Gizmo.Types		= {};
Gizmo.Sys		= null;
Gizmo.Material	= null;


//##############################################################################################

class GizmoSystem extends System{
	static init( ecs, priority = 51 ){
		let sys = new GizmoSystem();
		ecs.sys_add( sys, priority );
		return sys;
	}

	constructor(){ 
		super();
		this.initial 		= new Transform();
		this.selected_item	= null;
		this.use_snap		= false;
	}

	set_selected( e ){
		this.selected_item = e;
		this.initial.copy( e.Node.local );
		return this;
	}

	//////////////////////////////////////////////////////////
	//
	//////////////////////////////////////////////////////////
	camera_adjust( e ){
		let vEye	= Vec3.sub( App.camera.Node.local.pos, e.Node.local.pos ),
			eyeLen 	= vEye.length(),
			scl 	= e.Node.local.scl;

		vEye.norm();
		scl.set( 1, 1, 1 ).scale( eyeLen / GizmoSystem.CameraScale );

		if( vEye.dot( Vec3.LEFT )		< GizmoSystem.MinAdjust )	scl.x *= -1;
		if( vEye.dot( Vec3.FORWARD )	< GizmoSystem.MinAdjust )	scl.z *= -1;
		if( vEye.dot( Vec3.UP )			< GizmoSystem.MinAdjust )	scl.y *= -1;
		
		e.Node.isModified = true;
	}

	//////////////////////////////////////////////////////////
	//
	//////////////////////////////////////////////////////////
		run( ecs ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Handle Selected Gizmo
			if( this.selected_item ){
				if( App.input.isMouseActive ){
					this.selected_item.Gizmo.handle_mouse( App.input.coord.x, App.input.coord.y, this.initial, this.use_snap );
					return;
				}else this.selected_item = null;
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Update Camera Scale on Gizmos
			if( App.camera.Node.isModified ){
				let c, list = ecs.query_comp( "Gizmo" );
				if( list ) for( c of list ) this.camera_adjust( ecs.entities[ c.entityID ] );
			}
		}
}

GizmoSystem.CameraScale	= 8;
GizmoSystem.MinAdjust	= -0.2;


//##############################################################################################
export default Gizmo;
//export { GizmoSystem };