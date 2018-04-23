import Vec3		from "../../fungi/maths/Vec3.js";
import Quat		from "../../fungi/maths/Quat.js";
import DualQuat	from "../../fungi/maths/DualQuat.js";

//##################################################################
// SHADER TEMPLATES
class Armature{
	constructor(){
		this.root	= new Joint("root");
		this.joints	= new Array();
	}

	bindPose(){ //only call once when all bones are set where they need to be.
		var stack = [ this.root ];
		var j, jj, p

		while(stack.length > 0){
			this.joints.push( j = stack.pop() );
			p = j.parent;
			//console.log(j.name,this.joints.length-1);

			//................................
			//Calc our local Pos/Rotation
			j.dqLocal.set(j._rotation, j._position);

			//................................
			//Calculate the World Pos/Rotation
			if(p)	DualQuat.mul(p.dqWorld, j.dqLocal, j.dqWorld);	// parent.world * child.local = child.world
			else	j.dqWorld.copy(j.dqLocal);						// no parent, world == local

			//................................
			//Invert the World Dual-Quaternion which create our Bind Pos
			//  This creates a way to "subtract" one DQ from another (You really can't subtract)
			//  So by inverting one, you can use multiplication to achieve the idea of "subtraction"
			j.dqWorld.invert( j.dqBindPose );

			//................................
			//Add children to stack, to continue the loop
			if(j.children.length > 0) for(jj of j.children) stack.push(jj);
		}
	}

	update(){ var j; for(j of this.joints) j.update(); }

	getJoint(name){
		var j;
		for(j of this.joints) if(j.name == name) return j;
		return null;
	}

	//Used by a renderable to get the offset joint values
	//for deforming the mesh to simulate movement (animations)
	getFlatOffset(out){
		var ii, dq;
		out = out || new Float32Array( this.joints.length * 8 );

		for(var i=0; i < this.joints.length; i++){
			dq = this.joints[i].dqOffset;
			ii = i * 8;
			
			out[ii+0] = dq[0];
			out[ii+1] = dq[1];
			out[ii+2] = dq[2];
			out[ii+3] = dq[3];
			out[ii+4] = dq[4];
			out[ii+5] = dq[5];
			out[ii+6] = dq[6];
			out[ii+7] = dq[7];
		}
		return out;
	}

	//Used by ArmaturePreview
	getFlatWorldSpace(out=null){ //Used for visualizing bones
		var ii, dq;
		out = out || new Float32Array( this.joints.length * 8 );

		for(var i=0; i < this.joints.length; i++){
			dq = this.joints[i].dqWorld;
			ii = i * 8;
			
			out[ii+0] = dq[0];
			out[ii+1] = dq[1];
			out[ii+2] = dq[2];
			out[ii+3] = dq[3];
			out[ii+4] = dq[4];
			out[ii+5] = dq[5];
			out[ii+6] = dq[6];
			out[ii+7] = dq[7];
		}
		return out;
	}
}


//##################################################################
// SHADER TEMPLATES
class Joint{
	constructor(name, pos = null, rot = null){
		this.name	= name;
		this.order	= 0;
		this.level	= 0;
		this._isModified = false;

		//..............................
		//Position and Rotation should be private.
		this._position = new Vec3();
		this._rotation = new Quat();
		if(pos) this._position.copy(pos);
		if(rot) this._rotation.copy(pos);

		//..............................
		//Dual Quaternions to Hold Rotation/Position data instead of using Matrices.
		this.dqLocal	= new DualQuat(); // Local Pos/Rot
		this.dqWorld	= new DualQuat(); // Local plus all parents up the tree
		this.dqBindPose	= new DualQuat(); // Initial Pos/Rot of joint
		this.dqOffset	= new DualQuat(); // World Pos minus BindPose = How much to move the joint actually.

		//..............................
		//Parent / Child Relations
		this.children	= [];
		this.parent		= null;
		this._parentModified = false;
	}

	//calc all the joint dq to be used in shaders
	update(){
		if(!this._parentModified && !this._isModified) return false;
		var isUpdated = false;

		//......................................
		//If parent exists BUT its data hasn't been updated, Request Update.
		if(this.parent != null && this.parent._isModified) this.parent.update();

		//......................................
		//Local Transformation has changed, Update Local DQ
		if(this._isModified){
			//Calc our local Pos/Rotation
			this.dqLocal.set(this._rotation, this._position);

			//Alert Children that their parent dq has been updated.
			var child;
			for(child of this.children) child.__parentModified();
		}

		//......................................
		//Figure out the world matrix.
		if(this.parent != null && (this._parentModified || this._isModified)){
			// parent.world * child.local = child.world
			DualQuat.mul(this.parent.dqWorld, this.dqLocal, this.dqWorld);
			this._parentModified	= false;
			this._isModified		= false;
			isUpdated = true;

		}else if(this.parent == null && this._isModified){	
			// no parent, world == local
			this.dqWorld.copy(this.dqLocal);
			this._isModified = false;
			isUpdated = true;
		}

		//......................................
		//Calc the difference from the bindPose, which is whats sent to shaders
		if(isUpdated){
			// offset = world * bindPose;
			DualQuat.mul(this.dqWorld, this.dqBindPose, this.dqOffset);
		}

		return isUpdated;
	}

	//----------------------------------------------
	// Get-Set Rotation and Position
		get position(){ return new Vec3(this._position); }
		get rotation(){ return new Quat(this._rotation); }

		set position(v){ this._isModified = true; this._position.copy(v); }
		set rotation(v){ this._isModified = true; this._rotation.copy(v); }

		setPosition(x,y,z){		this._isModified = true; this._position.set(x,y,z);		return this; }
		setRotation(x,y,z,w){	this._isModified = true; this._rotation.set(x,y,z,w);	return this; }
	//end region

	//----------------------------------------------
	//Parent-Child
		//This function should only be called by parent
		//Hopefully this will help cascade down the tree that the world matrix needs to be updated.
		__parentModified(){
			if(this._parentModified) return;
			this._parentModified = true;

			if(this.children.length == 0) return;
			for(var i=0; i < this.children.length; i++) this.children[i].__parentModified();
		}

		//get parent(){ this._parent; }
		//set parent(p){
			//if(this._parent != null){ this._parent.removeChild(this); }
			//if(p != null) p.addChild(this); //addChild also sets parent
		//}

		addChild(name, pos=null, rot=null){
			var j = new Joint(name, pos, rot);
			j.level		= this.level + 1;
			j.parent	= this;

			this.children.push(j);
			return j;
		}

		removeChild(c){ 
			var i = this.children.indexOf(c);
			if(i != -1){
				this.children[i].parent = null;
				this.children.splice(i,1);
			}
			return this;
		}
	//endregion
}

export default Armature;