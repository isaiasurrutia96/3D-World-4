/** Flat, curb-free streets for the Driving Test. All dimensions are metres. */
export const NEIGHBORHOOD = 'neighborhood';

type Rectangle = Readonly<{ minX: number; maxX: number; minZ: number; maxZ: number }>;
const rectangle = (minX: number, maxX: number, minZ: number, maxZ: number): Rectangle =>
    Object.freeze({ minX, maxX, minZ, maxZ });
const contains = (area: Rectangle, x: number, z: number): boolean =>
    x >= area.minX && x <= area.maxX && z >= area.minZ && z <= area.maxZ;

const streetCenters = Object.freeze([-34, 0, 34]);
const roadHalfWidth = 3.5;
const roadMin = -45, roadMax = 45;
const ground = rectangle(-59, 59, -59, 59);

// Keep every north-south strip whole and fill the spaces between them with
// east-west strips. Crossings stay paved with no overlapping road faces.
const gaps: (readonly [number, number])[] = [];
let edge = roadMin;
for (const center of streetCenters) {
    gaps.push([edge, center - roadHalfWidth]);
    edge = center + roadHalfWidth;
}
gaps.push([edge, roadMax]);
const roadRectangles = Object.freeze([
    ...streetCenters.map(x => rectangle(x - roadHalfWidth, x + roadHalfWidth, roadMin, roadMax)),
    ...streetCenters.flatMap(z => gaps.map(([minX, maxX]) =>
        rectangle(minX, maxX, z - roadHalfWidth, z + roadHalfWidth))),
]);

const pavement = Object.freeze({ grip: 1, speed: 1, resistance: 1 });
const grass = Object.freeze({ grip: .78, speed: .9, resistance: 1.5 });

export const NEIGHBORHOOD_WORLD = Object.freeze({
    id: NEIGHBORHOOD,
    name: 'Neighborhood',
    start: Object.freeze({ point: Object.freeze({ x: -roadHalfWidth / 2, y: 0, z: -25 }), yaw: 0 }),
    layout: Object.freeze({ ground, roadRectangles, streetCenters, roadHalfWidth, roadMin, roadMax }),
    heightAt(x: number, z: number, maximum = Infinity): number | null {
        return maximum >= 0 && contains(ground, x, z) ? 0 : null;
    },
    surfaceAt(x: number, z: number, _y: number) {
        return roadRectangles.some(area => contains(area, x, z)) ? pavement : grass;
    },
});
