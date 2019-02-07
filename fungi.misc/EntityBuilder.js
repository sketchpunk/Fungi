import App, { Vao, Entity } from "../fungi/engine/App.js";
import Armature from from "../fungi.armature/Armature.js";

class EntityBuilder{
	static fromJson( json, bin ){
		let e = App.$Node( json.entityName );

		if( json.draw )		this.draw( e, json, bin );
		if( json.bones )	this.bones( e, json );

		return e;
	}


	////////////////////////////////////////////////////////////////
	//
	////////////////////////////////////////////////////////////////
		static draw( e, json, bin ){
			let com = Entity.addByName( e, "Draw" );
			//com.add( vao, material=null, mode=4 );
		}


	////////////////////////////////////////////////////////////////
	//
	////////////////////////////////////////////////////////////////
		static bones( e, json, incPreview ){
			let com = Entity.addByName( e, "Armature" );

			if( !e.Draw ) Entity.addByName( e, "Draw" );
		}
}

export default EntityBuilder;