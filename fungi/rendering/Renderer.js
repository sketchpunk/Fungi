import gl		from "../gl.js";
import Shader	from "../Shader.js"


class Renderer{
	constructor(){
		//Render Objects
		this.material	= null;
		this.shader		= null;
		//this.vao		= null;

		//Misc
		this.options	= {
			blend 					: { state : false,	id : gl.ctx.BLEND },
			sampleAlphaCoverage 	: { state : false,	id : gl.ctx.SAMPLE_ALPHA_TO_COVERAGE },
			cullFace				: { state : true,	id : gl.ctx.CULL_FACE },
			depthTest				: { state : true,	id : gl.ctx.DEPTH_TEST }
		}
	}

	//----------------------------------------------
	//region Loading
		//Load up a shader
		loadShader(s){
			if(this.shader === s) return;
			this.shader = s;
			gl.ctx.useProgram(s.program);
			return this;
		}

		//Load Material and its shader
		loadMaterial(mat){
			//...............................
			//If material is the same, exit.
			if(this.material === mat) return;
			this.material = mat;

			//...............................
			//Is the shader for the material different
			if(this.shader !== mat.shader){
				this.shader = mat.shader;
				gl.ctx.useProgram(this.shader.program);
			}

			//...............................
			//Push any saved uniform values to shader.
			mat.applyUniforms();

			//...............................
			//Enabled/Disable GL Options
			var o;
			for(o in mat.options){
				if(this.options[o].state != mat.options[o]){
					this.options[o].state = mat.options[o];
					gl.ctx[ (this.options[o].state)? "enable" : "disable" ]( this.options[o].id );
				}
			}

			//...............................
			return this;
		}
	//endregion

	//----------------------------------------------
	//region Drawing
		//Handle Drawing a Renderable's VAO
		drawRenderable(r){
			//...............................
			//if(this.vao != r.vao){
				//this.vao = r.vao;
				gl.ctx.bindVertexArray(r.vao.id);
			//}

			//...............................
			//if shader require special uniforms from model, apply
			r.updateMatrix();
			if(this.shader.options.modelMatrix)		this.shader.setUniform(Shader.UNIFORM_MODELMAT, r.worldMatrix);
			if(this.shader.options.normalMatrix)	this.shader.setUniform(Shader.UNIFORM_NORMALMAT, r.normalMatrix);

			//Apply GL Options
			var o;
			for(o in r.options){
				if(this.options[o].state != r.options[o]){
					this.options[o].state = r.options[o];
					gl.ctx[ (this.options[o].state)? "enable" : "disable" ]( this.options[o].id );
				}
			}

			//...............................
			if(r.vao.isIndexed)	gl.ctx.drawElements(r.drawMode, r.vao.elmCount, gl.ctx.UNSIGNED_SHORT, 0); 
			else				gl.ctx.drawArrays(r.drawMode, 0, r.vao.elmCount);


			gl.ctx.bindVertexArray(null);
			//...............................
			return this;
		}

		//Handle Drawing a Scene
		drawScene(ary){
			gl.clear();

			var itm;
			for(itm of ary){
				if(!itm.visible || itm.vao.elmCount == 0) continue;

				if(itm.draw){
					console.log("Run Custom Drawing Method");
				}else{
					this.loadMaterial(itm.material);
					this.drawRenderable(itm);
				}
			}
			return this;
		}
	//end region
}


export default Renderer;