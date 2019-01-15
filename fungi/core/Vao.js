import gl 		from "./gl.js";
import Cache	from "./Cache.js";
import Shader	from "./Shader.js";

//##################################################################
class Buffer{
	static array( target, aryData, isStatic, dataType, attrLoc, compLen=3, stride=0, offset=0, isInstance=false ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Create and Bind New Buffer
		let id = gl.ctx.createBuffer();
		gl.ctx.bindBuffer( target, id );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Depending on type, 
		switch( target ){
			case gl.ctx.ELEMENT_ARRAY_BUFFER:
				gl.ctx.bufferData( target, aryData, (isStatic)? gl.ctx.STATIC_DRAW : gl.ctx.DYNAMIC_DRAW );
				break;

			case gl.ctx.ARRAY_BUFFER:
				gl.ctx.bufferData( target, aryData, (isStatic)? gl.ctx.STATIC_DRAW : gl.ctx.DYNAMIC_DRAW );
				gl.ctx.enableVertexAttribArray( attrLoc );
				gl.ctx.vertexAttribPointer( attrLoc, compLen, dataType, false, stride, offset );
				break;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( isInstance == true ) gl.ctx.vertexAttribDivisor( attrLoc, 1 );

		return id;
	}

	static empty( target, byteCount, isStatic, dataType, attrLoc, compLen=3, stride=0, offset=0, isInstance=false ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Create and Bind New Buffer
		let id = gl.ctx.createBuffer();
		gl.ctx.bindBuffer( target, id );
		gl.ctx.bufferData( target, byteCount, (isStatic)? gl.ctx.STATIC_DRAW : gl.ctx.DYNAMIC_DRAW );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		switch( target ){
			case gl.ctx.ARRAY_BUFFER:
				gl.ctx.enableVertexAttribArray( attrLoc );
				gl.ctx.vertexAttribPointer( attrLoc, compLen, dataType, false, stride, offset );
				break;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( isInstance == true ) gl.ctx.vertexAttribDivisor( attrLoc, 1 );

		return id;
	}

	static partition( dataType, attrLoc, compLen=3, stride=0, offset=0, isInstance=false ){
		gl.ctx.enableVertexAttribArray( attrLoc );
		gl.ctx.vertexAttribPointer( attrLoc, compLen, dataType, false, stride, offset );

		if(isInstance) gl.ctx.vertexAttribDivisor( attrLoc, 1 );
	}

	static mat4Array( aryData, attrLoc, isStatic = true, isInstance = false ){
		let id = gl.ctx.createBuffer();

		gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, id);
		gl.ctx.bufferData(gl.ctx.ARRAY_BUFFER, ary, (isStatic)? gl.ctx.STATIC_DRAW : gl.ctx.DYNAMIC_DRAW );
		
		// Matrix is treated like an array of vec4, So there is actually 
		// 4 attributes to setup that actually makes up a single mat4.
		gl.ctx.enableVertexAttribArray( attrLoc );
		gl.ctx.vertexAttribPointer( attrLoc,	4, gl.ctx.FLOAT, false, 64, 0 );

		gl.ctx.enableVertexAttribArray( attrLoc+1 );
		gl.ctx.vertexAttribPointer( attrLoc+1,	4, gl.ctx.FLOAT, false, 64, 16);
		
		gl.ctx.enableVertexAttribArray( attrLoc+2 );
		gl.ctx.vertexAttribPointer( attrLoc+2,	4, gl.ctx.FLOAT, false, 64, 32);
		
		gl.ctx.enableVertexAttribArray( attrLoc+3 );
		gl.ctx.vertexAttribPointer( attrLoc+3,	4, gl.ctx.FLOAT, false, 64, 48);
		
		if( isInstance ){
			gl.ctx.vertexAttribDivisor( attrLoc,	1 );
			gl.ctx.vertexAttribDivisor( attrLoc+1,	1 );
			gl.ctx.vertexAttribDivisor( attrLoc+2,	1 );
			gl.ctx.vertexAttribDivisor( attrLoc+3,	1 );
		}

		return id;
	}
}


//##################################################################
class Vao{
	constructor(){
		this.id				= gl.ctx.createVertexArray();
		this.name			= "";
		this.elmCount		= 0;
		this.isIndexed		= false;
		this.isInstanced	= false;
		this.buf 			= {};
	}

