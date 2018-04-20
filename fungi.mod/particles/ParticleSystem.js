import gl					from "../../fungi/gl.js";
import Renderable			from "../../fungi/rendering/Renderable.js";
import Shader, { Material }	from "../../fungi/Shader.js";
import ParticleModules		from "./ParticleModules.js";
import TransformFeedback, {FeedbackUseMode}	from "./TransformFeedback.js";

class ParticleSystem extends Renderable{
	constructor(name, pCnt){
		super(name, null, null);
		this.particleCount		= pCnt;
		this.drawMode			= gl.ctx.POINTS;

		this.shaderDraw			= null;						// Shader used to render particles to the screen
		this.shaderFeedback		= null;						// Shader that will calculate values the draw shader needs
		
		this.transFeedback		= new TransformFeedback();

		this.modStack			= [];	//List of Modules currently in use (Maybe call it Modifiers??)

		this._attrCode_Feedback	= "";	//Attribute code for Feedback
		this._varyCode_Feedback	= "";	//Varyings ...
		this._mainCode_Feedback	= "";	//Code for Main Function
		
		this._attrCode_DrawVS	= "";	//Attribute code for Drawing Vertex Shader
		this._varyCode_DrawVS	= "";	//Varyings ...
		this._mainCode_DrawVS	= "";	//Code for the Main Function ...

		this._varyCode_DrawFS	= "";	//Varyings code for Drawing Fragment Shader
		this._mainCode_DrawFS	= "";	//Code for the Main Function ...

		this._locFeedback		= -1;	//Track the current Location for Attributes for Feedback Shader
		this._locDraw			= -1;	//Track the current location for Attribs in Drawing Shader
		this._fbShaderVarList	= [];	//List of OUT varyings needed for transform feedback shader before its linked.
	}

	//----------------------------------------------------------
	//Methods
		//set mesh that will be used as a particle.
		setMesh(aryVert, aryUV=null, aryNorm=null, anyIdx=null){
			//Vertex Position
			this.addDraw("position", "vec3"); //Add Position to Draw Shader, Need to call before creating StructElementChunk
			var vertCount	= aryVert.length / 3,
				vData		= [ aryVert ],
				vInfo		= [ structElementChunk("position", 3, -1, this._locDraw, FeedbackUseMode.Draw) ];		

			//Vertex UV
			if(aryUV != null){
				this.addDraw("uv", "vec2"); //Add UV to Draw Shader
				vData.push( aryUV );
				vInfo.push( structElementChunk("uv", 2, -1, this._locDraw, FeedbackUseMode.Draw) );
			}

			//Vertex Normal
			if(aryNorm != null){
				this.addDraw("norm", "vec3"); //Add Normal to Draw Shader
				vData.push( aryNorm );
				vInfo.push( structElementChunk("uv", 3, -1, this._locDraw, FeedbackUseMode.Draw) );
			}

			//Save data as interleaved data into a gl buffer.
			this.transFeedback.setupVertexBuffer(vertCount, vData, vInfo);
			return this;
		}

		//Overrides Renderable.draw
		draw(renderer){
			//This renderable doesn't use materials, so need to clear out materials from renderer.
			renderer.clearMaterial(); 

			//Prepare to run Feedback
			var info = this.transFeedback.preRender(); 	

			//Do Feedback
			renderer.loadShader(this.shaderFeedback);
			this.transFeedback.runFeedback(info, this.particleCount);

			//Do Draw
			renderer.loadShader(this.shaderDraw).loadRenderable(this);
			this.transFeedback.runRender(info, this.drawMode, this.particleCount);

			//Done Drawing 
			renderer.renderableComplete();
			return this;
		}
	//endregion


	//----------------------------------------------------------
	// Handle Modules Applied and Compiling Particle System
		//Add Module to the stack, these are particle options/settings
		addMod(modName, modParam = null){
			//TODO Look at actuve modes, if it exists, just update the params

			//var mod = ParticleSystem.modules[modName];
			var mod = ParticleModules[modName];
			if( mod === undefined ){ console.log("module not found:",modName); return this; }

			this.modStack.push({ name:modName, mod:mod, params:modParam });
			return this;
		}

