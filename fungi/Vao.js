import gl 		from "./gl.js";
import Fungi	from "./Fungi.js";
import Shader	from "./Shader.js";

class Vao{
	constructor(){ this.vao = null; }

	//----------------------------------------------------------
	create(){
		this.vao = { 
			id			: gl.ctx.createVertexArray(), 
			elmCount	: 0,
			isIndexed	: false
		};

		gl.ctx.bindVertexArray(this.vao.id);
		return this;
	}

	finalize(name){
		if(this.vao.elmCount == 0 && this.vao.bVertices !== undefined) this.vao.elmCount = this.vao.bVertices.elmCount;

		gl.ctx.bindVertexArray( null );
		gl.ctx.bindBuffer( gl.ctx.ARRAY_BUFFER, null );
		gl.ctx.bindBuffer( gl.ctx.ELEMENT_ARRAY_BUFFER, null );
		
		Fungi.vaos.set(name, this.vao);
		return this.vao;
	}

	cleanup(){ this.vao = null; return this; }

	//----------------------------------------------------------
	//Float Array Buffers
	floatBuffer(name, aryData, attrLoc, compLen=3, stride=0, offset=0, isStatic=true, isInstance=false){
		var rtn = {
			id			: gl.ctx.createBuffer(),
			compLen		: compLen,
			stride		: stride,
			offset		: offset,
			elmCount	: aryData.length / compLen
		};

		var ary = (aryData instanceof Float32Array)? aryData : new Float32Array(aryData);

		gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, rtn.id);
		gl.ctx.bufferData(gl.ctx.ARRAY_BUFFER, ary, (isStatic)? gl.ctx.STATIC_DRAW : gl.ctx.DYNAMIC_DRAW );
		gl.ctx.enableVertexAttribArray( attrLoc );
		gl.ctx.vertexAttribPointer(attrLoc, compLen, gl.ctx.FLOAT, false, stride, offset);

		if(isInstance == true) gl.ctx.vertexAttribDivisor(attrLoc, 1);

