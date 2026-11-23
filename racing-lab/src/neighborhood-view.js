import {
    BufferGeometry, Color, DataTexture, Float32BufferAttribute, Group,
    LinearFilter, LinearMipmapLinearFilter, Mesh, MeshLambertMaterial, RepeatWrapping,
} from 'three';

const asphalt = new Color('#30373b');
const groundColor = new Color('#505c63');
const centerPaint = new Color('#c4ab62');
const whitePaint = new Color('#dce0d8');

function appendQuad(layer, minX, maxX, minZ, maxZ, color) {
    // Upward winding in the XZ plane, with world coordinates for a continuous texture.
    for (const [x, z] of [[minX, minZ], [minX, maxZ], [maxX, minZ], [maxX, minZ], [minX, maxZ], [maxX, maxZ]]) {
        layer.positions.push(x, 0, z);
        layer.colors.push(color.r, color.g, color.b);
        layer.uvs?.push(x * .75, z * .75);
    }
}

function meshFromQuads(name, layer, material) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(layer.positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(layer.colors, 3));
    if (layer.uvs) geometry.setAttribute('uv', new Float32BufferAttribute(layer.uvs, 2));
    geometry.computeVertexNormals();
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    return mesh;
}

function makeSurfaceTexture() {
    const size = 64;
    const pixels = new Uint8Array(size * size * 4);
    let seed = 1977;
    for (let i = 0; i < pixels.length; i += 4) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const shade = 223 + (seed >>> 27);
        pixels[i] = pixels[i + 1] = pixels[i + 2] = shade;
        pixels[i + 3] = 255;
    }
    const map = new DataTexture(pixels, size, size);
    map.wrapS = map.wrapT = RepeatWrapping;
    map.minFilter = LinearMipmapLinearFilter;
    map.magFilter = LinearFilter;
    map.generateMipmaps = true;
    map.anisotropy = 4;
    map.needsUpdate = true;
    return map;
}

function makeSurface({ ground, roadRectangles }) {
    const layer = { positions: [], colors: [], uvs: [] };
    const edges = (min, max) => [...new Set([ground[min], ground[max], ...roadRectangles.flatMap(road => [road[min], road[max]])])].sort((a, b) => a - b);
    const xs = edges('minX', 'maxX'), zs = edges('minZ', 'maxZ');
    // Every cell lies wholly on pavement or wholly on ground. They share edges
    // at y=0, keeping the collision surface level with the rendered surface.
    for (let i = 1; i < xs.length; i++) for (let j = 1; j < zs.length; j++) {
        const x = (xs[i - 1] + xs[i]) / 2, z = (zs[j - 1] + zs[j]) / 2;
        const paved = roadRectangles.some(road => x > road.minX && x < road.maxX && z > road.minZ && z < road.maxZ);
        appendQuad(layer, xs[i - 1], xs[i], zs[j - 1], zs[j], paved ? asphalt : groundColor);
    }
    return layer;
}

function makeMarkings({ roadHalfWidth, roadMin, roadMax, streetCenters }) {
    const layer = { positions: [], colors: [] };
    const spans = [];
    let start = roadMin;
    for (const crossing of streetCenters) {
        spans.push([start, crossing - roadHalfWidth]);
        start = crossing + roadHalfWidth;
    }
    spans.push([start, roadMax]);

    function stripe(alongX, from, to, left, right, color) {
        if (alongX) appendQuad(layer, from, to, left, right, color);
        else appendQuad(layer, left, right, from, to, color);
    }

    for (const alongX of [true, false]) for (const street of streetCenters) {
        for (const [from, to] of spans) {
            if (to - from <= 1.2) continue;
            stripe(alongX, from + .6, to - .6, street - .165, street - .055, centerPaint);
            stripe(alongX, from + .6, to - .6, street + .055, street + .165, centerPaint);
        }
        for (const end of [roadMin + .35, roadMax - .35]) {
            stripe(alongX, end - .08, end + .08, street - roadHalfWidth + .2, street + roadHalfWidth - .2, whitePaint);
        }
        // East–west streets read as the through routes. Stop bars sit on each
        // approaching right-hand lane of the north–south streets.
        if (!alongX) for (const crossing of streetCenters) {
            const lower = crossing - roadHalfWidth - 1.25, upper = crossing + roadHalfWidth + 1.25;
            stripe(false, lower - .36, lower, street - roadHalfWidth + .2, street - .20, whitePaint);
            stripe(false, upper, upper + .36, street + .20, street + roadHalfWidth - .2, whitePaint);
        }
    }
    return layer;
}

export function createNeighborhoodView(track) {
    const root = new Group();
    root.name = track.name;
    const map = makeSurfaceTexture();
    const pavement = meshFromQuads('Pavement and ground', makeSurface(track.layout), new MeshLambertMaterial({ vertexColors: true, map }));
    const markings = meshFromQuads('Street markings', makeMarkings(track.layout), new MeshLambertMaterial({
        vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }));
    root.add(pavement, markings);
    function dispose() {
        for (const mesh of [pavement, markings]) {
            mesh.geometry.dispose();
            mesh.material.dispose();
        }
        map.dispose();
    }
    return { root, dispose };
}