		//Get an mod on the stack.
		getMod(modName){
			for(var i=0; i < this.modStack.length; i++){
				if(this.modStack[i].name == modName) return this.modStack[i];
			}
			return null;
		}

		//Run all the modules on the stack, and use the results to build up
		//the transform feedback object and generate the shaders that'll do all the work.
		compile(){
			if(this.modStack.length == 0){ console.log("module stack is empty"); return this; }

			//................................................
			var fbData = new CompileData(),
				itm;

			for(var i=0; i < this.modStack.length; i++){
				itm = this.modStack[i];
				itm.mod.run( this, itm.params, fbData);
			}

			//................................................
			//Use all the data from 
			var vs_fb = vs_feedback_tmpl
				.replace("[[ATTRIBUTES]]"	,this._attrCode_Feedback)
				.replace("[[VARYINGS]]"		,this._varyCode_Feedback)
				.replace("[[MAINCODE]]"		,this._mainCode_Feedback);

			var vs_d = vs_draw_tmpl
				.replace("[[ATTRIBUTES]]"	,this._attrCode_DrawVS)
				.replace("[[VARYINGS]]"		,this._varyCode_DrawVS)
				.replace("[[MAINCODE]]"		,this._mainCode_DrawVS);

			var fs_d = fs_draw_tmpl
				.replace("[[VARYINGS]]"		,this._varyCode_DrawFS)
				.replace("[[MAINCODE]]"		,(this._mainCode_DrawFS != "")? this._mainCode_DrawFS : "FragColor = vec4(0.0,0.0,1.0,1.0);");

			/*
			console.log("FEEDBACK VERTEX SHADER============================\n",
				vs_fb,
				"\nDRAW VERTEX SHADER ===================================\n",
				vs_d,
				"\nDRAW FRAGMENT SHADER ===================================\n",
				fs_d);
			*/
			//................................................
			//Compile shader for transform feedback.

			this.shaderFeedback = new Shader(this.name+"_fb", vs_fb, fs_feedback_tmpl,
				(this._fbShaderVarList.length > 0)? this._fbShaderVarList : null, 
				true //IsInterleaved
			).prepareUniformBlock("UBOTransform");
			
			//................................................
			//Compile and setup shader needed to draw/render to the screen
			this.shaderDraw = new Shader(this.name + "_ps", vs_d, fs_d)
				.setOptions(true, false)
				.prepareUniform(Shader.UNIFORM_MODELMAT, "mat4")
				.prepareUniformBlock("UBOTransform")

			//Fungi render needs a material setup, so set up a basic one tied to the render shader
			//this.material = new Material(null, this.shaderDraw);

			//................................................
			//Pass data to transform feedback to get things ready for rendering
			//console.log(fbData);
			this.transFeedback
				.setupTransformBuffer(this.particleCount, fbData.data, fbData.info)
				.setupFeedback()
				.setupDraw();
		}
	//endregion


	//----------------------------------------------------------
	// Build up code used in the shaders
		//How to handle Attributes set as READ
		addFeedbackRead(name, type, fbMainCode = null, dMainCode = null){
			var fLoc = ++this._locFeedback;

			this._attrCode_Feedback	+= `\n\rlayout(location=${fLoc}) in ${type} a_${name};`;
			if(fbMainCode != null)	this._mainCode_Feedback	+= "\n\r" + fbMainCode;
			if(dMainCode != null)	this._mainCode_DrawVS	+= "\n\r" + dMainCode;
		}

