var ctx = null;

/*
function init(canvas,bgColor,wp,hp){
	//........................................
	//Get Context
	if(typeof canvas == "string") canvas = document.getElementById(canvas);

	ctx = canvas.getContext("webgl2");
	if(!ctx){ console.error("WebGL context is not available."); return; }

	this.ctx = ctx;

	//........................................
	//Setup some defaults
	ctx.cullFace(ctx.BACK);								//Back is also default
	ctx.frontFace(ctx.CCW);								//Dont really need to set it, its ccw by default.
	ctx.enable(ctx.DEPTH_TEST);							//Shouldn't use this, use something else to add depth detection
	ctx.enable(ctx.CULL_FACE);							//Cull back face, so only show triangles that are created clockwise
	ctx.depthFunc(ctx.LEQUAL);							//Near things obscure far things
	ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);	//Setup default alpha blending
	//ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA, ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
	//ctx.blendFunc(ctx.ONE,ctx.ONE);
	
	fitScreen(wp || 1,hp || 1);							//Set the size of the canvas to a percent of the screen
	setClearColor(bgColor || "#ffffff");				//Set clear color
	clear();											//Clear the canvas

	//........................................
	//Globally Used Objects
	this.UBOTransform = createUBO(UBO_TRANSFORM,0,[ 
		{name:"matProjection",type:"mat4"}, 
		{name:"matCameraView",type:"mat4"}, 
		{name:"posCamera",type:"vec3"},
		{name:"fTime",type:"f"},
		{name:"screenRes",type:"vec2"}
	]);

	return this;
}
*/

//------------------------------------------------------
//State
//------------------------------------------------------



//------------------------------------------------------
//Buffers
//------------------------------------------------------
//Create and fill our Array buffer.
function createArrayBuffer(floatAry,isStatic = true,isUnbind = true){
	var buf = ctx.createBuffer();
	ctx.bindBuffer(ctx.ARRAY_BUFFER,buf);
	ctx.bufferData(ctx.ARRAY_BUFFER, floatAry, (isStatic)? ctx.STATIC_DRAW : ctx.DYNAMIC_DRAW);

	if(isUnbind) ctx.bindBuffer(ctx.ARRAY_BUFFER,null);
	return buf;
};


//------------------------------------------------------
//Setters - Getters
//------------------------------------------------------

//------------------------------------------------------
//Misc
//------------------------------------------------------





//------------------------------------------------------
//Textures
//------------------------------------------------------

