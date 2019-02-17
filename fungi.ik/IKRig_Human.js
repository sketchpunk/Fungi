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
		this.pose			= new Pose( e.Armature, true );

		this.leg_l_chain	= new IKChain( e.Armature, json.leg_l );
		this.leg_r_chain	= new IKChain( e.Armature, json.leg_r );

		//this.arm_l_chain = null;
		//this.arm_r_chain = null;

		//this.spine_chain = null;

		//this.neck	= null;
		
		this.hip			= Armature.getBone( e.Armature, json.hip ).Bone.order;

		//this.foot_l = null;
		//this.foot_r = null;
	}

	getEBone( i ){ return this.entity.Armature.bones[ i ]; }
	getPBone( i ){ return this.pose.bones[ i ]; }

	getPHip(){ return this.pose.bones[ this.hip ]; }
	//update(){ this.pose.apply(); return this; }
}


//#####################################################################
export default IKRig_Human;