import Vec3Buffer	from "../maths/Vec3Buffer.js";
import Vec3			from "../maths/Vec3.js";

class GeoUtil{
	//////////////////////////////////////////////////
	// Square
	//////////////////////////////////////////////////
		// Generate Vertices for a 2D Square
		static square_vertices_cnt( x_div=1, y_div=1 ){ return (y_div+1)*2 + (x_div-1)*2; }
		static square_vertices( out, idx, x_div=1, y_div=1, w=1, h=1, y_pos=0 ){
			let x_inc		= w / x_div,
				y_inc		= h / y_div,
				x			= w / 2,
				y			= h / 2,
				i;

			let put = ( x, z )=>{ out[ idx++ ] = x;  out[ idx++ ] = y_pos;  out[ idx++ ] = z; }
			for(i=0; i <= y_div; i++)	put( -x, -y + i* y_inc );	// Left
			for(i=1; i <= x_div; i++)	put( -x + i* x_inc, y );	// Bottom
			for(i=1; i <= y_div; i++)	put( x, y - i* y_inc );		// Right
			for(i=1; i <  x_div; i++)	put( x - i* x_inc, -y );	// Top
		}
	
	//////////////////////////////////////////////////
	// Grid
	//////////////////////////////////////////////////
		// Generate Vertices for a Grid
		static grid_vertices_cnt( x_div=2, y_div=2 ){ return (x_div+1) * (y_div+1); }
		static grid_vertices( out, idx, x_div=2, y_div=2, w=1, h=1, y_pos=0 ){
			let x_inc		= (x_div)? w / x_div : 0,
				y_inc		= (y_div)? h / y_div : 0,
				x			= w / 2,
				y			= h / 2,
				yy, i, j;

			for( i=0; i <= y_div; i++ ){
				yy = -y + i * y_inc;
				for( j=0; j <= x_div; j++ ){
					out[ idx++ ] = -x + j * x_inc;
					out[ idx++ ] = y_pos;
					out[ idx++ ] = yy;
				}
			}
		}

		// Get an array of indexes of the outer wall of the grid.
		static grid_vertices_outer_idx( x_div=2, y_div=2 ){
			let cnt 	= (y_div+1)*2 + (x_div-1)*2,
				ary 	= new Array( cnt ),
				x_cnt 	= x_div + 1,
				m_cnt 	= x_cnt * ( y_div + 1 ),
				idx 	= 0,
				i;

			for( i = 0; i < m_cnt; i += x_cnt )					ary[ idx++ ] = i;	// Left
			for( i = y_div * x_cnt + 1; i < m_cnt; i++ )		ary[ idx++ ] = i;	// Bot
			for( i = y_div * x_cnt - 1; i > 0; i -= x_div+1 )	ary[ idx++ ] = i;	// Right
			for( i = x_div-1; i > 0; i-- )						ary[ idx++ ] = i;	// Top
			return ary;
		}

		// Generate Triangle Indices for a Grid of Vertices : quad_cnt * 2_triangles * 3_pnts_per * rows
		static grid_indices_cnt( row_len, row_cnt, do_loop=false ){ return ((do_loop)? row_len : row_len-1) * 6 * row_cnt; }
		static grid_indices( out, idx, row_len, row_cnt, do_loop=false, start_vert_idx=0, rev_quad=false ){
			let row_stop = (do_loop)? row_len : row_len-1,	// Where to stop processing row
				a, b, c, d, i, ii, j, r0, r1;

			for( j=0; j < row_cnt; j++ ){
				r0 = start_vert_idx + j * row_len;	// Starting Index of Row 0
				r1 = r0 + row_len;					// Starting Index of Row 1

				for( i=0; i < row_stop; i++ ){
					ii	= (i + 1) % row_len;		// Go to start of row if over

					a 	= r0 + i;					// Defined the Vertex Index of a Quad
					b 	= r0 + ii;
					d 	= r1 + i;
					c 	= r1 + ii;

					// Save the Quad as Two Triangles
					if( !rev_quad ){
						out[ idx++ ] = a;			// Counter-ClockWise
						out[ idx++ ] = b;
						out[ idx++ ] = c;
						out[ idx++ ] = c;
						out[ idx++ ] = d;
						out[ idx++ ] = a;
					}else{
						out[ idx++ ] = a;			// ClockWise
						out[ idx++ ] = d;
						out[ idx++ ] = c;
						out[ idx++ ] = c;
						out[ idx++ ] = b;
						out[ idx++ ] = a;
					}
				}
			}
		}


