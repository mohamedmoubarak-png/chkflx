/* Data module loader — imports the Supabase products module and exposes the
   functions the (non-module) app.js needs on window. Externalized for CSP. */
import { getProducts, saveProduct, listenToProducts, DEFAULT_PRODUCTS } from './products.js';

window.getProducts = getProducts;
window.saveProduct = saveProduct;
window.listenToProducts = listenToProducts;
window.DEFAULT_PRODUCTS = DEFAULT_PRODUCTS;

// Signal that the products data module is ready
document.dispatchEvent(new Event('products-ready'));
