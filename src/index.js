import './common.css';
import * as THREE from '../node_modules/three/build/three.module.js';
import * as Perlin from './perlin.js';
import * as frag from './shader.frag';
import * as vert from './shader.vert';
import mp3 from './audio.mp3';

let modal;
let modalButton;

let windowWidth;
let windowHeight;
let scene;
let camera;
let renderer;
let sphereVertices;
let points;
let mesh;
let pointsGeometry;
let pointsMaterial;
let pointPositions;

let audioContext;
let audioSource;
let audioBufferSource;
let audioAnalyser;
let audioCount;
let circle,geo,vertice,normal,indices,uvs,mat;
let uniform;
let clock;
let num = 240;
var frequencyArray;


window.addEventListener("load", () => {
  
  initDom();
  initThree();

  initAudio().then(data => {
    
    modalButton.classList.remove("is-Hidden");
    
    modalButton.addEventListener(
      "click",
      () => {
        onClickModalButton(data);
      },
      false
    );
  });
});

const initDom = () => {
  modal = document.getElementById("modal");
  modalButton = document.getElementById("modal_button");
};

const initThree = () => {

  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;

  scene = new THREE.Scene();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(
    45,
    windowWidth / windowHeight,
    0.1,
    1000
  );
  camera.position.z =730;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0xf7f7f7, 1.0);
  renderer.setSize(windowWidth, windowHeight);
  document.body.appendChild(renderer.domElement);


  circle = new THREE.SphereBufferGeometry( 3.0, 100, 100 );
  geo = new THREE.InstancedBufferGeometry();
  
  vertice = circle.attributes.position.clone();
  geo.setAttribute('position', vertice);

  normal = circle.attributes.normal.clone();
  geo.setAttribute('normals', normal);

  indices = circle.index.clone();
  geo.setIndex( indices );

  uvs = circle.attributes.uv.clone();
  geo.setAttribute('uv', uvs);

        let noiseArray = [];
        let aradian = [];
        var scale;
        
        for(var i=0;i<num;i++){
          const radian = i / num * Math.PI * 2;
          
          let x = 25 * Math.sin(radian);
          let y = 25 * Math.cos(radian);
          let z = 0;

          var noise_value = Perlin.noise.perlin3(x,y,z);

          if(noise_value>0.5){
            scale = noise_value * 1.4;
          }else{
            scale = noise_value;
          }

          noiseArray.push(scale*4.0,0,0);
          aradian.push( radian );
        }

        let noise = new THREE.InstancedBufferAttribute( new Float32Array( noiseArray ), 3, false );
        let radian = new THREE.InstancedBufferAttribute( new Float32Array( aradian ), 1, false );
        let distance = new THREE.InstancedBufferAttribute( new Float32Array( num ), 1, false );

				geo.setAttribute( 'noise', noise );
        geo.setAttribute( 'radian', radian );
        geo.setAttribute( 'frequency', distance );
        
        uniform = {
          u_time: {value: 0.0},
        }

        mat = new THREE.ShaderMaterial({
          uniforms:uniform,
          vertexShader: vert,
          fragmentShader: frag
        });
        mat.transparent = false;
        mat.depthTest = false;

        points = new THREE.Mesh(geo,mat);
        scene.add(points);
        renderer.render(scene, camera);
};

const initAudio = () =>
  new Promise(resolve => {
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioSource = "./audio.mp3";
    audioBufferSource = audioContext.createBufferSource();
    audioAnalyser = audioContext.createAnalyser();

    let request = new XMLHttpRequest();
    request.open("GET", audioSource, true);
    request.responseType = "arraybuffer";
    request.onload = () => {
      
      audioContext.decodeAudioData(request.response, buffer => resolve(buffer));
    };
    request.send();
  });
  
  
