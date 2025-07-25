import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Toaster } from "sonner"
import { useCartStore } from "../stores/cartStore"
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react"

const CartPage: React.FC = () => {
  const navigate = useNavigate()
  
  const {
    cart,
    isLoading,
    isUpdating,
    updatingItems,
    initializeCart,
    updateQuantity,
    removeItem,
    getCartSubtotal,
    getCartTax,
    getCartTotal
  } = useCartStore()

  // Initialize cart on component mount
  useEffect(() => {
    initializeCart()
  }, [initializeCart])

  // Handle quantity input change - OPTIMIZED: Debounced for better performance
  const handleQuantityInputChange = (itemId: string, value: string) => {
    const newQuantity = parseInt(value) || 1
    if (newQuantity > 0 && newQuantity <= 999) {
      updateQuantity(itemId, newQuantity)
    }
  }

  // Handle increment quantity - OPTIMIZED: No loading state
  const incrementQuantity = (itemId: string, currentQuantity: number, maxStock: number) => {
    if (currentQuantity < maxStock) {
      updateQuantity(itemId, currentQuantity + 1)
    }
  }

  // Handle decrement quantity - OPTIMIZED: No loading state
  const decrementQuantity = (itemId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(itemId, currentQuantity - 1)
    }
  }

  // Calculate totals - OPTIMIZED: Only calculate when needed
  const subtotal = getCartSubtotal()
  const tax = getCartTax()
  const total = getCartTotal()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <Header />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3182CE]"></div>
            <p className="text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <Header />
      <Toaster />
      
      <div className="max-w-6xl mx-auto p-4">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div className=" flex lg:items-center flex-col w-full gap-5 ">
            <h1 className="text-2xl lg:text-3xl font-bold text-[#2D3748]">
              Shopping Cart
            </h1>
            <p className="text-gray-600">
              {cart?.items.length || 0} {cart?.items.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
         
        </div>

        {!cart || cart.items.length === 0 ? (
          /* Empty Cart */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <ShoppingCart className="w-24 h-24 text-gray-300 mb-4 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-500 mb-6">
                Looks like you haven't added any items to your cart yet.
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-[#3182CE] hover:bg-[#2C5282] text-white"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : (
          /* Cart Content */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                // OPTIMIZED: Only show updating state for remove operations
                const isItemRemoving = updatingItems.has(item.medication._id)
                
                return (
                  <div 
                    key={item._id} 
                    className={`flex gap-4 p-4 border rounded-lg transition-all duration-200 ${
                      isItemRemoving ? 'opacity-60' : 'hover:shadow-md'
                    }`}
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.medication.images[0]?.url || '/placeholder-product.jpeg'} 
                        alt={item.medication.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-product.jpeg'
                        }}
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-grow">
                      <h3 className="font-semibold text-[#2D3748] mb-1">
                        {item.medication.name}
                      </h3>
                      <p className="text-[#3182CE] font-bold">
                        ${item.price.toFixed(2)}
                      </p>
                      {item.medication.stock < 10 && item.medication.stock > 0 && (
                        <p className="text-orange-600 text-xs mt-1">
                          Only {item.medication.stock} left in stock
                        </p>
                      )}
                      {item.medication.stock === 0 && (
                        <p className="text-red-600 text-xs mt-1">
                          Out of stock
                        </p>
                      )}
                    </div>
                    
                    {/* Quantity Controls - OPTIMIZED: No updating states */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => decrementQuantity(item.medication._id, item.quantity)}
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 hover:bg-gray-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityInputChange(item.medication._id, e.target.value)}
                        className="w-16 text-center border-gray-300 focus:border-[#3182CE] focus:ring-[#3182CE]"
                        min="1"
                        max={item.medication.stock}
                      />
                      
                      <Button
                        onClick={() => incrementQuantity(item.medication._id, item.quantity, item.medication.stock)}
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 hover:bg-gray-50"
                        disabled={item.quantity >= item.medication.stock}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {/* Item Total & Remove */}
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="font-bold text-[#2D3748]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        onClick={() => removeItem(item.medication._id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isItemRemoving}
                      >
                        {isItemRemoving ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                            <span className="text-xs">Removing...</span>
                          </div>
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Order Summary - OPTIMIZED: Better visual hierarchy */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 sticky top-4 border border-gray-200">
                <h2 className="text-xl font-bold text-[#2D3748] mb-4">
                  Order Summary
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({cart.items.length} items)</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Tax (8%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <hr className="border-gray-300" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#3182CE]">${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6 bg-[#3182CE] hover:bg-[#2C5282] text-white font-semibold py-3"
                  onClick={() => navigate('/checkout')}
                  disabled={isUpdating || cart.items.length === 0}
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </Button>
                
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full mt-3 border-gray-300 hover:bg-gray-50"
                >
                  Continue Shopping
                </Button>
                
                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>• Free shipping on orders over $50</p>
                    <p>• 30-day return policy</p>
                    <p>• Secure checkout</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage