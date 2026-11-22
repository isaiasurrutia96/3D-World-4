import * as T from 'three';
import { KART_PROTOTYPES, isKartPrototype } from '../racing-core/kart/prototypes.ts';
import { buildWheel, meshOf, partGroup, RIMS, roundedBlock, wishbones } from './kart-model.js';
import { block, curvedTube, loft, mirrorX, paint, plate, range, stationCurve, superellipse, tube, wing } from './shapes.js';

const DARK = '#191f28';
const CARBON = '#303946';
const METAL = '#a4adb4';
const LIGHT = '#d8effa';

const LIVERIES = Object.freeze({
    gokart: ['#d21b29', '#eceef0'],
    gt: ['#ffbc15', '#30363f'],
    f1: ['#079b9b', '#fa7318'],
});

function material(finish) {
    return new T.MeshStandardMaterial({ vertexColors: true, ...finish });
}

function stationLoft(stations, materialColor, exponent = 2.7) {
    const [first] = stations;
    const last = stations.at(-1);
    const curve = stationCurve(stations.map(([z, w, bottom, top]) => ({ z, w, bottom, top })));
    return loft(range(first[0], last[0], Math.ceil((last[0] - first[0]) * 22) + 2).map(z => {
        const { w, bottom, top } = curve(z);
        return { z, ring: superellipse({ cy: (top + bottom) / 2, halfWidth: w, halfHeight: (top - bottom) / 2, exponent, count: 40 }) };
    }), typeof materialColor === 'function' ? materialColor : () => materialColor);
}

const mirrored = geometry => [geometry, mirrorX(geometry)];
const box = (x, y, z, w, h, d, r, color) => roundedBlock([x, y, z], [w, h, d], r, color, 3);

function tireFender(wheel, outer, color) {
    const r = wheel.radius + .062;
    const shape = new T.Shape();
    shape.moveTo(r + .049, 0);
    shape.absarc(0, 0, r + .049, 0, Math.PI, false);
    shape.lineTo(-r, 0);
    shape.absarc(0, 0, r, Math.PI, 0, true);
    shape.closePath();
    const edge = .011;
    const geometry = new T.ExtrudeGeometry(shape, {
        depth: wheel.width + .03, steps: 1, bevelEnabled: true, bevelThickness: edge,
        bevelSize: edge, bevelSegments: 3, curveSegments: 26,
    });
    geometry.rotateY(-Math.PI / 2);
    geometry.translate(outer - edge, wheel.radius, wheel.at[2]);
    return paint(geometry, color);
}

function axleWheels(dim) {
    return ['front', 'rear'].flatMap(axle => {
        const tire = dim[axle + 'Tire'];
        return [-1, 1].map(side => ({
            id: axle + (side < 0 ? '-left' : '-right'), axle, radius: tire.radius, width: tire.width,
            at: [side * tire.halfTrack, tire.radius, axle === 'front' ? dim.frontProbe : -dim.rearProbe],
        }));
    });
}

