import Fungi		from "../Fungi.js";
import Vao 			from "../Vao.js";

//Define quad with a Min Bound and Max Bound X,Y
function Quad(matName, name="Quad", bx0=-1, by0=-1, bz0=0, bx1=1, by1=1, bz1=0, stand=true){
	var e = Fungi.ecs.newAssemblage("Draw",name);
	e.com.Drawable.vao 		= Quad.vao( name="Quad", bx0, by0, bz0, bx1, by1, bz1, stand);
	e.com.Drawable.material	= Fungi.getMaterial(matName);
	e.com.Drawable.options.cullFace = false;
	return e;
}

Quad.vertData = function(bx0=-1, by0=-1, bz0=0, bx1=1, by1=1, bz1=0, stand=true){
	return {
		uv			:[ 0.0,0.0,   1.0,0.0,   1.0,1.0,   0.0,1.0 ],
		index 		:[ 0,1,2, 2,3,0 ],
		vertices	:(stand)?
				[ bx0,by0,bz0,   bx1,by0,bz1,   bx1,by1,bz0,   bx0,by1,bz0 ] :
				[ bx0,by0,bz0,   bx0,by0,bz1,   bx1,by1,bz1,   bx1,by1,bz0 ]
				//[ bx0,by0,bz0,   bx1,by0,bz0,   bx1,by1,bz1,   bx0,by1,bz1 ]
	};
}

Quad.vao = function(name="Quad", bx0=-1, by0=-1, bz0=0, bx1=1, by1=1, bz1=0, stand=true){
	var d = Quad.vertData(bx0, by0, bz0, bx1, by1, bz1, stand);
	return Vao.standardRenderable(name, 3, d.vertices, null, d.uv, d.index);
}

export default Quad;