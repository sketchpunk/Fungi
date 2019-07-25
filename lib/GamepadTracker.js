class GamepadTracker{
	constructor(){
		this.gpIndex	= -1;
		this.buttons	= null;
		this.joySticks	= null;
		this.deadZone	= 0.1;
		this.isReady 	= false;

		window.addEventListener("gamepadconnected", this.onConnect.bind(this) );
		window.addEventListener("gamepaddisconnected", this.onDisconnect.bind(this) );
	}

	onDisconnect(e){ console.log("disconnect",e); }
	onConnect(e){
		console.log("Index : %d, ID: %s", e.gamepad.index, e.gamepad.id);
		if(e.gamepad.id.indexOf("XInput") && this.gpIndex == -1){
			this.gpIndex = e.gamepad.index;
			GamepadTracker.xboxProfile(this);
			this.isReady = true;
		}

		if( e.gamepad.id.indexOf("Hotas") ){
			this.gpIndex = e.gamepad.index;
			this.isReady = true;
		}
	}

	update(){
		if( !this.isReady ) return;
		/*float axis[4], GamepadButton {pressed: false, value: 0, touched: false}*/
		if(this.gpIndex != -1){
			var itm,v, gp = navigator.getGamepads()[ this.gpIndex ];
			console.log( gp );

			return;
			
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
		}
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