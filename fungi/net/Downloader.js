/* SAMPLE ------------------------------------------------------
var p = Downloader.start([
	{type:"shader",file:"fungi/shaders/VecWColor.txt"},
	{type:"image",file:"pic.png", yFlip:false, mips:false }
]).then(function(){			setTimeout(onInit,50);
}).catch(function(error){	console.log(error); });

Promise.all([p]).then(values=>{ console.log(values); },reason =>{ console.log(reason); });
 -------------------------------------------------------------*/

var DebugMode		= false,
	IsActive		= false,	//Is the downloader currently downloading things
	ActivePromise	= null,		//Refernce to promise created by start
	PromiseResolve	= null,		//Resolve Reference for promise
	PromiseReject	= null,		//Reject Reference for promise
	Queue			= [],		//Queue of items to download
	Complete 		= [],		//Queue of completed items downloaded.
	XhrPoolSize		= 3,		//How Many xhr objects to make
	XhrPool 		= [],		//Like a threadpool
	PromiseList		= [];


for(var i=0; i < XhrPoolSize; i++){
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load",	onXhrComplete,false);
	xhr.addEventListener("error",	onXhrError,false);
	xhr.addEventListener("abort",	onXhrAbort,false);
	xhr.addEventListener("timeout",	onXhrTimeout,false);
	xhr.inUse = false;

	XhrPool.push(xhr);
}


//------------------------------------------------------------
// Public
//------------------------------------------------------------
function start(queueItems = null){
	if(IsActive) return;
	if(DebugMode) console.log("Downloader Starting");

	//Add Items to the Queue
	if(queueItems != null && queueItems.length > 0){
		for(var i=0; i < queueItems.length;i++) Queue.push(queueItems[i]);
	}

	//Create Promise that will do the work in the background.
	if(ActivePromise == null) 
		ActivePromise = new Promise((resolve,reject)=>{
			if(DebugMode) console.log("Promise Beginning");

			PromiseResolve	= resolve;
			PromiseReject	= reject;
			loadNext();
		});

	IsActive = true;
	return ActivePromise; 
}

function queueShader(file){ 	Queue.push({type:"shader", file:file}); }
function queueSnippet(file){ 	Queue.push({type:"snippet", file:file}); }

function activeCount(){
	var cnt = 0;
	for(var i = 0; i < XhrPoolSize; i++)
		if( XhrPool[i].inUse ) cnt++;
	return cnt;
}


//------------------------------------------------------------
// Private
//------------------------------------------------------------
function finalize(isSuccess,errMsg){
	IsActive = false;
	if(DebugMode) console.log("Download Finalizer", isSuccess, errMsg);

	if(isSuccess)	PromiseResolve(); //Can pass data with resolve if needed later
	else			PromiseReject(new Error(errMsg));

	ActivePromise	= null;
	PromiseResolve	= null;
	PromiseReject	= null;
}


function loadNext(){
	if(DebugMode) console.log("Load Next : Queue Size ", Queue.length, "Active", activeCount() );

	//Downloading is complete once we have an empty queue and no active downloads.
	if(Queue.length == 0 && activeCount() == 0){
		finalize(true);
		return;
	}

	//Is there an available Xhr for downloading?
	for(var i = 0; i < XhrPoolSize; i++){
		if( XhrPool[i].inUse ) continue;

		if(Queue.length == 0) break; //If we are out of queue items, exit loop

		//Get an item off the queue and begin downloading it.
		var itm		= Queue.pop(),
			handler	= Handlers[itm.type];

		if(handler == undefined){
			finalize(false,"Unknown download handler : " + itm.type);
			return;
		}

		get(XhrPool[i], itm, handler.downloadType);
	}
}


function get(xhr, itm, type){
	//xhr holds the active item incase in the future the call is set
	//to handle multiple downloads at a time with some sort of threadpool.
	//This way each ajax caller holds the download info that can then
	//be sent back to the download complete handler.
	if(DebugMode) console.log("======================\nGet File ", itm.file);

	xhr.open("GET",itm.file);
	xhr.inUse			= true;
	xhr.responseType	= type;
	xhr.activeItem		= itm;

	try{
		xhr.send();
	}catch(err){
		console.log("xhr err",err);
		finalize(false,err);
	}
}

//------------------------------------------------------------
// Private
//------------------------------------------------------------
//Functionality for actual downloading
function onXhrComplete(e){
	if(DebugMode) console.log("onXhrComplete", this.activeItem.file);

	if(!IsActive) return; //Incase of loading error downloader will be stopped.

	//If error out if there is no successful html code
	if(e.currentTarget.status != 200){
		finalize(false,"http status : " + e.currentTarget.status + " " + e.currentTarget.statusText);
		return;
	}

	//When download is done, do any further processing if needed.
	var doSave = true;
	var handler = Handlers[ this.activeItem.type ];
	if(handler.onReady) doSave = handler.onReady( this.activeItem, e.currentTarget.response );

	//Save Download Data and put in on the complete list
	if(doSave) this.activeItem.download = e.currentTarget.response;
	Complete.push(this.activeItem);
	
	//Cleanup and start next download
	this.activeItem = null;
	this.inUse 		= false; 
	loadNext();
}

function onXhrError(e){		this.inUse = false; finalize(false,e); console.log("onXhrError"); }
function onXhrAbort(e){		this.inUse = false; finalize(false,e); console.log("onXhrAbort"); }
function onXhrTimeout(e){	this.inUse = false; finalize(false,e); console.log("onXhrTimeout"); }


//------------------------------------------------------------
// Handlers
//------------------------------------------------------------
//Downloader is suppose to be expandable by adding new ways to handle
//different types of files for downloading.
var Handlers = {
	//...........................................
	"image":{ downloadType:"blob",
		onReady : function(itm,dl){
			//Loading Blob into Image, takes time, so create a promise
			//Then later in loading, wait for all promise to be complete.
			PromiseList.push(
				new Promise((resolve,reject)=>{
					var img		= new Image();
					img.onload	= ()=>{ resolve(); }
					img.src		= URL.createObjectURL(dl);
					itm.image	= img;
				})
			);
  			return false;
		}	
	},

	//...........................................
	"snippet":{ downloadType:"text" },

	//...........................................
	"shader":{
		downloadType	: "text",
		cache			: [],	//Cache the snippet files found, so we dont download the same snippet more then once.
		onReady			: function(itm,dl){
			if(DebugMode) console.log("Shader.onReady", dl);

			var re		= /#snip ([^\n\r]*)/g,
				snip	= [],
				m;

			while(m = re.exec(dl)){
				if( this.cache.indexOf(m[1]) == -1 ){
					this.cache.push( m[1] );
					queueSnippet( m[1] );
					snip.push( m[1] );
				}
			}

			if(snip.length > 0) itm.snippets = snip;

			return true;
		}
	}
	//...........................................
};

//------------------------------------------------------------
// Export
//------------------------------------------------------------

var mod = {
	start		: start,
	complete	: Complete,
	handlers	: Handlers,
	promiseList	: PromiseList
};

export default mod;