//Textures
function loadTexture(name,img,doYFlip,useMips){ 
	var tex = mod.res.textures[name] = ctx.createTexture();  
	return updateTexture(name,img,doYFlip,useMips);
}
function updateTexture(name,img,doYFlip,useMips){ //can be used to pass video frames to gpu texture.
	var tex = mod.res.textures[name];	

	if(doYFlip == true) ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, true);	//Flip the texture by the Y Position, So 0,0 is bottom left corner.

	ctx.bindTexture(ctx.TEXTURE_2D, tex); //bind texture so we can start configuring it.
	ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, img);	//Push image to GPU.
	
	if(useMips == true){
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);					//Setup up scaling
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR_MIPMAP_NEAREST);	//Setup down scaling
		ctx.generateMipmap(ctx.TEXTURE_2D);	//Precalc different sizes of texture for better quality rendering.
	}else{
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER,	ctx.NEAREST);
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER,	ctx.NEAREST);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER,	ctx.LINEAR);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER,	ctx.LINEAR);
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S,		ctx.CLAMP_TO_EDGE);
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T,		ctx.CLAMP_TO_EDGE);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S,		ctx.REPEAT); //TODO make this configurable on load.
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T,		ctx.REPEAT);
	}

	ctx.bindTexture(ctx.TEXTURE_2D,null); //Unbind
	
	if(doYFlip == true) ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);	//Stop flipping textures
	return tex;	
}
/*
//imgAry must be 6 elements long and images placed in the right order
//RIGHT,LEFT,TOP,BOTTOM,BACK,FRONT
ctx.fLoadCubeMap = function(name,imgAry){
	if(imgAry.length != 6) return null;

	//Cube Constants values increment, so easy to start with right and just add 1 in a loop
	//To make the code easier costs by making the imgAry coming into the function to have
	//the images sorted in the same way the constants are set.
	//	TEXTURE_CUBE_MAP_POSITIVE_X - Right	:: TEXTURE_CUBE_MAP_NEGATIVE_X - Left
	//	TEXTURE_CUBE_MAP_POSITIVE_Y - Top 	:: TEXTURE_CUBE_MAP_NEGATIVE_Y - Bottom
	//	TEXTURE_CUBE_MAP_POSITIVE_Z - Back	:: TEXTURE_CUBE_MAP_NEGATIVE_Z - Front

	var tex = this.createTexture();
	this.bindTexture(this.TEXTURE_CUBE_MAP,tex);

	//push image to specific spot in the cube map.
	for(var i=0; i < 6; i++){
		this.texImage2D(this.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.RGBA, this.RGBA, this.UNSIGNED_BYTE, imgAry[i]);
	}

	this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_MAG_FILTER, this.LINEAR);	//Setup up scaling
	this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_MIN_FILTER, this.LINEAR);	//Setup down scaling
	this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_WRAP_S, this.CLAMP_TO_EDGE);	//Stretch image to X position
	this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_WRAP_T, this.CLAMP_TO_EDGE);	//Stretch image to Y position
	this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_WRAP_R, this.CLAMP_TO_EDGE);	//Stretch image to Z position
	//this.generateMipmap(this.TEXTURE_CUBE_MAP);

	this.bindTexture(this.TEXTURE_CUBE_MAP,null);
	Fungi.Res.Textures[name] = tex;
	return tex;
};
*/



//------------------------------------------------------
//Export
//------------------------------------------------------
/*
var mod = {
	set:init,		//Set the canvas for gl to get its context
	ctx:null,		//Reference to gl context
	width:0,
	height:0,

	clear:clear,

	//.........................................
	createArrayBuffer:createArrayBuffer,
	createUBO:createUBO,

	//.........................................
	fitScreen:fitScreen,
	setSize:setSize,
	setClearColor:setClearColor,

	//.........................................
	rgbArray:rgbArray,
	rgbaArray:rgbaArray,

	//.........................................
	createShader:createShader,
	createProgram:createProgram,
	createProgramFromText:createProgramFromText,
	
	//.........................................
	loadTexture:loadTexture,
	updateTexture:updateTexture,

	//.........................................	
	res:{ textures:[], videos:[], images:[], shaders:[], ubo:[], vao:[], fbo:[], materials:[],
		getMaterial:function(matName){
			if(matName === undefined || matName == null) return null;
			if(this.materials[matName] === undefined){ console.log("Material Not Found :", matName); return null; }
			return this.materials[matName];
		}
	},

	//.........................................
	UBOTransform: null
};
*/




class gl{
	static init(canvas){
		//........................................
		//Get Context
		if(typeof canvas == "string") canvas = document.getElementById(canvas);

		gl.ctx = canvas.getContext("webgl2");
		if(!gl.ctx){ console.error("WebGL context is not available."); return false; }


		//........................................
		//Setup some defaults
		var c = gl.ctx;
		c.cullFace(		c.BACK );			// Back is also default
		c.frontFace(	c.CCW );			// Dont really need to set it, its ccw by default.
		c.enable( 		c.DEPTH_TEST );		// Shouldn't use this, use something else to add depth detection
		c.enable( 		c.CULL_FACE );		// Cull back face, so only show triangles that are created clockwise
		c.depthFunc( 	c.LEQUAL );			// Near things obscure far things
		c.blendFunc( 	c.SRC_ALPHA,		// Setup default alpha blending
						c.ONE_MINUS_SRC_ALPHA);
	
		gl.fitScreen()						// Set the size of the canvas to a percent of the screen
			.setClearColor("#ffffff")		// Set clear color
		return true;
	}

