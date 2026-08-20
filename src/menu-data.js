// Which dish shows up on this page load is picked via URL parameter, e.g.:
//   https://yoursite.com/index.html?dish=pizza
//   https://yoursite.com/index.html?dish=burger
// Same pattern used in the earlier image-target version - one URL per dish,
// one QR code per dish, all sharing this single built project.
//
// GLB files referenced here must live in src/assets/ (webpack copies that
// folder straight into dist/assets/ - see config/webpack.config.js).

export const MENU_DATA = {
  pizza: {
    name: 'Margherita Pizza',
    modelFile: 'assets/pizza.glb',
    price: '$12.99',
    calories: '285 cal / slice',
    ingredients: ['Mozzarella', 'Tomato Sauce', 'Fresh Basil', 'Olive Oil', 'Sea Salt'],
  },
  burger: {
    name: 'Classic Burger',
    modelFile: 'assets/burger.glb',
    price: '$13.99',
    calories: '540 cal',
    ingredients: ['Beef Patty', 'Cheddar', 'Lettuce', 'Tomato', 'Brioche Bun', 'House Sauce'],
  },
  // Add more dishes here as you add more models:
  // salad: { name: 'Caesar Salad', modelFile: 'assets/salad.glb', price: '$9.99', calories: '320 cal', ingredients: [...] },
}

export function getCurrentDish() {
  const params = new URLSearchParams(window.location.search)
  const key = params.get('dish') || Object.keys(MENU_DATA)[0]
  const data = MENU_DATA[key]
  if (!data) {
    console.error(`No MENU_DATA entry for dish "${key}" - check the URL parameter or add an entry.`)
    return null
  }
  return {key, ...data}
}
