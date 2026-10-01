# The Agent's Workshop

Interactive 3D portfolio. A lit cyberpunk bay, a gloss-black Toyota RunX, and a laptop that actually opens.

Drag to orbit the poster shot. WASD walks you in. Cyan ring is the driver door (right-hand drive), pink is the laptop bench, orange is the rear — SPACE revs it.

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
