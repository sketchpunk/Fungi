import gl			from "./gl.js";
import Ubo			from "./Ubo.js";
import Fungi		from "./Fungi.js";
import Downloader	from "./net/Downloader.js";
import Loader		from "./data/Loader.js";
import Camera		from "./data/Camera.js";
import Renderer 	from "./rendering/Renderer.js";
import RenderLoop 	from "./rendering/RenderLoop.js";
import Scene 		from "./rendering/Scene.js";
import Mat4			from "./maths/Mat4.js";

class System{
	static getResources(resAry, onInit = null, onRender = null){	
		var p = Downloader.start(resAry)
			.then( ()=>{ System.startUp(onInit, onRender); } )  
			.catch( (err)=>{ console.log(err); } );
		//Promise.all([p]).then(values=>{ console.log(values); },reason =>{ console.log(reason); });
	}

	static startUp(onInit = null, onRender = null){
		//.........................................
		// Get GL Context
		if(!gl.init("FungiCanvas")){ console.log("Could not load canvas."); return; }

		//.........................................
		//Build UBOs
		System.UBOTransform = new Ubo("UBOTransform", 0)
			.addItem("projViewMatrix", "mat4")
			.addItem("cameraPos", "vec3")
			.addItem("globalTime", "float")
			.addItem("screenSize","vec2")
			.finalize(false)
			.updateItem("screenSize", new Float32Array( [ gl.width, gl.height ] ) )
			.unbind();

		//.........................................
		// Start Loading all the resources into GL.
		if(Downloader.complete.length > 0) Loader.fromDownloads(Downloader.complete); 


		//.........................................
		//
		Fungi.camera	= new Camera().setPerspective();
		Fungi.render	= new Renderer();
		Fungi.scene		= new Scene();

		if(onRender) Fungi.loop = new RenderLoop(onRender);


		//.........................................
		// Everything is setup, start the webapp.
		if(onInit) setTimeout(onInit, 50);
	}

	static update(){
		//..............................................
		//Update Camera and UBO
		Fungi.camera.updateMatrix();
		System.GlobalTime[0] = Fungi.sinceStart;

		var matProjView = new Mat4();
		Mat4.mult(matProjView, Fungi.camera.projectionMatrix, Fungi.camera.invertedWorldMatrix);

		System.UBOTransform.bind()
			.updateItem("projViewMatrix", matProjView)
			.updateItem("cameraPos", Fungi.camera._position)
			.updateItem("globalTime", System.GlobalTime ) //new Float32Array([Fungi.sinceStart])
			.unbind();

		//..............................................
		Fungi.render.drawScene( Fungi.scene.items );
	}
};

System.UBOTransform = null; //Save reference, so no need to request it from Fungi in render loop
System.GlobalTime 	= new Float32Array([0]); //Allocate this once for UBO and reuse for renderloop

export default System;