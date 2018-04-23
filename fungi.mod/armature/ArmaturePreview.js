import gl			from "../../fungi/gl.js";
import Vao			from "../../fungi/Vao.js";
import Shader		from "../../fungi/Shader.js";
import Renderable	from "../../fungi/rendering/Renderable.js";

const ATTRIB_QD_ROT_LOC = 8;
const ATTRIB_QD_POS_LOC = 9;

//Renderer object to be able to visually see the Armature Data.
//TODO  NO DEPT TESTING

class ArmaturePreview extends Renderable{
	constructor(name, arm, jointLen = 0.5, matName = "ArmaturePreview"){
		super(name, null, matName);
		this.armature = arm;
		this.drawMode = gl.ctx.LINES;

		var verts	= [0,0,0,0, 0,jointLen,0,1],
			offset	= arm.getFlatWorldSpace(),

			oVao 	= new Vao().create()
				.floatBuffer("bVertices", verts, Shader.ATTRIB_POSITION_LOC, 4)
				.floatBuffer("bOffset", offset, ATTRIB_QD_ROT_LOC, 4, 32, 0, true, true)	// QR (Rotation)
				.partitionFloatBuffer(ATTRIB_QD_POS_LOC, 4, 32, 16, true)					// QD (Translation)
				.setInstanced( offset.length / 8 );

		this.vao = oVao.finalize(name);
		oVao.cleanup();
	}

	//TODO Only Update if dirty;
	update(){
		var offset = this.armature.getFlatWorldSpace(offset);
		gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, this.vao.bOffset.id);
		gl.ctx.bufferSubData(gl.ctx.ARRAY_BUFFER, 0, offset, 0, null);
		gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, null);
	}
}

export default ArmaturePreview;