class GamepadTracker{
	constructor(){
		this.gpIndex	= -1;
		this.profile 	= null;
		this.timestamp	= 0;
		this.hasChanged = false;

		window.addEventListener("gamepadconnected", this.onConnect.bind(this) );
		window.addEventListener("gamepaddisconnected", this.onDisconnect.bind(this) );
	}

	onDisconnect(e){ console.log("disconnect",e); this.gpIndex = -1; }
	onConnect(e){
		console.log("Index : %d, ID: %s", e.gamepad.index, e.gamepad.id);

		if(e.gamepad.id.indexOf("XInput") != -1 && this.gpIndex == -1){
			this.gpIndex = e.gamepad.index;
			this.profile = new Xbox();
		}

		if( e.gamepad.id.indexOf("Hotas") != -1 && this.gpIndex == -1 ){
			this.profile = new Hotas();
			this.gpIndex = e.gamepad.index;
		}
	}

	update(){
		if(this.gpIndex != -1){
			let gp = navigator.getGamepads()[ this.gpIndex ];

			if( gp.timestamp == this.timestamp ){ this.hasChanged = false; return; }

			this.timestamp 	= gp.timestamp;
			this.hasChanged	= true;

			this.profile.update( gp );

			let p 		= this.profile,
				moveX 	= 0,
				moveZ	= 0,
				orbitX	= 0,
				orbitY 	= 0,
				orbitD	= 0;


			if( p.pitch.isActive ){
				//this.view.ctrl.panY_inc( 10 * p.pitch.v * eng.deltaTime );
			}

			//if( p.roll.isActive ) moveX = 10 * p.roll.v * eng.deltaTime;
			
			//if( p.thrust.isActive ) moveZ = 10 * p.thrust.v * eng.deltaTime;
			//if( moveX || moveZ ) this.view.ctrl.setTargetPos( moveX, moveZ );
			////
			////if( p.yaw.isActive ) orbitY = 10 * p.yaw.v * eng.deltaTime;

			//if( p.rocker.isActive ) this.view.setDistance( 10 * p.rocker.v * eng.deltaTime );

			//if( p.hat.x ) orbitX = 10 * p.hat.x * eng.deltaTime;
			//if( p.hat.y ) orbitY = 10 * p.hat.x * eng.deltaTime;

			//if( orbitX || orbitY ){

			//}

			//return;
			/*
			//Update Button Data
			for(itm of this.buttons.values()){
				v = (gp.buttons[ itm.idx ].value > this.deadZone)? gp.buttons[ itm.idx ].value : 0;

				itm.hasChanged	= (v != itm.state);
				itm.state 		= v;
			}

			//Update Joystick Data
			for(itm of this.joySticks.values()){
				//Flip Y, Up is -1, rather it be positive and down be negative.
				//Flip X, Fungi uses Left, not Right, so flipping sign will make math work correctly

				itm.x = (Math.abs( gp.axes[ itm.xIdx ] ) > this.deadZone)? -gp.axes[ itm.xIdx ] : 0;
				itm.y = (Math.abs( gp.axes[ itm.yIdx ] ) > this.deadZone)? -gp.axes[ itm.yIdx ] : 0;

				itm.isActive = (itm.x != 0 || itm.y != 0);
			}
			*/
		}
	}
}

