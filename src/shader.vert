
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

      vec3 offset = vec3(cos(radian), sin(radian), 0.0) * 150.0;

      vec3 dif = vec3(cos(radian), sin(radian), 0.0) * frequency * 2.0;
      float scl = 1.0 + frequency / 5.0;

      vec3 _position = position*noise*scl + noise + noise + offset + dif;

      _position.xy = rotate(u_time * 0.5) * _position.xy;
      

      vec4 mvPosition =  modelViewMatrix * vec4( _position, 1.0 );
      vPos = mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;

      }