import Fungi	from "../../fungi/Fungi.js";
import Quat		from "../../fungi/maths/Quat.js";
import Vec3		from "../../fungi/maths/Vec3.js";

class ArmatureAnimator{
	constructor(kf,arm){
		this.keyFrames = kf;
		this.armature = arm;
		this.itemLink = [];

		this.isRunning = false;
		this.startTime = 0;

		this.idxFrom = 0;
		this.idxTo = 0;

		this.link_KF_Armature();
	}

	//Create a quick index from keyframe items to armature joints
	//This allows for easy look up when updating the animations.
	//So by pre linking everything, we save time during the animation.
	link_KF_Armature(){
		var iAry = this.keyFrames.itemNames;
		var joint = null;
		for(var i=0; i < iAry.length; i++){
			//...........................
			//Look at all the keyframe items and find joints of the same name.
			joint = this.armature.getJoint(iAry[i]);
			if(joint == null){
				console.log("Can not find a joint with the key frame item name:",);
				continue;
			}

			//...........................
			//Link Keyframe Item Name, to Armature Joint.
			this.itemLink[ iAry[i] ] = joint; 
		}
		//console.log(this.itemLink);
	}

	start(){
		this.isRunning = true;
		this.startTime = Fungi.sinceStart; //TODO, Maybe use deltaTime and not have it tied to system clock
		return this;
	}

	//Search for two key frames that fit the current time of animation.
	findKeyframesBetweenT(t){
		var kf = this.keyFrames.frames;

		for(var i=0; i < kf.length-1; i++){
			if(t >= kf[i].t && t <= kf[i+1].t){
				this.idxFrom = i;
				this.idxTo = i+1;
				break;
			}
		}
	}

	update(){
		var kf = this.keyFrames.frames,				//Key Frame Ref
			ct = Fungi.sinceStart-this.startTime;	//Current Time

		//.......................................
		//If current time is over the end time of animation, then reset to the beginning.
		if(ct > this.keyFrames.maxTime){
			this.startTime = Fungi.sinceStart;
			this.idxFrom = 0;
			this.idxTo = 1;
			ct = 0;
		}

		//.......................................
		//Check if the currently selected indexes create the correct time range.
		if(! (ct >= kf[this.idxFrom].t && ct <= kf[this.idxTo].t)) this.findKeyframesBetweenT(ct);

		//.......................................
		var iLink,							//Ref to Armature Joint to update
			itmA,							//Ref to Item Animation Data for Keyframe A
			itmB,							//Ref to Item Animation Data for Keyframe B
			keyA 	= kf[this.idxFrom],		//Ref to Starting Keyframe
			keyB 	= kf[this.idxTo],		//Ref to Ending Keyframe
			t		= (ct - keyA.t) / (keyB.t - keyA.t); 	//Normalize current time between the two key frames

		if(keyB.t - keyA.t == 0) t = 0;//TODO Need to redo this whole function.
		
		var quat = new Quat(),
			vec3 = new Vec3();
		for(var itm in this.itemLink){
			//TODO, Need lots of error checks, if undefined, etc.
			//need to import blender actions to optimize code
			itmA = keyA.items[itm];		//Start KeyFrame
			itmB = keyB.items[itm];		//End KeyFrame
			iLink = this.itemLink[itm]; //Get Joint Reference

			//Todo, is it better to make keyframes dual quaternions then lerp that?
			//or better off doing rot/trans separately then set dualquat
			iLink.rotation = Quat.lerp(itmA.rotation, itmB.rotation, t, quat);
			iLink.position = Vec3.lerp(itmA.translation, itmB.translation, t, vec3);
		}

		//.......................................
		this.armature.update();
	}
}


/*=================================================
KeyFrame Data Structure
frames = 
[
	{t:int,items:[
		itmName:[ translation:vec3, scale:vec3, rotation:quat ]
	]}
]
=================================================*/
class KeyFrames{
	constructor(){
		this.frames = [];		//Key Frame Data Structure
		this.maxTime = 0;		//Min Time in Animation
		this.minTime = 100;		//Max Time in Animation
		this.itemNames = [];	//List Item names that are to be Animated.
	}

	addFrame(t,itmName,itmPropName,itmPropValue){
		if(this.itemNames.indexOf(itmName) == -1) this.itemNames.push(itmName);
		var iMin = -1;
		t *= 1000; //Move time from seconds to miliseconds.

		//---------------------------------
		//Check if frame exists or a sorted location to add new frame
		for(var i=0; i < this.frames.length; i++){
			//Frame exists
			if(this.frames[i].t == t){

				//Create Item if it does not exist.
				if(this.frames[i].items[itmName] == undefined)
					this.frames[i].items[itmName] = [];

				//Save property value
				this.frames[i].items[itmName][itmPropName] = itmPropValue;
				return;
			}else if(this.frames[i].t < t) iMin = i;
		}

		//---------------------------------
		//Create and insert new key frame
		var frame = {t:t, items:[]};
		frame.items[itmName] = [];
		frame.items[itmName][itmPropName] = itmPropValue;

		//---------------------------------
		if(iMin != -1)	this.frames.splice(iMin+1, 0, frame);
		else 			this.frames.push(frame);

		//---------------------------------
		//Figure starting and ending time for the while animation
		if(t > this.maxTime)	this.maxTime = t;
		if(t < this.minTime)	this.minTime = t;

		return frame;
	}

	getFrameAt(t){
		for(var i=0; i < this.frames.length; i++){
			if(this.frames[i].t == t) return this.frames[i];
		}
		return null;
	}
}

export { ArmatureAnimator, KeyFrames };