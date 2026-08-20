// Component that places (and repositions) ONE dish model where the user
// taps the detected floor/table. Adapted from 8th Wall's original cactus
// example - key differences:
//   - Places a single model (not a new one on every tap) - re-tapping
//     moves the existing dish to the new spot instead of spawning more.
//   - The model comes from menu-data.js, picked via the ?dish= URL param.
//   - Once placed, the dish is scaled to fill ~90% of the screen width,
//     and supports pinch-to-scale and drag-to-rotate.

import {getCurrentDish} from './menu-data'

export const tapPlaceComponent = {
  init() {
    const ground = document.getElementById('ground')
    this.prompt = document.getElementById('promptText')
    this.dishEl = null // the placed entity, once it exists
    this.suppressMoveUntil = 0
    let multiTouchActive = false

    const dish = getCurrentDish()
    if (!dish) {
      this.prompt.textContent = 'No dish configured for this link.'
      return
    }
    this.dish = dish
    this.prompt.textContent = `Tap the floor to place the ${dish.name}`

    // While the user is pinch-zooming (2+ fingers), ignore taps so the dish
    // doesn't jump to the touch position. The browser can fire a click from
    // the first finger of a pinch, which would otherwise move the model.
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length >= 2) {
        multiTouchActive = true
        this.suppressMoveUntil = Date.now() + 500
      }
    })
    window.addEventListener('touchend', () => {
      if (multiTouchActive) {
        multiTouchActive = false
        this.suppressMoveUntil = Date.now() + 500
      }
    })

    ground.addEventListener('click', (event) => {
      if (Date.now() < this.suppressMoveUntil) return

      const touchPoint = event.detail.intersection.point

      if (!this.dishEl) {
        this.placeDish(touchPoint)
      } else {
        this.moveDish(touchPoint)
      }
    })
  },

  placeDish(touchPoint) {
    const dish = this.dish
    const newElement = document.createElement('a-entity')

    newElement.setAttribute('position', touchPoint)
    newElement.setAttribute('rotation', '0 0 0')
    newElement.setAttribute('visible', 'false')
    newElement.setAttribute('scale', '0.0001 0.0001 0.0001')
    newElement.setAttribute('shadow', {receive: false})

    // Direct URL, not an #asset reference - avoids needing to predeclare
    // this in <a-assets> for every possible dish ahead of time.
    newElement.setAttribute('gltf-model', `url(${dish.modelFile})`)

    // Enable pinch-zoom and drag-rotate once it's placed.
    newElement.setAttribute('pinch-scale', '')
    newElement.setAttribute('drag-rotate', '')

    this.el.sceneEl.appendChild(newElement)

    newElement.addEventListener('model-loaded', () => {
      // Fit-to-screen is a bonus - the dish must ALWAYS appear even if it
      // fails, so it's wrapped in try/catch with a fallback to scale 1.
      let toScale = 1
      try {
        const fitScale = this.fitToScreen(newElement, touchPoint)
        if (Number.isFinite(fitScale) && fitScale > 0) {
          toScale = fitScale
        }
      } catch (err) {
        console.warn('fit-to-screen skipped:', err)
      }

      newElement.object3D.scale.set(0.0001, 0.0001, 0.0001)
      newElement.setAttribute('visible', 'true')
      newElement.setAttribute('animation', {
        property: 'scale',
        to: `${toScale} ${toScale} ${toScale}`,
        easing: 'easeOutElastic',
        dur: 800,
      })

      this.prompt.style.display = 'none'
      console.log('Dish placed:', this.dish.name)
    })

    newElement.addEventListener('error', () => {
      console.error(`Failed to load model: ${dish.modelFile}`)
      this.prompt.style.display = 'block'
      this.prompt.textContent = `Couldn't load ${dish.name} - check that ${dish.modelFile} exists.`
    })

    this.dishEl = newElement
  },

  // Scales the model so its on-screen width fills ~90% of the phone's
  // screen width. Measures the model's actual projected screen size (NDC),
  // so it works regardless of model size, distance, or camera FOV.
  // Returns 1 (no scaling) if anything can't be measured, so it never
  // breaks placement.
  fitToScreen(el) {
    const camera = this.el.sceneEl.camera
    if (!camera) return 1

    // Measure the on-screen size at unit scale so the ratio comes out right.
    el.object3D.scale.set(1, 1, 1)
    el.object3D.updateMatrixWorld(true)
    camera.updateMatrixWorld(true)
    if (camera.matrixWorldInverse) {
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert()
    }

    const box = new AFRAME.THREE.Box3().setFromObject(el.object3D)
    if (box.isEmpty()) {
      console.warn('fit-to-screen: model bounding box is empty')
      return 1
    }

    // Project all 8 corners of the model's bounding box to screen space and
    // measure how wide it is on screen right now.
    const {min, max} = box
    const xs = []
    const ys = []
    for (let i = 0; i < 8; i++) {
      const corner = new AFRAME.THREE.Vector3(
        i & 1 ? max.x : min.x,
        i & 2 ? max.y : min.y,
        i & 4 ? max.z : min.z,
      )
      corner.project(camera)
      xs.push(corner.x)
      ys.push(corner.y)
    }

    const screenW = Math.max(...xs) - Math.min(...xs)
    const screenH = Math.max(...ys) - Math.min(...ys)
    if (!Number.isFinite(screenW) || screenW <= 0) {
      console.warn('fit-to-screen: bad on-screen width', screenW)
      return 1
    }

    // NDC width of the full viewport is 2, so scale to 90% of that.
    const scale = (0.9 * 2) / screenW
    console.log('fit-to-screen:', {screenW, screenH, scale})
    return scale
  },

  moveDish(touchPoint) {
    // Smoothly animate to the new tap point instead of snapping instantly.
    this.dishEl.setAttribute('animation__move', {
      property: 'position',
      to: `${touchPoint.x} ${touchPoint.y} ${touchPoint.z}`,
      easing: 'easeOutQuad',
      dur: 400,
    })
  },
}