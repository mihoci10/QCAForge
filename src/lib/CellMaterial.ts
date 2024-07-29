import * as THREE from 'three'

const commonVertexSrc = `
attribute vec2 localPosition;
attribute vec2 polarization;
attribute int inMetadata;
varying vec2 localPos;
varying vec2 polar;
flat varying int metadata;
void main() {
    localPos = localPosition;
    polar = polarization;
    metadata = inMetadata;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`

const drawableFragmentSrc = `
uniform int polarizationCount;
varying vec2 localPos;
varying vec2 polar;
flat varying int metadata;
out vec4 outColor;

float HollowRectMask(vec2 pos, vec2 bandStart, vec2 bandStop, float fade)
{
    vec2 value = abs(localPos - pos);

    vec2 mask = smoothstep(bandStart - fade, bandStart, value);
    mask -= smoothstep(bandStop, bandStop + fade, value);

    return max(max(mask.x, mask.y), 0.0);
}

float HollowCircleMask(vec2 pos, float radiusStart, float radiusStop, float fade)
{
    radiusStop = max(radiusStart, radiusStop);
    float value = length(localPos - pos);

    float mask = smoothstep(radiusStart - fade, radiusStart, value);
    mask -= smoothstep(radiusStop, radiusStop + fade, value);

    return max(mask, 0.0);
}

void main() {
    vec2 fragSize = fwidth(localPos);
    bool selected = bool(metadata & (1 << 6));

    float mask = HollowRectMask(vec2(0), vec2(1) - (vec2(4) * fragSize), vec2(1), 0.0);

    float circleSize = 0.15;
    float dotSizeMax = 0.10;

    float rotStep = 3.1415926535897932384626433832795/float(polarizationCount * 2);
    float rotOffset = 3.1415926535897932384626433832795 / 4.0;

    for(int i = 0; i < polarizationCount * 2; i++){
        float offX = cos(rotStep * float(i) + rotOffset) * 0.6;
        float offY = sin(rotStep * float(i) + rotOffset) * 0.6;
        
        float dotSize = abs(polar[i / 2] / 2.0 + 0.5) * dotSizeMax;
        if (i%2 == 1)
            dotSize = dotSizeMax - dotSize;
        
        mask += HollowCircleMask(vec2(offX, offY), circleSize, circleSize + (length(fragSize)), 0.01);
        mask += HollowCircleMask(vec2(-offX, -offY), circleSize, circleSize + (length(fragSize)), 0.01);

        mask += HollowCircleMask(vec2(offX, offY), 0.0, dotSize + length(fragSize), 0.01);
        mask += HollowCircleMask(vec2(-offX, -offY), 0.0, dotSize + length(fragSize), 0.01);
    }

    if (selected)
        outColor = vec4(mask, 0, 0, 1);
    else
        outColor = vec4(vec3(mask), 1);
}
`

const pickableFragmentSrc = `
varying vec2 localPos;
varying vec2 polar;
flat varying int metadata;
out int out_id;

void main() {
    out_id = metadata >> 16;
}
`

export let DrawableCellMaterial = new THREE.ShaderMaterial({
    uniforms: {polarizationCount: {value: 2}},
    glslVersion: THREE.GLSL3,
    vertexShader: commonVertexSrc,
    fragmentShader: drawableFragmentSrc,
    transparent: false,
});

export let PickableCellMaterial = new THREE.ShaderMaterial({
    uniforms: {polarizationCount: {value: 1}},
    glslVersion: THREE.GLSL3,
    vertexShader: commonVertexSrc,
    fragmentShader: pickableFragmentSrc,
    transparent: false,
});