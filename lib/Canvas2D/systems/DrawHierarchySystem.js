import { System } from "../Ecs.js";

const QUERY_COM = ["Draw", "Hierarchy"];

class DrawHierarchySystem extends System{
	constructor(){ super(); }

	update(ecs){
		let d,		// Draw
			h,		// Hierarchy
			e,		// Entity
			c,		// Child
			isMod,	// isModified
			ary = ecs.queryEntities( QUERY_COM, thSort );

		for( e of ary ){
			d		= e.Draw;
			h		= e.Hierarchy;
			isMod 	= (d.isModified || (h && h.parentModified));

			if(! isMod ) continue;

			d.isModified		= false;
			h.parentModified	= false;

			//....................................................
			// Mark children to force update
			if( h.children.length != 0 ){
				for(c of h.children) c.Hierarchy.parentModified = true;
			}


			//....................................................
			//Handle Specific Draw Types
			switch(d.type){
				//---------------------------------
				case "line":
					h.angle = d.angle;
					if(h.parent){
						h.angle += h.parent.Hierarchy.angle;
						h.position.copy( h.parent.Draw.positionEnd );
					}else{
						h.position.copy( d.position );
					}

					d.positionEnd.set(
						h.position.x + Math.cos(h.angle) * d.length,
						h.position.y + Math.sin(h.angle) * d.length
					);
					break;

				//---------------------------------
				default:
					if(!h.parent)	h.position.copy( d.position );
					else			h.parent.Hierarchy.position.add(d.position, h.position); //World Position
			}
		}//for
	}

}

//Compare function to sort entities based on the level of the hierarchy.
function thSort(a,b){
	//Any entity without TH thrown to the start of the list
	if(!a.Hierarchy) return -1; 	
	if(!b.Hierarchy) return 1;

	//Sort by Hierarachy Levels so parents are calculated before children
	let lvlA = a.Hierarchy.level,
		lvlB = b.Hierarchy.level;

	if(lvlA == lvlB)		return  0;	// A = B
	else if(lvlA < lvlB)	return -1;	// A < B
	else					return  1;	// A > B
}


export default DrawHierarchySystem;