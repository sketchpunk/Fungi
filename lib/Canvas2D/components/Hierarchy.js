import { Vec2 }			from "../App.js";
import { Components }	from "../Ecs.js";

class Hierarchy{
	constructor(){
		this.level			= 0;			// What level in the Hierachy
		this.parent			= null;			// Entity reference of the parent
		this.parentModified	= false;		// When a parent's Local/World Matrix updates, children are marked to update their world matrix
		this.children		= [];			// List of Children Entities

		this.position 		= new Vec2();
	}


	////////////////////////////////////////////////////////////////////
	// Child Management
	////////////////////////////////////////////////////////////////////
		static addChild(ep, ec){
			let ph = ep.Hierarchy;

			if( ph.children.indexOf(ec) != -1){
				console.log("%s is already a child of %s", ec.name, ep.name);
				return Hierarchy;
			}

			//...............................................
			//if child already has a parent, remove itself
			let ch = ec.Hierarchy;
			if(ch.parent != null) Hierarchy.removeChild( ch.parent, ec );

			//...............................................
			ch.parent	= ep;				//Set parent on the child
			ch.level	= ph.level + 1;		//Set the level value for the child
			ph.children.push( ec );			//Add child to parent's children list

			//...............................................
			//if child has its own children, update their level values
			if(ch.children.length > 0) updateChildLevel( ch );

			return Hierarchy;
		}

		static removeChild(ep, ec){
			var idx = ep.Hierarchy.children.indexOf(ec);

			if(idx == -1) console.log("%s is not a child of %s", ec.name, ep.name);
			else{
				//Update Child Data
				ec.Hierarchy.parent	= null;
				ec.Hierarchy.level		= 0;

				//Remove from parent
				ep.Hierarchy.children.splice(idx,1);
			}

			return Hierarchy;
		}

} Components(Hierarchy);


//#######################################################################
//recursive function to update the heirarachy levels in children
function updateChildLevel(h){
	let c, th;
	for(c of h.children){
		th			= c.Hierarchy;
		th.level	= h.level + 1;
		if(th.children.length > 0) updateChildLevel( th );
	}
}


export default Hierarchy;