class Hotas{
	constructor(){
		this.deadZone	= 0.01;

		this.pitch	= { v:0, idx:1, isActive:false };
		this.roll	= { v:0, idx:0, isActive:false };
		this.yaw	= { v:0, idx:5, isActive:false };
		this.thrust	= { v:0, idx:2, isActive:false };
		this.rocker	= { v:0, idx:6, isActive:false };
		this.hat 	= { x:0, y:0, idx:9, isActive:false };
		this.axis	= [ "pitch", "roll", "yaw", "thrust", "rocker" ];

		this.L1		= { idx:1, state:0, hasChanged:false };
		this.L2		= { idx:9, state:0, hasChanged:false };
		this.L3		= { idx:3, state:0, hasChanged:false };
		this.R1		= { idx:0, state:0, hasChanged:false };
		this.R2		= { idx:8, state:0, hasChanged:false };
		this.R3		= { idx:2, state:0, hasChanged:false };
		
		this.B5		= { idx:4, state:0, hasChanged:false };
		this.B6		= { idx:5, state:0, hasChanged:false };
		this.B7		= { idx:6, state:0, hasChanged:false };
		this.B8		= { idx:7, state:0, hasChanged:false };

		this.btns 	= [ "L1", "L2", "L3", "R1", "R2", "R3", "B5", "B6", "B7", "B8" ];
	}

	update( gp ){
		let i, itm, v;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( i of this.axis ){
			itm = this[ i ];
			v = ( Math.abs( gp.axes[ itm.idx ] ) > this.deadZone )? gp.axes[ itm.idx ] : 0;
			itm.v = v;
			itm.isActive = ( v != 0 );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.hat.v = gp.axes[ this.hat.idx ];
		switch( this.hat.v ){
			case -1: 					this.hat.x = 1;		this.hat.y = 0; break;	// Up
			case 0.14285719394683838:	this.hat.x = -1;	this.hat.y = 0; break;	// Down
			case 0.7142857313156128:	this.hat.y = -1;	this.hat.x = 0; break;	// Left
			case -0.4285714030265808:	this.hat.y = 1;		this.hat.x = 0; break;	// Right
			default: 					this.hat.y = 0; 	this.hat.x = 0; break;	// Unchanged
		}
		this.hat.isActive = ( this.hat.v != 0 );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( i of this.btns ){
			itm = this[ i ];
			v = ( gp.buttons[ itm.idx ].value > this.deadZone )? gp.buttons[ itm.idx ].value : 0;

			itm.hasChanged	= (v != itm.state);
			itm.state 		= v;
		}
	}
}

class Xbox{
	constructor(){

	}

	update( gp ){

	}
}


GamepadTracker.xboxProfile = function(gt){
	//trying out the new Map :: http://exploringjs.com/es6/ch_maps-sets.html#sec_overview-maps-sets
	gt.joySticks = new Map()
		.set("leftStick",	{ x:0, y:0, xIdx:0, yIdx:1, isActive:false })
		.set("rightStick",	{ x:0, y:0, xIdx:2, yIdx:3, isActive:false });

	//State is 0 or 1, But for trigger buttons, its a number between 0 and 1, so you can check how far its pulled.
	//hasChanged, tells if the value state changes since the last update. Useful if you only want to do something
	//when the button's state changes like turning something On/Off
	gt.buttons	= new Map()
		.set("a",			{idx:0, state:0, hasChanged:false })
		.set("b",			{idx:1, state:0, hasChanged:false })
		.set("x",			{idx:2, state:0, hasChanged:false })
		.set("z",			{idx:3, state:0, hasChanged:false })
		.set("bumperL",		{idx:4, state:0, hasChanged:false })
		.set("bumperR",		{idx:5, state:0, hasChanged:false })
		.set("triggerL",	{idx:6, state:0, hasChanged:false })
		.set("triggerR",	{idx:7, state:0, hasChanged:false })
		.set("back",		{idx:8, state:0, hasChanged:false })
		.set("start",		{idx:9, state:0, hasChanged:false })
		.set("stickL",		{idx:10, state:0, hasChanged:false })
		.set("stickR",		{idx:11, state:0, hasChanged:false })
		.set("dup",			{idx:12, state:0, hasChanged:false })
		.set("ddown",		{idx:13, state:0, hasChanged:false })
		.set("dleft",		{idx:14, state:0, hasChanged:false })
		.set("dright",		{idx:15, state:0, hasChanged:false });
}

export default GamepadTracker;