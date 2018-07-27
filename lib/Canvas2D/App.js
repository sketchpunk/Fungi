import Vec2			from "/fungi/maths/Vec2.js";
import Canvas2D		from "../Canvas2D.js";
import RenderLoop	from "../../fungi/RenderLoop.js";

import Ecs, { Assemblages, Components, System }	from "./Ecs.js";
import Draw 		from "./components/Draw.js";
import DrawSystem 	from "./systems/DrawSystem.js";

class App{
	static launch(onRender = null){
		if(onRender) App.loop = new RenderLoop(onRender, 30);

		//-----------------------------------------
		// Setup Canvas
		App.canvas	= new Canvas2D("FungiCanvas")
							.bottomLeft()
							.style("#00ff00","#d0d0d0", 3);

		//-----------------------------------------
		// Setup Canvas
		App.ecs = new Ecs();
		Assemblages.add("Draw", ["Draw"] );
		App.ecs.addSystem(new DrawSystem(), 200);

		return App;
	}

	////////////////////////////////////////////////////////////////////
	// LOADING
	////////////////////////////////////////////////////////////////////
		static async useHierarchy( priority=100 ){
			await Promise.all([
				import("./components/Hierarchy.js"),
				import("./systems/DrawHierarchySystem.js").then( mod=>{ App.ecs.addSystem(new mod.default(), priority); })
			]);

			Assemblages.add("HDraw", ["Draw", "Hierarchy"] );
		}
}

////////////////////////////////////////////////////////////////////
// Static Global Varaibles
////////////////////////////////////////////////////////////////////
App.canvas	= null;
App.loop	= null;
App.ecs		= null;


////////////////////////////////////////////////////////////////////
// Functions
////////////////////////////////////////////////////////////////////
function newDraw(eName = "draw_entity"){
	return App.ecs.newAssemblage("Draw", eName);
}


////////////////////////////////////////////////////////////////////
export default App;
export { Vec2, Draw, newDraw, Components, System, Assemblages };