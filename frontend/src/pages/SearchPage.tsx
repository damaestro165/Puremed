import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, ShoppingCart, Package } from 'lucide-react';
import { Toaster } from 'sonner';
import { useCartStore } from '../stores/cartStore';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
}

interface ProductsApiResponse {
  success: boolean;
  data: Product[];
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, updatingItems, isItemInCart, getItemQuantity } = useCartStore();

  useEffect(() => {
    const fetchResults = async () => {
      if (!initialQuery.trim()) {
        setProducts([]);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get<ProductsApiResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/medications/search?q=${encodeURIComponent(initialQuery.trim())}`
        );

        if (!response.data.success) {
          throw new Error('Search request failed');
        }

        setProducts(response.data.data || []);
      } catch (err) {
        console.error('Search failed:', err);
        setError('We could not load search results right now. Please try again.');
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchParams({});
      return;
    }
    setSearchParams({ q: trimmedQuery });
  };

  const handleAddToCart = async (product: Product) => {
    if (product.stock <= 0) {
      return;
    }

    const imageUrl =
      product.images?.find((img) => img.isPrimary)?.url ||
      product.images?.[0]?.url ||
      '/placeholder-product.jpeg';

    await addToCart(product._id, 1, {
      name: product.name,
      price: product.price,
      imageUrl
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toaster />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2D3748] mb-2">Search medications</h1>
          <p className="text-gray-600">Find products and add them straight to your cart.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for medications"
                className="pl-12 h-12 rounded-xl"
              />
            </div>
            <Button type="submit" className="h-12 px-6 bg-[#3182CE] hover:bg-[#2C5282] text-white">
              Search
            </Button>
          </div>
        </form>

        {isLoading && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-600">
            Loading search results...
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && initialQuery && products.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-[#2D3748] mb-2">No matches found</h2>
            <p className="text-gray-600">Try a different medication name or browse categories from the homepage.</p>
          </div>
        )}

        {!isLoading && !error && products.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {products.length} result{products.length === 1 ? '' : 's'} for "{initialQuery}"
            </p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const isUpdating = updatingItems.has(product._id);
                const inCart = isItemInCart(product._id);
                const quantity = getItemQuantity(product._id);

                return (
                  <div key={product._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <button onClick={() => navigate(`/product/${product._id}`)} className="block w-full text-left">
                      <img
                        src={product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || '/placeholder-product.jpeg'}
                        alt={product.name}
                        className="w-full h-52 object-cover bg-gray-100"
                      />
                    </button>
                    <div className="p-5 space-y-3">
                      <div>
                        <button onClick={() => navigate(`/product/${product._id}`)} className="text-left">
                          <h2 className="text-lg font-semibold text-[#2D3748]">{product.name}</h2>
                        </button>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-[#3182CE]">${product.price.toFixed(2)}</span>
                        <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0 || isUpdating}
                        className="w-full bg-[#3182CE] hover:bg-[#2C5282] text-white"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {isUpdating ? 'Adding...' : inCart ? `In Cart (${quantity})` : 'Add to Cart'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
