import App			from "../fungi/engine/App.js";
import Vao, { Buf }	from "../fungi/core/Vao2.js";

//##############################################################################
class FungiMesh{
	/////////////////////////////////////////////////////////////////
	// Main Loading Functions
	/////////////////////////////////////////////////////////////////
		static $(){} // Just Mesh
		static $skin(){} // Mesh with arm
		
		static $preview( e_name, txt ){ // Armature Preview Only
			let e = App.$Draw( e_name );
			
			this.load_bones( e, txt );
			App.global.ArmaturePreview.$( e, "ArmaturePreview", 2 );

			e.Armature.isActive = false; // Disable Arm Rendering
			return e;
		} 
		
		// Mesh with Armature Preview
		static $debug( e_name, mat, txt, bin ){
			let e = App.$Draw( e_name );
			this.build_vao( e, mat, txt, bin );
			this.load_bones( e, txt );
			App.global.ArmaturePreview.$( e, "ArmaturePreview", 2 );
			return e;
		} 

	/////////////////////////////////////////////////////////////////
	// Helper Functions
	/////////////////////////////////////////////////////////////////
		static parse_section( sec, txt ){
			let aPos = txt.indexOf( "<" + sec + ">" ) + sec.length + 2,
				bPos = txt.indexOf( "</" + sec + ">" );

			if( aPos == -1 || bPos == -1 || bPos <= aPos ) return null;

			let tmp	= txt.substring( aPos, bPos );

			try{ return JSON.parse( tmp ); }
			catch(err){ console.error( err.message, "\n" , tmp ); }

			return null;
		}

		static load_bones( e, txt ){
			App.global.Armature.$( e );

			let json	= this.parse_section( "Armature", txt ),
				bLen	= json.length,
				arm		= e.Armature,
				i, b, ab;

			for( i=0; i < bLen; i++ ){
				b	= json[i];
				//ab 	= Armature.addBone( arm, b.name, b.len, null, b.idx );
				ab 	= arm.add_bone( b.name, b.len, null, b.idx );

				// Can not have levels updated automaticly, Callstack limits get hit
				// Instead, using the Level from bones to manually set it.
				//if( b.p_idx != null ) App.node.addChild( arm.bones[ b.p_idx ], ab, false );
				if( b.p_idx != null ) arm.bones[ b.p_idx ].Node.add_child( ab, false );

				// Manual set node level, Must do it after addChild, else it will get overwritten.
				ab.Node.level = b.lvl; 

				if( b.rot ) ab.Node.setRot( b.rot );
				if( b.pos ) ab.Node.setPos( b.pos );
				if( b.scl ) ab.Node.setScl( b.scl );
			}

			App.global.Armature.finalize( e );	//This updates World Transform
		}

		static build_vao( e, mat, txt, bin ){
			let dv		= ( bin instanceof ArrayBuffer )? new DataView( bin ) : bin,
				json	= this.parse_section( "Vao", txt ),
				i, d, itm, vao, elm_cnt;

			for( i in json ){
				itm 	= json[ i ];
				vao		= new Vao().bind();
				elm_cnt = null;

				//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
				if( (d=itm.indices) ){
					vao.add_indices_bin( dv, d.byteStart, d.byteLen, true );
					elm_cnt = d.elmCount;
				}

				if( (d=itm.weights) )	vao.add_weights_bin( dv, d.byteStart, d.byteLen );
				if( (d=itm.joints) )	vao.add_bones_bin( bin, d.byteStart, d.elmCount, d.compLen );

				//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
				d = itm.vertices;
				vao	.add_vertices_bin( dv, d.byteStart, d.byteLen, true )
					.set( elm_cnt | d.elmCount );

				//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
				e.Draw.add( vao, mat );
			}

			return e;
		}
}

//##############################################################################
export default FungiMesh;