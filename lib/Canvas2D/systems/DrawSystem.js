import { System }	from "../Ecs.js";
import App			from "../App.js";

const QUERY_COM = ["Draw"];

class DrawSystem extends System{
	constructor(){ super(); }
	update(ecs){
		let d, e, ary = ecs.queryEntities( QUERY_COM );

		App.canvas.clear();
		for(e of ary){
			d = e.Draw;

			//========================================================
			if(d.style){

			}

			//========================================================
			switch(d.type){
				//..........................................
				case "circle":
					if(d.isModified) d.isModified = false;
					App.canvas.circle(d.position.x, d.position.y, d.radius, d.mode);
					break;

				//..........................................
				case "line":
					if(d.isModified){
						d.isModified = false;
						d.positionEnd.set(
							d.position.x + Math.cos(d.angle) * d.length,
							d.position.y + Math.sin(d.angle) * d.length
						);
					}

					App.canvas.oneLine(
						(!e.Hierarchy)? d.position : e.Hierarchy.position,
						d.positionEnd
					);
					break;
			}
		}
	}
}

export default DrawSystem;