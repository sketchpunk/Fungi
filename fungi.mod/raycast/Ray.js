	

	/* Came from Camera
	worldToScreen(vAry){
		var mat	= new Float32Array(16), // Matrix4 Holder
			p	= [0,0,0,0],			// Vec4
			rtn	= [];					// List of vec2 results

		//Move Points from WorldSpace to -> View Space (View Matrix) -> ClipSpace (ProjMatrix)
		Mat4.mult(mat,this.projectionMatrix,this.invertedLocalMatrix);

		for(var i=0; i < vAry.length; i++){
			Mat4.transformVec3(p, vAry[i], mat);

			//Move from Clip Space to NDC Space (Normalized Device Coordinate Space) (-1 to 1 opengl viewport)
			if(p[3] != 0){ //only if W is not zero,
				p[0] = p[0] / p[3];
				p[1] = p[1] / p[3];
			}

			//Then finally move the points to Screen Space
			//Map points from -1 to 1 range into  0 to 1 range, Then multiple by canvas size
			rtn.push( // Replaced /2 with *0.5
				( p[0] + 1) * 0.5 * gl.width,
				(-p[1] + 1) * 0.5 * gl.height
			);
		}

		if(vAry.length == 1) return rtn[0]; //Just return the one point
		return rtn;	//Return all the points
	}*/