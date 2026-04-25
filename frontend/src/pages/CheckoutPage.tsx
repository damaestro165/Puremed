import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useCartStore } from '../stores/cartStore';
import orderService, { Order } from '../services/orderService';
import { toast, Toaster } from 'sonner';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, initializeCart, isLoading, getCartSubtotal, getCartTax, getCartTotal } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    notes: '',
    paymentMethod: 'cash_on_delivery' as 'cash_on_delivery' | 'card_on_delivery' | 'pay_now_demo'
  });

  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  const subtotal = getCartSubtotal();
  const tax = getCartTax();
  const total = getCartTotal();

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await orderService.placeOrder({
        paymentMethod: form.paymentMethod,
        shipping: {
          fullName: form.fullName,
          phone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          notes: form.notes
        }
      });

      setCompletedOrder(order);
      await initializeCart();
      toast.success('Order placed successfully');
    } catch (error) {
      console.error('Checkout failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to place order';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toaster />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2D3748] mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your delivery details and place this order securely.</p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-600">Loading your order summary...</div>
        ) : completedOrder ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm max-w-3xl">
            <h2 className="text-2xl font-semibold text-[#2D3748] mb-3">Order confirmed</h2>
            <p className="text-gray-600 mb-6">
              Your order <span className="font-medium">#{completedOrder._id.slice(-6).toUpperCase()}</span> has been created successfully.
            </p>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold capitalize text-[#2D3748]">{completedOrder.status}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-gray-500">Payment</p>
                <p className="font-semibold text-[#2D3748]">
                  {completedOrder.paymentMethod === 'cash_on_delivery'
                    ? 'Cash on delivery'
                    : completedOrder.paymentMethod === 'card_on_delivery'
                      ? 'Card on delivery'
                      : 'Demo pay now'}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-gray-500">Payment status</p>
                <p className="font-semibold capitalize text-[#2D3748]">{completedOrder.paymentStatus}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate('/dashboard')} className="bg-[#3182CE] hover:bg-[#2C5282] text-white">
                View Dashboard
              </Button>
              <Button onClick={() => navigate('/')} variant="outline">
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <h2 className="text-xl font-semibold text-[#2D3748] mb-3">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add a few items before moving to checkout.</p>
            <Button onClick={() => navigate('/')} className="bg-[#3182CE] hover:bg-[#2C5282] text-white">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <form onSubmit={handlePlaceOrder} className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-[#2D3748] mb-4">Delivery information</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Full name" required />
                  <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Phone number" required />
                  <div className="md:col-span-2">
                    <Input value={form.addressLine1} onChange={(e) => updateField('addressLine1', e.target.value)} placeholder="Address line 1" required />
                  </div>
                  <div className="md:col-span-2">
                    <Input value={form.addressLine2} onChange={(e) => updateField('addressLine2', e.target.value)} placeholder="Address line 2 (optional)" />
                  </div>
                  <Input value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="City" required />
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => updateField('paymentMethod', e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="cash_on_delivery">Cash on delivery</option>
                    <option value="card_on_delivery">Card on delivery</option>
                    <option value="pay_now_demo">Pay now (demo)</option>
                  </select>
                  <div className="md:col-span-2">
                    <Input value={form.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="Delivery notes (optional)" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={isSubmitting} className="bg-[#3182CE] hover:bg-[#2C5282] text-white">
                  {isSubmitting ? 'Placing order...' : 'Place Order'}
                </Button>
                <Button type="button" onClick={() => navigate('/cart')} variant="outline">
                  Back to Cart
                </Button>
              </div>
            </form>

            <div className="bg-white rounded-2xl p-6 shadow-sm h-fit">
              <h2 className="text-xl font-semibold text-[#2D3748] mb-4">Summary</h2>
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    <img
                      src={item.medication.images?.[0]?.url || '/placeholder-product.jpeg'}
                      alt={item.medication.name}
                      className="w-14 h-14 rounded-xl object-cover bg-gray-100"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#2D3748]">{item.medication.name}</p>
                      <p className="text-sm text-gray-500">Qty {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-[#2D3748]">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#2D3748] pt-3 border-t border-gray-100">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Selecting <span className="font-medium">Pay now (demo)</span> simulates an immediate successful payment and confirms the order.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
