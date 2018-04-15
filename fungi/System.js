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
			.then( ()=>{ System.prepare(onInit, onRender); } )  
			.catch( (err)=>{ console.log(err); } );
		//Promise.all([p]).then(values=>{ console.log(values); },reason =>{ console.log(reason); });
	}

	//Load Shaders First, Then Textures then Materials. If I load the resources in this order and if successful,
	//	Can avoid saving shader / texture names to do JIT loading. Trying to avoid doing extra IF statements during
	//	the render loop. For example, for materials I need the texture GPU ID, but I need to load texture first if not
	//	then I need to save its name, then have an if statement to cache the GPU later OR for every material load call,
	//	get the ID from the global cache. BUT if I can load textures first, then materials, I can save the up front
	//	then not have to deal with getting it from the cache later during each frame.
	static prepare(onInit = null, onRender = null){
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
		//Prepare Shaders
		var mapSnippets	= Loader.getSnippets( Downloader.complete ),
			aryShaders 	= Loader.parseShaders( Downloader.complete, mapSnippets );

		if(aryShaders == null){ console.log("Error parsing shader files."); return false; };

		if(!Loader.compileShaders(aryShaders)){ console.log("Error compiling shaders"); return false; }
		
		//.........................................
		//If we have things that requires time to load, Wait then continue
		if(Downloader.promiseList.length > 0){
			Promise.all( Downloader.promiseList ).then(
				values=>{
					Loader.textures( Downloader.complete );
					Loader.materials( aryShaders );

					//Start up System
					System.startup(onInit, onRender);
				}, reason=>{ console.log(reason); }
			);
		}else{
			//Nothing to wait for, Finish up loading.
			Loader.materials( aryShaders );
			System.startup(onInit, onRender);
		}
	}

	static startup(onInit, onRender){
		if(gl.ctx == null){
			if(!gl.init("FungiCanvas")){ console.log("Could not load canvas."); return; }
		}

		//.........................................
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