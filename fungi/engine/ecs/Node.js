import { Components, System }	from "../Ecs.js";
import Transform	from "../../maths/Transform.js";
import Mat4			from "../../maths/Mat4.js";

//#########################################################################
class Node{
	constructor(){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Position / Rotation / Scale		
		this.isModified		= true;
		this.local			= new Transform();	
		this.world			= new Transform();
		this.modelMatrix	= new Mat4();

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Heirachy
		this.level			= 0;			// What level in the Hierachy
		this.parent			= null;			// Entity reference of the parent
		this.children		= [];			// List of Children Entities
	}

	////////////////////////////////////////////////////////////////////
	// Child Management
	////////////////////////////////////////////////////////////////////
		static addChild( pe, ce ){
			let pn = pe.Node;

			if( pn.children.indexOf( ce ) != -1){
				console.log("%s is already a child of %s", ce.info.name, pe.info.name);
				return Node;
			}

			//...............................................
			//if child already has a parent, remove itself
			let cn = ce.Node;
			if( cn.parent != null ) Node.removeChild( cn.parent, ce );

			//...............................................
			cn.parent	= pe;				//Set parent on the child
			cn.level	= pn.level + 1;		//Set the level value for the child
			pn.children.push( ce );			//Add child to parent's children list

			//...............................................
			//if child has its own children, update their level values
			if(cn.children.length > 0) updateChildLevel( cn );

			return TransformNode;
		}

		static removeChild( pe, ce ){
			var idx = pe.Node.children.indexOf( ce );

			if(idx == -1) console.log("%s is not a child of %s", ce.info.name, pe.info.name);
			else{
				//Update Child Data
				ce.Node.parent	= null;
				ce.Node.level	= 0;

				//Remove from parent
				pe.Node.children.splice( idx,1 );
			}

			return Node;
		}
} Components( Node );


//#########################################################################
const QUERY_COM = [ "Node" ];

class NodeSystem extends System{
	static init( ecs, priority = 800, priority2 = 1000 ){ 
		ecs.addSystem( new NodeSystem(), priority );
		ecs.addSystem( new NodeCleanupSystem(), priority2 );
	}

	constructor(){ super(); }
	update( ecs ){
		let e,		// Entity
			cn,		// Child Node ( only if parent node exists )
			ary	= ecs.queryEntities( QUERY_COM, thSort );

		for( e of ary ){
			cn = e.Node;

			// if parent has been modified, then child should also be concidered modified.
			if( cn.parent !== null && cn.parent.isModified ) cn.isModified = true;
			if( !cn.isModified ) continue;

			// if parent exists, add parent's world transform to the child's local transform
			if( cn.parent !== null )	Transform.add( cn.parent.Node.world, cn.local, cn.world );
			else						cn.world.copy( cn.local );

			// Create Model Matrix for Shaders
			Mat4.fromQuaternionTranslationScale( cn.world.rot, cn.world.pos, cn.world.scl, cn.modelMatrix );

			//.............................................
			//cn.isModified = true; // To simplify things, this should be done in a Sub System after rendering.
		}
	}
}


//#########################################################################
class NodeCleanupSystem extends System{
	constructor(){ super(); }
	update(ecs){
		let e, ary = ecs.queryEntities( QUERY_COM, thSort );
		for( e of ary ) if( e.Node.isModified ) e.Node.isModified = true;
	}
}


//#########################################################################
//Compare function to sort entities based on the level of the hierarchy.
function thSort( a, b ){
	//Sort by Hierarachy Levels so parents are calculated before children
	let lvlA = a.Node.level,
		lvlB = b.Node.level;

	if(lvlA == lvlB)		return  0;	// A = B
	else if(lvlA < lvlB)	return -1;	// A < B
	else					return  1;	// A > B
}


function updateChildLevel( n ){
	let c, cn;
	for(c of n.children){
		cn			= c.Node;
		cn.level	= n.level + 1;
		if(cn.children.length > 0) updateChildLevel( cn );
	}
}


//#########################################################################
export default Node;
export { NodeSystem, NodeCleanupSystem };