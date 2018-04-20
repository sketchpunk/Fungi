import gl from "../../fungi/gl.js";

const FeedbackUseMode = { Read:1, Write:2, Draw:4, All:7, ReadDraw:5, WriteDraw:6 };

//Create structure that contains information on how a Interleaved Buffer is Defined.
function structInterleavedDef(partCnt, stride, parts){
	return {
		stride			: stride,		// How many bytes makes up one element
		partCount		: partCnt,		// How many chunks of data exist in one element
		parts 			: parts
	};
}

// OBJECT TO HANDLE FEEDBACK, PLUS MERGE DATA INTO INTERLEAVED BUFFERS
class TransformFeedback{
	constructor(){
		this.vaoDraw			= new Array(2);		// VAOs for drawing
		this.readFeedback		= new Array(2);		// VAOs : What to read in during Feedback
		this.writeFeedback		= new Array(2);		// TransformFeedback : Where to write during feedback.

		//this.vertexIndexBuffer 	= null;			// Index buffer when available for meshes
		this.vertexBuffer		= null;				// The Points or Mesh to Render
		this.vertexDef			= null;				// Definition for the Vertex Buffer
		this.vertexCnt			= 0;				// How many vertices in the mesh to draw

		this.staticBuffer 		= null;				// Data used in Feedback / Draw that will not change
		this.staticBufferDef	= null;				//
		
		this.dynamicBuffers		= new Array(2);		// Alternating Buffers for Feedback for writing
		this.dynamicBuffersDef	= null;				// Definition for the feedback buffer

		this.runIndex 			= 0;				// Keep track of the index for alternating buffers for each feedback
	}


	interleavedFloatArray(vertCnt, fbData, fbInfo){
		var bFloat	= Float32Array.BYTES_PER_ELEMENT,	// Short for float byte size
			dLen	= fbData.length,					// Data array Length (how many parts make up an element)
			iFinal	= 0,								// Length of final array
			stride	= 0,								// Size of single chunk of vertex data
			fi		= 0,								// Final Index
			i, j, k;									// Loop Vars

		//-----------------------------------
		// Calc some values that helps build a buffer on the gpu : Offset
		for(i=0; i < fbData.length; i++){
			iFinal		+= fbData[i].length;
			stride		+= fbInfo[i].compCount * bFloat;
			
			fbInfo[i].offset = (i != 0) ? 
				fbInfo[i-1].compCount * bFloat + fbInfo[i-1].offset
				: 0; //use previous offset val to continue this i
		}

		//-----------------------------------
		//Build the final array with all the vertex attributes grouped together
		var final = new Float32Array(iFinal);		// Create a final array to hold all the data.
		for(i=0; i < vertCnt; i++)					// Loop based on total vertex data that exists
			for(j=0; j < fbData.length; j++)		// loop per stride of data
				for(k=0; k < fbInfo[j].compCount; k++)	// loop per element to put into final
					final[ fi++ ] = fbData[j][ (i*fbInfo[j].compCount) + k ];

		//-----------------------------------		
		return {
			data	:final,
			def		:structInterleavedDef(dLen,stride,fbInfo)
		};
	}


	//----------------------------------------------------------
	//Execute Feedback
		preRender(){
			var nextIndex	= (this.runIndex + 1) % 2,
				rtn			= {
					nextIndex	: nextIndex,
					vaoTFRead	: this.readFeedback[this.runIndex],
					vaoTFWrite	: this.writeFeedback[nextIndex]
				};

			this.runIndex = rtn.nextIndex;
			return rtn;
		}


		runFeedback(info, instanceCnt){
			gl.ctx.bindVertexArray( info.vaoTFRead );						//Set Buffer to Read From
			gl.ctx.bindTransformFeedback(gl.ctx.TRANSFORM_FEEDBACK, info.vaoTFWrite );	//Set Buffer to Write To
			gl.ctx.enable(gl.ctx.RASTERIZER_DISCARD);						//Disable Fragment Program (only need vertex for this)

				gl.ctx.beginTransformFeedback(gl.ctx.POINTS);				//Begin Feedback Process
					gl.ctx.drawArrays(gl.ctx.POINTS, 0, instanceCnt);		//Execute Feedback Shader.
				gl.ctx.endTransformFeedback();	

			gl.ctx.disable(gl.ctx.RASTERIZER_DISCARD);						//Enable Fragment Program so we can draw to framebuffer
			gl.ctx.bindTransformFeedback(gl.ctx.TRANSFORM_FEEDBACK, null);
		}


		runRender(info, drawMode, instanceCnt){
			gl.ctx.bindVertexArray( this.vaoDraw[ info.nextIndex ] );		//Set which VAO to draw from
			//gl.ctx.drawArrays(this.drawMode, 0, 1); //Drawing Instance
			gl.ctx.drawArraysInstanced(drawMode, 0, this.vertexCnt, instanceCnt); 	//Draw!!
		}


