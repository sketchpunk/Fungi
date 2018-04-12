import gl		from "./gl.js";
import Fungi	from "./Fungi.js";

//------------------------------------------------------
// Loading Functions
//------------------------------------------------------
//Get shader code from an inline script tag, use that to load a shader.
function LoadInlineShader(elmName){ return ParseShader( document.getElementById(elmName).innerText ); }


//Apply Snippets and Break shader file into a data struct that can be used for loading
function ParseShader(shText){
	var dat = { shader:null, materials:null, vertex:null, fragment:null },
		posA, posB, txt, itm;

	//Loop threw the rtn struct to find all the tag elements that should be in the text file
	//THen parse out the text and save it to the object.
	for(itm in dat){
		//...................................
		posA	= shText.indexOf("<" + itm + ">") + itm.length + 2;
		posB	= shText.indexOf("<\\" + itm + ">");
		if(posA == -1 || posB == -1){
			if(itm == "materials") continue;

			console.log("Error parsing shader, missing ", itm);
			return false;
		}

		//...................................
		txt	= shText.substring(posA,posB);
		switch(itm){
			case "shader": case "materials": //These are JSON elements, parse them so they're ready for use.
				try{ dat[itm] = JSON.parse(txt); }
				catch(err){ console.log(err.message); return false; }
			break;
			default: dat[itm] = txt.trim(); break;
		}
	}

	return LoadShader(dat);
}

//Deserialize Downloaded Shader files to create shaders and materials.
function LoadShader(js){
	//===========================================
	//Create Shader
	var shader = new Shader( js.shader.name, js.vertex, js.fragment );

	//Setup Uniforms
	if(js.shader.uniforms && js.shader.uniforms.length > 0){
		shader.prepareUniforms(js.shader.uniforms);
	}

	//Setup Uniform Buffer Objects
	if(js.shader.ubo && js.shader.ubo.length > 0){
		var i;
		for(i=0; i < js.shader.ubo.length; i++)
			shader.prepareUniformBlock( js.shader.ubo[i] );
	}

	//Setup Shader Options
	if(js.shader.options){
		for(var o in js.shader.options) shader.options[o] = js.shader.options[o];

		if(shader.options.modelMatrix)	shader.prepareUniform(Shader.UNIFORM_MODELMAT, "mat4");
		if(shader.options.normalMatrix)	shader.prepareUniform(Shader.UNIFORM_NORMALMAT, "mat3");
	}

	gl.ctx.useProgram(null);


	//===========================================
	//Setup Materials
	if(js.materials && js.materials.length > 0){
		var m, mat, u, val, type;
		for(m of js.materials){
			mat = new Material(m.name, shader);
			if(m.uniforms && m.uniforms.length > 0) mat.addUniforms( m.uniforms );

			//..............................
			//Load Options
			if(m.options){
				for(var o in m.options) mat.options[o] = m.options[o];
			}
		}
	}

	//===========================================
	return shader;
}


//------------------------------------------------------
// Material
//------------------------------------------------------
class Material{
	constructor(name, shader=null){
		//..................................../
		//If the shader is just the name, search resources for it.
		if(shader && typeof shader == "string"){
			var s = Fungi.shaders.get(shader);
			if(!s){ console.log("Can not find shader %s for material %s", shader, name); return; }
			shader = s;
		}

		//....................................
		this.options = {
			blend 					: false,
			sampleAlphaCoverage 	: false,
			depthTest				: true,
		};

		//....................................
		this.name 		= name;
		this.shader 	= shader;
		this.uniforms 	= new Map();

		Fungi.materials.set(name, this);
	}

	addUniforms(ary){
		var itm;
		for(itm of ary) this.addUniform(itm.name, itm.type, itm.value);
		return this;
	}

	addUniform(uName, uType, uValue){
		if(this.uniforms.has(uName)){
			console.log("Uniform already exists : %s", uName);
			return this;
		}

		//..........................
		//Certain Types need processing of the value
		switch(uType){
			case "rgb"	: uValue = gl.rgbArray( uValue ); break;
			case "rgba"	: uValue = gl.rgbaArray( uValue ); break;
			case "tex"	: uValue = Fungi.textures.get( uValue ); break;
		}

		//..........................
		this.uniforms.set(uName,{type:uType, value:uValue});
		return this;
	}

	applyUniforms(){
		if(this.shader && this.uniforms.size > 0){
			var key,itm;
			for([key,itm] of this.uniforms) this.shader.setUniform(key, itm.value);
		}
		return this;
	}
}


