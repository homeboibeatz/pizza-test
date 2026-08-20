// Pinch-to-scale and drag-to-rotate. Identical logic to what we used in the
// image-target (MindAR) version - these only touch object3D.scale/rotation
// directly, so they work the same regardless of what's doing the tracking
// underneath (MindAR vs 8th Wall's SLAM makes no difference here).

import {touchBlock} from './touch-state'

export const pinchScaleComponent = {
  init() {
    const el = this.el
    let startDistance = 0
    let startScale = el.object3D.scale.x

    const getDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 2) return
      e.preventDefault()

      const distance = getDistance(e.touches)

      if (!startDistance) {
        startDistance = distance
        startScale = el.object3D.scale.x
        return
      }

      const scale = startScale * (distance / startDistance)
      // Generous clamp: the fit-to-screen scale can be large (the dish is
      // placed filling ~90% of the screen), so the old max of 5 made zooming
      // feel broken. Keep zoom in/out responsive from any starting scale.
      const clampedScale = Math.max(0.1, Math.min(scale, 50))

      el.object3D.scale.set(clampedScale, clampedScale, clampedScale)
    }, {passive: false})

    window.addEventListener('touchend', () => {
      startDistance = 0
    })
  },
}

export const dragRotateComponent = {
  init() {
    const el = this.el
    let isDragging = false
    let startX = 0
    let startY = 0
    let lastX = 0
    let lastY = 0
    let wasDrag = false
    const DRAG_THRESHOLD = 10 // px of movement before a touch becomes a rotation

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true
        wasDrag = false
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
        lastX = startX
        lastY = startY
      } else {
        // A second finger joined (pinch) - cancel rotation so the dish
        // doesn't spin while the user is trying to zoom.
        isDragging = false
      }
    }, {passive: true})

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1 || !isDragging) return
      e.preventDefault()

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY

      // Ignore small movements (taps) - only rotate once it's clearly a drag.
      if (!wasDrag) {
        const dx = currentX - startX
        const dy = currentY - startY
        if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return
        wasDrag = true
      }

      const deltaX = currentX - lastX
      const deltaY = currentY - lastY

      el.object3D.rotation.y += deltaX * 0.01
      el.object3D.rotation.x += deltaY * 0.01

      lastX = currentX
      lastY = currentY

      // Keep the placement tap blocked for as long as we're rotating, so
      // releasing the finger doesn't jump the dish to the touch point.
      touchBlock.blockFor(1500)
    }, {passive: false})

    window.addEventListener('touchend', () => {
      isDragging = false
      // After a rotation drag, block placement taps briefly so the dish stays
      // where it is instead of being dragged to the finger's release spot.
      if (wasDrag) {
        touchBlock.blockFor(1500)
      }
    })
  },
}
