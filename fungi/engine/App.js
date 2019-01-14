import gl 			from "../core/gl.js";
import Shader 		from "../core/Shader.js";
import Ubo			from "../core/Ubo.js";
import Cache  		from "../core/Cache.js";

import Page			from "./lib/Page.js";
import RenderLoop 	from "./RenderLoop.js";

import Ecs, { Assemblages } 	from "./Ecs.js";
import Camera, { CameraSystem }	from "./ecs/Camera.js";
import { NodeSystem } 			from "./ecs/Node.js";
import { DrawSystem }			from "./ecs/Draw.js";

/*
System Notes


700 - Physics
800 - Transform
801 - Camera
950 - Draw
1000 - Cleanup
*/

//######################################################
class App{
	static async launch( dlAry = null ){
		if( !init_gl() ) throw "GL Init Error";			// Create HTML Elements and GL Context
		if( dlAry ) await init_resources( dlAry );		// Download and Load Up Resources

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		init_ecs();

		App.camera = App.ecs.newEntity( "MainCamera", [ "Node", "Camera" ] );		
		Camera.setPerspective( App.camera );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		console.log(" Run App ");
		return true;
	}

	static async loadModules( ary ){
		let i, pAry = new Array( ary.length );

		for(i=0; i < ary.length; i++){
			pAry[ i ] = import( "./ecs/" + ary[i] + ".js" ).then( loadModule );
		}

		await Promise.all( pAry );


		//await Promise.all([
		//	import( "./ecs/Node.js").then( mod=>{ console.log(mod); } )
		//]);
		console.log( "loadModules", ary );
	}

	static newDraw( name ){ 
		return this.ecs.newAssemblage( "Draw", name );
	}
	static newNode( name ){ return this.ecs.newAssemblage( "Node", name ); }
}


//######################################################
function loadModule( mod ){
	//console.log( m );
	let sys;
	for( let m in mod ){
		if( m.endsWith("System") ){
			sys = mod[ m ];
			if( sys.init ) sys.init( App.ecs );
		}
	}
}

function init_gl(){
	Page.init();
	if( !gl.init("pgCanvas") ) return false;

	gl.setClearColor("#d0d0d0").clear();

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Setup UBOs
	let uboGlobal = Ubo.build( "UBOGlobal", 0, [
		"projViewMatrix",	"mat4",
		"cameraPos",		"vec3",
		"globalTime",		"float",
		"screenSize",		"vec2"
	]);

	uboGlobal.setItem( "screenSize", new Float32Array( [ gl.width, gl.height ] ));

	let uboModel = Ubo.build( "UBOModel", 1, [
		"modelMatrix",	"mat4",
		"normalMatrix",	"mat3",
	]);

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	return true;
}

async function init_resources( dlAry ){
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Download Modules for Download and Loading support
	let dl, Loader;
	await Promise.all([
		import("./lib/Downloader.js").then(	mod=>{	dl		= new mod.default( dlAry ); }),
		import("./lib/Loader.js").then(	mod=>{		Loader	= mod.default; })
	]);

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Resource Downloading
	//dl.debug = false;
	if(! await dl.start() )	throw new Error("Error Downloading");

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Load up Shader & Materials	
	if( !Loader.parseShaderDownloads( dl.complete ) ) throw new Error("Error Parsing Shaders");


	/* TODO : Shader Snippet's Functionality, Redo it at some point
	//.................................
	// Load Up Shaders
	var arySnippets	= Loader.getSnippets( dl.complete ),
		aryShaders	= Loader.parseShaders( dl.complete, arySnippets );

	if(aryShaders == null)					throw new Error("Problems parsing shader text");
	if(!Loader.compileShaders(aryShaders))	throw new Error("Failed compiling shaders");

	//....................................
	// Load Other Resources
	Loader.textures( dl.complete );
	Loader.materials( aryShaders );
	*/
}

function init_ecs(){
	App.ecs = new Ecs();

	//....................................
	// ASSEMBLAGES
	Assemblages.add( "Node", ["Node"] );
	Assemblages.add( "Draw", ["Node", "Draw"] );

	//....................................
	// SYSTEMS
	NodeSystem.init( App.ecs );
	CameraSystem.init( App.ecs );
	DrawSystem.init( App.ecs );
}


//######################################################
// GLOBAL VARIABLES
App.ecs				= null;
App.loop			= null;
App.camera			= null;
App.input			= null;
App.cache			= Cache;

App.deltaTime		= 0;
App.sinceStart		= 1;


//######################################################
export default App;