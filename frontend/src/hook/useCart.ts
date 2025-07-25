import { useEffect } from 'react'
import { useCartStore } from '../stores/cartStore'

/**
 * Custom hook for cart functionality with automatic initialization
 * Provides easy access to cart state and actions
 */
export const useCart = () => {
  const store = useCartStore()

  // Initialize cart on first use
  useEffect(() => {
    if (!store.cart && !store.isLoading) {
      store.initializeCart()
    }
  }, [store.cart, store.isLoading, store.initializeCart])

  return {
    // State
    cart: store.cart,
    isLoading: store.isLoading,
    isUpdating: store.isUpdating,
    updatingItems: store.updatingItems,

    // Actions
    addToCart: store.addToCart,
    updateQuantity: store.updateQuantity,
    removeItem: store.removeItem,
    clearCart: store.clearCart,
    initializeCart: store.initializeCart,

    // Computed values
    itemsCount: store.getCartItemsCount(),
    total: store.getCartTotal(),
    subtotal: store.getCartSubtotal(),
    tax: store.getCartTax(),

    // Utility functions
    isItemInCart: store.isItemInCart,
    getItemQuantity: store.getItemQuantity,

    // Quick actions
    quickAdd: async (productId: string, productInfo: {
      name: string
      price: number
      imageUrl: string
    }) => {
      try {
        await store.addToCart(productId, 1, productInfo)
        return true
      } catch (error) {
        return false
      }
    },

    isEmpty: !store.cart || store.cart.items.length === 0,
    hasItems: store.cart && store.cart.items.length > 0,
  }
}