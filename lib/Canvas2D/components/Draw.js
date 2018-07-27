import { Components } from "../Ecs.js";
import Vec2			from "../../../fungi/maths/Vec2.js";

class Draw{
	constructor(){
		this.mode		= "stroke"; // fill
		this.type		= "none";
		this.style		= null;
		this.isModified	= true;
		this.position	= new Vec2();
	}

	static initCircle(e, radius, mode = "stroke"){
		let d = (e instanceof Draw)? e : e.Draw;
		d.type		= "circle";
		d.radius	= radius;
		d.mode		= mode;
		return e;
	}

	static initLine(e, len=10, angle=0){
		let d = (e instanceof Draw)? e : e.Draw;
		d.type			= "line";
		d.length		= len,
		d.angle			= angle,
		d.positionEnd	= new Vec2();
		return e;
	}
} Components( Draw );

export default Draw;