		// First we bind the shader that handles the feedback, then execute it with fragment disabled.
		// With the alternating write buffer updated from the shader, then we render on screen the mesh
		// with new data from transform feedback shader.
		runFull(drawMode, shaderFeedback, shaderDraw, instanceCnt){
			//Determine what to Read and Write to during this draw call
			var nextIndex	= (this.runIndex + 1) % 2,
				vaoTFRead	= this.readFeedback[this.runIndex],
				vaoTFWrite	= this.writeFeedback[nextIndex];

			//-----------------------------------
			//Execute the Transform Feedback
			gl.ctx.useProgram(shaderFeedback);

			gl.ctx.bindVertexArray( vaoTFRead );									//Set Buffer to Read From
			gl.ctx.bindTransformFeedback(gl.ctx.TRANSFORM_FEEDBACK, vaoTFWrite );	//Set Buffer to Write To
			gl.ctx.enable(gl.ctx.RASTERIZER_DISCARD);								//Disable Fragment Program (only need vertex for this)

				gl.ctx.beginTransformFeedback(gl.ctx.POINTS);						//Begin Feedback Process
		        	gl.ctx.drawArrays(gl.ctx.POINTS, 0, instanceCnt);				//Execute Feedback Shader.
		        gl.ctx.endTransformFeedback();	

			gl.ctx.disable(gl.ctx.RASTERIZER_DISCARD);								//Enable Fragment Program so we can draw to framebuffer
			gl.ctx.bindTransformFeedback(gl.ctx.TRANSFORM_FEEDBACK, null);
			
			//-----------------------------------
			//Execute the Transform Feedback
			gl.ctx.useProgram(shaderDraw);
			gl.ctx.bindVertexArray( this.vaoDraw[ nextIndex ] );					//Set which VAO to draw from
			//gl.ctx.drawArrays(this.drawMode, 0, 1); //Drawing Instance
			gl.ctx.drawArraysInstanced(drawMode, 0, this.vertexCnt, instanceCnt); 	//Draw!!

			//-----------------------------------
			//Clean up
			this.runIndex = nextIndex; //Next frame use the other feedback and render vao
			gl.ctx.bindVertexArray(null);
			return this;
		}
	//endregion


