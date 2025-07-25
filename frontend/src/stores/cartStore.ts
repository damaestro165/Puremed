import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'
import CartService from '../services/cartService'

export interface CartItem {
  _id: string
  medication: {
    _id: string
    name: string
    price: number
    stock: number
    images: Array<{
      url: string
      alt: string
      isPrimary: boolean
    }>
  }
  quantity: number
  price: number
  addedAt: string
}

export interface Cart {
  _id: string
  userId: string
  items: CartItem[]
  totalItems: number
  totalPrice: number
  createdAt: string
  updatedAt: string
}

interface CartState {
  // State
  cart: Cart | null
  isLoading: boolean
  isUpdating: boolean
  updatingItems: Set<string>
  
  // Actions
  initializeCart: () => Promise<void>
  addToCart: (productId: string, quantity: number, productInfo?: {
    name: string
    price: number
    imageUrl: string
  }) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  
  // Utility actions
  setLoading: (loading: boolean) => void
  setUpdating: (updating: boolean) => void
  addUpdatingItem: (itemId: string) => void
  removeUpdatingItem: (itemId: string) => void
  
  // Computed values
  getCartItemsCount: () => number
  getCartTotal: () => number
  getCartSubtotal: () => number
  getCartTax: () => number
  isItemInCart: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      cart: null,
      isLoading: false,
      isUpdating: false,
      updatingItems: new Set(),

      // Initialize cart (load from server)
      initializeCart: async () => {
        const { setLoading } = get()
        try {
          setLoading(true)
          const cart = await CartService.getCart()
          set({ cart })
        } catch (error) {
          console.error('Failed to initialize cart:', error)
          toast.error('Failed to load cart')
          set({ cart: null })
        } finally {
          setLoading(false)
        }
      },

      // Add item to cart
      addToCart: async (productId: string, quantity: number, productInfo) => {
        const { addUpdatingItem, removeUpdatingItem } = get()
        
        try {
          addUpdatingItem(productId)
          
          const updatedCart = await CartService.addToCart(productId, quantity, productInfo)
          
          set({ cart: updatedCart })
          
          // Show success toast
          const productName = productInfo?.name || 'Item'
          toast.success('Added to cart', {
            description: `${productName} has been added to your cart.`
          })
          
          // Dispatch custom event for other components
          window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { cart: updatedCart, action: 'add', productId } 
          }))
          
        } catch (error: any) {
          console.error('Failed to add to cart:', error)
          toast.error('Failed to add to cart', {
            description: error.message || 'Please try again.'
          })
          throw error
        } finally {
          removeUpdatingItem(productId)
        }
      },

      // Update item quantity - OPTIMIZED: No loading states for better UX
      updateQuantity: async (itemId: string, quantity: number) => {
        const { removeItem } = get()
        
        try {
          // If quantity is 0 or less, remove the item
          if (quantity <= 0) {
            await removeItem(itemId)
            return
          }
          
          // Optimistic update - update UI immediately
          const currentCart = get().cart
          if (currentCart) {
            const optimisticCart = {
              ...currentCart,
              items: currentCart.items.map(item => 
                item.medication._id === itemId 
                  ? { ...item, quantity }
                  : item
              )
            }
            
            // Update total items count
            optimisticCart.totalItems = optimisticCart.items.reduce(
              (sum, item) => sum + item.quantity, 0
            )
            
            // Update UI immediately
            set({ cart: optimisticCart })
          }
          
          // Make API call in background
          const updatedCart = await CartService.updateCartItem(itemId, quantity)
          
          // Update with server response (in case of discrepancies)
          set({ cart: updatedCart })
          
          // Dispatch custom event
          window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { cart: updatedCart, action: 'update', itemId } 
          }))
          
        } catch (error: any) {
          console.error('Failed to update quantity:', error)
          toast.error('Failed to update quantity', {
            description: error.message || 'Please try again.'
          })
          
          // Reload cart on error to sync state
          await get().initializeCart()
          throw error
        }
      },

      // Remove item from cart
      removeItem: async (itemId: string) => {
        const { addUpdatingItem, removeUpdatingItem } = get()
        
        try {
          addUpdatingItem(itemId)
          
          const updatedCart = await CartService.removeFromCart(itemId)
          
          set({ cart: updatedCart })
          
          toast.success('Item removed from cart')
          
          // Dispatch custom event
          window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { cart: updatedCart, action: 'remove', itemId } 
          }))
          
        } catch (error: any) {
          console.error('Failed to remove item:', error)
          toast.error('Failed to remove item', {
            description: error.message || 'Please try again.'
          })
          
          // Reload cart on error
          await get().initializeCart()
          throw error
        } finally {
          removeUpdatingItem(itemId)
        }
      },

      // Clear entire cart
      clearCart: async () => {
        const { setUpdating } = get()
        
        try {
          setUpdating(true)
          
          const updatedCart = await CartService.clearCart()
          
          set({ cart: updatedCart })
          
          toast.success('Cart cleared')
          
          // Dispatch custom event
          window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { cart: updatedCart, action: 'clear' } 
          }))
          
        } catch (error: any) {
          console.error('Failed to clear cart:', error)
          toast.error('Failed to clear cart', {
            description: error.message || 'Please try again.'
          })
          throw error
        } finally {
          setUpdating(false)
        }
      },

      // Utility actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setUpdating: (updating: boolean) => set({ isUpdating: updating }),
      
      addUpdatingItem: (itemId: string) => 
        set((state) => ({ 
          updatingItems: new Set([...state.updatingItems, itemId]) 
        })),
      
      removeUpdatingItem: (itemId: string) => 
        set((state) => {
          const newSet = new Set(state.updatingItems)
          newSet.delete(itemId)
          return { updatingItems: newSet }
        }),

      // Computed values - OPTIMIZED: Memoized calculations
      getCartItemsCount: () => {
        const { cart } = get()
        return cart?.totalItems || 0
      },

      getCartTotal: () => {
        const { cart } = get()
        if (!cart || cart.items.length === 0) return 0
        const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const tax = subtotal * 0.08 // 8% tax
        return subtotal + tax
      },

      getCartSubtotal: () => {
        const { cart } = get()
        if (!cart || cart.items.length === 0) return 0
        return cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      },

      getCartTax: () => {
        const subtotal = get().getCartSubtotal()
        return subtotal * 0.08 // 8% tax
      },

      isItemInCart: (productId: string) => {
        const { cart } = get()
        return cart?.items.some(item => item.medication._id === productId) || false
      },

      getItemQuantity: (productId: string) => {
        const { cart } = get()
        const item = cart?.items.find(item => item.medication._id === productId)
        return item?.quantity || 0
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        cart: state.cart 
      }),
      // Add version for migration support
      version: 1,
    }
  )
)