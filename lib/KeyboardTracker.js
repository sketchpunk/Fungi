class KeyboardTracker{
	constructor(){
		document.addEventListener("keydown",	this.onKeyDown.bind(this));
		document.addEventListener("keyup",		this.onKeyUp.bind(this));

		this.keyState = []; //Keep track of the key state
	}

	key(kCode){	return (this.keyState[kCode] == true); }

	arrows(){
		var rtn = {}; 
		for(var itm in KeyboardTracker.arrowKeys){
			rtn[ itm ] = ( this.keyState[ KeyboardTracker.arrowKeys[itm] ] == true);
		}
		return rtn;
	}

	onKeyDown(e){	this.keyState[ e.keyCode ] = true; }
	onKeyUp(e){ 	this.keyState[ e.keyCode ] = false; }
}
KeyboardTracker.arrowKeys = { left:37, up:38, right:39, down:40 }; //space:32

export default KeyboardTracker;