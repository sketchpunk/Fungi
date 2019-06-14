class Overlay{
	constructor( rName="pgPanel" ){
		this.root = document.getElementById( rName );
	}

	load_css( path ){
		var head	= document.getElementsByTagName('head')[0],
			style	= document.createElement('link');

		style.href	= path;
		style.type	= "text/css";
		style.rel	= "stylesheet";
		head.append( style );
		return this;
	}

	mk_section(name, value){
		var elm		= { root: this.mk_elm( "section", null, null, this.root ) };
		elm.label	= this.mk_elm( "label", name, null, elm.root);
		elm.preview	= this.mk_elm( "span", value, null, elm.root);
		return elm
	}

	mk_elm( elmName, txt=null, cls=null, root=null ){
		var elm = document.createElement(elmName);
		if(root)		root.appendChild(elm);
		if(txt!=null)	elm.innerHTML = txt;
		if(cls)			elm.className = cls;
		return elm;
	}

	mk_input( type, value=null, root=null ){
		var elm = document.createElement("input");
		elm.type = type;

		if(root)			root.appendChild(elm);
		if(value != null) 	elm.value = value;
		return elm;
	}


	add_btn( value=null, func ){
		let elm 	= { root: this.mk_elm("section",null,null,this.root) };
		elm.input 	= newInput("button",value, elm.root);
		elm.input.addEventListener("click", func );
		return this;
	}

	add_title( txt ){
		var elm = { root: this.mk_elm("section",null,null,this.root) };
		elm.root.className = "div";
		elm.preview	= this.mk_elm("span",txt,null, elm.root);
		return this;
	}

	add_range( name, value=0, min=0, max=1, step=0.01, func ){
		let elm = this.mk_section( name, value );
		
		elm.input 		= this.mk_input("range", null, elm.root);
		elm.input.min	= min;
		elm.input.max	= max;
		elm.input.step	= step;
		elm.input.value	= value;
		
		elm.input.addEventListener("change", func);
		elm.input.addEventListener("input", function(){ elm.preview.innerText = this.value; });
		return this;
	}
}

export default Overlay;