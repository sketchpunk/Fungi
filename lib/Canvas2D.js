
class Canvas2D{
	constructor(elmName){
		this.canvas	= document.getElementById(elmName);
		this.ctx	= this.canvas.getContext("2d");
		this.width	= this.canvas.width = window.innerWidth;
		this.height	= this.canvas.height = window.innerHeight;

		this.clearX	= 0;
		this.clearY	= 0;
	}

	//===================================================
	// Canvas Settings
		center(){
			this.ctx.translate(this.width * 0.5, this.height * 0.5);
			this.clearX = -this.width * 0.5;
			this.clearY = -this.height * 0.5;
			return this;
		}

		bottomLeft(){
			this.ctx.translate(0, this.height);
			this.ctx.scale(1,-1);
			this.clearX = 0;
			this.clearY = 0;
			return this;
		}

		lineWidth(v){ this.ctx.lineWidth = v; return this; }
		fill(v){ this.ctx.fillStyle = v; return this; }
		style(cFill = "#ffffff", cStroke = "#505050", lWidth = 3){
			if(cFill != null) 	this.ctx.fillStyle		= cFill;
			if(cStroke != null) this.ctx.strokeStyle	= cStroke;
			if(lWidth != null) 	this.ctx.lineWidth		= lWidth;
			return this;
		}

		lineDash(ary = null){ 
			if(ary == null) ary = [0];
			this.ctx.setLineDash(ary);
			return this;
		}

		font(font = "12px verdana", textAlign="left"){
			if(font)		this.ctx.font		= font;
			if(textAlign)	this.ctx.textAlign	= textAlign;
			return this;
		}


	//===================================================
	// Canvas Methods
		clear(){ this.ctx.clearRect(this.clearX, this.clearY, this.width, this.height); return this; }

		restoreTransform(){ this.ctx.restore(); return this; }
		saveTransform(vpos = null, ang = null, vscale = null){
			this.ctx.save();
			if(vpos)		this.ctx.translate(vpos[0],vpos[1]);
			if(ang != null)	this.ctx.rotate(ang);
			if(vscale)		this.ctx.scale(vscale[0], vscale[1]);
			return this;
		}



	//===================================================
	// Drawing
		circle(x, y, radius = 10, draw = "fill"){
			this.ctx.beginPath();
			this.ctx.arc(x, y, radius ,0, Math.PI*2, false);
			this.ctx[draw]();
			return this;
		}

		vecCircle(draw, radius, v){
			if(arguments.length > 3){
				for(var i=1; i < arguments.length; i++){
					this.ctx.beginPath();
					this.ctx.arc(arguments[i][0], arguments[i][1], radius ,0, Math.PI*2, false);
					this.ctx[draw]();
				}
			}else{
				this.ctx.beginPath();
				this.ctx.arc(v[0], v[1], radius ,0, Math.PI*2, false);
				this.ctx[draw](); //this.ctx.fill();
			}
			return this;
		}

		vecEllipse(v, xRadius = 5, yRadius = 10, draw = "stroke"){
			this.ctx.beginPath();
			this.ctx.ellipse(v[0], v[1], xRadius, yRadius , 0, Math.PI*2, false);
			this.ctx[draw]();
			return this;
		}

		vecLine(draw, p0, p1){
			this.ctx.beginPath();
			this.ctx.moveTo( p0[0], p0[1] );

			if(arguments.length > 3){
				for(var i=2; i < arguments.length; i++)
					this.ctx.lineTo( arguments[i][0], arguments[i][1] );

			}else this.ctx.lineTo( p1[0], p1[1] );

			this.ctx[draw]();
			return this;
		}

		text(x, y, txt){
			this.ctx.fillText(txt, x, y);
			return this;
		}

		rect(x,y,w,h){ this.ctx.fillRect(x,y,w,h); return this; }
}

export default Canvas2D;