import mongoose from 'mongoose';

// Cart Item Schema
const CartItemSchema = new mongoose.Schema({
  medication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Cart Schema
const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Each user can have only one cart
  },
  items: [CartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better performance
CartSchema.index({ user: 1 });
CartSchema.index({ 'items.medication': 1 });

// Virtual to calculate total items
CartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual to calculate subtotal
CartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Middleware to update totals before saving
CartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  this.lastUpdated = Date.now();
  next();
});

// Method to add item to cart
CartSchema.methods.addItem = function(medicationId, quantity, price) {
  const existingItemIndex = this.items.findIndex(
    item => item.medication.toString() === medicationId.toString()
  );

  if (existingItemIndex >= 0) {
    // Item already exists, update quantity
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].price = price; // Update price in case it changed
  } else {
    // New item, add to cart
    this.items.push({
      medication: medicationId,
      quantity,
      price
    });
  }

  return this.save();
};

// Method to update item quantity
CartSchema.methods.updateItem = function(medicationId, quantity) {
  const itemIndex = this.items.findIndex(
    item => item.medication.toString() === medicationId.toString()
  );

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      this.items.splice(itemIndex, 1);
    } else {
      this.items[itemIndex].quantity = quantity;
    }
    return this.save();
  }
  
  throw new Error('Item not found in cart');
};

// Method to remove item from cart
CartSchema.methods.removeItem = function(medicationId) {
  this.items = this.items.filter(
    item => item.medication.toString() !== medicationId.toString()
  );
  return this.save();
};

// Method to clear cart
CartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Static method to get or create cart for user
CartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId }).populate({
    path: 'items.medication',
    select: 'name price images stock isActive'
  });

  if (!cart) {
    cart = new this({ user: userId });
    await cart.save();
    // Populate after creation
    cart = await this.findById(cart._id).populate({
      path: 'items.medication',
      select: 'name price images stock isActive'
    });
  }

  return cart;
};

// Static method to clean up expired items (optional - for items that might have been discontinued)
CartSchema.statics.cleanupInactiveItems = async function(userId) {
  const cart = await this.findOne({ user: userId });
  if (!cart) return null;

  // Remove items where medication is inactive or out of stock
  const validItems = [];
  for (const item of cart.items) {
    const medication = await mongoose.model('Medication').findById(item.medication);
    if (medication && medication.isActive && medication.stock > 0) {
      validItems.push(item);
    }
  }

  cart.items = validItems;
  return cart.save();
};

export const Cart = mongoose.model('Cart', CartSchema);