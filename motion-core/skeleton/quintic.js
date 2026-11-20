// The smooth curve everything in motion-core moves on: a fifth-power (quintic)
// from a start value with its own speed and acceleration to an end value at
// rest, over T seconds. Position, speed and acceleration are all continuous,
// so chaining these (each starting from where the last one is) never kinks.

/**
 * Value, speed and acceleration at time t of the curve from p0 (speed v0,
 * acceleration a0) to p1 at rest over T seconds. Before 0 it holds p0, after T
 * it holds p1 (at rest).
 */
export function quintic(p0, v0, a0, p1, T, t){
 if(!(T > 0) || t >= T) return {p: p1, v: 0, a: 0};
 const s = Math.max(0, t / T), s2 = s * s, s3 = s2 * s, s4 = s3 * s, s5 = s4 * s, V0 = v0 * T, A0 = a0 * T * T;
 return {
  p: (1 - 10*s3 + 15*s4 - 6*s5)*p0 + (s - 6*s3 + 8*s4 - 3*s5)*V0 + (.5*s2 - 1.5*s3 + 1.5*s4 - .5*s5)*A0 + (10*s3 - 15*s4 + 6*s5)*p1,
  v: ((-30*s2 + 60*s3 - 30*s4)*p0 + (1 - 18*s2 + 32*s3 - 15*s4)*V0 + (s - 4.5*s2 + 6*s3 - 2.5*s4)*A0 + (30*s2 - 60*s3 + 30*s4)*p1) / T,
  a: ((-60*s + 180*s2 - 120*s3)*p0 + (-36*s + 96*s2 - 60*s3)*V0 + (1 - 9*s + 18*s2 - 10*s3)*A0 + (60*s - 180*s2 + 120*s3)*p1) / (T * T),
 };
}