		//How to handle Attributes set as WRITE
		addFeedbackWrite(name, type, fbMainCode = null, dMainCode = null){
			var fLoc = ++this._locFeedback,
				dLoc = ++this._locDraw;

			this._fbShaderVarList.push(`v_${name}`);

			this._attrCode_Feedback	+= `\n\rlayout(location=${fLoc}) in ${type} a_${name};`;
			this._attrCode_DrawVS	+= `\n\rlayout(location=${dLoc}) in ${type} a_${name};`;
			this._varyCode_Feedback	+= `\n\rout ${type} v_${name};`;

			if(fbMainCode != null)	this._mainCode_Feedback	+= "\n\r" + fbMainCode;
			if(dMainCode != null)	this._mainCode_DrawVS	+= "\n\r" + dMainCode;
		}

		//How to handle Attributes set as DRAW
		addDraw(name, type, vsMainCode=null, fsMainCode=null, toFrag=false){
			var dLoc = ++this._locDraw;
			this._attrCode_DrawVS += `\n\rlayout(location=${dLoc}) in ${type} a_${name};`;

			//Does this attribute need to be passed to fragment shader
			if(toFrag){
				this._varyCode_DrawVS += `\n\r out ${type} v_${name};`;
				this._mainCode_DrawVS += `\n\r v_${name} = a_${name};`;
				this._varyCode_DrawFS += `\n\r in ${type} v_${name};`;
			}

			if(vsMainCode != null) this._mainCode_DrawVS += vsMainCode;
			if(fsMainCode != null) this._mainCode_DrawFS += fsMainCode;
		}
	//endregion
}


//##################################################################
// PRIVATE FUNCTIONS AND STRUCTS
	//Helps define how/where each array of data will be used in the feedback.
	
	/*
	var fbData = [ p_curPosition, p_velocity, p_color ];
	var fbInfo = [
		structElementChunk("curPosition", 3, 1, 1, FeedbackUseMode.WriteDraw),
		structElementChunk("velocity", 3, 0, -1, FeedbackUseMode.Read),
		structElementChunk("color", 3, -1, 2, FeedbackUseMode.Draw),
	];
	*/
	function structElementChunk(name=null, compCnt=0, fbLoc=-1, drawLoc=-1, usedIn=0){
		return { 	
			name		: name,
			compCount	: compCnt,
			feedbackLoc	: fbLoc,
			drawLoc		: drawLoc,
			usedIn 		: usedIn,
			offset 		: 0
		};
	}


	//Only way I can think of keeping all the data together as a package that can
	//be passed to all modules and even have the data recalled since some modules will
	//used data from other modules.
	class CompileData{
		constructor(){
			this.info = [];
			this.data = [];
			this.name = [];
		}

		add(name, data, info){
			this.name.push(name);
			this.info.push(info);
			this.data.push(data);
		}

		getData(name){
			for(var i=0; i < this.name.length; i++){
				if(this.name[i] == name) return this.data[i];
			}
			return null;
		}
	}
//endregion


//##################################################################
// SHADER TEMPLATES
	const vs_draw_tmpl = `#version 300 es
		[[ATTRIBUTES]]

		uniform UBOTransform{
			mat4 	projViewMatrix;
			vec3	cameraPos;
			float	globalTime;
			vec2	screenSize;
		};

		uniform mat4 u_modelMatrix;

		[[VARYINGS]]

		void main(void){
			vec3 localPos = a_position;
			
			[[MAINCODE]]

			gl_PointSize = 8.0; //a_size + 2.0;
			gl_Position = projViewMatrix * u_modelMatrix * vec4(localPos, 1.0);
		}`;

	const fs_draw_tmpl = `#version 300 es
		precision mediump float;
		
		[[VARYINGS]]

		out vec4 FragColor;
		void main(void){
			[[MAINCODE]]
		}`;

	const vs_feedback_tmpl = `#version 300 es
		[[ATTRIBUTES]]

		[[VARYINGS]]

		uniform UBOTransform{
			mat4 	projViewMatrix;
			vec3	cameraPos;
			float	globalTime;
			vec2	screenSize;
		};

		void main(void){
			[[MAINCODE]]
		}`;

	const fs_feedback_tmpl = `#version 300 es
		precision mediump float; out vec4 outColor; 
		void main(void){ outColor = vec4(1.0); }`;
//endregion

export default ParticleSystem;
export { structElementChunk };