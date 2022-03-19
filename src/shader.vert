//座標変換の手順：現在のposの存在する位置を定義する。（pos*modelmatrix）
//カメラの向きや位置を決める。（_*viewmatrix）
//三次元空間のどの領域を撮影するのかを定義する。つまり、遠近効果を得る。(_*projectionmatrix)
//この値をglpositionに入れる。
//modelviewmatrix:modelMatrixとviewMatrixを乗算したもの

attribute float noise;
attribute vec3 normals;
attribute float frequency;
attribute float radian;
varying vec3 vPos;
uniform float u_time;
varying vec3 vNormal;

mat2 rotate(float _time){
  float _sin = sin(_time);
  float _cos = cos(_time);
  return mat2(_cos, -_sin, _sin, _cos);
}

      void main() {
      vNormal = normals;
      
      //デフォルトオフセット
      vec3 offset = vec3(cos(radian), sin(radian), 0.0) * 150.0;
      
      //frequencyから取得した差分にも、角度を適用させる。
      vec3 dif = vec3(cos(radian), sin(radian), 0.0) * frequency * 2.0;
      float scl = 1.0 + frequency / 5.0;

      vec3 _position = position*noise*scl + noise + noise + offset + dif;
      
      //rotateさせる。
      _position.xy = rotate(u_time * 0.5) * _position.xy;
      

      vec4 mvPosition =  modelViewMatrix * vec4( _position, 1.0 );
      vPos = mvPosition.xyz;//これはつまり遠近効果を計算する前の座標をfragに送ってる。
      gl_Position = projectionMatrix * mvPosition;

      }