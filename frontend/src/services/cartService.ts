import axios from 'axios';

const API_BASE_URL =  import.meta.env.VITE_BACKEND_URL+'/api';

// Types
export interface CartItem {
  _id: string;
  medication: {
    _id: string;
    name: string;
    price: number;
    images: Array<{
      url: string;
      alt: string;
      isPrimary: boolean;
    }>;
    stock: number;
    isActive: boolean;
  };
  quantity: number;
  price: number;
  addedAt: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  lastUpdated: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

// Local cart for guest users
const CART_STORAGE_KEY = 'guest_cart';

interface LocalCartItem {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

class CartService {
  private isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Basic token validation - check if it's not expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error validating token:', error);
      localStorage.removeItem('token'); // Remove invalid token
      return false;
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Local cart methods (for guest users)
  private getLocalCart(): LocalCartItem[] {
    try {
      const cart = localStorage.getItem(CART_STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Error reading local cart:', error);
      return [];
    }
  }

  private saveLocalCart(cart: LocalCartItem[]): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      this.notifyCartUpdate(cart.length);
    } catch (error) {
      console.error('Error saving local cart:', error);
    }
  }

  private notifyCartUpdate(count: number): void {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: count }));
  }

  private handleApiError(error: any, defaultMessage: string): never {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Authentication required. Please log in again.');
    }

    if (error.response?.status === 403) {
      throw new Error('Access denied. Please check your permissions.');
    }

    if (error.response?.status === 404) {
      throw new Error('Resource not found.');
    }

    // Use server error message if available
    const serverMessage = error.response?.data?.message || error.response?.data?.error;
    throw new Error(serverMessage || defaultMessage);
  }

  // Backend cart methods
  async getCart(): Promise<Cart | null> {
    if (!this.isAuthenticated()) {
      // Return local cart in a compatible format
      const localItems = this.getLocalCart();
      return {
        _id: 'local',
        user: 'guest',
        items: localItems.map(item => ({
          _id: item._id,
          medication: {
            _id: item._id,
            name: item.name,
            price: item.price,
            images: [{ url: item.imageUrl, alt: item.name, isPrimary: true }],
            stock: 999, // Unknown for local cart
            isActive: true
          },
          quantity: item.quantity,
          price: item.price,
          addedAt: new Date().toISOString()
        })),
        totalItems: localItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: localItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
    }

    try {
      const response = await axios.get<ApiResponse<Cart>>(
        `${API_BASE_URL}/cart`,
        { 
          headers: this.getAuthHeaders(),
          timeout: 10000 // 10 second timeout
        }
      );
      
      if (response.data.success) {
        this.notifyCartUpdate(response.data.data.totalItems);
        return response.data.data;
      }
      
      console.warn('Cart fetch unsuccessful:', response.data.message);
      return null;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to fetch cart');
    }
  }

  async addToCart(medicationId: string, quantity: number = 1, productData?: {
    name: string;
    price: number;
    imageUrl: string;
  }): Promise<Cart | null> {
    console.log('Adding to cart:', { medicationId, quantity, productData, isAuthenticated: this.isAuthenticated() });
    
    if (!this.isAuthenticated()) {
      // Handle local cart
      if (!productData) {
        throw new Error('Product data required for guest cart');
      }

      const localCart = this.getLocalCart();
      const existingItemIndex = localCart.findIndex(item => item._id === medicationId);

      if (existingItemIndex >= 0) {
        localCart[existingItemIndex].quantity += quantity;
      } else {
        localCart.push({
          _id: medicationId,
          name: productData.name,
          price: productData.price,
          imageUrl: productData.imageUrl,
          quantity
        });
      }

      this.saveLocalCart(localCart);
      return this.getCart(); // Return formatted local cart
    }

    try {
      const response = await axios.post<ApiResponse<Cart>>(
        `${API_BASE_URL}/cart/add`,
        { medicationId, quantity },
        { 
          headers: this.getAuthHeaders(),
          timeout: 10000
        }
      );

      if (response.data.success) {
        this.notifyCartUpdate(response.data.data.totalItems);
        return response.data.data;
      }
      
      console.warn('Add to cart unsuccessful:', response.data.message);
      throw new Error(response.data.message || 'Failed to add item to cart');
    } catch (error: any) {
      this.handleApiError(error, 'Error adding to cart');
    }
  }

  async updateCartItem(medicationId: string, quantity: number): Promise<Cart | null> {
    if (!this.isAuthenticated()) {
      // Handle local cart
      const localCart = this.getLocalCart();
      const itemIndex = localCart.findIndex(item => item._id === medicationId);

      if (itemIndex >= 0) {
        if (quantity <= 0) {
          localCart.splice(itemIndex, 1);
        } else {
          localCart[itemIndex].quantity = quantity;
        }
        this.saveLocalCart(localCart);
      }

      return this.getCart();
    }

    try {
      const response = await axios.put<ApiResponse<Cart>>(
        `${API_BASE_URL}/cart/item/${medicationId}`,
        { quantity },
        { 
          headers: this.getAuthHeaders(),
          timeout: 10000
        }
      );

      if (response.data.success) {
        this.notifyCartUpdate(response.data.data.totalItems);
        return response.data.data;
      }
      
      console.warn('Update cart item unsuccessful:', response.data.message);
      throw new Error(response.data.message || 'Failed to update cart item');
    } catch (error: any) {
      this.handleApiError(error, 'Error updating cart item');
    }
  }

  async removeFromCart(medicationId: string): Promise<Cart | null> {
    if (!this.isAuthenticated()) {
      // Handle local cart
      const localCart = this.getLocalCart().filter(item => item._id !== medicationId);
      this.saveLocalCart(localCart);
      return this.getCart();
    }

    try {
      const response = await axios.delete<ApiResponse<Cart>>(
        `${API_BASE_URL}/cart/item/${medicationId}`,
        { 
          headers: this.getAuthHeaders(),
          timeout: 10000
        }
      );

      if (response.data.success) {
        this.notifyCartUpdate(response.data.data.totalItems);
        return response.data.data;
      }
      
      console.warn('Remove from cart unsuccessful:', response.data.message);
      throw new Error(response.data.message || 'Failed to remove item from cart');
    } catch (error: any) {
      this.handleApiError(error, 'Error removing from cart');
    }
  }

  async clearCart(): Promise<Cart | null> {
    if (!this.isAuthenticated()) {
      // Handle local cart
      this.saveLocalCart([]);
      return this.getCart();
    }

    try {
      const response = await axios.delete<ApiResponse<Cart>>(
        `${API_BASE_URL}/cart`,
        { 
          headers: this.getAuthHeaders(),
          timeout: 10000
        }
      );

      if (response.data.success) {
        this.notifyCartUpdate(0);
        return response.data.data;
      }
      
      console.warn('Clear cart unsuccessful:', response.data.message);
      throw new Error(response.data.message || 'Failed to clear cart');
    } catch (error: any) {
      this.handleApiError(error, 'Error clearing cart');
    }
  }

  async getCartCount(): Promise<number> {
    if (!this.isAuthenticated()) {
      const localCart = this.getLocalCart();
      return localCart.reduce((sum, item) => sum + item.quantity, 0);
    }

    try {
      const response = await axios.get<ApiResponse<{ count: number }>>(
        `${API_BASE_URL}/cart/count`,
        { 
          headers: this.getAuthHeaders(),
          timeout: 10000
        }
      );

      if (response.data.success) {
        return response.data.data.count;
      }
      
      console.warn('Get cart count unsuccessful:', response.data.message);
      return 0;
    } catch (error: any) {
      console.error('Error fetching cart count:', error);
      return 0; // Don't throw error for count, just return 0
    }
  }

  async syncCart(): Promise<Cart | null> {
    if (!this.isAuthenticated()) {
      return null; // Can't sync if not authenticated
    }

    const localCart = this.getLocalCart();
    if (localCart.length === 0) {
      return this.getCart(); // Nothing to sync
    }

    try {
      const response = await axios.post<ApiResponse<Cart>>(
        `${API_BASE_URL}/cart/sync`,
        {
          items: localCart.map(item => ({
            medicationId: item._id,
            quantity: item.quantity
          }))
        },
        { 
          headers: this.getAuthHeaders(),
          timeout: 15000 // Longer timeout for sync
        }
      );

      if (response.data.success) {
        // Clear local cart after successful sync
        localStorage.removeItem(CART_STORAGE_KEY);
        this.notifyCartUpdate(response.data.data.totalItems);
        return response.data.data;
      }
      
      console.warn('Sync cart unsuccessful:', response.data.message);
      throw new Error(response.data.message || 'Failed to sync cart');
    } catch (error: any) {
      this.handleApiError(error, 'Error syncing cart');
    }
  }
}

export default new CartService();