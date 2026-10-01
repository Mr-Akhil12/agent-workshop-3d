# The Agent's Workshop

Daylight Tongaat driveway. The gloss-black RunX is the only mesh kept from the first build. No garage box — the houses are set pieces, and the camera stops at them instead of clipping through.

You start in first person, standing in the mouth of the driveway looking at the car. V switches to third person. WASD walks. E at the driver door (right-hand side) sits you in. In the seat, W drives, A/D steers, S brakes, V flips between the cabin and a chase camera, SPACE throws flames. E gets you back out. The laptop is on the table against the house.

Drop a rev-range recording at `assets/audio/runx-rev.mp3` and rebuild. Until then the engine note is a synth stand-in. The face on the walker is the public Linktree portrait; LinkedIn would not serve the photo.

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
