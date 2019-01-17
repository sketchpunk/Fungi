
import { structElementChunk }	from "./ParticleSystem.js";
import { FeedbackUseMode }		from "./TransformFeedback.js";

var PM = {};

//##################################################################
// Position
	class ModPosition{
		static run(psys, params, fbData){
			if(params == null){ console.log("Position Module needs params"); return false; }
			if(params.placement == undefined){ console.log("Position Module needs params.placement"); return false; }

			psys.addFeedbackWrite(ModPosition.varName,"vec3", ModPosition.mainCodeFeedback, ModPosition.mainCodeDraw);

			fbData.add("Position",
				ModPosition.placement[ params.placement ]( psys, params, fbData ),
				structElementChunk(ModPosition.varName, 3, psys._locFeedback, psys._locDraw, FeedbackUseMode.WriteDraw)
			);

			return true;
		}
	}
	PM.Position = ModPosition;
	ModPosition.varName				= "particlePos";
	ModPosition.mainCodeFeedback	= "v_particlePos = a_particlePos;";
	ModPosition.mainCodeDraw		= "localPos += a_particlePos;";
	ModPosition.placement = {
		//...........................................
		circleSegment : function(psys, params){
			var aLen	= psys.particleCount * 3, //Three floats per particle (x,y,z)
				ary		= new Array(aLen),
				radInc	= Math.PI * 2 / psys.particleCount,
				radius 	= params.radius || 1;

			var ii,rad;
			for(var i=0; i < psys.particleCount; i++){
				rad	= i * radInc;
				ii	= i * 3;
				ary[ii]		= radius * Math.cos(rad);
				ary[ii+1]	= 0;
				ary[ii+2]	= radius * Math.sin(rad);
			}

			return ary;
		},
		//...........................................
		test : function(psys, params){
			var aLen	= psys.particleCount * 3, //Three floats per particle (x,y,z)
				ary		= new Array(aLen),
				v		= 1 / 3 * 0.4;

			//For test data just move the vertices on the x axis
			for(var i=0; i < aLen; i += 3){
				ary[i] = i * v;
				ary[i+1] = ary[i+2] = 0;
			}

			return ary;
		}
	}
//endregion


//##################################################################
// Velocity
	class ModVelocity{
		static run(psys, params, fbData, fbInfo){
			psys.addFeedbackRead(ModVelocity.varName,"vec3",ModVelocity.mainCodeFeedback,ModVelocity.mainCodeDraw);

			fbData.add("Velocity",
				ModVelocity.placement[ params.placement ]( psys, params, fbData ),
				structElementChunk(ModVelocity.varName, 3, psys._locFeedback, -1, FeedbackUseMode.Read)
			);

			return true;
		}
	}

	PM.Velocity						= ModVelocity;
	ModVelocity.varName				= "particleVelocity";
	ModVelocity.mainCodeFeedback	= "v_particlePos += a_particleVelocity;";
	ModVelocity.placement = {
		//...........................................
		test : function(psys, params){
			var aLen	= psys.particleCount * 3, //Three floats per particle (x,y,z)
				ary		= new Array(aLen),
				v		= 1 / 3 * (params.speed || 0.001);

			//For test data just move the vertices on the x axis
			for(var i=0; i < aLen; i += 3){
				ary[i+1] = (i+3) * v;
				ary[i] = ary[i+2] = 0;
			}

			return ary;
		},
		//...........................................
		normalizePos : function(psys, params, fbData){
			var aLen	= psys.particleCount * 3, //Three floats per particle (x,y,z)
				ary		= new Array(aLen),
				pos 	= fbData.getData("Position"),
				t 		= 0,
				speed 	= params.speed || 0.01;

			for(var i=0; i < aLen; i += 3){
				t = 1 / ( pos[i] * pos[i] + pos[i+1] * pos[i+1] + pos[i+2] * pos[i+2] ) * speed;
	 
				ary[i]		= pos[i] * t;
				ary[i+1]	= pos[i+1] * t;
				ary[i+2]	= pos[i+2] * t;
			}

			return ary;
		},
	}
//endregion


//##################################################################
// Colors
	class ModColor{
		static run(psys, params, fbData, fbInfo){
			psys.addDraw(ModColor.varName, "vec3", null, ModColor.mainCodeDrawFrag, true);

			fbData.add("Color",
				ModColor.placement[ params.placement ]( psys, params, fbData ),
				structElementChunk(ModColor.varName, 3, -1, psys._locDraw, FeedbackUseMode.Draw)
			);

			return true;
		}
	}

	PM.Color					= ModColor;
	ModColor.varName			= "particleColor";
	ModColor.mainCodeDrawFrag	= "FragColor = vec4(v_particleColor,1.0);";
	ModColor.placement = {
		//...........................................
		test : function(psys, params){
			var aLen	= psys.particleCount * 3, //Three floats per particle (x,y,z)
				ary		= new Array(aLen);

			//For test data just move the vertices on the x axis
			var ii,j;
			for(var i=0; i < psys.particleCount; i++){
				ii = i * 3;
				j = i % 3;
				ary[ii]		= (j == 0)? 1:0;
				ary[ii+1]	= (j == 1)? 1:0;
				ary[ii+2]	= (j == 2)? 1:0;
			}
			return ary;
		},
	}

export default PM;