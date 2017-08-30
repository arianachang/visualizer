/*
SOURCE: http://raathigesh.com/Audio-Visualization-with-Web-Audio-and-ThreeJS/
AudioVisualizer class
*/

var visualizer;

function main() {
	visualizer = new AudioVisualizer();
	visualizer.initialize();
	visualizer.createBlobs();
	visualizer.setupAudioProcessing();
	visualizer.dropFile();
}

function AudioVisualizer() {
	this.numberOfBars = 20;

	//render
	this.camera;
	this.scene;
	this.renderer;
	this.controls;

	this.blobs = new Array();

	this.javascriptNode;
	this.audioContext;
	this.sourceBuffer;
	this.analyzer;
}

AudioVisualizer.prototype.initialize = function() {
	//generate scene
	this.scene = new THREE.Scene();
	
	const width = window.innerWidth;
	const height = window.innerHeight;

	//add camera
	this.camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 25000);
	this.camera.position.set(0, 0, 100);
	this.scene.add(this.camera);

	//get renderer
	this.renderer = new THREE.WebGLRenderer({alpha:1, antialias:true});
	this.renderer.setSize(width, height);
	document.body.appendChild(this.renderer.domElement);

	const that = this;

	//update on window resize
	window.addEventListener('resize', () => {
		const w = window.innerWidth;
		const h = window.innerHeight;

		that.renderer.setSize(w, h);

		that.camera.aspect = w/h;

		that.camera.updateProjectionMatrix();
	});

	//background color
	this.renderer.setClearColor(0x000000, 0);

	//add light
	const light = new THREE.PointLight(0xffffff);
	light.position.set(-100, 200, 100);
	this.scene.add(light);

	this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
};

AudioVisualizer.prototype.createBlobs = function() {
	for(let i=0; i<this.numberOfBars; i++) {
		const barGeometry = new THREE.SphereGeometry(1, 10, 7, 0, 6.3, 0, 3.5);
		
		const material = new THREE.MeshPhongMaterial({
			color: randomColor({luminosity: 'light', hue:'blue'}),
			specular: 0xffffff
		});

		this.blobs[i] = new THREE.Mesh(barGeometry, material);
		this.blobs[i].position.set(i-this.numberOfBars/2+(1.5*i), 0, 0);

		this.scene.add(this.blobs[i]);
	}
};

AudioVisualizer.prototype.dropFile = function() {
 	//drag Enter
    document.body.addEventListener("dragenter", function () {
       
    }, false);

    //drag over
    document.body.addEventListener("dragover", function (e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, false);

    //drag leave
    document.body.addEventListener("dragleave", function () {
       
    }, false);

	document.body.addEventListener('drop', function(event) {

		event.stopPropagation();
		event.preventDefault();

		//get file
		var file = event.dataTransfer.files[0];
		var fileName = file.name;

		//display song
		document.querySelector('#songId').innerHTML = fileName;

		//analyze the file
		var fileReader = new FileReader();

		fileReader.onload = function(event) {
			var fileResult = event.target.result;
			visualizer.start(fileResult);
		};

		fileReader.onerror = function(err) {
			console.log(err);
		};

		fileReader.readAsArrayBuffer(file);

	}, false);
};

AudioVisualizer.prototype.setupAudioProcessing = function() {
	this.audioContext = new AudioContext();

	this.javascriptNode = this.audioContext.createScriptProcessor(2048, 1, 1);
	this.javascriptNode.connect(this.audioContext.destination);

	this.sourceBuffer = this.audioContext.createBufferSource();

	this.analyzer = this.audioContext.createAnalyser();
	this.analyzer.smoothingTimeConstant = 0.3;
	this.analyzer.fftSize = 512;

	this.sourceBuffer.connect(this.analyzer);

	this.analyzer.connect(this.javascriptNode);

	this.sourceBuffer.connect(this.audioContext.destination);

	var that = this;

	this.javascriptNode.onaudioprocess = function() {
		var array = new Uint8Array(that.analyzer.frequencyBinCount);
		that.analyzer.getByteFrequencyData(array);

		visualizer.renderer.render(visualizer.scene, visualizer.camera);
		visualizer.controls.update();

		var step = Math.round(array.length/visualizer.numberOfBars);

		for(var i=0; i<visualizer.numberOfBars; i++) {
			var value = array[i*step]/4;
			value = value < 1 ? 1: value;
			//visualizer.blobs[i].scale.z = value;
			//visualizer.blobs[i].scale.x = value;
			visualizer.blobs[i].scale.y = value;
		}

	}
};

AudioVisualizer.prototype.start = function(buffer) {
	this.audioContext.decodeAudioData(buffer, success, failure);
	
	var that = this;

	function success(decodedBuffer) {
		that.sourceBuffer.buffer = decodedBuffer;
		that.sourceBuffer.start(0);
	}

	function failure() {
		console.log('decode audio data failure');
	}
};

AudioVisualizer.prototype.getRandomColor = function () {
    const letters = '0123456789ABCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

document.addEventListener('DOMContentLoaded', main);