	///////////////////////////////////////////////////////
	// TEMPLATES
	///////////////////////////////////////////////////////
		static buildStandard( name, vertCompLen, aryVert, aryNorm=null, aryUV=null, aryInd=null ){
			let vao 		= new Vao(),
				elmCount	= 0;

			// Vertices are mandatory
			Vao	.bind( vao )
				.floatBuffer( vao, "vertex", aryVert, Shader.POSITION_LOC, vertCompLen );

			// Build Optional Buffers
			if( aryNorm ) 	Vao.floatBuffer( vao, "normal", aryNorm, Shader.NORMAL_LOC, 3 );
			if( aryUV )		Vao.floatBuffer( vao, "uv", aryUV, Shader.UV_LOC, 2 );
			if( aryInd ){
				Vao.indexBuffer( vao, "index", aryInd );
				elmCount = aryInd.length;
			}else elmCount = aryVert.length / vertCompLen;

			// Done
			Vao.finalize( vao, name, elmCount );
			return vao;
		}

		static buildSkinning(name, vertCompLen, aryVert, aryNorm=null, aryUV=null, aryInd=null, jointSize=0, aryJoint = null, aryWeight = null){
			var o = new Vao().create()
				.floatBuffer("bVertices", aryVert, Shader.ATTRIB_POSITION_LOC, vertCompLen);

			if(aryNorm)	o.floatBuffer("bNormal", aryNorm, Shader.ATTRIB_NORMAL_LOC, 3);
			if(aryUV)	o.floatBuffer("bUV", aryUV, Shader.ATTRIB_UV_LOC, 2);
			if(aryInd)	o.indexBuffer("bIndex", aryInd)
			if(jointSize > 0){
				o.floatBuffer("bJointIdx",		aryJoint,	Shader.ATTRIB_JOINT_IDX_LOC,	jointSize);
			   	o.floatBuffer("bJointWeight",	aryWeight,	Shader.ATTRIB_JOINT_WEIGHT_LOC,	jointSize);
			}
						
			var vao = o.finalize(name);
			o.cleanup();

			return vao;
		}

		static buildEmpty(name, vertCompLen=3, vertCnt=4, normLen=0, uvLen=0, indexLen=0){
			var o = new Vao().create()
				.emptyFloatBuffer("bVertices",
					Float32Array.BYTES_PER_ELEMENT * vertCompLen * vertCnt, 
					Shader.ATTRIB_POSITION_LOC, vertCompLen );

			//if(aryNorm)	VAO.floatArrayBuffer(rtn,	"bNormal",	aryNorm,	ATTR_NORM_LOC,	3,0,0,true);
			if(uvLen > 0)		o.emptyFloatBuffer("bUV", Float32Array.BYTES_PER_ELEMENT * 2 * uvLen, Shader.ATTRIB_UV_LOC, 2);
			if(indexLen > 0)	o.emptyIndexBuffer("bIndex", Uint16Array.BYTES_PER_ELEMENT * indexLen, false);

			var vao = o.finalize(name);
			o.cleanup();

			return vao;
		}


	///////////////////////////////////////////////////////
	// STATIC FUNC
	///////////////////////////////////////////////////////
		
		static finalize( vao, name, elmCount = null ){
			vao.name = name;

			if( elmCount ) vao.elmCount = elmCount;

			// Clean up
			gl.ctx.bindVertexArray( null );
			gl.ctx.bindBuffer( gl.ctx.ARRAY_BUFFER, null );
			gl.ctx.bindBuffer( gl.ctx.ELEMENT_ARRAY_BUFFER, null );
			
			Cache.vaos.set( name, vao );
			return Vao;
		}

