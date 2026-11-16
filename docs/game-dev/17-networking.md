# 17 — Multiplayer Networking

## A) The three classic approaches (Glenn Fiedler, "Networked Physics")

1. **Deterministic lockstep:** every machine runs the same simulation and only
   inputs are sent. Tiny bandwidth regardless of object count. Needs perfect
   determinism (floating-point results can differ across browsers/CPUs) and
   stalls waiting for the slowest player. Used by RTS games and fighting games
   (with rollback).
2. **Snapshot interpolation:** the server sends the state of everything; clients
   draw slightly in the past, interpolating between snapshots. Simple and
   robust; adds delay (at 10 snapshots/s at least 100 ms).
3. **State synchronization:** both sides simulate; the authority sends state
   (including velocities) for important objects plus inputs; clients
   extrapolate when packets are late. Good for physics-heavy games.

## B) Client–server shooters (Valve Source, Call of Duty)

1. Authoritative server; clients send inputs.
2. **Client-side prediction** for the local player; **reconciliation** when the
   server disagrees (rewind to the server state, replay unacknowledged
   inputs).
3. **Entity interpolation** for other players (~100 ms behind by default in
   Source).
4. **Lag compensation:** server rewinds players to what the shooter saw to
   check hits.
5. **Tick rate:** 20–128 Hz server simulation.

## C) Rollback netcode (fighting games, Rocket League-like)

Predict the remote player's input (usually "same as last frame"), run ahead;
when the real input arrives and differs, roll back to that frame, apply it and
re-simulate to the present. Needs fast, deterministic simulation and saved
states.

## D) In the browser

1. **WebSocket:** reliable, ordered (TCP); easy; fine for turn-based or slower
   games.
2. **WebRTC data channels:** can be unreliable/unordered (UDP-like); better for
   fast action; more setup (signaling server).
3. **WebTransport:** newer, UDP-like over HTTP/3.
4. Libraries/servers: Colyseus (rooms, state sync), geckos.io (WebRTC),
   Nakama, PartyKit.
5. Turn-based or asynchronous multiplayer (golf, bowling: take turns, send the
   shot parameters, each client simulates deterministically) is far easier
   than real-time and fits sports minigames well.

## E) Safety

1. Never trust the client for scores or hits in competitive play.
2. Rate-limit and validate inputs on the server.
