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

    const dish = getCurrentDish()
    if (!dish) {
      this.prompt.textContent = 'No dish configured for this link.'
      return
    }
    this.dish = dish
    this.prompt.textContent = `Tap the floor to place the ${dish.name}`

    ground.addEventListener('click', (event) => {
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

  // Scales the model so its footprint spans ~90% of the phone's screen
  // width at its current distance from the camera. Returns 1 (no scaling)
  // if anything can't be measured, so it never breaks placement.
  fitToScreen(el, touchPoint) {
    const camera = this.el.sceneEl.camera
    if (!camera) return 1

    // Measure the footprint at unit scale so the ratio comes out right.
    el.object3D.scale.set(1, 1, 1)
    el.object3D.updateMatrixWorld(true)
    const box = new AFRAME.THREE.Box3().setFromObject(el.object3D)
    const size = box.getSize()
    const modelWidth = Math.max(size.x, size.z)
    if (!Number.isFinite(modelWidth) || modelWidth <= 0) return 1

    const camPos = new AFRAME.THREE.Vector3()
    camera.getWorldPosition(camPos)
    const dist = camPos.distanceTo(
      new AFRAME.THREE.Vector3(touchPoint.x, touchPoint.y, touchPoint.z),
    )

    const vFov = AFRAME.THREE.MathUtils.degToRad(camera.fov || 80)
    const canvas = this.el.sceneEl.canvas
    const aspect = canvas ? canvas.width / canvas.height : window.innerWidth / window.innerHeight
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const visibleWidth = 2 * dist * Math.tan(hFov / 2)
    if (!Number.isFinite(visibleWidth) || visibleWidth <= 0) return 1

    return (0.9 * visibleWidth) / modelWidth
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