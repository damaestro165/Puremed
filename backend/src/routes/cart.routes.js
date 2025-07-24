import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  syncCart
} from '../utils/cart.controller.js'; // Fixed import path
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticateToken);

// GET /api/cart - Get user's cart
router.get('/', getCart);

// GET /api/cart/count - Get cart item count
router.get('/count', getCartCount);

// POST /api/cart/add - Add item to cart
router.post('/add', addToCart);

// POST /api/cart/sync - Sync local cart with backend
router.post('/sync', syncCart);

// PUT /api/cart/item/:medicationId - Update item quantity
router.put('/item/:medicationId', updateCartItem);

// DELETE /api/cart/item/:medicationId - Remove item from cart
router.delete('/item/:medicationId', removeFromCart);

// DELETE /api/cart - Clear entire cart
router.delete('/', clearCart);

export default router;