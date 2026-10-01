# The Agent's Workshop

A small driving portfolio. You start in the Tongaat driveway, in first person, looking at the RunX. The road north is a coastal city. Four stops are the work: Comfort Shooting, Hush, AgenticBiz, Ballito. Drive into the ring and the stop checks off.

V switches first and third person. The seat is right-hand drive. WASD walks. E at a driver door sits you in — the white hatch on the Hush avenue is the second car. In the seat you are in a gearbox: 1–5, Shift up, Ctrl down, R for reverse when you are slow. W is throttle, S is brake. Fifth is capped at 190 km/h. Lift off or downshift and the RunX pops. E gets you out. The minimap is the city. The laptop is the table against the house.

Drop `assets/models/civic.glb` and rebuild to replace the hatch. Drop `assets/audio/runx-rev.mp3` for the real engine note.

## Live

https://agent-workshop-3d.vercel.app

## Stack

- Three.js
- Vite (IIFE bundle, served from the repo root on Vercel)

## Development

```bash
npm install
npm run build
python3 -m http.server 4173
```

`index.html` loads `dist/bundle.iife.js`. A Vercel deploy of this repo does not run a build, so the bundle has to be committed.

## Model credit

The car is [2001 Toyota Corolla RunX](https://sketchfab.com/3d-models/2001-toyota-corolla-runx-44614da6a9ab49d2814a31f754f6685c) by [OUTPISTON](https://sketchfab.com/outpiston), licensed [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). The mesh is used as published. It is not an original model.
