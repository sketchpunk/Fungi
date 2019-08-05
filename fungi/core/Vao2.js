import gl from "./gl.js";
import Shader from "./shader.js";

const BUF_V_NAME	= "vertices";
const BUF_N_NAME	= "normal";
const BUF_UV_NAME	= "uv";
const BUF_IDX_NAME	= "indices";
const BUF_BI_NAME	= "boneIndex";
const BUF_BW_NAME	= "boneWeight";

class Buf{
	static new_array( data, is_static=true, unbind=true ) {
		let ary	= ( data instanceof Float32Array )? data : new Float32Array( data ),
			id	= gl.ctx.createBuffer();
		gl.ctx.bindBuffer( gl.ctx.ARRAY_BUFFER, id );
		gl.ctx.bufferData( gl.ctx.ARRAY_BUFFER, ary, (is_static)? gl.ctx.STATIC_DRAW : gl.ctx.DYNAMIC_DRAW );

		if( unbind ) gl.ctx.bindBuffer( gl.ctx.ARRAY_BUFFER, null );
		return id;
	}

	static new_element( data, is_static=true, unbind=true ) {
		let ary	= ( data instanceof Uint16Array )? data : new Uint16Array( data ),
			id	= gl.ctx.createBuffer();
		gl.ctx.bindBuffer( gl.ctx.ELEMENT_ARRAY_BUFFER, id );
		gl.ctx.bufferData( gl.ctx.ELEMENT_ARRAY_BUFFER, ary, (is_static)? gl.ctx.STATIC_DRAW : gl.ctx.DYNAMIC_DRAW );

		if( unbind ) gl.ctx.bindBuffer( gl.ctx.ELEMENT_ARRAY_BUFFER, null );
		return id;
	}

	static set_attrib( attr_loc, comp_len, data_type, stride=0, offset=0 ){
		gl.ctx.enableVertexAttribArray( attr_loc );
		gl.ctx.vertexAttribPointer( attr_loc, comp_len, data_type, false, stride, offset );
		return this;
	}

	static bind_array( id ){ gl.ctx.bindBuffer( gl.ctx.ARRAY_BUFFER, id ); return this; }
	static unbind_array(){ gl.ctx.bindBuffer( gl.ctx.ARRAY_BUFFER, null ); return this; }

	static bind_element( id ){ gl.ctx.bindBuffer( gl.ctx.ELEMENT_ARRAY_BUFFER, id ); return this; }
	static unbind_element(){ gl.ctx.bindBuffer( gl.ctx.ELEMENT_ARRAY_BUFFER, null ); return this; }
}


class Vao{
	constructor( name="BlankVAO" ){
		this.id				= gl.ctx.createVertexArray();
		this.name			= name;
		this.elmCount		= 0;
		this.isIndexed		= false;
		this.isInstanced	= false;
		this.buf 			= {};
	}

	set( elm_cnt=0, is_instance=false ){
		this.elmCount		= elm_cnt;
		this.isInstanced	= is_instance;
		return this;
	}

	///////////////////////////////////////////////////////////////
	//
	///////////////////////////////////////////////////////////////
	
	add_buf( name, id, attr_loc, comp_len=3, data_type="FLOAT", stride=0, offset=0, is_instance=false ){
		gl.ctx.bindBuffer( gl.ctx.ARRAY_BUFFER, id );
		gl.ctx.enableVertexAttribArray( attr_loc );
		gl.ctx.vertexAttribPointer( attr_loc, comp_len, gl.ctx[data_type], false, stride, offset );

		if( is_instance ) gl.ctx.vertexAttribDivisor( attr_loc, 1 );

		this.buf[ name ] = { id }; 
		return this;
	}

	add_partition( attr_loc, comp_len=3, data_type="FLOAT", stride=0, offset=0, is_instance=false ){
		gl.ctx.enableVertexAttribArray( attr_loc );
		gl.ctx.vertexAttribPointer( attr_loc, comp_len, gl.ctx[data_type], false, stride, offset );

		if( is_instance ) gl.ctx.vertexAttribDivisor( attr_loc, 1 );
		return this;
	}

	///////////////////////////////////////////////////////////////
	//
	///////////////////////////////////////////////////////////////
	
	add_vertices( id, comp_len=3, stride=0, offset=0 ){
		return this.add_buf( BUF_V_NAME, id, Shader.POSITION_LOC, comp_len, "FLOAT", stride, offset );
	}

	add_indices( id ){ 
		gl.ctx.bindBuffer( gl.ctx.ELEMENT_ARRAY_BUFFER, id );

		this.buf[ BUF_IDX_NAME ]	= { id };
		this.isIndexed				= true;
		return this;
	}

	///////////////////////////////////////////////////////////////
	//
	///////////////////////////////////////////////////////////////
	
	bind(){ gl.ctx.bindVertexArray( this.id ); return this; }
	unbind(){ gl.ctx.bindVertexArray( null ); return this; }
	unbind_all(){
		gl.ctx.bindVertexArray( null );
		gl.ctx.bindBuffer( gl.ctx.ARRAY_BUFFER, null );

		if( this.isIndexed ) gl.ctx.bindBuffer( gl.ctx.ELEMENT_ARRAY_BUFFER, null );
		return this;
	}

	static unbind(){ gl.ctx.bindVertexArray( null ); return this; }
	static set_cache( vao ){ Cache.vaos.set( vao.name, vao ); return this; }


	///////////////////////////////////////////////////////////////
	//
	///////////////////////////////////////////////////////////////

	static standard_by_buf( uName, elm_cnt, comp_len, vert_id, idx_id = null ){
		let vao = new Vao( uName ).bind();

		vao.add_vertices( vert_id, comp_len );
		if( idx_id ) vao.add_indices( idx_id );

		return vao.set( elm_cnt ).unbind_all();
	}
}

export default Vao;
export { Buf };