	//////////////////////////////////////////////////
	// 
	//////////////////////////////////////////////////

		static arc_verts( angle_a, angle_b, div, radius=1, i=0 ){
			let inc = 1 / (div-1),
				out = new Vec3Buffer( div ),
				x, y, t, angle;

			for( i; i < div; i++ ){
				t		= i * inc;
				angle 	= angle_a * (1-t) + angle_b * t;
				x		= Math.cos( angle ) * radius;
				y		= Math.sin( angle ) * radius;
				out.push_raw( x, y, 0 );
			}
			return out;
		}


		static lathe( vbuf_path, steps=2, rot_axis="y" ){
			let v_len	= vbuf_path.len,
				out		= new Vec3Buffer( v_len*steps ),
				inc 	= Math.PI * 2 / steps;

			let i, j, angle, cos, sin;
			let rx, ry, rz;

			let v = new Vec3();

			for( i=0; i < steps; i++ ){
				angle 	= i * inc;
				cos		= Math.cos( angle );
				sin 	= Math.sin( angle );

				for( j=0; j < v_len; j ++ ){
					vbuf_path.copy_to( j, v );

					switch(rot_axis){ // https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/3drota.htm#Y-Axis%20Rotation
						case "y": ry = v.y;		rx = v.z*sin + v.x*cos;		rz = v.z*cos - v.x*sin; break;
						case "x": rx = v.x; 	ry = v.y*cos - v.z*sin;		rz = v.y*sin + v.z*cos; break;
						case "z": rz = v.z;		rx = v.x*cos - v.y*sin;		ry = v.x*sin + v.y*cos; break;
					}

					out.push_raw( rx, ry, rz );
				}
			}

			return out;

			/*
			var plen	= pathAry.length,
				inc		= Math.PI * 2 / -steps,
				rad, 
				cos, sin, 
				i, p, v, 
				rx, ry, rz;

			for(i=1; i < steps; i++){
				rad = i * inc;
				cos = Math.cos(rad);
				sin = Math.sin(rad);

				for(p of pathAry){
					v = this.cloneVert( p );

					switch(rotAxis){ // https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/3drota.htm#Y-Axis%20Rotation
						case "y": ry = v.y;		rx = v.z*sin + v.x*cos;		rz = v.z*cos - v.x*sin; break;
						case "x": rx = v.x; 	ry = v.y*cos - v.z*sin;		rz = v.y*sin + v.z*cos; break;
						case "z": rz = v.z;		rx = v.x*cos - v.y*sin;		ry = v.x*sin + v.y*cos; break;
					}

					v.set(rx, ry, rz);
				}
			}
			*/
		}
}

export default GeoUtil;

