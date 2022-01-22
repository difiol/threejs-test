import glsl from "babel-plugin-glsl/macro";

export const vertexShader = glsl`
uniform float uSize;
uniform float uTime;

attribute float aScale;
attribute vec3 aRandomness;

varying vec3 vColor;

void main()
{
    //POSITION
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    //Spin
    float angle = atan(modelPosition.x, modelPosition.z);
    float distanceToCenter = length(modelPosition.xz);
    float angleOffset = (1.0 / distanceToCenter) *uTime * 0.5;
    angle += angleOffset;
    modelPosition.x = cos(angle) * distanceToCenter;
    modelPosition.y = distanceToCenter * 4.0;
    modelPosition.z = sin(angle) * distanceToCenter;

    //Randomness
    modelPosition.xyz += aRandomness;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    //PARTICLE SIZE
    gl_PointSize = (uSize * aScale) * ( 1.5 - abs(sin( distanceToCenter/angle + 3.0 * uTime/2.0)));
    gl_PointSize *= (1.0 / -  viewPosition.z);  //Adds size attenuation to the particle

    //Pass the Color
    vColor = color;
}`;
