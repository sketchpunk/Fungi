import Voxel 			from "./Voxel.js";
import Vao 				from "../../fungi/Vao.js";
import DynamicBuffer	from "../../fungi/data/DynamicBuffer.js";
import Renderable		from "../../fungi/rendering/Renderable.js";

class DynamicVoxel extends Renderable{
	constructor(name, vc, matName){
		super(name, null, matName);
		this.drawMode = 4; //gl.ctx.TRIANGLES;
		this.chunk = vc;

		this.vao 			= Vao.standardEmpty(name, 4, 1, 0, 0, 1);
		this.bufVertices 	= DynamicBuffer.newFloat(this.vao.bVertices.id, Voxel.COMPLEN, 1);
		this.bufIndex 		= DynamicBuffer.newElement(this.vao.bIndex.id, 1);
	}

	chunkUpdate(){
		var vAry = [], iAry = [];
		Voxel.buildMesh(this.chunk, vAry, iAry);
		
		this.bufVertices.pushToGPU(vAry);
		this.bufIndex.pushToGPU(iAry);
		this.vao.elmCount = this.bufIndex.getComponentCnt();

		return this;
	}
}

export default DynamicVoxel;