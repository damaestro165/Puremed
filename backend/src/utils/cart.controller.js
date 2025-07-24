import { Cart } from '../models/cart.model.js';
import { Medication } from '../models/product.model.js';

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id; 
    const cart = await Cart.getOrCreateCart(userId);
    res.status(200).json({
      success: true,
      data: cart,
      message: 'Cart retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving cart',
      error: error.message
    });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicationId, quantity = 1 } = req.body;

    // Validate input
    if (!medicationId) {
      return res.status(400).json({
        success: false,
        message: 'Medication ID is required'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Check if medication exists and is available
    const medication = await Medication.findById(medicationId);
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    if (!medication.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Medication is not available'
      });
    }

    if (medication.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${medication.stock} items available in stock`
      });
    }

    // Get or create cart
    const cart = await Cart.getOrCreateCart(userId);

    // Check if adding this quantity would exceed stock
    const existingItem = cart.items.find(
      item => item.medication._id.toString() === medicationId
    );
    const totalQuantityAfterAdd = (existingItem?.quantity || 0) + quantity;

    if (totalQuantityAfterAdd > medication.stock) {
      return res.status(400).json({
        success: false,
        message: `Cannot add ${quantity} items. Maximum available: ${medication.stock - (existingItem?.quantity || 0)}`
      });
    }

    // Add item to cart
    await cart.addItem(medicationId, quantity, medication.price);

    // Return updated cart with populated data
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.medication',
      select: 'name price images stock isActive'
    });

    res.status(200).json({
      success: true,
      data: updatedCart,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message
    });
  }
};

// Update item quantity in cart
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicationId } = req.params;
    const { quantity } = req.body;


    // Validate input
    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }

    // Get cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      await cart.removeItem(medicationId);
    } else {
      // Check stock availability
      const medication = await Medication.findById(medicationId);
      if (!medication) {
        return res.status(404).json({
          success: false,
          message: 'Medication not found'
        });
      }

      if (quantity > medication.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${medication.stock} items available in stock`
        });
      }

      await cart.updateItem(medicationId, quantity);
    }

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.medication',
      select: 'name price images stock isActive'
    });

    res.status(200).json({
      success: true,
      data: updatedCart,
      message: 'Cart updated successfully'
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart item',
      error: error.message
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicationId } = req.params;

    console.log('Removing from cart:', { userId, medicationId });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    await cart.removeItem(medicationId);

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.medication',
      select: 'name price images stock isActive'
    });

    res.status(200).json({
      success: true,
      data: updatedCart,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: error.message
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    await cart.clearCart();

    // Return empty cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.medication',
      select: 'name price images stock isActive'
    });

    res.status(200).json({
      success: true,
      data: updatedCart,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
};

// Get cart item count (for header badge)
export const getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    const count = cart ? cart.totalItems : 0;

    res.status(200).json({
      success: true,
      data: { count },
      message: 'Cart count retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving cart count',
      error: error.message
    });
  }
};

// Sync local cart with backend (useful for guest to user conversion)
export const syncCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; // Array of { medicationId, quantity }

    console.log('Syncing cart:', { userId, itemsCount: items?.length });

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }

    const cart = await Cart.getOrCreateCart(userId);

    // Clear existing cart
    await cart.clearCart();

    // Add each item from local cart
    for (const item of items) {
      const { medicationId, quantity } = item;

      if (!medicationId || !quantity) {
        console.warn('Skipping invalid item:', item);
        continue;
      }

      try {
        // Validate medication exists and is available
        const medication = await Medication.findById(medicationId);
        if (medication && medication.isActive && medication.stock >= quantity) {
          await cart.addItem(medicationId, quantity, medication.price);
        } else {
          console.warn('Skipping unavailable medication:', medicationId);
        }
      } catch (itemError) {
        console.error('Error adding item during sync:', itemError);
        // Continue with other items
      }
    }

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.medication',
      select: 'name price images stock isActive'
    });

    res.status(200).json({
      success: true,
      data: updatedCart,
      message: 'Cart synced successfully'
    });
  } catch (error) {
    console.error('Error syncing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing cart',
      error: error.message
    });
  }
};