/* Data module loader — exposes the built-in products to the (non-module)
   app.js on window. Externalized for CSP. */
import { getProducts, DEFAULT_PRODUCTS } from './products.js';

window.getProducts = getProducts;
window.DEFAULT_PRODUCTS = DEFAULT_PRODUCTS;

// Signal that the products data module is ready
document.dispatchEvent(new Event('products-ready'));