//------------------------------------------------------
// Shaders
//------------------------------------------------------
class Shader{
	constructor(name, vertShader, fragShader, tfeedbackVar = null, tfeedbackInterleaved = true){
		this.name		= name;
		this.program 	= gl.createShader(vertShader, fragShader, true, tfeedbackVar, tfeedbackInterleaved);
		this.texSlot	= 0;

		//............................
		this.options = { modelMatrix : false, normalMatrix : false };

		//............................
		if(this.program != null){
			gl.ctx.useProgram(this.program);
			this.uniforms = new Map();

			Fungi.shaders.set(name, this);
		}
	}

	//---------------------------------------------------
	// Methods For Shader Setup.
	//---------------------------------------------------
	//Map uniform names to location integers
	prepareUniform(uName, uType){
		var loc = gl.ctx.getUniformLocation(this.program, uName);

		if(loc != null)	this.uniforms.set( uName, { loc:loc, type:uType } );
		else console.log("prepareUniform : Uniform not found %s in %s", uName, this.name);

		return this;
	}

	prepareUniforms(ary){
		var itm, loc;
		for(itm of ary){
			loc = gl.ctx.getUniformLocation(this.program, itm.name);

			if(loc != null)	this.uniforms.set( itm.name, { loc:loc, type:itm.type } );
			else console.log("prepareUniforms : Uniform not found %s in %s", uName, this.name);
		}

		return this;
	}

	prepareUniformBlock(uboName){
		var bIdx = gl.ctx.getUniformBlockIndex(this.program, uboName);
		if(bIdx > 1000){ console.log("Ubo not found in shader %s : %s ", this.name, uboName); return this; }

		var ubo = Fungi.getUBO(uboName);
		if(!ubo){ console.log("Can not find UBO in fungi cache : %s", uboName); return this; }

		gl.ctx.uniformBlockBinding(this.program, bIdx, ubo.bindPoint);
		return this;
	}
	

	//---------------------------------------------------
	// Setters Getters
	//---------------------------------------------------
	//Uses a 2 item group argument array. Uniform_Name, Uniform_Value;
	setUniforms(uName, uValue){
		if(arguments.length % 2 != 0){ console.log("setUniforms needs arguments to be in pairs."); return this; }

		for(var i=0; i < arguments.length; i+=2) this.setUniform( arguments[i], arguments[i+1] );

		return this;
	}

	setUniform(uName, uValue){
		var itm	= this.uniforms.get( uName );
		if(!itm){ console.log("uniform not found %s in %s",uName, this.name); return this; }

		switch(itm.type){
			case "float":	gl.ctx.uniform1f(	itm.loc, uValue); break;
			case "afloat":	gl.ctx.uniform1fv(	itm.loc, uValue); break;
			case "vec2":	gl.ctx.uniform2fv(	itm.loc, uValue); break;
			case "vec3":	gl.ctx.uniform3fv(	itm.loc, uValue); break;
			case "vec4":	gl.ctx.uniform4fv(	itm.loc, uValue); break;
			case "int":		gl.ctx.uniform1i(	itm.loc, uValue); break;

			case "mat4":	gl.ctx.uniformMatrix4fv(	itm.loc, false, uValue); break;
			case "mat3":	gl.ctx.uniformMatrix3fv(	itm.loc, false, uValue); break;
			case "mat2x4": 	gl.ctx.uniformMatrix2x4fv(	itm.loc, false, uValue); break;
			case "sample2D":
				gl.ctx.activeTexture(	gl.ctx.TEXTURE0 + this.texSlot);
				gl.ctx.bindTexture(		gl.ctx.TEXTURE_2D, uValue);
				gl.ctx.uniform1i(		itm.loc, this.texSlot);
				this.texSlot++;
				break;
			default: console.log("unknown uniform type %s for %s in  %s", itm.type, uName, this.name); break;
		}
		return this;
	}


	//---------------------------------------------------
	// Methods
	//---------------------------------------------------
	bind(){		gl.ctx.useProgram(this.program);	return this; }
	unbind(){	gl.ctx.useProgram(null);			return this; }

	//function helps clean up resources when shader is no longer needed.
	dispose(){
		//unbind the program if its currently active
		if(gl.ctx.getParameter(gl.ctx.CURRENT_PROGRAM) === this.program) gl.ctx.useProgram(null);
		gl.ctx.deleteProgram(this.program);
	}

	/*
	preRender(){
		this.texSlot = 0;
		gl.ctx.useProgram(this.program); //Save a function call and just activate this shader program on preRender

		return this;
	}
	*/
}


//------------------------------------------------------
// Constants
//------------------------------------------------------
Shader.ATTRIB_POSITION_LOC	= 0;
Shader.ATTRIB_NORMAL_LOC	= 1;
Shader.ATTRIB_UV_LOC		= 2;

Shader.UNIFORM_MODELMAT		= "u_modelMatrix";
Shader.UNIFORM_NORMALMAT	= "u_normalMatrix";


//------------------------------------------------------
// Export
//------------------------------------------------------
export { ParseShader, LoadInlineShader, Material };
export default Shader;