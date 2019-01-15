import App			from "./App.js";
import Quat			from "../../maths/Quat.js";
import Vec3			from "../../maths/Vec3.js";
import { System }	from "../Ecs.js";

//###########################################################################
const LOOK_RATE 		= 0.002;
const ORBIT_RATE		= 0.003;
const PAN_RATE			= 0.008;
const KB_FORWARD_RATE	= -0.1;
const KB_ROTATE_RATE	= 0.04;

const FRAME_LIMIT		= 1;


//###########################################################################
class InputSystem extends System{
	static init( ecs, priority = 1 ){ ecs.addSystem( new InputSystem(), priority ); }

	constructor(){
		super();

		this.isActive	= false;	//
		this.mode		= 1;		//Which Mouse Mode to use
		this.state_c	= false;	//State of the C button
		this.wheelChg	= null;

		//Keep track of inital state for mode
		this.initRotation = new Quat();	
		this.initPosition = new Vec3();

		//Track last mouse change, so if no change, dont handle mouse movements
		this.lastYChange = 0;
		this.lastXChange = 0;
	}

	update( ecs ){
		//............................................
		//Handle Keyboard Input
		if( App.input.keyCount > 0 ) this.handleKeyboard();

		//console.log(ecs);

		//............................................
		//Handle Mouse Wheel Change
		if( App.input.wheelUpdateOn !== this.wheelChg){
			this.wheelChg = App.input.wheelUpdateOn;

			let t	= App.camera.Node.local,
				cc	= ( App.input.isCtrl() )? 5 : 1;

			t.pos.add( Api.getLocalForward( App.camera, null, KB_FORWARD_RATE * App.input.wheelValue * cc) );
			App.camera.Node.isModified = true;
		}


		//............................................
		//Has mouse movement started, if so which mode to be in
		if( !App.input.leftMouse ){  //if(!Fungi.input.isMouseActive){
			this.isActive = false;		
			return;	
		}else if(!this.isActive){
			this.isActive = true;
			this.initRotation.copy( App.camera.Node.local.rot );
			this.initPosition.copy( App.camera.Node.local.pos );

			if( App.input.keyState[16] == true)			this.mode = 0; // Shift - Pan Mode
			else if( App.input.keyState[17] == true)	this.mode = 2; // Ctrl - Orbit Mode
			else 										this.mode = 1; // Look
		}


		//............................................
		//Only handle mouse Movements if there was a change since last frame.
		if(	this.lastYChange != App.input.coord.idy || 
			this.lastXChange != App.input.coord.idx ) this.handleMouse();

		this.lastYChange = App.input.coord.idy;
		this.lastXChange = App.input.coord.idx;
	}


	handleMouse(){
		let t = App.camera.Node.local,
			c = App.input.coord;

		switch(this.mode){
			//------------------------------------ LOOK
			case 1:
				//Quaternion Way
				//var pos = Fungi.camera.getPosition()
				//			.add( Fungi.camera.left(null, c.pdx * this.mLookRate) )
				//			.add( Fungi.camera.up(null, c.pdy * -this.mLookRate) )
				//			.add( Fungi.camera.forward() )
				//			.sub( Fungi.camera.getPosition() );

				//Works just as good without local position as a starting point then 
				//subtracting it to make a Direction vector
				//var pos = Fungi.camera.left(null, c.pdx * this.mLookRate)
				//			.add( Fungi.camera.up(null, c.pdy * -this.mLookRate) )
				//			.add( Fungi.camera.forward() );
				//Fungi.camera.rotation = Quat.lookRotation(pos, Vec3.UP);

				//Euler Way
				var euler = Quat.toEuler(this.initRotation);
				euler[0] += c.idy * LOOK_RATE;
				euler[1] += c.idx * LOOK_RATE;

				t.rotation.copy( Quat.fromEuler(null, euler[0], euler[1], 0, "YZX") );
				t.isModified = true;
			break;
			//------------------------------------ Orbit
			case 2:
				//Rotate the camera around X-Z
				var pos		= this.initPosition.clone(),
					lenXZ	= Math.sqrt(pos.x*pos.x + pos.z*pos.z),
					radXZ	= Math.atan2(pos.z, pos.x) + ORBIT_RATE * c.idx;

				pos[0]	= Math.cos(radXZ) * lenXZ;
				pos[2]	= Math.sin(radXZ) * lenXZ;

				//Then Rotate point around the the left axis
				var q = new Quat().setAxisAngle( Api.getLocalLeft( App.camera ) , -c.idy * ORBIT_RATE);
				Quat.rotateVec3(q, pos, pos);

				//Save New Position, then update rotation
				t.pos.copy( pos );
				t.rot.copy( Quat.lookRotation( pos, Vec3.UP ) );
				App.camera.Node.isModified = true;
			break;
			//------------------------------------ Panning
			default:
				t.position.copy( new Vec3()
					.add( Api.getLocalUp(	App.camera, null, PAN_RATE * c.idy) )		// Up-Down
					.add( Api.getLocalLeft(	App.camera, null, PAN_RATE * -c.idx) )	// Left-Right
					.add( this.initPosition )											// Add Change to Inital Position
				);
				App.camera.Node.isModified = true;
			break;
		}
	}


	handleKeyboard(){
		let key	= App.input.keyState,
			t	= App.camera.Node.local,
			ss	= ( App.input.isShift() )? 5.0 : 1.0;

		//.......................................
		//C - Output Camera Position and Rotation
		//Only do operation on Key Up.
		if(!key[67] && this.state_c){
			this.state_c = false;

			let axis = t.rot.getAxisAngle();
			console.log(".setPosition(%f, %f, %f)\n.setAxisAngle([%f,%f,%f], %f);", 
				t.pos.x, t.pos.y, t.pos.z,
				axis[0], axis[1], axis[2], axis[3]
			);
			console.log("Camera Length: %f", t.pos.length());
		}else if( key[67] && !this.state_c ) this.state_c = true;

		//..................................... Forward / Backwards
		 // w - s
		if(key[87] || key[83]){
			let s = (key[87])? KB_FORWARD_RATE : -KB_FORWARD_RATE;
			t.pos.add( Api.getLocalForward( App.camera, null, s * ss ) );
			App.camera.Node.isModified = true;
		}

		//..................................... Left / Right
		// A - D
		if(key[65] || key[68]){
			let s = (key[68])? -KB_FORWARD_RATE : KB_FORWARD_RATE;
			t.pos.add( Api.getLocalLeft( App.camera, null, s * ss ) );
			App.camera.Node.isModified = true;
		}

		//..................................... Left / Right
		// Q - E
		if(key[81] || key[69]){
			let s = (key[69])? -KB_ROTATE_RATE : KB_ROTATE_RATE;

			Quat.mulAxisAngle( t.rot, Vec3.UP, s * ss);
			App.camera.Node.isModified = true;
		}
	}
}


//###########################################################################
export default InputSystem;