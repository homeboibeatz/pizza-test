# Pizza Test — AR Menu

A WebAR restaurant menu built on **8th Wall** + **A-Frame**. Tap the detected floor or table to place a 3D dish in the room, then pinch to zoom and drag to rotate it.

- 🍕 Place a dish (pizza, burger) on any flat surface in AR
- 👆 Tap to place / reposition — the dish animates smoothly to the new spot
- ✌️ Pinch to zoom (clamped 0.1x–50x)
- 🔄 Drag to rotate — follows your finger exactly, and stays put while you rotate
- 📱 Fit-to-screen: on placement the dish scales to fill ~90% of the screen width

## Dish selection

Which dish loads is set by a URL parameter — one URL (and QR code) per dish, all sharing this single built project:

```
https://yoursite.com/?dish=pizza
https://yoursite.com/?dish=burger
```

Defaults to the first entry in `src/menu-data.js` when no `?dish=` is given. Add new dishes by dropping a GLB into `src/assets/` and adding an entry to `MENU_DATA` (webpack copies `src/assets/` into `dist/assets/`).

## Local development

```
npm install
npm run serve
```

Open the printed URL (on a phone for AR, or desktop for 3D). To preview a specific dish: `http://localhost:8080/?dish=pizza`

## Build & deploy

```
npm run build
```

Outputs the production build to `dist/`. Deploying via Vercel:

```
vercel --prod
```

`vercel.json` sets the build command (`npm run build`) and output directory (`dist`), so pushes to the `main` branch auto-deploy.

## Project structure

| Path | What it is |
| --- | --- |
| `src/app.js` | Entry point — registers the custom A-Frame components |
| `src/index.html` | The 8th Wall `<a-scene>` (floor detection, camera) |
| `src/tap-place.js` | Tap-to-place, fit-to-screen, and pinch/rotate tap-blocking |
| `src/interaction-components.js` | `pinch-scale` and `drag-rotate` gesture components |
| `src/touch-state.js` | Shared touch-block state (a gesture release never jumps the dish) |
| `src/menu-data.js` | Dish catalog + `?dish=` URL selection |
| `src/assets/` | GLB models (copied into `dist/assets/`) |
| `config/webpack.config.js` | Webpack build config |

## License

See [LICENSE](LICENSE).