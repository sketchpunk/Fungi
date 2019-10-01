import App, { gl, Entity, Components, Shader, Material } from "../App.js";
import Vao, { Buf }	from "../../core/Vao2.js";
import { Vec3 } from "../../maths/Maths.js";


//###################################################################################

let COLORS = {
	"black"		: "#000000",
	"white"		: "#ffffff",
	"red"		: "#ff0000",
	"green"		: "#00ff00",
	"blue"		: "#0000ff",
	"fuchsia"	: "#ff00ff",
	"cyan"		: "#00ffff",
	"yellow"	: "#ffff00",
	"orange"	: "#ff8000",
};

function colour( c ){
	if( c == null || c == undefined ) return gl.rgbArray( "#ff0000" );

	if( typeof c == "string" ){
		if( c.charAt(0) == "#" ) 	return gl.rgbArray( c );
		else if( COLORS[ c ] )		return gl.rgbArray( COLORS[ c ] );
	}else if( Array.isArray(c) ) return c;

	return gl.rgbArray( "#ff0000" );		
}

class Lines{
	static $( e, capacity=6 ){
		if( !e ) e = App.$Draw();
		if( e instanceof Entity && !e.Points ) Entity.com_fromName( e, "Lines" );

		e.Lines.init( capacity );
		e.Draw.add( e.Lines.vao, g_material, 1 );

		g_material
			.add_uniform( "dash_seg", 1 / e.Lines.dash_seg )
			.add_uniform( "dash_div", e.Lines.dash_div );

		return e;
	}

	////////////////////////////////////////////////////////
	// 
	////////////////////////////////////////////////////////
	constructor(){
		this.vao			= null;
		this.is_modified	= true;
		this.data			= null;
		this.data_dbuf		= null;

		this.dash_seg		= 0.06;
		this.dash_div		= 0.5;
	}

	init( capacity=6 ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( !g_shader ) init_shader();

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.data = new InterleavedArray()
			.add_var( "pos", 3 )
			.add_var( "color", 3 )
			.add_var( "len", 1 )
			.expand_by( capacity );
		
		let data_buf	= Buf.empty_array( this.data.byte_capacity, false );	// Create Empty Buffers on the GPU with the capacity needed.

		this.data_dbuf	= new DynBuffer( data_buf, this.data.byte_capacity );	// Manage Updating / Resizing the Buffers on the GPU
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let stride_blen = this.data.stride_byte_len;
		this.vao = new Vao()
			.bind()
			.add_buf( "vertices", data_buf, 0, 3, "FLOAT", stride_blen, this.data.var_byte_offset("pos") )
			.add_partition( 1, 3, "FLOAT", stride_blen, this.data.var_byte_offset("color") )
			.add_partition( 2, 1, "FLOAT", stride_blen, this.data.var_byte_offset("len") )
			.unbind_all()
			.set( 0 );
		
		return this;
	}

	////////////////////////////////////////////////////////
	// 
	////////////////////////////////////////////////////////
		set( idx, data, v_name="pos" ){
			if( v_name == "color" ) data = colour( data );

			this.data.set( idx, v_name, data ); 
			this.is_modified = true; 
			return this;
		}

		add( a, b, col_a=null, col_b=null ){
			this.is_modified = true;

			let len = Vec3.len( a, b );
			col_a = colour( col_a );
			col_b = ( col_b )? colour( col_b ) : col_a;
			return [ 
				this.data.push( a, col_a, 0 ),
				this.data.push( b, col_b, len ),
			];
		}

	////////////////////////////////////////////////////////
	// 
	////////////////////////////////////////////////////////
		update(){
			if( !this.is_modified ) return this;

			// Update the GPU buffers with the new data.
			this.data_dbuf.update( this.data.buffer );

			this.vao.elmCount	= this.data.len;
			this.is_modified	= false;
			return this;
		}
} Components( Lines );


//###################################################################################
class DynBuffer{
	constructor( buf, cap, is_ary_buf=true ){
		this.target		= (is_ary_buf)? gl.ctx.ARRAY_BUFFER : gl.ctx.ELEMENT_ARRAY_BUFFER;
		this.capacity	= cap;	// Capacity in bytes of the gpu buffer
		this.byte_len	= 0;	// How Many Bytes Currently Posted ot the GPU
		this.buf 		= buf;	// Reference to buffer that will be modified
	}

	update( type_ary ){
		let b_len = type_ary.byteLength;

		gl.ctx.bindBuffer( this.target, this.buf );

		// if the data size is of capacity on the gpu, can set it up as sub data.
		if( b_len <= this.capacity ) gl.ctx.bufferSubData( this.target, 0, type_ary, 0, null );
		else{
			this.capacity = b_len;
			// if( this.byte_len > 0) gl.ctx.bufferData( this.target, null, gl.ctx.DYNAMIC_DRAW ); // Clean up previus data
			gl.ctx.bufferData( this.target, type_ary, gl.ctx.DYNAMIC_DRAW );
		}

		gl.ctx.bindBuffer( this.target, null ); // unbind buffer
		this.byte_len = b_len;
	}
}


