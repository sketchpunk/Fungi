import { Components, Entity }	from "../fungi/engine/Ecs.js";

//############################################################################
class Collider{
	constructor(){
		this.type = null;
	}

	static $( e ){
		if( !e.Collider ) Entity.addByName( e, "Collider");
		return e;
	}
} Components( Collider );


//############################################################################
export default Collider;