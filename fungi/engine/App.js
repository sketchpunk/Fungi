import gl 			from "../core/gl.js";
import Shader 		from "../core/Shader.js";
import Ubo			from "../core/Ubo.js";
import Cache  		from "../core/Cache.js";

import Page			from "./lib/Page.js";
import RenderLoop 	from "./RenderLoop.js";
import InputTracker from "./lib/InputTracker.js";

import Ecs, { Assemblages } 	from "./Ecs.js";
import Camera, { CameraSystem }	from "./ecs/Camera.js";
import Node, { NodeSystem } 	from "./ecs/Node.js";
import { DrawSystem }			from "./ecs/Draw.js";
import InputSystem				from "./ecs/InputSystem.js";

/*
System Notes
001 - Input 
100 - Misc : DynamicVerts
700 - Physics
800 - Transform
801 - Camera
950 - Draw
1000 - Cleanup
*/

//######################################################
class App{
	//////////////////////////////////////////////
	// LOADERS
	//////////////////////////////////////////////
		static async launch( onDraw = null, dlAry = null ){
			if( ! await init_gl() ) throw "GL Init Error";	// Create HTML Elements and GL Context
			if( dlAry ) await init_resources( dlAry );		// Download and Load Up Resources

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// ECS
			init_ecs();

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// CAMERA
			App.camera = App.ecs.newEntity( "MainCamera", [ "Node", "Camera" ] );		
			Camera.setPerspective( App.camera );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// MISC
			App.input = new InputTracker();
			if( onDraw ) App.loop = new RenderLoop( onDraw, 0, App );
		}

		static async loadModules(){
			let i, pAry = new Array( arguments.length );

			for(i=0; i < arguments.length; i++){
				pAry[ i ] = import( arguments[i] ).then( runModuleInit );
			}

			await Promise.all( pAry );
		}

		static async loadScene( useDebug=false ){
			let pAry = [];

			pAry.push( import( "../primitives/GridFloor.js").then( mod=>mod.default() ) );

			//Load up Visual Debugging Objects
			if( useDebug) pAry.push( import( "./Debug.js").then( mod=>mod.default.init( App.ecs ) ) );

			await Promise.all( pAry );
		}


	//////////////////////////////////////////////
	// SETTER / GETTERS
	//////////////////////////////////////////////
		static loopState( state = true ){
			if( state ) App.loop.start();
			else 		App.loop.stop();
			return App;
		}


	//////////////////////////////////////////////
	// ENTITY MANAGEMENT
	//////////////////////////////////////////////
		static newDraw( name ){ return this.ecs.newAssemblage( "Draw", name ); }
		static newNode( name ){ return this.ecs.newAssemblage( "Node", name ); }
}


//######################################################

//////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////
	function SleepAsync( ms ){ return new Promise( resolve => setTimeout(resolve, ms) ); }

	function runModuleInit( mod ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Run any System Init function if it exists
		let sys;
		for( let m in mod ){
			//console.log( m );
			if( m.endsWith("System") ){
				sys = mod[ m ];
				if( sys.init ) sys.init( App.ecs );
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Check if the default has an init Static function
		if( mod.default.init ) mod.default.init( App.ecs );
	}


//////////////////////////////////////////////
// INITIALIZERS
//////////////////////////////////////////////
	async function init_gl(){
		Page.init();
		await SleepAsync( 50 ); // Need time for the new html elements to render to properly finish loading GL.

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( !gl.init("pgCanvas") ) return false;

		let box = gl.ctx.canvas.getBoundingClientRect(); // if not enough sleep time, can not get correct size
		gl.setClearColor("#d0d0d0")
			.setSize( box.width, box.height )
			.clear();

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

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// ASSEMBLAGES
		Assemblages.add( "Node", ["Node"] );
		Assemblages.add( "Draw", ["Node", "Draw"] );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SYSTEMS
		InputSystem.init( App.ecs );	// Handle Input for controlling the camera
		NodeSystem.init( App.ecs );		// Handle Transform Heirachy
		CameraSystem.init( App.ecs );	// Just Camera Matrices
		DrawSystem.init( App.ecs );		// Render Enttities
	}


//######################################################
// GLOBAL VARIABLES
App.ecs				= null;		// Main ECS instances, Primarily the World Entity List.
App.loop			= null;		// Render Loop
App.camera			= null;		// Reference to the Main Camera for the view port
App.input			= null;		// Handle Keeping Mouse and Keyboard state for application
App.cache			= Cache;	// Quick Access to Cache
App.node 			= Node;		// Quick Access to Node Static Functions

App.deltaTime		= 0;		// Time between frames
App.sinceStart		= 1;		// Time since the render loop started.


//######################################################
export default App;