function cockpit(dim, primary, isF1) {
    const { hip, grip } = dim;
    const top = isF1 ? .78 : dim.label === 'GoKart' ? dim.height : .97;
    const cushion = box(0, hip.y - .09, hip.z + .17, .64, .13, .49, .055, DARK);
    const backLength = (top - hip.y + .10) / Math.cos(hip.recline);
    const back = box(0, 0, 0, .70, backLength, .115, .048, CARBON);
    back.rotateX(-hip.recline);
    back.translate(0, (top + hip.y - .10) / 2 - (dim.label === 'GoKart' ? .004 : .024), hip.z - Math.sin(hip.recline) * backLength / 2 - .09);
    const bolster = tube([.29, hip.y - .044, hip.z + .38], [.29, hip.y + .02, hip.z - .06], .055, DARK, 16);
    const inner = box(0, hip.y - .022, hip.z + .162, .49, .032, .38, .014, '#353b42');
    const backPad = box(0, 0, 0, .49, backLength * .72, .057, .026, DARK);
    backPad.rotateX(-hip.recline);
    backPad.translate(0, (top + hip.y - .10) / 2 - .03, hip.z - Math.sin(hip.recline) * backLength / 2 - .016);
    const sideRest = curvedTube([[.282, hip.y - .005, hip.z - .060],
        [.28, hip.y + .115, hip.z - .051 - .115 * Math.tan(hip.recline)],
        [.263, hip.y + .29, hip.z - .044 - .29 * Math.tan(hip.recline)],
        [.221, hip.y + .38, hip.z - .063 - .38 * Math.tan(hip.recline)]], .045, DARK);
    const steering = new T.Group();
    steering.name = 'steering control';
    steering.position.set(0, grip.y, grip.z);
    steering.rotateX(Math.PI / 7);
    let wheelParts;
    if (isF1) {
        wheelParts = [
            box(0, 0, 0, .33, .15, .055, .025, DARK),
            ...mirrored(box(.165, 0, -.015, .058, .177, .062, .027, DARK)),
            ...mirrored(box(.126, .029, -.032, .036, .016, .015, .005, primary)),
            box(0, .025, -.034, .10, .047, .012, .005, '#454c58'),
        ];
    } else {
        const rim = paint(new T.TorusGeometry(.164, .022, 12, 48), DARK);
        wheelParts = [rim, box(0, 0, 0, .119, .091, .037, .015, CARBON)];
        for (const angle of [0, 2 * Math.PI / 3, 4 * Math.PI / 3]) {
            const spoke = box(0, .095, 0, .033, .124, .025, .007, METAL);
            wheelParts.push(spoke.rotateZ(angle));
        }
    }
    const column = tube([0, .23, grip.z + .34], [0, grip.y, grip.z + .035], .021, METAL, 16);
    return { seat: [back, backPad, cushion, inner, ...mirrored(bolster), ...mirrored(sideRest)], steering, wheelParts, column };
}

function lampPair(x, y, z, rear = false) {
    const base = box(x, y, z, .155, .077, .045, .022, DARK);
    const lenses = Array.from({ length: 3 }, (_, i) => box(x - .045 + i * .045, y, z + (rear ? -.026 : .026), .030, .039, .012, .004, rear ? '#f44731' : LIGHT));
    return [base, ...lenses].flatMap(mirrored);
}

function rearPieces(dim, primary, secondary, f1) {
    const { tail, rearProbe, height } = dim;
    const width = f1 ? 1.38 : Math.min(dim.width - .1, 1.71);
    const zWing = tail + (f1 ? .43 : .49);
    const top = f1 || dim.label === 'GT GoKart' ? height : .76;
    const broad = f1 ? .34 : .28;
    const strut = tube([.20, .37, tail + .46], [.18, top - .088, zWing + .04], f1 ? .031 : .026, CARBON, 14);
    const planes = [
        wing({ span: width, chord: broad, y: top - .091, leadingZ: zWing + .12, angle: .075 }, primary),
        wing({ span: width, chord: .145, y: top - .046, leadingZ: zWing + .015, angle: .27 }, secondary),
        ...mirrored(plate({ x: width / 2, zMin: zWing - broad, zMax: zWing + .14, yMin: top - .19, yMax: top, radius: .045 }, secondary)),
        ...mirrored(strut),
    ];
    const bumper = box(0, .233, tail + .09, dim.width * .69, .13, .18, .045, CARBON);
    const fins = Array.from({ length: 5 }, (_, i) => plate({
        x: (i - 2) * dim.width * .105, yMin: .073, yMax: .20, zMin: tail + .035, zMax: tail + .38,
        thickness: .016, radius: .02,
    }, DARK));
    const exhaustZ = tail + .117;
    const exhaust = paint(new T.CylinderGeometry(.052, .052, .155, 24, 1, true).rotateX(Math.PI / 2).translate(.25, .32, exhaustZ), METAL);
    const muffler = paint(new T.CylinderGeometry(.043, .043, .17, 20).rotateX(Math.PI / 2).translate(.25, .32, exhaustZ + .093), DARK);
    const tire = dim.rearTire;
    const mudFlaps = mirrored(box(tire.halfTrack, .155, -rearProbe - tire.radius - .028, tire.width * .89, .20, .028, .012, DARK));
    return { wing: planes, rearBumper: [bumper], diffuser: fins, exhaust: [exhaust, muffler], mudFlaps };
}

function buildGoBody(dim, p, s, wheels) {
    const { tail, nose, frontProbe, rearProbe } = dim;
    const hood = stationLoft([
        [-.03, .19, .16, .41], [.29, .23, .145, .47], [.63, .28, .13, .38],
        [1.02, .33, .12, .27], [nose - .065, .30, .12, .22],
    ], (x, y, z) => Math.abs(x) < .064 && y > .20 ? s : p);
    const bumper = box(0, .152, nose - .10, 1.07, .17, .20, .049, p);
    const intake = box(0, .16, nose - .012, .52, .075, .02, .01, DARK);
    const sidePods = mirrored(box(.39, .235, -.005, .19, .251, .92, .064, p));
    const panel = mirrored(box(.486, .26, -.005, .018, .17, .66, .008, s));
    const fenders = wheels.filter(w => w.at[0] > 0).flatMap(w => {
        const z = w.at[2], r = w.radius;
        const canopy = stationLoft([
            [z - .20, .052, r * 1.67, r * 1.91],
            [z, .108, r * 2.14, r * 2.36],
            [z + .19, .066, r * 1.65, r * 1.90],
        ], p).translate(w.at[0] - .03, 0, 0);
        return mirrored(canopy);
    });
    const axles = [
        tube([-.59, dim.rearTire.radius, -rearProbe], [.59, dim.rearTire.radius, -rearProbe], .022, METAL, 12),
        tube([-.55, dim.frontTire.radius, frontProbe], [.55, dim.frontTire.radius, frontProbe], .018, METAL, 12),
    ];
    return {
        nose: [hood], hood: [box(0, .372, .32, .33, .069, .27, .025, s)],
        frontBumper: [bumper, intake],
        sidePanels: [...sidePods, ...panel], fenders, axles,
        lights: [...lampPair(.415, .166, nose - .045), ...lampPair(.37, .31, tail + .058, true)],
    };
}

function buildGTBody(dim, p, s, wheels) {
    const { nose, tail, frontProbe, rearProbe, width, height, hip } = dim;
    const bonnet = stationLoft([
        [.23, .53, .155, .48], [.52, .58, .13, .62], [.89, .62, .14, .64],
        [1.31, .68, .125, .50], [nose - .035, .61, .135, .30],
    ], (x, y) => Math.abs(x) < .16 && y > .26 ? s : p);
    const bumper = box(0, .195, nose - .125, width - .11, .24, .25, .063, s);
    const splitter = box(0, .105, nose - .105, width - .025, .048, .21, .021, p);
    const grille = box(0, .193, nose - .016, .88, .148, .022, .010, DARK);
    const fins = Array.from({ length: 6 }, (_, i) => box((i - 2.5) * .113, .193, nose - .006, .012, .109, .011, .003, CARBON));
    const arches = wheels.filter(w => w.at[0] > 0).flatMap(w => {
        const [x, r, z] = w.at;
        const cap = stationLoft([
            [z - .35, .106, r + .26, r + .325],
            [z - .18, .134, r + .33, r + .407],
            [z, .142, r + .355, r + .426],
            [z + .184, .133, r + .326, r + .397],
            [z + .35, .102, r + .246, r + .314],
        ], w.axle === 'front' ? s : p, 3.1).translate(x - .12, 0, 0);
        return [...mirrored(tireFender(w, width / 2, w.axle === 'front' ? s : p)), ...mirrored(cap)];
    });
    const shoulder = stationLoft([
        [tail + .12, .70, .17, .46], [-1.22, .83, .18, .63], [-.91, .80, .19, .68], [-.57, .64, .185, .50],
    ], p);
    const sill = stationLoft([
        [rearProbe * -1 + .32, .115, .12, .44], [-.38, .15, .115, .40], [.31, .17, .11, .35],
        [frontProbe - .40, .14, .115, .35],
    ], s).translate(.68, 0, 0);
    const outer = box(.77, .274, -.04, .027, .18, .91, .01, p);
    const hoopZ = hip.z - .37;
    const hoop = curvedTube([[-.37, .36, hoopZ], [-.32, 1.19, hoopZ], [-.20, height - .059, hoopZ],
        [0, height - .055, hoopZ], [.20, height - .059, hoopZ], [.32, 1.19, hoopZ], [.37, .36, hoopZ]], .041, s);
    const vents = Array.from({ length: 4 }, (_, i) => {
        const v = box(.31, .608 - i * .013, .90 + i * .068, .185, .014, .041, .006, DARK);
        return mirrored(v);
    }).flat();
    return {
        nose: [splitter], hood: [bonnet, ...vents], frontBumper: [bumper, grille, ...fins],
        sidePanels: [...mirrored(sill), ...mirrored(outer)],
        engineCover: [shoulder], fenders: arches, rollHoop: [hoop],
        lights: [...lampPair(.746, .239, nose - .039), ...lampPair(.58, .36, tail + .093, true)],
    };
}

function buildF1Body(dim, p, s) {
    const { tail, nose, frontProbe, hip } = dim;
    // One monotone shoulder-to-tip contour. The width and height ease into
    // the front bulkhead with no secondary hump beside the front tire.
    const nosework = stationLoft([
        [-.015, .34, .135, .67], [.25, .32, .135, .655], [.68, .275, .131, .602],
        [1.15, .224, .119, .515], [1.55, .175, .113, .415], [1.95, .148, .096, .295],
        [2.25, .125, .079, .205], [nose, .093, .096, .154],
    ], (x, y) => Math.abs(x) < .078 && y >= .150 ? s : p, 2.45);
    const tubRail = stationLoft([
        [-1.12, .119, .135, .44], [-.83, .133, .137, .574], [-.44, .122, .139, .615],
        [-.08, .108, .136, .657], [.24, .083, .149, .655],
    ], p).translate(.355, 0, 0);
    const cockpitEdge = curvedTube([[.302, .593, -.94], [.302, .615, -.63], [.304, .612, -.27], [.308, .649, .18]], .018, CARBON);
    const sidePod = stationLoft([
        [-1.45, .055, .136, .278], [-1.15, .124, .144, .363], [-.73, .20, .145, .454],
        [-.32, .225, .164, .509], [.035, .223, .182, .526], [.345, .185, .237, .511],
    ], (_x, _y, _z, u) => u > .15 && u < .30 ? s : p, 3.25).translate(.53, 0, 0);
    const inlet = box(.525, .382, .349, .293, .187, .027, .048, DARK);
    const louvers = [.344, .377, .410].map(y => box(.525, y, .365, .226, .010, .018, .004, CARBON));
    const tray = stationLoft([
        [-1.70, .47, .084, .109], [-1.18, .68, .083, .108], [-.24, .78, .081, .119], [.55, .52, .088, .119],
    ], CARBON, 3.6);
    const cowl = stationLoft([
        [tail + .31, .14, .25, .43], [-1.46, .20, .25, .69], [-1.12, .248, .28, .94],
        [-.86, .194, .31, 1.02], [-.72, .145, .36, .94],
    ], (x, y) => Math.abs(x) < .068 && y > .60 ? s : p);
    const hoopZ = hip.z - .48;
    const hoop = curvedTube([[-.20, .53, hoopZ], [-.15, 1.04, hoopZ - .07], [0, 1.19, hoopZ - .11],
        [.15, 1.04, hoopZ - .07], [.20, .53, hoopZ]], .035, p);
    const frontWing = [
        wing({ span: 1.77, chord: .44, y: .103, leadingZ: nose - .097, angle: .047 }, p),
        wing({ span: 1.72, chord: .20, y: .161, leadingZ: nose - .27, angle: .29 }, CARBON),
        ...mirrored(plate({ x: .924, zMin: nose - .51, zMax: nose - .081, yMin: .081, yMax: .26, radius: .031 }, s)),
        ...mirrored(plate({ x: .103, zMin: nose - .47, zMax: nose - .25, yMin: .101, yMax: .235, thickness: .019, radius: .025 }, CARBON)),
    ];
    const cap = box(0, .091, nose - .258, .36, .058, .21, .023, DARK);
    const wheelFins = mirrored(plate({
        x: .54, zMin: frontProbe - .54, zMax: frontProbe - .37, yMin: .13, yMax: .23, thickness: .014, radius: .021,
    }, CARBON));
    const tailLamp = box(0, .27, tail + .074, .155, .043, .023, .01, '#f44731');
    const mirrors = mirrored(box(.45, .653, .09, .144, .056, .064, .024, p));
    return {
        nose: [nosework], floor: [tray], hood: [...mirrored(tubRail), ...mirrored(cockpitEdge)],
        engineCover: [cowl], sidePanels: [sidePod, inlet, ...louvers].flatMap(mirrored),
        frontWing, frontBumper: [cap], fenders: wheelFins, rollHoop: [hoop], mirrors,
        lights: [tailLamp, ...lampPair(.715, .170, nose - .282)],
    };
}

const BODY = { gokart: buildGoBody, gt: buildGTBody, f1: buildF1Body };

function buildSuspension(wheels) {
    return wheels.flatMap(wheel => {
        const z = wheel.at[2], y = wheel.radius;
        return wishbones(wheel, [
            [.29, y + .137, z + .15], [.29, y + .143, z - .17],
            [.27, y - .085, z + .14], [.27, y - .088, z - .19],
            [.29, y + .201, z - .087], [.27, y, z + .026],
        ], CARBON);
    });
}

export function buildKartPrototype(id) {
    if (!isKartPrototype(id)) throw new RangeError('Unknown kart prototype');
    const dim = KART_PROTOTYPES[id], [primary, accent] = LIVERIES[id], wheels = axleWheels(dim);
    const bodyMaterial = material({ roughness: .30, metalness: .15 });
    const wheelMaterials = {
        body: material({ roughness: .27, metalness: .51 }),
        rubber: material({ roughness: .81, metalness: 0 }),
    };
    const root = new T.Group();
    root.name = dim.label + ' prototype';
    const add = (slot, pieces, finish = bodyMaterial) => {
        const group = partGroup(slot, id + '-' + slot, [meshOf(slot, pieces, finish)]);
        root.add(group);
        return group;
    };

    const body = BODY[id](dim, primary, accent, wheels);
    if (!body.floor) {
        body.floor = [box(0, .119, (dim.tail + dim.nose) / 2, Math.min(dim.width * .80, 1.65), .066, dim.length - .125, .03, DARK)];
    }
    for (const [slot, pieces] of Object.entries(body)) add(slot, pieces);
    for (const [slot, pieces] of Object.entries(rearPieces(dim, primary, accent, id === 'f1'))) add(slot, pieces);

    const seat = cockpit(dim, primary, id === 'f1');
    add('seat', seat.seat);
    add('pedals', mirrored(box(.144, .256, dim.hip.z + .94, .099, .163, .021, .008, METAL)));
    seat.steering.add(meshOf('rim and grips', seat.wheelParts, bodyMaterial));
    add('steering', [seat.column]).add(seat.steering);
    if (id !== 'gokart') add('suspension', buildSuspension(wheels));
    const wheelMeshes = wheels.map(wheel => {
        const style = id === 'f1' ? { ...RIMS.f1, inner: .225 / wheel.radius } : RIMS[id];
        const model = buildWheel(wheel, style, wheelMaterials);
        // Seat the GoKart's wheel hardware inside its narrow tire sidewall.
        if (id === 'gokart') model.getObjectByName('rim').scale.x = .92;
        return model;
    });
    const wheelGroup = partGroup('wheels', id + '-wheels', wheelMeshes);
    root.add(wheelGroup);
    return { root, wheels: wheelGroup.children, steering: seat.steering, dimensions: dim };
}
