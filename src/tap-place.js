// Places ONE dish model directly on the detected floor using 8th Wall's
// world (SLAM) tracking - no tapping required. As soon as the camera is
// looking down at a floor that SLAM has picked up, the dish pops in at the
// center of the view, scaled to fill ~90% of the screen width.
//
// The dish comes from menu-data.js, picked via the ?dish= URL param.
// Once placed you can still tap the floor to reposition it, pinch to
// scale, and drag to rotate.

import {getCurrentDish} from './menu-data'

const FLOOR_Y = 0.01 // top surface of the invisible shadow plane in index.html

export const tapPlaceComponent = {
  init() {
    const ground = document.getElementById('ground')
    this.prompt = document.getElementById('promptText')
    this.dishEl = null // the placed entity, once it exists
    this.placed = false
    this.lookFrames = 0

    const dish = getCurrentDish()
    if (!dish) {
      this.prompt.textContent = 'No dish configured for this link.'
      return
    }
    this.dish = dish
    this.prompt.textContent = `Point your phone at the floor to show the ${dish.name}`

    // Tapping the floor after auto-placement just moves the dish there.
    ground.addEventListener('click', (event) => {
      if (!this.placed) return
      this.moveDish(event.detail.intersection.point)
    })
  },

  // Runs every frame. Auto-places the dish (once) once the camera is
  // reliably looking down at the SLAM-detected floor.
  tick() {
    if (this.placed || !this.dish) return

    const floorPoint = this.getFloorLookPoint()
    if (!floorPoint) {
      this.lookFrames = 0
      return
    }

    // Hold the camera on the floor for a few frames so SLAM has settled
    // on a stable floor estimate before we commit the position.
    this.lookFrames += 1
    if (this.lookFrames < 10) return

    this.placeDish(floorPoint)
    this.placed = true
  },

  // Intersects the camera's view ray (screen center) with the virtual
  // floor plane. Returns null until the phone is actually tilted down.
  getFloorLookPoint() {
    const camera = this.el.sceneEl.camera
    if (!camera) return null

    const pos = new AFRAME.THREE.Vector3()
    const dir = new AFRAME.THREE.Vector3()
    camera.getWorldPosition(pos)
    camera.getWorldDirection(dir)

    // Only place once the camera is genuinely looking down at the floor.
    if (dir.y > -0.1) return null

    const t = (FLOOR_Y - pos.y) / dir.y
    if (t < 0.2 || t > 8) return null

    return {
      x: pos.x + dir.x * t,
      y: FLOOR_Y,
      z: pos.z + dir.z * t,
    }
  },

  placeDish(floorPoint) {
    const dish = this.dish
    const newElement = document.createElement('a-entity')

    newElement.setAttribute('position', floorPoint)
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
      const fitScale = this.fitToScreen(newElement, floorPoint)

      newElement.object3D.scale.set(0.0001, 0.0001, 0.0001)
      newElement.setAttribute('visible', 'true')
      newElement.setAttribute('animation', {
        property: 'scale',
        to: `${fitScale} ${fitScale} ${fitScale}`,
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

  // Scales the model so its footprint spans ~90% of the phone's screen
  // width at its current distance from the camera.
  fitToScreen(el, floorPoint) {
    // Measure the footprint at unit scale so the ratio comes out right.
    el.object3D.scale.set(1, 1, 1)
    el.object3D.updateMatrixWorld(true)
    const box = new AFRAME.THREE.Box3().setFromObject(el.object3D)
    const size = box.getSize()
    const modelWidth = Math.max(size.x, size.z)

    const camera = this.el.sceneEl.camera
    const camPos = new AFRAME.THREE.Vector3()
    camera.getWorldPosition(camPos)
    const dist = camPos.distanceTo(
      new AFRAME.THREE.Vector3(floorPoint.x, floorPoint.y, floorPoint.z),
    )

    const vFov = AFRAME.THREE.MathUtils.degToRad(camera.fov)
    const canvas = this.el.sceneEl.canvas
    const aspect = canvas ? canvas.width / canvas.height : window.innerWidth / window.innerHeight
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const visibleWidth = 2 * dist * Math.tan(hFov / 2)

    return Math.max(0.01, (0.9 * visibleWidth) / modelWidth)
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