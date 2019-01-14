import { Components, System }	from "../Ecs.js";
import Renderer from "../Renderer.js";

//#########################################################################
class Draw{
	constructor(){ 
		this.items	= [];
		this.onDraw	= null;
	}
	add( vao, material=null, mode=4 ){ // 4 == gl.TRIANGLE
		this.items.push( { vao, material, mode, options:{ cullFace:true } } );
		return this;
	}
} Components( Draw );


//#########################################################################
const QUERY_COM = [ "Node", "Draw" ];

class DrawSystem extends System{
	static init( ecs, priority = 950 ){ 
		ecs.addSystem( new DrawSystem(), priority );
	}

	constructor(){ 
		super();
		this.render = new Renderer();
	}

	update( ecs ){
		let i, e, d, ary = ecs.queryEntities( QUERY_COM );
		this.render.beginFrame();

		for( e of ary ){
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			if( !e.info.active ) continue;
			if( e.Draw.items.length == 0 ) continue;
			
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			d = e.Draw;
			if( !d.onDraw ){

				for( i of d.items ){
					if( i.vao.elmCount == 0 ) continue;
					console.log( i );
				}

			}else d.onDraw( this, e );
		}

		//............................................
		//Update Main UBO
		/*
		this.UBOTransform
			.updateItem("projViewMatrix",	Camera.getProjectionViewMatrix( Fungi.camera.com.Camera ) )
			.updateItem("cameraPos",		Fungi.camera.com.Transform.position )
			.updateItem("globalTime",		Fungi.sinceStart )
			.updateGL();
		*/

		//............................................
		//let d, e, ary = ecs.queryEntities( QUERY_COM );
		//gl.clear();	//Clear Frame Buffer

		//Draw all active Entities
		/*
		for( e of ary ){
			//......................................
			if(!e.active) continue;
			d = e.com.Drawable;

			//......................................			
			if(! d.draw){ //Use standard drawing

				// Check if there is anything to render
				if(!d.vao || d.vao.elmCount == 0) continue; //console.log("VAO has no index/vertices or null : ", e.name);

				//Load and Draw
				this.loadMaterial( d.material );
				this.loadEntity( e );
				this.draw( d );
			
			}else d.draw( this, e, d ); //Component has custom drawing instructions
		*/
	}
}


//#########################################################################
export default Draw;
export { DrawSystem };