	//------------------------------------------------------
	// 
	//------------------------------------------------------
	static clear(){
		gl.ctx.clear( gl.ctx.COLOR_BUFFER_BIT | gl.ctx.DEPTH_BUFFER_BIT );
		return gl;
	}

	static blendMode(m){
		switch(m){
			case gl.BLEND_ALPHA: 			gl.ctx.blendFunc(gl.ctx.SRC_ALPHA, gl.ctx.ONE_MINUS_SRC_ALPHA); break;
			case gl.BLEND_ADDITIVE: 		gl.ctx.blendFunc(gl.ctx.ONE, gl.ctx.ONE); break;
			case gl.BLEND_ALPHA_ADDITIVE:	gl.ctx.blendFunc(gl.ctx.SRC_ALPHA, gl.ctx.ONE); break;
		}
		return gl;
	}


	//------------------------------------------------------
	// 
	//------------------------------------------------------

	//Set the size of the canvas to fill a % of the total screen.
	static fitScreen(wp = 1, hp = 1){
		gl.setSize( window.innerWidth * wp, window.innerHeight * hp );
		return gl;
	}

	//Set the size of the canvas html element and the rendering view port
	static setSize(w = 500, h = 500){
		//set the size of the canvas, on chrome we need to set it 3 ways to make it work perfectly.
		gl.ctx.canvas.style.width	= w + "px";
		gl.ctx.canvas.style.height	= h + "px";
		gl.ctx.canvas.width			= w;
		gl.ctx.canvas.height		= h;

		//when updating the canvas size, must reset the viewport of the canvas 
		//else the resolution webgl renders at will not change
		gl.ctx.viewport(0,0,w,h);
		gl.width	= w;	//Need to save Width and Height to resize viewport back if we need to.
		gl.height	= h;
		return gl;
	}

	static setClearColor(hex){
		if(hex.length > 7){
			var a = gl.rgbaArray(hex);
			gl.ctx.clearColor(a[0], a[1], a[2], a[3]);	
		}else{
			var a = gl.rgbArray(hex);
			gl.ctx.clearColor(a[0], a[1], a[2], 1.0);
		}
		return gl;
	}


	//------------------------------------------------------
	// Data
	//------------------------------------------------------
	static rgbArray(){
		if(arguments.length == 0) return null;
		var ary = (Array.isArray(arguments[0]))? arguments[0] : arguments,
			rtn = [];

		for(var i=0, c, p; i < ary.length; i++){
			if(ary[i].length < 6) continue;
			c = ary[i];				//Just an alias(copy really) of the color text, make code smaller.
			p = (c[0] == "#")?1:0;	//Determine starting position in char array to start pulling from

			rtn.push(
				parseInt(c[p]	+c[p+1],16)	/ 255.0,
				parseInt(c[p+2]	+c[p+3],16)	/ 255.0,
				parseInt(c[p+4]	+c[p+5],16)	/ 255.0
			);
		}
		return rtn;
	}

	static rgbaArray(){
		if(arguments.length == 0) return null;
		var ary = (Array.isArray(arguments[0]))? arguments[0] : arguments,
			rtn = [];

		for(var i=0, c, p; i < ary.length; i++){
			if(ary[i].length < 8) continue;
			c = ary[i];				//Just an alias(copy really) of the color text, make code smaller.
			p = (c[0] == "#")?1:0;	//Determine starting position in char array to start pulling from

			rtn.push(
				parseInt(c[p]	+c[p+1],16)	/ 255.0,
				parseInt(c[p+2]	+c[p+3],16)	/ 255.0,
				parseInt(c[p+4]	+c[p+5],16)	/ 255.0,
				parseInt(c[p+6]	+c[p+7],16)	/ 255.0
			);
		}
		return rtn;
	}


