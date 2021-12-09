import glsl from "babel-plugin-glsl/macro";

export const fragmentShader = glsl`
uniform float uTime;

varying vec3 vColor;

void main(){
    //gl_PointCoord is the vec2 that represents the UV coordinates of each particle
    
    // Light point Pattern
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 10.0);

    //Color
    vec3 color = mix(vec3(0.0), vColor, strength);

    gl_FragColor = vec4(color, 1.0);
}
`;
