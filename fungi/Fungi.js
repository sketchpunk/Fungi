export default {
	//............................
	//Main Objects
	camera		: null,
	scene		: null,
	render		: null,
	loop		: null,

	//............................
	//Shared Global Data
	deltaTime	: 0,
	sinceStart	: 1,

	//............................
	//Resources 
	shaders		: new Map(),
	materials	: new Map(),
	vaos		: new Map(),
	ubos		: new Map(),
	textures	: new Map(),

	getMaterial	: function(name){
		var m = this.materials.get(name);
		if(!m){ console.log("Material Not Found %s", name); return null; }
		return m;
	},

	getUBO		: function(name){
		var m = this.ubos.get(name);
		if(!m){ console.log("UBO Not Found %s", name); return null; }
		return m;
	},

	getTexture	: function(name){
		var m = this.textures.get(name);
		if(!m){ console.log("Texture Not Found %s", name); return null; }
		return m;
	},

	//............................
	//Constants
	PNT			: 0,
	LINE		: 1,
	LINE_LOOP	: 2,
	LINE_STRIP	: 3,
	TRI			: 4,
	TRI_STRIP	: 5
};