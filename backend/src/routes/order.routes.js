import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { Cart } from '../models/cart.model.js';
import { Medication } from '../models/product.model.js';
import { Order } from '../models/order.model.js';
import { TAX_RATE, calculateOrderTotals, getPaymentDetails } from '../utils/order.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/my-orders', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: orders,
      message: 'Orders retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

router.get('/admin/all', requireRole('admin'), async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name email role')
      .lean();

    res.json({
      success: true,
      data: orders,
      message: 'All orders retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all orders',
      error: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { shipping, paymentMethod = 'cash_on_delivery' } = req.body;

    if (!shipping?.fullName || !shipping?.phone || !shipping?.addressLine1 || !shipping?.city) {
      return res.status(400).json({
        success: false,
        message: 'Shipping full name, phone, address, and city are required'
      });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.medication',
      select: 'name price stock isActive images'
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty'
      });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const medication = await Medication.findById(cartItem.medication._id);

      if (!medication || !medication.isActive) {
        return res.status(400).json({
          success: false,
          message: `${cartItem.medication?.name || 'A medication'} is no longer available`
        });
      }

      if (medication.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${medication.stock} units of ${medication.name} are currently available`
        });
      }

      medication.stock -= cartItem.quantity;
      await medication.save();

      subtotal += cartItem.price * cartItem.quantity;
      orderItems.push({
        medication: medication._id,
        name: medication.name,
        price: cartItem.price,
        quantity: cartItem.quantity,
        imageUrl: medication.images?.find((img) => img.isPrimary)?.url || medication.images?.[0]?.url || ''
      });
    }

    const totals = calculateOrderTotals(subtotal, TAX_RATE);
    const paymentDetails = getPaymentDetails(paymentMethod);

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      status: paymentDetails.orderStatus,
      paymentMethod,
      paymentStatus: paymentDetails.paymentStatus,
      shipping: {
        fullName: shipping.fullName.trim(),
        phone: shipping.phone.trim(),
        addressLine1: shipping.addressLine1.trim(),
        addressLine2: shipping.addressLine2?.trim() || '',
        city: shipping.city.trim(),
        notes: shipping.notes?.trim() || ''
      }
    });

    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order placed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to place order',
      error: error.message
    });
  }
});

router.put('/admin/:orderId', requireRole('admin'), async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const updates = {};

    if (status) {
      updates.status = status;
    }

    if (paymentStatus) {
      updates.paymentStatus = paymentStatus;
    }

    const order = await Order.findByIdAndUpdate(req.params.orderId, updates, {
      new: true,
      runValidators: true
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
});

export default router;