	//----------------------------------------------------------
	//Setup Transform Feedback
		// Setup the vertex data for a point OR mesh that will instanced as a particle
		setupVertexBuffer(vertCount, vertData, vertInfo, vertIdx=null){
			var info = this.interleavedFloatArray(vertCount, vertData, vertInfo);

			//...........................................
			//Create buffer, save how its defined and push data to it
			this.vertexCnt		= vertCount;
			this.vertexDef		= info.def;
			this.vertexBuffer	= gl.ctx.createBuffer();

			gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, this.vertexBuffer );
			gl.ctx.bufferData(gl.ctx.ARRAY_BUFFER, info.data, gl.ctx.STATIC_DRAW);
			gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, null );
			return this;
		}

		setupTransformBuffer(vertCnt, fbData, fbInfo){
			//...........................................
			//Filter out the list of data into Read and Write. To use interleaved data, we need to seperate the data
			//into two different buffers for use, because when I created a single buffer, Writing does not take
			//stride into account of the data, so it overwritten read data in the process. So to fix this issue,
			//interleaved write data must exist in its own buffer so the writing can be done one complete element
			//at a time without messing up read data.
			var itm,
				dLen			= fbData.length,
				aryStatic		= [],
				aryStaticInfo	= [],
				aryDynamic		= [],
				aryDynamicInfo	= [];

			for(var i=0; i < dLen; i++){
				itm = fbInfo[i];

				if( (itm.usedIn & FeedbackUseMode.Write) != 0 ){
					aryDynamic.push( fbData[i] );
					aryDynamicInfo.push( fbInfo[i] );
				}else{ // if( (itm.usedIn & FeedbackUseMode.Read) != 0 || (itm.usedIn & FeedbackUseMode.Draw) != 0 ){
					aryStatic.push( fbData[i] );
					aryStaticInfo.push( fbInfo[i] );
				}
			}

			//...........................................
			//Create a buffer of data that will only be read in by feedback
			if(aryStatic.length > 0){
				var info = this.interleavedFloatArray(vertCnt, aryStatic, aryStaticInfo);

				this.staticBufferDef = info.def;
				gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, this.staticBuffer = gl.ctx.createBuffer() );
				gl.ctx.bufferData(gl.ctx.ARRAY_BUFFER, info.data, gl.ctx.STATIC_DRAW);
			}

			//...........................................
			//Create a buffer of data that will be read and written to by feedback
			if(aryDynamic.length > 0){
				var info = this.interleavedFloatArray(vertCnt, aryDynamic, aryDynamicInfo);
				this.dynamicBuffersDef = info.def;

				for(var i=0; i < 2; i++){				
					gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, this.dynamicBuffers[i] = gl.ctx.createBuffer() );
					gl.ctx.bufferData(gl.ctx.ARRAY_BUFFER, info.data, gl.ctx.DYNAMIC_COPY);
				}
			}

			gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, null );
			return this;
		}

		setupFeedback(){
			var itm;
			for(var i = 0; i < 2; i++){
				//...................................
				// Create & Bind VAO
				this.readFeedback[i] = gl.ctx.createVertexArray();
				gl.ctx.bindVertexArray(this.readFeedback[i]);
				
				//...................................
				//Bind Read Only
				if(this.staticBuffer != null){
					gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, this.staticBuffer); //Bind Buffer

					for(var j=0; j < this.staticBufferDef.partCount; j++){
						itm = this.staticBufferDef.parts[j];
						if( (itm.usedIn & FeedbackUseMode.Read) == 0) continue;

						gl.ctx.enableVertexAttribArray( itm.feedbackLoc );
						gl.ctx.vertexAttribPointer( itm.feedbackLoc, itm.compCount, gl.ctx.FLOAT, false, this.staticBufferDef.stride, itm.offset );
					}
				}

				//Bind Write
				if(this.dynamicBuffers != null){
					gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, this.dynamicBuffers[i]); //Bind Buffer

					for(var j=0; j < this.dynamicBuffersDef.partCount; j++){
						itm = this.dynamicBuffersDef.parts[j];
						if( (itm.usedIn & FeedbackUseMode.Write) == 0) continue;

						gl.ctx.enableVertexAttribArray( itm.feedbackLoc );
						gl.ctx.vertexAttribPointer( itm.feedbackLoc, itm.compCount, gl.ctx.FLOAT, false, this.dynamicBuffersDef.stride, itm.offset );
					}
				}

				//...................................
				//End Creating vao.
				gl.ctx.bindVertexArray(null);			
				gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, null);

				//...................................
				//Create & Bind TransformFeedback.
				this.writeFeedback[i] = gl.ctx.createTransformFeedback();			
				gl.ctx.bindTransformFeedback(gl.ctx.TRANSFORM_FEEDBACK, this.writeFeedback[i]);			//Bind Feedback
				gl.ctx.bindBufferBase(gl.ctx.TRANSFORM_FEEDBACK_BUFFER, 0, this.dynamicBuffers[i] );	//Bind buffer to feedback
				gl.ctx.bindTransformFeedback(gl.ctx.TRANSFORM_FEEDBACK, null);
			}
			return this;
		}

		// Setup alternating VAOs for rendering data. Both VAOs will link to the same
		// vertex buffers, but each one will link to A or B buffers used in feedback.
		// So every draw call, we alternate which draw VAO to execute.
		// Draw A -> Feedback A, Draw B -> Feedback B.
		setupDraw(){
			var itm;

			for(var i=0; i < 2; i++){
				//-----------------------------------
				//Create and Bind VAO
				gl.ctx.bindVertexArray( this.vaoDraw[i] = gl.ctx.createVertexArray() );

				//-----------------------------------
				//Setup Vertex Attributes
				
				//TODO Bind Index if Available.

				//Bind Vertex, UI, Normal, etc.
				gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, this.vertexBuffer); //Bind Buffer
				for(var j=0; j < this.vertexDef.partCount; j++){
					itm = this.vertexDef.parts[j];
					gl.ctx.enableVertexAttribArray( itm.drawLoc );
					gl.ctx.vertexAttribPointer( itm.drawLoc, itm.compCount, gl.ctx.FLOAT, false, this.vertexDef.stride, itm.offset );
				}

				//-----------------------------------
				//If static data exists, bind whats assigned for drawing and make it instanced data
				if(this.staticBufferDef != null){
					gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, this.staticBuffer);

					for(var j=0; j < this.staticBufferDef.partCount; j++){
						itm = this.staticBufferDef.parts[j];
						if( (itm.usedIn & FeedbackUseMode.Draw) == 0) continue;

						gl.ctx.enableVertexAttribArray( itm.drawLoc );
						gl.ctx.vertexAttribPointer( itm.drawLoc, itm.compCount, gl.ctx.FLOAT, false, this.staticBufferDef.stride, itm.offset );
						gl.ctx.vertexAttribDivisor( itm.drawLoc, 1 );	// Make Attribute Instanced
					}
				}

				//If dynamic data exists, bind whats assigned for drawing and make it instanced data
				if(this.dynamicBuffers != null){
					gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, this.dynamicBuffers[i]);

					for(var j=0; j < this.dynamicBuffersDef.partCount; j++){
						itm = this.dynamicBuffersDef.parts[j];
						if( (itm.usedIn & FeedbackUseMode.Draw) == 0) continue;

						gl.ctx.enableVertexAttribArray( itm.drawLoc );
						gl.ctx.vertexAttribPointer( itm.drawLoc, itm.compCount, gl.ctx.FLOAT, false, this.dynamicBuffersDef.stride, itm.offset );
						gl.ctx.vertexAttribDivisor( itm.drawLoc, 1 );	// Make Attribute Instanced
					}
				}

				//-----------------------------------
				//Clean up
				gl.ctx.bindVertexArray(null);			
				gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, null);
			}
			return this;
		}
	//endregion
}

export default TransformFeedback;
export { FeedbackUseMode };