/*

		lathe(pathAry, steps, rotAxis = "y"){
			var plen	= pathAry.length,
				inc		= Math.PI * 2 / -steps,
				rad, 
				cos, sin, 
				i, p, v, 
				rx, ry, rz;

			for(i=1; i < steps; i++){
				rad = i * inc;
				cos = Math.cos(rad);
				sin = Math.sin(rad);

				for(p of pathAry){
					v = this.cloneVert( p );

					switch(rotAxis){ // https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/3drota.htm#Y-Axis%20Rotation
						case "y": ry = v.y;		rx = v.z*sin + v.x*cos;		rz = v.z*cos - v.x*sin; break;
						case "x": rx = v.x; 	ry = v.y*cos - v.z*sin;		rz = v.y*sin + v.z*cos; break;
						case "z": rz = v.z;		rx = v.x*cos - v.y*sin;		ry = v.x*sin + v.y*cos; break;
					}

					v.set(rx, ry, rz);
				}
			}
		}



	////////////////////////////////////////////////////////////////////
	// Create Triangles
	////////////////////////////////////////////////////////////////////
		//using two index arrays, if built counter clockwise, create triangles out of the quads that make up the wall.
		triangleWallLoop(iAryA,iAryB){
			let i, a, b, c, d, p,
				len = iAryA.length;

			for(i=0; i < len; i++){
				p = (i+1)%len;
				a = iAryB[i],
				b = iAryA[i],
				c = iAryA[p],
				d = iAryB[p];
				this.addFace(a,b,c,c,d,a);
			}
		}

		//Triangles in a fan way, With a center point connecting to circle of points
		triangleCircle(cIdx, cAry){
			let len	= cAry.length,
				i, ii;

			for(i=0; i < len; i++){
				ii = (i + 1) % len;
				this.addFace( cAry[i], cIdx, cAry[ii] );
			}
		}

		triangleGrid(cLen, rLen){
			var cc, rr, rA, rB, 
				a, b, c, d;

			for(rr=0; rr < rLen-1; rr++){
				rA = rr * cLen;
				rB = (rr+1) * cLen;
				for(cc=0; cc < cLen-1; cc++){
					a = rA + cc;	//Defined Quad
					b = rB + cc;
					c = b + 1;
					d = a + 1;
					this.addFace(a,b,c,c,d,a);
				}
			}
			return this;
		}

		triangleLathe(cLen, rLen, triStart = false, isLoop=true){
			var cc, rr, rA, rB,
				a, b, c, d,
				rEnd = (isLoop)? rLen : rLen-1;

			for(rr=0; rr < rEnd; rr++){
				rA = rr * cLen;
				rB = (rr+1) % rLen * cLen;

				for(cc=0; cc < cLen-1; cc++){
					a = rA + cc;	//Defined Quad
					b = rB + cc;
					c = b + 1;
					d = a + 1;

					if(triStart && cc == 0)	this.addFace(c,d,a);
					else 					this.addFace(a,b,c,c,d,a);
				}
			}
		}


		//Create index that will work for TRIANGLE_TRIP draw mode
		static triangleStrip(indAry,rLen,cLen,isLoop=false,doClose=false){ 
			// isLoop :: ties the left to the right
			// doClose :: is for paths that are closed shapes like a square
			var iLen = (rLen-1) * cLen,		//How many indexes do we need
				iEnd = (cLen*(rLen-1))-1,	//What the final index for triangle strip
				iCol = cLen - 1,			//Index of Last col
				posA = 0,					//Top Index
				posB = posA + cLen,			//Bottom Index
				c = 0;						//Current Column : 0 to iCol

			for(var i=0; i < iLen; i++){
				c = i % cLen;
				indAry.push(posA+c,posB+c);

				//Create degenerate triangles, The last then the first index of the current bottom row.
				if(c == iCol){
					if(i == iEnd && isLoop == true){
						if(doClose == true) indAry.push(posA,posB);
						indAry.push(posB+cLen-1,posB);
						iLen += cLen; //Make loop go overtime for one more row that connects the final row to the first.
						posA += cLen;
						posB = 0;
					}else if(i >= iEnd && doClose == true){
						indAry.push(posA,posB);
					}else if(i < iEnd){ //if not the end, then skip to next row
						if(doClose == true) indAry.push(posA,posB);
						indAry.push(posB+cLen-1, posB);
						posA += cLen;
						posB += cLen;
					}
				}
			}
		}

*/