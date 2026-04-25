import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth.service';
import orderService, { AdminOrder, Order } from '../services/orderService';
import Header from './Header';
import { Button } from './ui/button';

interface Medication {
  _id: string;
  name: string;
  stock: number;
  price: number;
}

interface InventoryResponse {
  success: boolean;
  data: Medication[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Medication[]>([]);
  const [expiringSoonItems, setExpiringSoonItems] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const requests = [
          orderService.getMyOrders().catch(() => []),
          axios.get<InventoryResponse>(`${import.meta.env.VITE_BACKEND_URL}/api/medications/inventory/low-stock`),
          axios.get<InventoryResponse>(`${import.meta.env.VITE_BACKEND_URL}/api/medications/inventory/expiring-soon?days=60`)
        ] as const;

        const [orderResults, lowStockResults, expiringResults] = await Promise.all(requests);
        setOrders(orderResults);
        setLowStockItems(lowStockResults.data.success ? lowStockResults.data.data.slice(0, 5) : []);
        setExpiringSoonItems(expiringResults.data.success ? expiringResults.data.data.slice(0, 5) : []);

        if (isAdmin) {
          const allOrders = await orderService.getAllOrders().catch(() => []);
          setAdminOrders(allOrders);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [isAdmin]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleAdminOrderUpdate = async (orderId: string, status: Order['status'], paymentStatus: Order['paymentStatus']) => {
    try {
      const updated = await orderService.updateOrder(orderId, { status, paymentStatus });
      setAdminOrders((current) => current.map((order) => (order._id === orderId ? { ...order, ...updated } : order)));
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const adminPendingOrders = adminOrders.filter((order) => order.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2D3748]">Welcome, {user?.name || 'there'}!</h1>
            <p className="text-gray-600 mt-2">Track your orders, prescriptions, and pharmacy operations from one place.</p>
          </div>
          <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white w-fit">
            Logout
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Role</p>
            <p className="text-xl font-semibold text-[#2D3748] capitalize">{user?.role || 'customer'}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Orders placed</p>
            <p className="text-xl font-semibold text-[#2D3748]">{orders.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">{isAdmin ? 'Orders awaiting action' : 'Pending orders'}</p>
            <p className="text-xl font-semibold text-[#2D3748]">{isAdmin ? adminPendingOrders : pendingOrders}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total spent</p>
            <p className="text-xl font-semibold text-[#2D3748]">${totalSpent.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#2D3748]">{isAdmin ? 'Customer orders' : 'Recent orders'}</h2>
                <Button variant="outline" onClick={() => navigate('/checkout')}>New Order</Button>
              </div>

              {isLoading ? (
                <p className="text-gray-600">Loading your dashboard...</p>
              ) : (isAdmin ? adminOrders : orders).length === 0 ? (
                <div className="rounded-xl bg-gray-50 p-5 text-gray-600">
                  {isAdmin ? 'No customer orders yet.' : 'No orders yet. Your first completed checkout will show up here.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {(isAdmin ? adminOrders : orders).slice(0, 6).map((order) => (
                    <div key={order._id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <p className="font-semibold text-[#2D3748]">Order #{order._id.slice(-6).toUpperCase()}</p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-sm capitalize px-3 py-1 rounded-full bg-blue-50 text-[#3182CE] w-fit">
                            {order.status}
                          </span>
                          <span className="text-sm capitalize px-3 py-1 rounded-full bg-green-50 text-green-700 w-fit">
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                      {'user' in order && order.user && (
                        <p className="text-sm text-gray-500 mb-2">
                          {order.user.name || order.user.email} • {order.user.email}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mb-2">
                        {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} item{order.items.length === 1 ? '' : 's'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.items.map((item) => `${item.name} x${item.quantity}`).join(', ')}
                      </p>
                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="font-semibold text-[#2D3748]">${order.total.toFixed(2)}</p>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdminOrderUpdate(order._id, 'confirmed', order.paymentStatus)}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdminOrderUpdate(order._id, 'fulfilled', 'paid')}
                            >
                              Fulfill
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#2D3748] mb-4">Profile</h2>
              <div className="flex items-center gap-4">
                {user?.picture ? (
                  <img src={user.picture} alt="Profile" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-[#3182CE] font-semibold">
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[#2D3748]">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <p className="text-sm text-gray-500 capitalize">{user?.provider || 'local'} account</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#2D3748] mb-4">Operations snapshot</h2>
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Low stock</p>
                  {lowStockItems.length === 0 ? (
                    <p className="text-sm text-gray-600">No low-stock items right now.</p>
                  ) : (
                    <div className="space-y-2">
                      {lowStockItems.map((item) => (
                        <div key={item._id} className="flex justify-between text-sm">
                          <span className="text-[#2D3748]">{item.name}</span>
                          <span className="text-orange-600 font-medium">{item.stock} left</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Expiring soon</p>
                  {expiringSoonItems.length === 0 ? (
                    <p className="text-sm text-gray-600">No medications are close to expiry.</p>
                  ) : (
                    <div className="space-y-2">
                      {expiringSoonItems.map((item) => (
                        <div key={item._id} className="flex justify-between text-sm">
                          <span className="text-[#2D3748]">{item.name}</span>
                          <span className="text-red-500 font-medium">${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
