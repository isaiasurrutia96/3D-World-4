# Progressive steering and recovery

9 PASS, 0 FAIL.

## Progressive steering is copied, frozen, validated and included in physics identity

Rule: No caller alias; canonical identity; invalid settings rejected; prior Fast and F1 identities stay exact when shaping is absent.

Script: `"Construct with mutable nested settings; change caller data; compare reversed property order and reject malformed values."`

Measured: `{"rejected":10,"previousFast":"kart-v1-9addaf0b5acc2976","referenceF1":"kart-v1-b2666c008706e548","active":"kart-v1-025c0e69a91e540a"}`

**PASS**

## Low-speed response blends continuously into the unchanged high-speed response

Rule: Rise stays .18–.5s and exponent1–1.35; monotonic smooth blend; high-speed endpoints exactly .18s/1.

Script: `"Sweep0–140m/s in.001m/s steps, probe negative speeds and the exact12/45m/s transition endpoints."`

Measured: `{"probes":140001,"maxRiseStep":0.000014545454527670199,"maxExponentStep":0.000015909090889554278,"midpoint":{"riseSeconds":0.33999999999999997,"exponent":1.175}}`

**PASS**

## Brief low-speed steering presses make gentler real trajectory corrections

Rule: Every correction remains positive and below35% of the previous yaw change; no stationary rotation or direction reversal; exact states at all rates.

Script: `{"fps":[30,60,120,144],"script":"Start3/8/13m/s; Gas+Right for50/100/200ms; release steering and keep Gas for.5s. Compare the exact previous Fast setup."}`

Measured: `[{"speed":3,"hold":0.05,"oldYawDegrees":0.5605140210341685,"newYawDegrees":0.05597759912664298,"ratio":0.09986832982939893},{"speed":3,"hold":0.1,"oldYawDegrees":2.439744636342084,"newYawDegrees":0.29448561567511733,"ratio":0.12070345858681358},{"speed":3,"hold":0.2,"oldYawDegrees":11.403821574081933,"newYawDegrees":1.8101840546513954,"ratio":0.15873486294853087},{"speed":8,"hold":0.05,"oldYawDegrees":1.4744601565048407,"newYawDegrees":0.14796675244063268,"ratio":0.10035317115070984},{"speed":8,"hold":0.1,"oldYawDegrees":6.122258242129685,"newYawDegrees":0.7535493356091661,"ratio":0.12308355933496805},{"speed":8,"hold":0.2,"oldYawDegrees":24.585418826677618,"newYawDegrees":4.1478253512106456,"ratio":0.16871078668425382},{"speed":13,"hold":0.05,"oldYawDegrees":2.2878602109004396,"newYawDegrees":0.23138182310803873,"ratio":0.10113459817414856},{"speed":13,"hold":0.1,"oldYawDegrees":9.109379130567646,"newYawDegrees":1.1624765370236347,"ratio":0.12761314688536798},{"speed":13,"hold":0.2,"oldYawDegrees":31.40945701933793,"newYawDegrees":6.039792647446134,"ratio":0.19229216995784426}]`

**PASS**

## Longer holds progressively reach the full existing wheel angle

Rule: Angles strictly increase with hold duration, reach30degrees within.5s+one tick and center within.14s+one tick; yaw remains0; milestones must be observed.

Script: `{"fps":[30,60,120,144],"script":"At rest hold Right .1/.25/.4/.6s; measure actual wheel angle; separately observe first full angle and release."}`

Measured: `{"angles":[{"seconds":0.1,"degrees":3.415951916550917},{"seconds":0.25,"degrees":11.768761468451258},{"seconds":0.4,"degrees":22.196921040449293},{"seconds":0.6,"degrees":29.999999999999996}],"firstFullSeconds":0.5,"releaseSeconds":0.1416666666666666,"maxAngleStep":0.04163082563125087}`

**PASS**

## High-speed driving traces retain the approved response and cornering capacity exactly

Rule: Above45m/s all physical state, inputs, angles, momentum and grip telemetry match bit for bit; only profile identity differs.

Script: `{"fps":[30,60,120,144],"script":"Start60/80.4672/98.3488m/s; Gas plus alternating analog steering for3s; compare prior Fast on every tick. Grant boost initially at220mph."}`

Measured: `{"comparedTicks":4320,"maximumDifference":0,"cases":[{"initialSpeed":60,"finalSpeed":74.81474010405415},{"initialSpeed":80.4672,"finalSpeed":80.46719999884718},{"initialSpeed":98.3488,"finalSpeed":91.1820555145047}]}`

**PASS**

## Gentle input remains analog, mirrored and independent of world orientation

Rule: Stronger input gives stronger turning; left/right paths mirror; all rates agree and release returns to center.

Script: `{"fps":[30,60,120,144],"script":"At8m/s apply signed .2/.5/1 steering with .4 throttle for1s; mirror each run."}`

Measured: `[{"input":0.2,"yaw":0.24642349307952072},{"input":0.5,"yaw":0.7854547937862738},{"input":1,"yaw":1.748625569456217}]`

**PASS**

## A genuinely hard held turn can still slide and spin, then recover after release

Rule: Peak sideways speed>5m/s and slip>0.5rad; body turns>PI; no yaw snap>.06rad/tick; after release sideways speed<.01m/s and yaw rate<.001rad/s.

Script: `{"fps":[30,60,120,144],"script":"Start13m/s; Gas+full Right3s, then release Right and keep Gas2.5s; mirror the full input."}`

Measured: `{"peakSidewaysSpeed":11.721388962581095,"peakSlipRadians":0.9968948432328792,"rotationAtRelease":-6.253713425860713,"maximumYawStep":0.026840020189216718,"finalSidewaysSpeed":-9.78973879739442e-9,"finalYawRate":-9.532646467188842e-11}`

**PASS**

## The broad hard-turn release matrix does not leave neutral steering stuck

Rule: 432 scenarios: wheel input centers; sideways speed<.01m/s and yaw rate<.001rad/s after2s; finite state and exact terminal states across FPS.

Script: `{"fps":[30,60,120,144],"speeds":[0,3,8,13,20,35,60,80,98],"holds":[0.1,0.3,0.6,1,2,4],"script":"For every speed/hold, Gas+Right then release steering4s with Gas held or released. Observe all ticks after2s."}`

Measured: `{"scenarios":432,"worstSidewaysSpeedAfter2s":0.00013385268649379611,"worstYawRateAfter2s":2.0624643211933013e-8}`

**PASS**

## Large initial sideways slip settles without steering in either direction

Rule: No spontaneous yaw; finite state; final sideways speed<.01m/s; left/right mirror and exact FPS states.

Script: `{"fps":[30,60,120,144],"angles":[30,60,89,90,91,120,179],"script":"Initial30m/s world velocity at each signed angle from the body; Gas with neutral steering5s."}`

Measured: `{"angles":7,"signs":2,"worstFinalSidewaysSpeed":2.3689165942824723e-12}`

**PASS**
