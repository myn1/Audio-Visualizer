//②light+cameraPosでnormalizeする。
//cameraposはワールド座標系でのカメラ位置（これで合ってるかはわからない。。）
//変換された視線ベクトルとライトベクトルとのハーフベクトルを変数 halfLE に取得。(normalizeすると半分になる？？)
 //法線とハーフベクトルの内積をとり、clampで負の値にならないようにする。(0~1の中で最大値)
 //さらにそれをpowで二乗する。
 //反射光の計算ではべき乗をうまく活用することによって、弱い光をさらに弱く、強い光はそのまま残す変換。
 //※局所的な輝きであるハイライトらしさを演出するのであれば、ある程度の回数べき乗を行なうようにしたほうがいい


precision mediump float;
varying vec3 vPos;
varying vec3 vNormal;

const vec4 ambientColor = vec4(0.1, 0.1, 0.1, 1.0);
const vec3 dirLight = vec3(0.2);//lightの明るさ
const vec3 dirLight_2 = vec3(0.15);
const vec3 dirLightPos = vec3(-30,30,50);//directionalLightの位置を設定
const vec3 dirLightPos_2 = vec3(30, -50, -50);

//calcIrradiance_dirについて。
//lightベクトルと法線ベクトルから形成される角度によって、光の拡散の影響を計算する。
//角度を求めるには、ベクトル同士の内積をとることで求められる。
//これは、法線ベクトルとlightベクトルから内積を求めるfuncton。
//※基本的に、大きさは必要ないので、vertex、light共に正規化する
//dot()：内積を求める。
//max()：xとyのより大きい値を返す。
//maxで算出してるのは、負の値にならないように。webglでは、clampを用いて負の数値になることを抑制してる。
vec3 calcIrradiance_dir(vec3 newNormal, vec3 lightPos, vec3 light){
  float dotNL = dot(newNormal, normalize(lightPos));
  return light * max(0.0, dotNL);
}

vec3 calcIrradiance_hemi(vec3 newNormal, vec3 lightPos, vec3 grd, vec3 sky){
  float dotNL = dot(newNormal, normalize(lightPos));
  float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
  return mix(grd, sky, hemiDiffuseWeight);
}

const vec3 hemiLight_s_1 = vec3(1.0);
const vec3 hemiLight_g_1 = vec3(0.768, 0.768, 0.768);
const vec3 hemiLight_s_2 = vec3(0.458, 0.458, 0.458);
const vec3 hemiLight_g_2 = vec3(0.419, 0.419, 0.419);

//const vec3 hemiLight_s_1 = vec3(0.980, 0.4, 0.564);//空//からし色
//const vec3 hemiLight_g_1 = vec3(0.894, 0.113, 0.047);//地面//めっちゃ濃いピンク
//const vec3 hemiLight_s_2 = vec3(0.345, 0.733, 0.682);//渋い赤
//const vec3 hemiLight_g_2 = vec3(0.874, 0.129, 0.066);//渋い紫
const vec3 hemiLightPos_1 = vec3(1.0, 0.0, -1.0);
const vec3 hemiLightPos_2 = vec3(-0.5, 0.5, 1.0);

void main() {
vec3 objColor = vec3(0.75);

  //dirLight
  //vertex法線とライトベクトルから光の影響を計算。引数：vertex法線、ライト位置、ライトの強さ
  vec3 dirColor = vec3(0.0);
  dirColor += calcIrradiance_dir(vNormal, dirLightPos, dirLight);
  dirColor += calcIrradiance_dir(vNormal, dirLightPos_2, dirLight_2);
  
  //specularLight:局所的な輝き
  vec3 b = normalize(cameraPosition);
  vec3 a = normalize(dirLightPos);
  vec3 halfLE = normalize(a + b);
  float specular = pow(clamp(dot(vNormal, halfLE), 0.0, 1.0), 150.0);
  
  //半球ライティング
  vec3 hemiColor = vec3(0.0);
  hemiColor += calcIrradiance_hemi(vNormal, hemiLightPos_1, hemiLight_g_1, hemiLight_s_1) * 0.7;
  hemiColor += calcIrradiance_hemi(vNormal, hemiLightPos_2, hemiLight_g_2, hemiLight_s_2) * 0.8;

  //色 = 頂点色 * 拡散光 + 反射光 + 環境光(ambient)
  vec3 color = objColor * hemiColor + dirColor;
  gl_FragColor = vec4(color, 0.3) + vec4(vec3(specular), 1.0) +  ambientColor;
}
