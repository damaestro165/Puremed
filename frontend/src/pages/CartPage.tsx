import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"


interface CartItem {  
  _id: string
  name: string
  price: number
  imageUrl: string
  quantity: number
}

const CartPage: React.FC = () => {
  const navigate = useNavigate()
  
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        const cart = localStorage.getItem('cart')
        if (cart) {
          setCartItems(JSON.parse(cart))
        }
      } catch (error) {
        console.error('Error loading cart:', error)
        setCartItems([])
      } finally {
        setLoading(false)
      }
    }

    loadCart()

    // Listen for cart updates from other components
    const handleCartUpdate = (event: CustomEvent) => {
      setCartItems(event.detail || [])
    }

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener)
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener)
    }
  }, [])

  // Save cart to localStorage and dispatch event
  const saveCart = (newCart: CartItem[]) => {
    setCartItems(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: newCart }))
  }

  // Update item quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId)
      return
    }


    const updatedCart = cartItems.map(item =>
      item._id === itemId ? { ...item, quantity: newQuantity } : item
    )
    saveCart(updatedCart)
    

  }

  // Remove item from cart
  const removeItem = (itemId: string) => {
    const updatedCart = cartItems.filter(item => item._id !== itemId)
    saveCart(updatedCart)
    
 
  }

  // Clear entire cart
  const clearCart = () => {
    saveCart([])
    
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
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
      
      <div className="max-w-6xl mx-auto p-4">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#2D3748]">
              Shopping Cart
            </h1>
            <p className="text-gray-600">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          {cartItems.length > 0 && (
            <Button 
              onClick={clearCart}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          )}
        </div>

        {cartItems.length === 0 ? (
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
              {cartItems.map((item) => (
                <div key={item._id} className="flex gap-4 p-4 border rounded-lg">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
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
                      {item.name}
                    </h3>
                    <p className="text-[#3182CE] font-bold">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item._id, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                      min="1"
                    />
                    <Button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
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
                      onClick={() => removeItem(item._id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-1"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
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
                  onClick={() => {
                   
                  }}
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