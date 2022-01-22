import glsl from "babel-plugin-glsl/macro";

export const fragmentShader = glsl`
uniform float uTime;

uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

varying vec3 vColor;

void main(){
    //gl_PointCoord is the vec2 that represents the UV coordinates of each particle
    
    // Light point Pattern
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 5.0);

    //Color
    vec3 color = mix(vec3(0.0), vColor, strength);

    gl_FragColor = vec4(color, 1.0);

    //Add fog
    #ifdef USE_FOG
          #ifdef USE_LOGDEPTHBUF_EXT
              float depth = gl_FragDepthEXT / gl_FragCoord.w;
          #else
              float depth = gl_FragCoord.z / gl_FragCoord.w;
          #endif
          float fogFactor = smoothstep( fogNear, fogFar, depth );
          gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
      #endif
}
`;
