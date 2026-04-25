import axios from 'axios';
import authService from './auth.service';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/orders`;

export interface OrderPayload {
  shipping: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    notes?: string;
  };
  paymentMethod: 'cash_on_delivery' | 'card_on_delivery' | 'pay_now_demo';
}

export interface OrderItem {
  medication: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled';
  paymentMethod: 'cash_on_delivery' | 'card_on_delivery' | 'pay_now_demo';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shipping: OrderPayload['shipping'];
  createdAt: string;
}

export interface AdminOrder extends Order {
  user?: {
    _id: string;
    name?: string;
    email: string;
    role: 'customer' | 'admin';
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

class OrderService {
  private getHeaders() {
    return {
      ...authService.getAuthHeaders()
    };
  }

  async placeOrder(payload: OrderPayload): Promise<Order> {
    const response = await axios.post<ApiResponse<Order>>(API_BASE_URL, payload, {
      headers: this.getHeaders(),
      timeout: 15000
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to place order');
    }

    return response.data.data;
  }

  async getMyOrders(): Promise<Order[]> {
    const response = await axios.get<ApiResponse<Order[]>>(`${API_BASE_URL}/my-orders`, {
      headers: this.getHeaders(),
      timeout: 10000
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch orders');
    }

    return response.data.data;
  }

  async getAllOrders(): Promise<AdminOrder[]> {
    const response = await axios.get<ApiResponse<AdminOrder[]>>(`${API_BASE_URL}/admin/all`, {
      headers: this.getHeaders(),
      timeout: 10000
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch all orders');
    }

    return response.data.data;
  }

  async updateOrder(orderId: string, updates: Partial<Pick<Order, 'status' | 'paymentStatus'>>): Promise<Order> {
    const response = await axios.put<ApiResponse<Order>>(`${API_BASE_URL}/admin/${orderId}`, updates, {
      headers: this.getHeaders(),
      timeout: 10000
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update order');
    }

    return response.data.data;
  }
}

export default new OrderService();
