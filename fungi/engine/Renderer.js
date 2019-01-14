import gl		from "../core/gl.js";
import App		from "./App.js";

class Renderer{
	constructor(){
		//Render Objects
		this.frameBuffer 	= null;
		this.material		= null;
		this.shader			= null;
		this.vao			= null;

		//UBOs for Updating
		this.UBOModel	= App.cache.getUBO("UBOModel");
		this.UBOGlobal	= App.cache.getUBO("UBOGlobal");

		//GL Option states
		this.options	= {
			blend 					: { state : false,	id : gl.ctx.BLEND },
			sampleAlphaCoverage 	: { state : false,	id : gl.ctx.SAMPLE_ALPHA_TO_COVERAGE },
			depthTest				: { state : true,	id : gl.ctx.DEPTH_TEST },
			depthMask				: { state : true },
			cullFace				: { state : true,	id : gl.ctx.CULL_FACE },
			cullDir					: { state : gl.ctx.BACK },
			blendMode				: { state : gl.BLEND_ALPHA },
		}		
	}

	////////////////////////////////////////////////////////////////////
	// 
	////////////////////////////////////////////////////////////////////

		beginFrame(){
			console.log( "renderer.beginFrame ");
			gl.clear();

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Update Main UBO
			this.UBOGlobal
				.setItem("projViewMatrix",	App.camera.Camera.pvMatrix )
				.setItem("cameraPos",		App.camera.Node.world.pos )
				.setItem("globalTime",		App.sinceStart )
				.update();
		}


		loadShader( s ){
			if( this.shader !== s ){
				this.shader = s;
				gl.ctx.useProgram( s.program );
			}
			return this;
		}

		//Load Material and its shader
		loadMaterial( mat ){
			//...............................
			//If material is the same, exit.
			if( this.material === mat ) return;
			this.material = mat;

			//...............................
			//Is the shader for the material different
			this.loadShader( mat.shader );

			//...............................
			mat.apply();			//Push any saved uniform values to shader.
			this.loadOptions( mat.options );	//Enabled/Disable GL Options

			return this;
		}

		loadOptions( aryOption ){
			var k, v;
			for( k in aryOption ){
				v = aryOption[k];

				if(this.options[k] && this.options[k].state != v){
					this.options[k].state = v;

					switch(k){
						case "blendMode":	gl.blendMode( v ); break;
						case "depthMask":	gl.ctx.depthMask( v ); break;
						case "cullDir":		gl.ctx.cullFace( v ); break;
						default:
							gl.ctx[ (this.options[k].state)? "enable" : "disable" ]( this.options[k].id );
						break;
					}
					
				}
			}

			return this;
		}

}

export default Renderer;