const setAudio = buffer => {
  audioAnalyser.smoothingTimeConstant = 0.7;
  audioAnalyser.fftSize = 2048;
  audioBufferSource.buffer = buffer;
  audioBufferSource.loop = true;

  audioCount = new Float32Array(audioAnalyser.frequencyBinCount);
  
  audioBufferSource.connect(audioAnalyser);
  audioAnalyser.connect(audioContext.destination);
  audioBufferSource.start(0);
};


const playAudio = () => {

  audioAnalyser.getFloatFrequencyData(audioCount);

//-------------------audioCountを解析する。------------------------------
  
var minHz = 1;
var maxHz = 600;
var sourceStart = Math.ceil(1024 * minHz / 22028);
var sourceEnd = Math.round(1024 * maxHz / 22028);
var sourceLength = sourceEnd - sourceStart + 1;
var adjustOffset = Math.round(sourceLength * 0.12);

var interval_1 =  (sourceLength - 1) / (200 - 1) ;
var interval_2 =  (sourceLength - 1) / (40 - 1) ;
var avg = 0;
var avgBass = 0;

update();
function update(){

  frequencyArray = [];

  for(let i=sourceStart; i<=sourceEnd; i++){

      avg += audioCount[i];
      
      if(i < 6) avgBass += audioCount[i];
    }
    

    avg /= sourceLength;
    avgBass /= 6;
    avg = Math.min(-40, Math.max(avg, -60));
    avgBass = Math.max(-60, avgBass);
    
    createArray(200, interval_1);
    createArray(40, interval_2, true);
    
}

function createArray(num, interval, isReverse){

    if(!isReverse){

      for(let i = 0; i < num; i++){
        calcFrequency(num, interval, i);
      }
    } else {
      for(let i = num - 1; i >= 0; i--){
        calcFrequency(num, interval, i);
      }
    }
  }

  function calcFrequency(num, interval, i){

    let n1 = Math.floor(i * interval);
    let n2 = n1 + 1;
    let n0 = Math.abs(n1 - 1);
    let n3 = n1 + 2;

    n2 = (n2 > sourceLength - 1) ? (sourceLength - 1) * 2 - n2 : n2;
    n3 = (n3 > sourceLength - 1) ? (sourceLength - 1) * 2 - n3 : n3;

    let p0 = adjustFrequency(n0, avg);
    let p1 = adjustFrequency(n1, avg);
    let p2 = adjustFrequency(n2, avg);
    let p3 = adjustFrequency(n3, avg);

    let mu = i * interval - n1;

    let targetFrequency;
    targetFrequency = cubic(mu, p0, p1, p2, p3);
    targetFrequency = Math.max(0, targetFrequency);
    frequencyArray.push(targetFrequency * 4.0 / 10);
  }
  
  function adjustFrequency(i, avr){

      var f = Math.max(0, audioCount[sourceStart + i] - avr) * 3.5;
      var offset = i - sourceStart;
      var ratio = offset / adjustOffset;

      f *= Math.max(0, Math.min(1, 5 / 6 * (ratio - 1) *  (ratio - 1) *  (ratio - 1) + 1));
      
      
      return f;
    }
    
    function cubic(mu, p0, p1, p2, p3){
      let mu2 = mu * mu;

      let a0 = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
      let a1 = p0 - 2.5 * p1 + 2 * p2 - 0.5*p3;
      let a2 = -0.5 * p0 + 0.5 * p2;

      return a0 * mu * mu2 + a1 * mu2 + a2 * mu + p1;
    }
       
       var frequency = geo.attributes.frequency;
       frequency.needsUpdate = true;
       
       for(var i = 0;i<num;i++){
         var spectrum = frequencyArray[i];
       frequency.array[i] = spectrum;
     }

  mat.uniforms.u_time.value = clock.getElapsedTime();
  
  renderer.render(scene, camera);

  requestAnimationFrame(playAudio);
};

const onClickModalButton = 


buffer => {
  modal.classList.add("is-Hidden");
  setAudio(buffer);
  playAudio();
};