		this.vao[name] = rtn;
		return this;
	}


	partitionFloatBuffer(attrLoc, compLen, stride=0, offset=0, isInstance=false){
		gl.ctx.enableVertexAttribArray(attrLoc);
		gl.ctx.vertexAttribPointer(attrLoc, compLen, gl.ctx.FLOAT, false, stride, offset);

		if(isInstance) gl.ctx.vertexAttribDivisor(attrLoc, 1);
		
		return this;
	}


	emptyFloatBuffer(name, byteCount, attrLoc, compLen, stride=0, offset=0, isStatic=false, isInstance=false){
		var rtn = {
			id			: gl.ctx.createBuffer(),
			compLen		: compLen,
			stride		: stride,
			offset		: offset,
			elmCount	: 0
		};

		gl.ctx.bindBuffer( gl.ctx.ARRAY_BUFFER, rtn.id);
		gl.ctx.bufferData( gl.ctx.ARRAY_BUFFER, byteCount, (isStatic)? gl.ctx.STATIC_DRAW : gl.ctx.DYNAMIC_DRAW);
		gl.ctx.enableVertexAttribArray( attrLoc );
		gl.ctx.vertexAttribPointer( attrLoc, compLen, gl.ctx.FLOAT, false, stride, offset );

		if(isInstance) gl.ctx.vertexAttribDivisor( attrLoc, 1 );
		
		this.vao[name] = rtn;
		return VAO;
	}


	//----------------------------------------------------------
	//Matrix 4 Array Buffer
	mat4ArrayBuffer(name, aryData, attrLoc, isStatic=true, isInstance=false){
		var rtn = {
			id		: gl.ctx.createBuffer(),
			compLen	: 4,
			stride	: 64,
			offset	: 0,
			count	: aryFloat.length / 16
		};

		var ary = (aryData instanceof Float32Array)? aryData : new Float32Array(aryData);

		gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, rtn.id);
		gl.ctx.bufferData(gl.ctx.ARRAY_BUFFER, ary, (isStatic != false)? gl.ctx.STATIC_DRAW : gl.ctx.DYNAMIC_DRAW );
		
		//Matrix is treated like an array of vec4, So there is actually 4 attributes to setup that
		//actually makes up a single mat4.
		gl.ctx.enableVertexAttribArray( attrLoc );
		gl.ctx.vertexAttribPointer( attrLoc,	4, gl.ctx.FLOAT, false, 64, 0 );

		gl.ctx.enableVertexAttribArray( attrLoc+1 );
		gl.ctx.vertexAttribPointer( attrLoc+1,	4, gl.ctx.FLOAT, false, 64, 16);
		
		gl.ctx.enableVertexAttribArray( attrLoc+2 );
		gl.ctx.vertexAttribPointer( attrLoc+2,	4, gl.ctx.FLOAT, false, 64, 32);
		
		gl.ctx.enableVertexAttribArray( attrLoc+3 );
		gl.ctx.vertexAttribPointer( attrLoc+3,	4, gl.ctx.FLOAT, false, 64, 48);
		
		if(isInstance){
			gl.ctx.vertexAttribDivisor( attrLoc,	1 );
			gl.ctx.vertexAttribDivisor( attrLoc+1,	1 );
			gl.ctx.vertexAttribDivisor( attrLoc+2,	1 );
			gl.ctx.vertexAttribDivisor( attrLoc+3,	1 );
		}

		this.vao[name] = rtn;
		return this;
	}


	//----------------------------------------------------------
	//Indexes
	indexBuffer(name, aryData, isStatic=true){
		var rtn = {	id 			: gl.ctx.createBuffer(),
					elmCount 	: aryData.length	},
			ary = (aryData instanceof Uint16Array)? aryData : new Uint16Array(aryData);

		gl.ctx.bindBuffer(gl.ctx.ELEMENT_ARRAY_BUFFER, rtn.id );  
		gl.ctx.bufferData(gl.ctx.ELEMENT_ARRAY_BUFFER, ary, (isStatic)? gl.ctx.STATIC_DRAW : gl.ctx.DYNAMIC_DRAW );

		this.vao[name]		= rtn;
		this.vao.elmCount	= aryData.length;
		this.vao.isIndexed	= true;
		return this;
	}

	emptyIndexBuffer(name, aryCount, isStatic=true){
		var rtn = { id:gl.ctx.createBuffer(), elmCount:0 };

		gl.ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, rtn.id );  
		gl.ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, aryCount, (isStatic)? gl.ctx.STATIC_DRAW : gl.ctx.DYNAMIC_DRAW );

		this.vao[name]		= rtn;
		this.vao.isIndexed	= true;
		return this;
	}


	//----------------------------------------------------------
	//Static Functions
	static bind(vao){	gl.ctx.bindVertexArray(vao.id); return Vao; }
	static unbind(){	gl.ctx.bindVertexArray( null ); return Vao; }
	static draw(vao, drawMode = gl.ctx.TRIANGLES, doBinding=false){
		if(doBinding) gl.ctx.bindVertexArray(vao.id);

		if(vao.elmCount != 0){
			if(vao.isIndexed)	gl.ctx.drawElements(drawMode, vao.elmCount, gl.ctx.UNSIGNED_SHORT, 0); 
			else				gl.ctx.drawArrays(drawMode, 0, vao.elmCount);
		}

		if(doBinding) gl.ctx.bindVertexArray(null);
		return Vao;
	}

	//static updateAryBufSubData(bufID, offset, data){
	//	gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, bufID);
	//	gl.ctx.bufferSubData(gl.ctx.ARRAY_BUFFER, offset, data, 0, null);
	//	gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, null);
	//}

	//----------------------------------------------------------
	//Templates
	static standardRenderable(name, vertCompLen, aryVert, aryNorm=null, aryUV=null, aryInd=null){
		var o = new Vao().create()
			.floatBuffer("bVertices", aryVert, Shader.ATTRIB_POSITION_LOC, vertCompLen);

		if(aryNorm)	o.floatBuffer("bNormal", aryNorm, Shader.ATTRIB_NORMAL_LOC, 3);
		if(aryUV)	o.floatBuffer("bUV", aryUV, Shader.ATTRIB_UV_LOC, 2);
		if(aryInd)	o.indexBuffer("bIndex", aryInd)
					
		var vao = o.finalize(name);
		o.cleanup();

		return vao;
	}

	static standardEmpty(name, vertCompLen=3, vertCnt=4, normLen=0, uvLen=0, indexLen=0){
		//var rtn = VAO.create();
		//VAO.emptyFloatArrayBuffer(rtn,"bVertices",Float32Array.BYTES_PER_ELEMENT * vertCompLen * vertCnt,ATTR_POSITION_LOC,vertCompLen,0,0,false);
	

		//if(aryNorm)	VAO.floatArrayBuffer(rtn,	"bNormal",	aryNorm,	ATTR_NORM_LOC,	3,0,0,true);
		//if(aryUV)	VAO.floatArrayBuffer(rtn,	"bUV",		aryUV,		ATTR_UV_LOC,	2,0,0,true);
		
		//if(indexLen > 0) VAO.emptyIndexBuffer(rtn, "bIndex", Uint16Array.BYTES_PER_ELEMENT * indexLen, false);

		//VAO.finalize(rtn,name);

		//return rtn;
	}
}

export default Vao;