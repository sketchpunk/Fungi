export default class{
	static accel_vec3( dt, tension, damp, pos_tar, pos_cur_o, vel_o ){
		// a = -tension * ( pos - to ) / mass;
		// vel += ( a - damping * vel ) * dt;
		vel_o[0] += (-tension * ( pos_cur_o[0] - pos_tar[0] ) - damping * vel_o[0]) * dt;
		vel_o[1] += (-tension * ( pos_cur_o[1] - pos_tar[1] ) - damping * vel_o[1]) * dt;
		vel_o[2] += (-tension * ( pos_cur_o[2] - pos_tar[2] ) - damping * vel_o[2]) * dt;

		pos_cur_o[0] += vel_o[ 0 ] * dt;
		pos_cur_o[1] += vel_o[ 1 ] * dt;
		pos_cur_o[2] += vel_o[ 2 ] * dt;

		return pos_cur_o;
	}

	static accel_quat( dt, tension, damp, rot_tar, rot_cur_o, vel_o ){
		// a = -tension * ( pos - to ) / mass;
		// vel += ( a - damping * vel ) * dt;
		vel_o[0] += (-tension * ( rot_cur_o[0] - rot_tar[0] ) - damping * vel_o[0]) * dt;
		vel_o[1] += (-tension * ( rot_cur_o[1] - rot_tar[1] ) - damping * vel_o[1]) * dt;
		vel_o[2] += (-tension * ( rot_cur_o[2] - rot_tar[2] ) - damping * vel_o[2]) * dt;
		vel_o[3] += (-tension * ( rot_cur_o[3] - rot_tar[3] ) - damping * vel_o[3]) * dt;

		rot_cur_o[0] += vel_o[ 0 ] * dt;
		rot_cur_o[1] += vel_o[ 1 ] * dt;
		rot_cur_o[2] += vel_o[ 2 ] * dt;
		rot_cur_o[3] += vel_o[ 3 ] * dt;

		return rot_cur_o.norm();
		// ( Quat.dot( rot_cur, rot_tar ) >= 0.9999  && vel_o.lenSqr() < 0.00001 ) How to tell when done.
	}

	static springy_vec3( dt, fr, dt_scale, tension, damp, pos_tar, pos_cur_o, vel_o ){
		// dt *= scale;
		// accel = -this.stiffness * ( at - to );
		// vel = ( this.vel + accel * dt ) * Math.pow( 1 - this.damping / this.frameRate, this.frameRate * dt ); 
		// at = at + vel * dt;
		dt				*= dt_scale;
		let p_damp 		= Math.pow( 1 - damp / fr, fr * dt ), // TODO : 1 - damp / fr, can be cached somewhere
			dt_tension	= -tension * dt;

		vel_o[0] = ( vel_o[0] + ( pos_cur_o[0] - pos_tar[0] ) * dt_tension ) * p_damp;
		vel_o[1] = ( vel_o[1] + ( pos_cur_o[1] - pos_tar[1] ) * dt_tension ) * p_damp;
		vel_o[2] = ( vel_o[2] + ( pos_cur_o[2] - pos_tar[2] ) * dt_tension ) * p_damp;

		pos_cur_o[0] += vel_o[ 0 ] * dt;
		pos_cur_o[1] += vel_o[ 1 ] * dt;
		pos_cur_o[2] += vel_o[ 2 ] * dt;

		return pos_cur_o;
	}

	static springy_quat( dt, fr, dt_scale, tension, damp, rot_tar, rot_cur_o, vel_o ){
		// dt *= scale;
		// accel = -this.stiffness * ( at - to );
		// vel = ( this.vel + accel * dt ) * Math.pow( 1 - this.damping / this.frameRate, this.frameRate * dt ); 
		// at = at + vel * dt;
		dt				*= dt_scale;
		let p_damp 		= Math.pow( 1 - damp / fr, fr * dt ), // TODO : 1 - damp / fr, can be cached somewhere
			dt_tension	= -tension * dt;

		vel_o[0] = ( vel_o[0] + ( rot_cur_o[0] - rot_tar[0] ) * dt_tension ) * p_damp;
		vel_o[1] = ( vel_o[1] + ( rot_cur_o[1] - rot_tar[1] ) * dt_tension ) * p_damp;
		vel_o[2] = ( vel_o[2] + ( rot_cur_o[2] - rot_tar[2] ) * dt_tension ) * p_damp;
		vel_o[3] = ( vel_o[3] + ( rot_cur_o[3] - rot_tar[3] ) * dt_tension ) * p_damp;

		rot_cur_o[0] += vel_o[ 0 ] * dt;
		rot_cur_o[1] += vel_o[ 1 ] * dt;
		rot_cur_o[2] += vel_o[ 2 ] * dt;
		rot_cur_o[3] += vel_o[ 3 ] * dt;

		return rot_cur_o.norm();
	}
};


from_polar( lon, lat, up=null ){
	lat = Math.max( Math.min( lat, 89.999999 ), -89.999999 ); // Clamp lat, going to 90+ makes things spring around.

	let phi 	= ( 90 - lat ) * 0.01745329251, // PI / 180
		theta 	= ( lon + 180 ) * 0.01745329251,
		phi_s	= Math.sin( phi ),
		v		= [
			-( phi_s * Math.sin( theta ) ),
			Math.cos( phi ),
			phi_s * Math.cos( theta )
		];

	return Quat.look( v, up || Vec3.UP, this );
}

//pub const PI_H_MIN	:f32 = 1.57079630934166; 	// 89.999999