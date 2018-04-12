import { ParseShader }	from "../Shader.js";

export default class Loader{
	static fromDownloads(ary){
		Loader.shaders(ary);
	}


	static shaders( ary ){
		//................................................
		//Find all the Snippets
		var itm, snipAry = new Map();
		for(itm of ary){
			if(itm.type == "snippet")
				snipAry.set(itm.file, itm.download);
		}

		//................................................
		var txt;
		for(itm of ary){
			if(itm.type != "shader") continue;
			txt = itm.download;

			//------------------------------------
			// Check if there is any Snippets that needs to be
			// Inserted into the shader code
			if(itm.snippets){
				for(var i=0; i < itm.snippets.length; i++){
					txt = txt.replace(
						new RegExp("#snip " + itm.snippets[i], 'gi'),
						snipAry.get(itm.snippets[i])
					);
				}
			}

			//------------------------------------
			ParseShader(txt);
		}
	}
}