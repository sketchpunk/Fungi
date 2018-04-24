class Animator{
	constructor(kf){
		this.keyFrames = kf;

		this.isRunning = false;
		this.startTime = 0;

		this.idxFrom = 0;
		this.idxTo = 0;
	}

	start(){
		this.isRunning = true;
		this.startTime = Fungi.sinceStart; //TODO, Maybe use deltaTime and not have it tied to system clock
		return this;
	}

	update(){
		var kf = this.keyFrames.frames,				//Key Frame Ref
			ct = Fungi.sinceStart-this.startTime;	//Current Time

		//.......................................
		//If current time is over the end time of animation, then reset to the beginning.
		if(ct > this.keyFrames.maxTime){
			//console.log("RESET");
			this.startTime = Fungi.sinceStart;
			this.idxFrom = 0;
			this.idxTo = 1;
			ct = 0;
		}

		//.......................................
		//Check if the currently selected indexes create the correct time range.
		if(! (ct >= kf[this.idxFrom].t && ct <= kf[this.idxTo].t)){
			//console.log("find new kb pair",this.idxFrom,this.idxTo,ct,Fungi.sinceStart);
			//Search for two key frames that fit the current time of animation.
			for(var i=0; i < kf.length-1; i++){
				if(ct >= kf[i].t && ct <= kf[i+1].t){
					this.idxFrom = i;
					this.idxTo = i+1;
					break;
				}
			}
		}

		//.......................................
		var t1	= kf[this.idxFrom].t,		//Time in miliseconds for Key Frame 1
			t2	= kf[this.idxTo].t,			//Time in miliseconds for Key Frame 2
			t	= (ct - t1) / (t2 - t1); 	//Normalize current time between the two key frames

		console.log("-",t1,t2,this.idxFrom,this.idxTo,t);
		console.log(Fungi.sinceStart-this.startTime);
	}
}