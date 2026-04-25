import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { useCartStore } from '../stores/cartStore';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, initializeCart, isLoading, getCartSubtotal, getCartTax, getCartTotal } = useCartStore();

  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  const subtotal = getCartSubtotal();
  const tax = getCartTax();
  const total = getCartTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2D3748] mb-2">Checkout</h1>
          <p className="text-gray-600">
            This first pass gives the cart flow a real destination while full ordering and payment are still being built.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-600">Loading your order summary...</div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <h2 className="text-xl font-semibold text-[#2D3748] mb-3">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add a few items before moving to checkout.</p>
            <Button onClick={() => navigate('/')} className="bg-[#3182CE] hover:bg-[#2C5282] text-white">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#2D3748] mb-4">Order items</h2>
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-b-0">
                    <img
                      src={item.medication.images?.[0]?.url || '/placeholder-product.jpeg'}
                      alt={item.medication.name}
                      className="w-16 h-16 rounded-xl object-cover bg-gray-100"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#2D3748]">{item.medication.name}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-[#2D3748]">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm h-fit">
              <h2 className="text-xl font-semibold text-[#2D3748] mb-4">Summary</h2>
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

              <div className="mt-6 space-y-3">
                <Button onClick={() => navigate('/cart')} variant="outline" className="w-full">
                  Back to Cart
                </Button>
                <Button onClick={() => navigate('/prescription')} className="w-full bg-[#3182CE] hover:bg-[#2C5282] text-white">
                  Upload Prescription
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Payment, shipping, and order placement are the next steps to build in the checkout flow.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
