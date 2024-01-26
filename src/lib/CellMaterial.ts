import * as THREE from 'three'

const commonVertexSrc = `
attribute vec2 localPosition;
attribute float polarization;
attribute int inId;
varying vec2 localPos;
varying float polar;
flat varying int cellId;
void main() {
    localPos = localPosition;
    polar = polarization;
    cellId = inId;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

const drawableFragmentSrc = `
varying vec2 localPos;
varying float polar;
flat varying int cellId;
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

    float mask = HollowRectMask(vec2(0), vec2(1) - (vec2(4) * fragSize), vec2(1), 0.0);

    mask += HollowCircleMask(vec2(0.5, 0.5), 0.2, 0.2 + (length(fragSize)), 0.01);
    mask += HollowCircleMask(vec2(0.5, -0.5), 0.2, 0.2 + (length(fragSize)), 0.01);
    mask += HollowCircleMask(vec2(-0.5, 0.5), 0.2, 0.2 + (length(fragSize)), 0.01);
    mask += HollowCircleMask(vec2(-0.5, -0.5), 0.2, 0.2 + (length(fragSize)), 0.01);

    mask += HollowCircleMask(vec2(0.5, 0.5), 0.0, polar * (0.2 + (length(fragSize))), 0.01);
    mask += HollowCircleMask(vec2(0.5, -0.5), 0.0, -polar * (0.2 + (length(fragSize))), 0.01);
    mask += HollowCircleMask(vec2(-0.5, 0.5), 0.0, -polar * (0.2 + (length(fragSize))), 0.01);
    mask += HollowCircleMask(vec2(-0.5, -0.5), 0.0, polar * (0.2 + (length(fragSize))), 0.01);

    outColor = vec4(vec3(mask), 1);
}
`

const pickableFragmentSrc = `
varying vec2 localPos;
varying float polar;
flat varying int cellId;
out vec4 outColor;

void main() {
    outColor = vec4(cellId, 0, 0, 255);
}
`

export let DrawableCellMaterial = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: commonVertexSrc,
    fragmentShader: drawableFragmentSrc,
});

export let PickableCellMaterial = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: commonVertexSrc,
    fragmentShader: pickableFragmentSrc,
});