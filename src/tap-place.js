// Component that places (and repositions) ONE dish model where the user
// taps the detected floor/table. Adapted from 8th Wall's original cactus
// example - key differences:
//   - Places a single model (not a new one on every tap) - re-tapping
//     moves the existing dish to the new spot instead of spawning more.
//   - The model comes from menu-data.js, picked via the ?dish= URL param.
//   - Adds pinch-to-scale and drag-to-rotate once placed.

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
      newElement.setAttribute('visible', 'true')
      newElement.setAttribute('animation', {
        property: 'scale',
        to: '1 1 1',
        easing: 'easeOutElastic',
        dur: 800,
      })

      this.prompt.style.display = 'none'
    })

    newElement.addEventListener('error', () => {
      console.error(`Failed to load model: ${dish.modelFile}`)
      this.prompt.style.display = 'block'
      this.prompt.textContent = `Couldn't load ${dish.name} - check that ${dish.modelFile} exists.`
    })

    this.dishEl = newElement
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
