import './common.css';
import * as THREE from '../node_modules/three/build/three.module.js';
import * as Perlin from './perlin.js';
import * as frag from './shader.frag';
import * as vert from './shader.vert';
import mp3 from './audio.mp3';
//import './image.jpg';

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
  //initAudioを実行する。resolveしたら、thenにセットしてるresolve関数にbuffer引数が渡される。それで、下の関数を実行。(data=buffer)
  /*
  buffer => {
    modal.classList.add("is-Hidden");//modalを隠す。（is-hiddenを追加すると隠れる。
    setAudio(buffer);
    playAudio();
  };
  */
  initAudio().then(data => {
    
    modalButton.classList.remove("is-Hidden");//"隠す"要素を消す
    
    modalButton.addEventListener(
      "click",
      () => {
        //クリックされたら隠す要素を追加する。そしてsetAudio()とplayAudioを実行。
        //setAudio()には取得したbufferが引数として引き継がれる。
        
        onClickModalButton(data);//ここの引数に、bufferが入る。つまり、ここで、setAudio()実行。
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
  renderer.setPixelRatio(window.devicePixelRatio);//デバイスピクセル比に合わせる
  renderer.setClearColor(0xf7f7f7, 1.0);
  renderer.setSize(windowWidth, windowHeight);
  document.body.appendChild(renderer.domElement);


  circle = new THREE.SphereBufferGeometry( 3.0, 100, 100 );//ベースのgeometryを一個作る。
  geo = new THREE.InstancedBufferGeometry();//インスタンス用のgeometryを作成する。
  
  vertice = circle.attributes.position.clone();//ベースのgeometryからattributeのコピーを作成。
  geo.setAttribute('position', vertice);//作成したコピーをインスタンスにセット。

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

          //x,y,zからパーリンノイズを求める。
          var noise_value = Perlin.noise.perlin3(x,y,z);

          //ノイズ値が0.5以上の場合はscaleを極端に大きくさせる。
          if(noise_value>0.5){
            scale = noise_value * 1.4;
          }else{
            scale = noise_value;
          }
          
          //noise_valueは0~1なので、等倍する。
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
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();// AudioContext の生成
    audioSource = "./audio.mp3";
    audioBufferSource = audioContext.createBufferSource();// 音声データの入力機能
    //AudioContextインターフェースのcreateAnalyser()メソッドは、音声の時間と周波数を解析するAnalyserNodeを生成します。これはデータの可視化などで使えます。音声データの波形取得機能。
    audioAnalyser = audioContext.createAnalyser();

    let request = new XMLHttpRequest();//XMLHttpRequestを利用して音声データ(バッファ)を読み込む。
    request.open("GET", audioSource, true);//GET を使用するリクエストは、データの取り込みに限ります。
    request.responseType = "arraybuffer";//responseType プロパティは、列挙型の文字列地で、レスポンスに含まれているデータの型を示します。
    
    //インターフェースのdecodeAudioData()メソッドは、ArrayBufferに書き込まれたオーディオファイルデータを非同期にデコードするために使われます。この場合、ArrayBufferは、通常はXMLHttpRequestのresponseTypeにarraybufferを設定して、response属性を読み込んで取得します。
    
    // 取得した音声データをデコードし、
    // デコードされた音声データをこの後の処理に渡す
    //decodeAudioDataメソッドの処理が成功すると, 第2引数に指定したコールバック関数が実行されます. そして, 第2引数に指定したコールバック関数の引数にはAudioBufferインスタンスが渡されるので, 次のステップ以降の処理を追加することにより, Web Audio APIでオーディオデータを再生することが可能になるというわけです.
    //処理が完了したらbufferを返す。
    request.onload = () => {
      //context.decodeAudioData(arrayBuffer, successCallback, errorCallback);
      //第1引数には, 取得したオーディオデータのArrayBufferを指定するだけです.
      //decodeAudioDataメソッドの処理が成功すると, 第2引数に指定したコールバック関数が実行されます. 
      //そして, 第2引数に指定したコールバック関数の引数にはAudioBufferインスタンスが渡されるので, 次のステップ以降の処理を追加することにより, Web Audio APIでオーディオデータを再生することが可能になるというわけです.つまり、buffer引数には、AudioBufferインスタンスが渡される！
      //第3引数は, 処理が失敗した場合のエラー処理をするコールバック関数を指定
      
      audioContext.decodeAudioData(request.response, buffer => resolve(buffer));//resolveしたら、上のやつ実行してthen()で登録してるresolve関数実行。
    };
    request.send();
  });
  
  
const setAudio = buffer => {
  // 描画の更新をスムーズにするかどうかを決める
  audioAnalyser.smoothingTimeConstant = 0.7;
  audioAnalyser.fftSize = 2048;
  audioBufferSource.buffer = buffer;//渡ってきた音声データを音源として設定する
  audioBufferSource.loop = true;

  // 時間領域の波形データを格納する配列を生成
  //frequencyBinCount:符号なしのlong型でFFT（高速フーリエ変換）のサイズの半分の値。一般的に音声再生時の可視化に用いられる。（読み取り専用）
  audioCount = new Float32Array(audioAnalyser.frequencyBinCount);
  
  // 音源を波形取得機能に接続
  audioBufferSource.connect(audioAnalyser);

  // 波形取得機能を出力機能に接続
  audioAnalyser.connect(audioContext.destination);

  // 音源の再生を開始する
  audioBufferSource.start(0);
};


const playAudio = () => {

  //周波数領域の波形データ (振幅スペクトル) を取得するメソッド
  audioAnalyser.getFloatFrequencyData(audioCount);

//-------------------audioCountを解析する。------------------------------
  
//min,maxHzを定義し、対応するindexを求める。
var minHz = 1;
var maxHz = 600;
//Math.ceil() :引数として与えた数以上の最小の整数を返します。
var sourceStart = Math.ceil(1024 * minHz / 22028);
//Math.round() :引数として与えた数を四捨五入して、もっとも近似の整数を返します。
var sourceEnd = Math.round(1024 * maxHz / 22028);
var sourceLength = sourceEnd - sourceStart + 1;
var adjustOffset = Math.round(sourceLength * 0.12);

//多分インデックスの値ひとつ辺りの長さを決めてる？
var interval_1 =  (sourceLength - 1) / (200 - 1) ;//0.07
var interval_2 =  (sourceLength - 1) / (40 - 1) ;//0.22
var avg = 0;
var avgBass = 0;

update();
function update(){
  //最終的な値を入れる配列の宣言。
  frequencyArray = [];

  //指定のインデックスまでの周波数平均を求める。
  for(let i=sourceStart; i<=sourceEnd; i++){
      //audiocountのi番目を足し込む。
      avg += audioCount[i];
      //低い音は周波数が低く(振動回数が少ない)、高い音は周波数が高く(振動回数が多い)
      //低音の平均を求める。
      if(i < 6) avgBass += audioCount[i];
    }
    
    //平均を計算。
    avg /= sourceLength;
    avgBass /= 6;
    
    //平均を-40~-60の範囲に収める。低音は最低-60
    //※通常の音楽信号は-30~-60辺りの値が出力される。
    avg = Math.min(-40, Math.max(avg, -60));
    avgBass = Math.max(-60, avgBass);
    
    //一つのインデックスの長さをintervalとし、
    createArray(200, interval_1);//240
    createArray(40, interval_2, true);//120
    
}
//200, 0.07
function createArray(num, interval, isReverse){
    //isReverseがtrueじゃなかったら、つまり１の方。
    if(!isReverse){
      //240回
      for(let i = 0; i < num; i++){
        //200,0.07,0~200
        calcFrequency(num, interval, i);
      }
      //120-1回
    } else {
      for(let i = num - 1; i >= 0; i--){
        calcFrequency(num, interval, i);
      }
    }
  }
  
  //calcFrequency(num, interval, i);
  ////200,0.07,0~200
  function calcFrequency(num, interval, i){
    //floor()：引数として与えた数以下の最大の整数を返します。
    //i番目のインターバル（0~27における場所を求める）
    let n1 = Math.floor(i * interval);//iに0.07と0.22の係数を掛けるから、それぞれmax17,27
    let n2 = n1 + 1;//ex.1の場合　2
    let n0 = Math.abs(n1 - 1);//0
    let n3 = n1 + 2; //3
    
    //sourceLength = 28
    n2 = (n2 > sourceLength - 1) ? (sourceLength - 1) * 2 - n2 : n2;
    n3 = (n3 > sourceLength - 1) ? (sourceLength - 1) * 2 - n3 : n3;

    //adjustFrequency：三次スプラインで曲線を求めるための、係数の調整だと思う。
    let p0 = adjustFrequency(n0, avg);
    let p1 = adjustFrequency(n1, avg);
    let p2 = adjustFrequency(n2, avg);
    let p3 = adjustFrequency(n3, avg);
    
    //i*intervalのmaxは17,27
    //i * interval - Math.floor(i * interval);
    //floorは小数切り捨ての整数
    let mu = i * interval - n1;

    let targetFrequency;
    targetFrequency = cubic(mu, p0, p1, p2, p3);
    targetFrequency = Math.max(0, targetFrequency);
    frequencyArray.push(targetFrequency * 4.0 / 10);
  }
  
  function adjustFrequency(i, avr){
    //平均を引いてる理由。該当のindexのHzが平均以下か平均以上か確認。平均以下の場合は０になる。（平均以下は負）
    //デフォルト値はそれぞれ, -100 dB / -30 dB
      var f = Math.max(0, audioCount[sourceStart + i] - avr) * 3.5;
      //単純にオフセット
      var offset = i - sourceStart;
      //オフセットを四等分？adjustOffset=3
      var ratio = offset / adjustOffset;
      
      //0~1の範囲に修正してる。fには０〜１の値をかけることになる。
      f *= Math.max(0, Math.min(1, 5 / 6 * (ratio - 1) *  (ratio - 1) *  (ratio - 1) + 1));
      
      
      return f;
    }
    
    function cubic(mu, p0, p1, p2, p3){
      let mu2 = mu * mu;

      //a0 = y3(0.5 * p3) - y2(- 1.5 * p2) - y0(-0.5 * p0) + y1(1.5 * p1);
      let a0 = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
      //a1 = y0(p0) - y1(- 2.5 * p1) - a0 (2 * p2 - 0.5*p3)????????;
      let a1 = p0 - 2.5 * p1 + 2 * p2 - 0.5*p3;
      //a2 = y2(0.5 * p2) - y0(-0.5 * p0);
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
  
  // レンダリングする
  renderer.render(scene, camera);

  // この関数をブラウザにとって最適なフレームレートで繰り返す
  requestAnimationFrame(playAudio);
};

const onClickModalButton = 
//bufferが引数って意味。buffer=引数(多分)
buffer => {
  modal.classList.add("is-Hidden");//modalを隠す。（is-hiddenを追加すると隠れる。
  setAudio(buffer);
  playAudio();
};


