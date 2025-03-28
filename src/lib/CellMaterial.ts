import * as THREE from 'three'

const commonVertexSrc = `
#include <instanced_pars_vertex>
varying vec2 vUv;

void main() {
    #include <instanced_vertex>
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`

const drawableFragmentSrc = `
uniform vec2 polarization;
uniform float metadata;
uniform vec3 color;
out vec4 outColor;
varying vec2 vUv;
vec2 uv_pos;

float HollowRectMask(vec2 pos, vec2 bandStart, vec2 bandStop, float fade)
{
    vec2 value = abs(uv_pos - pos);

    vec2 mask = smoothstep(bandStart - fade, bandStart, value);
    mask -= smoothstep(bandStop, bandStop + fade, value);

    return max(max(mask.x, mask.y), 0.0);
}

float HollowCircleMask(vec2 pos, float radiusStart, float radiusStop, float fade)
{
    radiusStop = max(radiusStart, radiusStop);
    float value = length(uv_pos - pos);

    float mask = smoothstep(radiusStart - fade, radiusStart, value);
    mask -= smoothstep(radiusStop, radiusStop + fade, value);

    return max(mask, 0.0);
}

const float PI = 3.1415926535897932384626433832795;

void main() {
    uv_pos = vUv * 2.0 - 1.0;
    vec2 fragSize = fwidth(uv_pos);

    int polarizationCount = 1;
    int metadata_int = int(metadata);
    float polarizationRotation = 0.0;

    if ((metadata_int & (1 << 6)) != 0)
        polarizationCount = 2;

    float rotStep = PI / float(polarizationCount * 2);

    if ((metadata_int & (1 << 5)) != 0)
        polarizationRotation = rotStep / 2.0;

    float polarizationSum = abs(polarization.x) + abs(polarization.y);
    float polarizationOffset = (1.0 - polarizationSum) / float(2 * polarizationCount);

    float mask = HollowRectMask(vec2(0), vec2(1) - (vec2(4) * fragSize), vec2(1), 0.0);

    float circleSize = 0.15;
    float dotSizeMax = 0.15;

    float rotOffset = PI / 4.0 + polarizationRotation;

    for(int i = 0; i < polarizationCount * 2; i++){
        float rot = rotStep * float((i/2) + (i%2) * polarizationCount) + rotOffset;
        float offX = cos(rot) * 0.6;
        float offY = sin(rot) * 0.6;
        
        float dotSize = max(0.0, polarization[i / 2] * (i % 2 == 0 ? 1.0 : -1.0)) + polarizationOffset;
        dotSize *= dotSizeMax;
        
        
        mask += HollowCircleMask(vec2(offX, offY), circleSize, circleSize + (length(fragSize)), 0.01);
        mask += HollowCircleMask(vec2(-offX, -offY), circleSize, circleSize + (length(fragSize)), 0.01);

        mask += HollowCircleMask(vec2(offX, offY), 0.0, dotSize, 0.01);
        mask += HollowCircleMask(vec2(-offX, -offY), 0.0, dotSize, 0.01);
    }

    outColor = vec4(mask * color, 1);
}
`

const pickableFragmentSrc = `
uniform vec2 polarization;
uniform float metadata;
uniform vec3 color;
out int out_id;
varying vec2 vUv;
vec2 uv_pos;

void main() {
    int metadata_int = int(metadata);
    out_id = metadata_int >> 16;
}
`

export class DrawableCellMaterial extends THREE.ShaderMaterial{
    public override vertexShader: string = commonVertexSrc;
    public override fragmentShader: string = drawableFragmentSrc;
    public override glslVersion = THREE.GLSL3;
    public override transparent = false;

    constructor(parameters?: THREE.ShaderMaterialParameters){
        super(parameters);
    }
}

export class PickableCellMaterial extends THREE.ShaderMaterial{
    public override vertexShader: string = commonVertexSrc;
    public override fragmentShader: string = pickableFragmentSrc;
    public override glslVersion = THREE.GLSL3;
    public override transparent = false;

    constructor(parameters?: THREE.ShaderMaterialParameters){
        super(parameters);
    }
}