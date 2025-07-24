import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { toast, Toaster } from "sonner"
import CartService, { Cart, CartItem } from "../services/cartService"

const CartPage: React.FC = () => {
  const navigate = useNavigate()
  
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const isUpdatingRef = useRef<boolean>(false)

  // Load cart using CartService
  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true)
        const fetchedCart = await CartService.getCart()
        setCart(fetchedCart)
      } catch (error) {
        console.error('Error loading cart:', error)
        toast.message('Error', {
          description: 'Failed to load cart.',
        })
        setCart(null)
      } finally {
        setLoading(false)
      }
    }

    loadCart()

    // Listen for cart updates from other components (like header)
    const handleCartUpdate = (event: CustomEvent) => {
      // Only reload if we're not currently updating an item from this page
      if (!isUpdatingRef.current) {
        loadCart()
      }
    }

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener)
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener)
    }
  }, [])

  // Update item quantity
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity < 1) {
        await removeItem(itemId)
        return
      }

      // Set updating state
      isUpdatingRef.current = true
      setUpdatingItems(prev => new Set(prev).add(itemId))

      const updatedCart = await CartService.updateCartItem(itemId, newQuantity)
      
      // Update local state immediately without triggering reload
      if (updatedCart) {
        setCart(updatedCart)
      }

      toast.message('Quantity Updated', {
        description: 'Cart item quantity updated successfully.',
      })
    } catch (error: any) {
      console.error('Error updating quantity:', error)
      toast.message('Error', {
        description: error.message || 'Failed to update item quantity.',
      })
      
      // Reload cart on error to sync state
      try {
        const freshCart = await CartService.getCart()
        setCart(freshCart)
      } catch (reloadError) {
        console.error('Failed to reload cart after error:', reloadError)
      }
    } finally {
      // Clear updating state
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
      
      // Reset the updating flag after a brief delay
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 500)
    }
  }

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    try {
      isUpdatingRef.current = true
      setUpdatingItems(prev => new Set(prev).add(itemId))

      const updatedCart = await CartService.removeFromCart(itemId)
      
      if (updatedCart) {
        setCart(updatedCart)
      }

      toast.message('Item Removed', {
        description: 'Item removed from cart successfully.',
      })
    } catch (error: any) {
      console.error('Error removing item:', error)
      toast.message('Error', {
        description: error.message || 'Failed to remove item from cart.',
      })
      
      // Reload cart on error
      try {
        const freshCart = await CartService.getCart()
        setCart(freshCart)
      } catch (reloadError) {
        console.error('Failed to reload cart after error:', reloadError)
      }
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
      
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 500)
    }
  }

  // Clear entire cart
  const clearCart = async () => {
    try {
      isUpdatingRef.current = true
      const updatedCart = await CartService.clearCart()
      
      if (updatedCart) {
        setCart(updatedCart)
      }

      toast.message('Cart Cleared', {
        description: 'All items removed from cart.',
      })
    } catch (error: any) {
      console.error('Error clearing cart:', error)
      toast.message('Error', {
        description: error.message || 'Failed to clear cart.',
      })
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 500)
    }
  }

  // Handle input change for quantity
  const handleQuantityInputChange = (itemId: string, value: string) => {
    const newQuantity = parseInt(value) || 1
    if (newQuantity > 0 && newQuantity <= 999) {
      updateQuantity(itemId, newQuantity)
    }
  }

  // Calculate totals
  const subtotal = cart?.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
  const tax = subtotal * 0.08 // Assuming 8% tax
  const total = subtotal + tax

  if (loading) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <Header />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3182CE]"></div>
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
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#2D3748]">
              Shopping Cart
            </h1>
            <p className="text-gray-600">
              {cart?.items.length || 0} {cart?.items.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          {cart?.items.length > 0 && (
            <Button 
              onClick={clearCart}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              disabled={isUpdatingRef.current}
            >
              Clear Cart
            </Button>
          )}
        </div>

        {!cart || cart.items.length === 0 ? (
          /* Empty Cart */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <i className="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
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
              {cart.items.map((item: CartItem) => {
                const isUpdating = updatingItems.has(item.medication._id)
                
                return (
                  <div key={item._id} className={`flex gap-4 p-4 border rounded-lg transition-opacity ${isUpdating ? 'opacity-60' : ''}`}>
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
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => updateQuantity(item.medication._id, item.quantity - 1)}
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0"
                        disabled={isUpdating || item.quantity <= 1}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityInputChange(item.medication._id, e.target.value)}
                        className="w-16 text-center"
                        min="1"
                        max={item.medication.stock}
                        disabled={isUpdating}
                      />
                      <Button
                        onClick={() => updateQuantity(item.medication._id, item.quantity + 1)}
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0"
                        disabled={isUpdating || item.quantity >= item.medication.stock}
                      >
                        +
                      </Button>
                    </div>
                    
                    {/* Item Total */}
                    <div className="text-right">
                      <p className="font-bold text-[#2D3748]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        onClick={() => removeItem(item.medication._id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-1"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                            <span className="text-xs">Updating...</span>
                          </div>
                        ) : (
                          'Remove'
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold text-[#2D3748] mb-4">
                  Order Summary
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <hr className="my-3" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#3182CE]">${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6 bg-[#3182CE] hover:bg-[#2C5282] text-white"
                  onClick={() => navigate('/checkout')}
                  disabled={isUpdatingRef.current}
                >
                  Proceed to Checkout
                </Button>
                
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full mt-3"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage