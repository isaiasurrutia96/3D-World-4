// The three kart models, by mode. buildKart(kart) builds whichever kart it is given.
import {buildGoKart} from './gokart-kart.js';
import {buildGTKart} from './gt-kart.js';
import {buildF1Kart} from './f1-kart.js';

export const MODELS = Object.freeze({gokart: buildGoKart, gt: buildGTKart, f1: buildF1Kart});
export const buildKart = (kart, setup) => MODELS[kart.mode](kart, setup);
