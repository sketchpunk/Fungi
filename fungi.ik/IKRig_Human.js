import App		from "../fungi/engine/App.js";
import IKChain	from "./IKChain.js";
import Armature from "../fungi.armature/Armature.js";
import Pose 	from "../fungi.armature/Pose.js";


/*
{ 	spine: ["","",""]
	leg_l: [ "","" ],
	leg_r: [],
	arm_l: [],
	arm_r: [],
	foot_r: "",
	foot_l: "",
	neck:"",
	hip:""
}
*/

//#####################################################################
class IKRig_Human{
	constructor( e, json ){
		this.entity = e;
		//this.chain	= new IKChain( e.Armature, bNames );
		this.pose	= new Pose( e.Armature, true );

		this.leg_l	= new IKChain( e.Armature, json.leg_l, "z" );
		this.leg_r	= new IKChain( e.Armature, json.leg_r, "z" );
		this.arm_l 	= new IKChain( e.Armature, json.arm_l, "x" );
		this.arm_r 	= new IKChain( e.Armature, json.arm_r, "x" );

		this.hip	= Armature.getBone( e.Armature, json.hip ).Bone.order;
		this.spine	= new IKChain( e.Armature, json.spine );;
		
		//this.hand_l	= Armature.getBone( e.Armature, json.hand_l ).Bone.order;
		//this.hand_r	= Armature.getBone( e.Armature, json.hand_r ).Bone.order;
	}

	getEBone( i ){ return this.entity.Armature.bones[ i ]; }
	getPBone( i ){ return this.pose.bones[ i ]; }

	getPHip(){ return this.pose.bones[ this.hip ]; }
	//update(){ this.pose.apply(); return this; }
}


//#####################################################################
export default IKRig_Human;