// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import './index.css'

// Register custom A-Frame components in app.js before the scene in body.html has loaded.
import {tapPlaceComponent} from './tap-place'
import {pinchScaleComponent, dragRotateComponent} from './interaction-components'

AFRAME.registerComponent('tap-place', tapPlaceComponent)
AFRAME.registerComponent('pinch-scale', pinchScaleComponent)
AFRAME.registerComponent('drag-rotate', dragRotateComponent)
