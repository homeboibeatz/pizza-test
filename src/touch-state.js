// Shared touch-gesture state so the dish placement click can be blocked while
// the user is pinch-zooming or drag-rotating. Both tap-place and the gesture
// components read/write this: a finger lifting after a gesture must not be
// interpreted as a tap that moves the dish.
export const touchBlock = {
  until: 0,
  blockFor(ms) {
    this.until = Date.now() + ms
  },
  isBlocked() {
    return Date.now() < this.until
  },
}