//###################################################################################
/*
	// TEST
	let sf_buf = new InterleavedArray();
	sf_buf
		.add_var( "pos", 3 )
		.add_var( "size", 1 )
		.add_var( "color", 3 )
		.add_var( "shape", 1 )
		.expand_by( 3 );
	sf_buf.push( [1,2,3], 5, [0,0,0], 0 );
	sf_buf.push( [4,5,6], 6, [0,0,0], 0 );
	sf_buf.push( [7,8,9], 7, [0,0,0], 0 );
	sf_buf.set( 1, "size", 100 );
	sf_buf.set( 2, "pos", [300,200,100] );
*/
class InterleavedArray{ //
	constructor(){
		this.capacity	= 0;
		this.buffer		= null;
		this.len 		= 0;			// Count of Elements ( Total set of stride components )
		this.stride_len	= 0;			// Stride Length in Float Count (Not bytes)
		this.vars		= new Array();
		this.map 		= {};
	}

	///////////////////////////////////////////////////////////////////
	// Buffer Data Management
	///////////////////////////////////////////////////////////////////

		get byte_capacity(){ return this.buffer.byteLength; }
		get stride_byte_len(){ return this.stride_len * 4; }
		var_byte_offset( v_name ){ return this.vars[ this.map[ v_name ] ].offset * 4; }

		add_var( name, float_len ){
			this.map[ name ] = this.vars.length;
			this.vars.push({
				name 	: name,
				len		: float_len,
				offset	: this.stride_len,
			});
			this.stride_len += float_len;
			return this;
		}

		set( idx, v_name, data ){
			let vr = this.vars[ this.map[ v_name ] ];

			idx = (idx * this.stride_len) + vr.offset;

			if( vr.len == 1 ) this.buffer[ idx ] = data;
			else{
				let i;
				for( i=0; i < vr.len; i++ ) this.buffer[ idx + i ] = data[ i ];
			}

			return this;
		}

		push(){
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Validation
			if( arguments.length != this.vars.length ){ console.error( "push argument length mismatch for stride buffer" ); return this; }
			if( this.len >= this.capacity ){ console.error( "InterleavedArray is at capacity" ); return this; }

			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			let j, i, a, v, idx = this.len, offset = idx * this.stride_len;

			for( i=0; i < arguments.length; i++ ){
				a = arguments[ i ];
				v = this.vars[ i ];

				if( v.len > 1 && a.length != v.len ){ console.error( "Variable len mismatch for ", v.name ); return this; }

				if( v.len == 1 ){
					this.buffer[ offset + v.offset ] = a;
				}else{
					for( j=0; j < v.len; j++ ) this.buffer[ offset + v.offset + j ] = a[ j ];
				}
			}

			this.len++;
			return idx;
		}

		rm( i ){
			/*
			if( i >= this.len ){ console.log( "Can not remove, Index is greater then length"); return this; }

			//If removing last one, Just change the length
			let b_idx = this.len - 1;
			if( i == b_idx ){ this.len--; return this; }

			let a_idx				= i * B_LEN;	// Index of Vec to Remove
			b_idx					*= B_LEN;		// Index of Final Vec.
			this.buffer[ a_idx ]	= this.buffer[ b_idx ];
			this.buffer[ a_idx+1 ]	= this.buffer[ b_idx+1 ];
			this.buffer[ a_idx+2 ]	= this.buffer[ b_idx+2 ];
			this.len--;
			*/
		
			return this;
		}

		expand_by( size ){
			let capacity	= this.capacity + size,
				fb			= new Float32Array( capacity * this.stride_len );

			if( this.buffer ){
				let i;
				for( i=0; i < this.buffer.length; i++ ) fb[ i ] = this.buffer[ i ];
			}

			this.capacity	= capacity;
			this.buffer		= fb;
			return this;
		}
}

//###################################################################################

let g_shader = null, g_material = null;
function init_shader(){
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// SETUP SHADER
	g_shader = Shader.build( "LineDash", v_shader_src, f_shader_src );
	Shader.prepareUniformBlock( g_shader, "UBOGlobal" );
	Shader.prepareUniform( g_shader, "dash_seg", "float" );
	Shader.prepareUniform( g_shader, "dash_div", "float" );


	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// SETUP MATERIAl
	g_material = new Material( "LineDash", g_shader )
		.opt_blend( true )
		.add_uniform( "dash_seg", 1 / 0.1 )
		.add_uniform( "dash_div", 0.4 );
}

//-----------------------------------------------
let v_shader_src = `#version 300 es
layout(location=0) in vec3 a_position;
layout(location=1) in vec3 a_color;
layout(location=2) in float a_len;

uniform UBOGlobal{
	mat4	projViewMatrix;
	vec3	cameraPos;
	float	globalTime;
	vec2	screenSize;
	float	deltaTime;
};

out vec3 v_color;
out float v_len;

void main(void){
	v_len 			= a_len;
	v_color			= a_color;
	gl_Position 	= projViewMatrix * vec4( a_position.xyz, 1.0 );
}`;

//-----------------------------------------------
let f_shader_src = `#version 300 es
precision mediump float;

in vec3 v_color;
in float v_len;

uniform float dash_seg;
uniform float dash_div;

out vec4 oFragColor;

void main(void){ 
	oFragColor = vec4( 
		v_color, 
		step( dash_div, fract( v_len * dash_seg ) )
	);
}`;


//###################################################################################
export default Lines;