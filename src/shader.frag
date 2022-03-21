
precision mediump float;
varying vec3 vPos;
varying vec3 vNormal;

const vec4 ambientColor = vec4(0.1, 0.1, 0.1, 1.0);
const vec3 dirLight = vec3(0.2);
const vec3 dirLight_2 = vec3(0.15);
const vec3 dirLightPos = vec3(-30,30,50);
const vec3 dirLightPos_2 = vec3(30, -50, -50);

vec3 calcIrradiance_dir(vec3 newNormal, vec3 lightPos, vec3 light){
  float dotNL = dot(newNormal, normalize(lightPos));
  return light * max(0.0, dotNL);
}

vec3 calcIrradiance_hemi(vec3 newNormal, vec3 lightPos, vec3 grd, vec3 sky){
  float dotNL = dot(newNormal, normalize(lightPos));
  float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
  return mix(grd, sky, hemiDiffuseWeight);
}

const vec3 hemiLight_s_1 = vec3(0.858, 0.858, 0.858);
const vec3 hemiLight_g_1 = vec3(0.905, 0.572, 0.866);
const vec3 hemiLight_s_2 = vec3(0.980, 0.650, 0.117);
const vec3 hemiLight_g_2 = vec3(0.392, 0.105, 0.235);

const vec3 hemiLightPos_1 = vec3(1.0, 0.0, -1.0);
const vec3 hemiLightPos_2 = vec3(-0.5, 0.5, 1.0);

void main() {
vec3 objColor = vec3(0.75);

  vec3 dirColor = vec3(0.0);
  dirColor += calcIrradiance_dir(vNormal, dirLightPos, dirLight);
  dirColor += calcIrradiance_dir(vNormal, dirLightPos_2, dirLight_2);

  vec3 b = normalize(cameraPosition);
  vec3 a = normalize(dirLightPos);
  vec3 halfLE = normalize(a + b);
  float specular = pow(clamp(dot(vNormal, halfLE), 0.0, 1.0), 150.0);

  vec3 hemiColor = vec3(0.0);
  hemiColor += calcIrradiance_hemi(vNormal, hemiLightPos_1, hemiLight_g_1, hemiLight_s_1) * 0.7;
  hemiColor += calcIrradiance_hemi(vNormal, hemiLightPos_2, hemiLight_g_2, hemiLight_s_2) * 0.8;

  //色 = 頂点色 * 拡散光 + 反射光 + 環境光(ambient)
  vec3 color = objColor * hemiColor + dirColor;
  gl_FragColor = vec4(color, 0.3) + vec4(vec3(specular), 1.0) +  ambientColor;
}