		static setInstanced( vao, cnt ){
			vao.isInstanced		= true;
			vao.instanceCount	= cnt;
			return Vao;
		}

		static bind( vao=null ){ gl.ctx.bindVertexArray( (vao)? vao.id : null ); return Vao; }
		
		static draw( vao, drawMode = gl.ctx.POINTS, doBinding=false ){
			if( doBinding ) gl.ctx.bindVertexArray( vao.id );

			if( vao.elmCount != 0 ){
				if( vao.isIndexed )	gl.ctx.drawElements( drawMode, vao.elmCount, gl.ctx.UNSIGNED_SHORT, 0 ); 
				else				gl.ctx.drawArrays( drawMode, 0, vao.elmCount );
			}

			if( doBinding ) gl.ctx.bindVertexArray( null );
			return Vao;
		}


	///////////////////////////////////////////////////////
	// FLOAT ARRAY BUFFERS
	///////////////////////////////////////////////////////

		static floatBuffer( vao, name, aryData, attrLoc, compLen=3, stride=0, offset=0, isStatic=true, isInstance=false ){
			let ary		= ( aryData instanceof Float32Array )? aryData : new Float32Array( aryData ),
				bufID	= Buffer.array( gl.ctx.ARRAY_BUFFER, 
				ary, isStatic, gl.ctx.FLOAT, 
				attrLoc, compLen, stride, offset, isInstance );

			vao.buf[ name ] = bufID;
			return Vao;
		}

		static partitionFloatBuffer( attrLoc, compLen, stride=0, offset=0, isInstance=false ){
			gl.ctx.enableVertexAttribArray(attrLoc);
			gl.ctx.vertexAttribPointer(attrLoc, compLen, gl.ctx.FLOAT, false, stride, offset);
			if(isInstance) gl.ctx.vertexAttribDivisor(attrLoc, 1);
			
			return Vao;
		}

		static emptyFloatBuffer( vao, name, byteCount, attrLoc, compLen, stride=0, offset=0, isStatic=false, isInstance=false){
			let bufID = Buffer.empty( gl.ctx.ARRAY_BUFFER, 
				byteCount, isStatic, gl.ctx.FLOAT, 
				attrLoc, compLen, stride, offset, isInstance );
			
			vao.buf[ name ] = bufID;
			return Vao;
		}


	///////////////////////////////////////////////////////
	// ELEMENT ARRAY BUFFER ( INDEX BUFFER )
	///////////////////////////////////////////////////////
		
		static indexBuffer( vao, name, aryData, isStatic=true){
			let ary		= (aryData instanceof Uint16Array)? aryData : new Uint16Array(aryData),
				bufID	= Buffer.array( gl.ctx.ELEMENT_ARRAY_BUFFER, ary, isStatic );

			vao.buf[ name ] = bufID;
			vao.elmCount	= aryData.length;
			vao.isIndexed	= true;
			return Vao;
		}

		static emptyIndexBuffer( vao, name, byteCount, isStatic=false){
			vao.buf[ name ] = Buffer.empty( gl.ctx.ELEMENT_ARRAY_BUFFER, byteCount, isStatic );
			vao.isIndexed	= true;
			return Vao;
		}


	///////////////////////////////////////////////////////
	// SPECIALTY BUFFERS
	///////////////////////////////////////////////////////
		
		static mat4ArrayBuffer(vao, name, aryData, attrLoc, isStatic=true, isInstance=false){
			let ary = (aryData instanceof Float32Array)? aryData : new Float32Array(aryData);
			vao.buf[ name ] = Buffer.mat4Array( ary, attrLoc, isStatic, isInstance );
			return Vao;
		}

		//static updateAryBufSubData(bufID, offset, data){
		//	gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, bufID);
		//	gl.ctx.bufferSubData(gl.ctx.ARRAY_BUFFER, offset, data, 0, null);
		//	gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, null);
		//}
}

//##################################################################
export default Vao;
export { Buffer };