	//------------------------------------------------------
	// Shaders tfeedback = null, tfeedbackInterleaved = true
	//------------------------------------------------------
	static createShader(vShaderTxt, fShaderTxt, doValidate = true, transFeedbackVars = null, transFeedbackInterleaved = true){
		var vShader		= gl.compileShader(vShaderTxt, gl.ctx.VERTEX_SHADER);
		if(!vShader)	return null;

		var fShader		= gl.compileShader(fShaderTxt, gl.ctx.FRAGMENT_SHADER);
		if(!fShader){	ctx.deleteShader(vShader); return null; }

		return gl.createShaderProgram(vShader, fShader, doValidate, transFeedbackVars, transFeedbackInterleaved);
	}

	//Create a shader by passing in its code and what type
	static compileShader(src,type){
		var shader = gl.ctx.createShader(type);
		gl.ctx.shaderSource(shader,src);
		gl.ctx.compileShader(shader);

		//Get Error data if shader failed compiling
		if(!gl.ctx.getShaderParameter(shader, gl.ctx.COMPILE_STATUS)){
			console.error("Error compiling shader : " + src, gl.ctx.getShaderInfoLog(shader));
			gl.ctx.deleteShader(shader);
			return null;
		}

		return shader;
	}

	//Link two compiled shaders to create a program for rendering.
	static createShaderProgram(vShader, fShader, doValidate = true, transFeedbackVars = null, transFeedbackInterleaved = true){
		//Link shaders together
		var prog = gl.ctx.createProgram();
		gl.ctx.attachShader(prog, vShader);
		gl.ctx.attachShader(prog, fShader);

		//Force predefined locations for specific attributes. If the attibute isn't used in the shader its location will default to -1
		//ctx.bindAttribLocation(prog,ATTR_POSITION_LOC,ATTR_POSITION_NAME);
		//ctx.bindAttribLocation(prog,ATTR_NORMAL_LOC,ATTR_NORMAL_NAME);
		//ctx.bindAttribLocation(prog,ATTR_UV_LOC,ATTR_UV_NAME);

		//Need to setup Transform Feedback Varying Vars before linking the program.
		if(transFeedbackVars != null){
			gl.ctx.transformFeedbackVaryings(prog, transFeedbackVars,
				((transFeedbackInterleaved)? gl.ctx.INTERLEAVED_ATTRIBS : gl.ctx.SEPARATE_ATTRIBS)
			);
		}

		gl.ctx.linkProgram(prog);

		//Check if successful
		if(!gl.ctx.getProgramParameter(prog, gl.ctx.LINK_STATUS)){
			console.error("Error creating shader program.", gl.ctx.getProgramInfoLog(prog));
			gl.ctx.deleteProgram(prog); return null;
		}

		//Only do this for additional debugging.
		if(doValidate){
			gl.ctx.validateProgram(prog);
			if(!gl.ctx.getProgramParameter(prog, gl.ctx.VALIDATE_STATUS)){
				console.error("Error validating program", gl.ctx.getProgramInfoLog(prog));
				gl.ctx.deleteProgram(prog); return null;
			}
		}
		
		//Can delete the shaders since the program has been made.
		gl.ctx.detachShader(prog,vShader); //TODO, detaching might cause issues on some browsers, Might only need to delete.
		gl.ctx.detachShader(prog,fShader);
		gl.ctx.deleteShader(fShader);
		gl.ctx.deleteShader(vShader);

		return prog;
	}

}

//.........................
gl.ctx		= null;
gl.width	= 0;
gl.height	= 0;

gl.BLEND_ALPHA 				= 0;
gl.BLEND_ADDITIVE 			= 1;
gl.BLEND_ALPHA_ADDITIVE 	= 2;

export default gl;