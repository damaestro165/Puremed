import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import Header from "../components/Header"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

import { Toaster } from "sonner"
import { useCartStore } from "../stores/cartStore"
import { ShoppingCart, Search, Package, Grid3X3, List, SlidersHorizontal, Heart, } from "lucide-react"

// Type definitions
interface Product {
  _id: string
  name: string
  description: string
  price: number
  images: Array<{
    url: string
    alt: string
    isPrimary: boolean
  }>
  stock: number
  categoryId: string
}

interface Category {
  _id: string
  name: string
  slug: string
  description: string
  icon: string
  isActive: boolean
  createdAt: string
}

interface CategoryApiResponse {
  success: boolean
  data: Category
}

interface ProductsApiResponse {
  success: boolean
  data: Product[]
  count: number
}

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [productsLoading, setProductsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'stock'>('name')

  // Cart store
  const { 
    addToCart, 
    updatingItems, 
    isItemInCart, 
    getItemQuantity 
  } = useCartStore()

  // Fetch category details
 // Fetch category details
// Fetch category details
useEffect(() => {
  const fetchCategory = async (): Promise<void> => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<CategoryApiResponse>(
        `${import.meta.env.VITE_BACKEND_URL}/api/categories/slug/${slug}`
      );

      if (response.data.success && response.data.data) {
        setCategory(response.data.data);
      } else {
        throw new Error('Category not found');
      }
    } catch (err) {
      console.error('Error fetching category:', err);
      setError('Category not found');
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setLoading(false);
    }
  };

  fetchCategory();
}, [slug, navigate]);

// Fetch products for this category
useEffect(() => {
  const fetchProducts = async (): Promise<void> => {
    if (!category?._id) return;

    try {
      setProductsLoading(true);
      const response = await axios.get<ProductsApiResponse>(
        `${import.meta.env.VITE_BACKEND_URL}/api/medications/category/${category._id}`
      );

      if (response.data.success && response.data.data) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  fetchProducts();
}, [category]);
  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'stock':
          return b.stock - a.stock
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value)
  }

  const handleProductClick = (productId: string, e: React.MouseEvent): void => {
    if ((e.target as HTMLElement).closest('button')) {
      e.stopPropagation()
      return
    }
    navigate(`/product/${productId}`)
  }

  // Add to cart using Zustand store
  const handleAddToCart = async (product: Product): Promise<void> => {
    if (product.stock <= 0) {
      return
    }

    try {
      const imageUrl = product.images?.find(img => img.isPrimary)?.url || 
                      product.images?.[0]?.url || 
                      '/placeholder-product.jpeg'

      await addToCart(product._id, 1, {
        name: product.name,
        price: product.price,
        imageUrl: imageUrl,
      })
    } catch (error) {
      console.error('Add to cart failed:', error)
    }
  }

  // Get add to cart button content
  const getAddToCartButton = (product: Product) => {
    const isUpdating = updatingItems.has(product._id)
    const inCart = isItemInCart(product._id)
    const quantity = getItemQuantity(product._id)

    if (product.stock <= 0) {
      return {
        text: 'Out of Stock',
        disabled: true,
        className: 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300',
        icon: <Package className="w-4 h-4 mr-2" />
      }
    }

    if (isUpdating) {
      return {
        text: 'Adding...',
        disabled: true,
        className: 'bg-[#3182CE] text-white shadow-lg',
        icon: <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      }
    }

    if (inCart) {
      return {
        text: `In Cart (${quantity})`,
        disabled: false,
        className: 'bg-green-600 hover:bg-green-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200',
        icon: <ShoppingCart className="w-4 h-4 mr-2" />
      }
    }

    return {
      text: 'Add to Cart',
      disabled: false,
      className: 'bg-[#3182CE] hover:bg-[#2C5282] text-white shadow-lg transform hover:scale-105 transition-all duration-200',
      icon: <ShoppingCart className="w-4 h-4 mr-2" />
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3182CE]"></div>
              <div className="animate-ping absolute top-0 left-0 rounded-full h-16 w-16 border-2 border-[#3182CE] opacity-20"></div>
            </div>
            <p className="text-lg text-gray-600 font-medium">Loading category...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col justify-center items-center min-h-[70vh] p-8">
          <div className="text-center bg-white rounded-2xl p-12 shadow-xl max-w-md mx-auto">
            <div className="bg-red-50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Package className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              {error || 'Category Not Found'}
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              The category you're looking for doesn't exist or has been removed from our catalog.
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-[#3182CE] hover:bg-[#2C5282] text-white px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toaster />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="text-sm text-gray-500">
            <span className="hover:text-[#3182CE] cursor-pointer" onClick={() => navigate('/')}>Home</span> 
            <span className="mx-2">›</span> 
            <span className="hover:text-[#3182CE] cursor-pointer">Categories</span> 
            <span className="mx-2">›</span> 
            <span className="text-gray-800 font-medium">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Category Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#3182CE]/5 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                <i className={`${category.icon} text-4xl text-[#3182CE]`}></i>
              </div>
            </div>
            <h1 className="text-5xl font-bold text-[#2D3748] mb-6 leading-tight">
              {category.name}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              {category.description}
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#3182CE]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Search Bar */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  className="pl-12 h-12 text-lg border-gray-200 focus:border-[#3182CE] focus:ring-[#3182CE]/20 rounded-xl"
                  placeholder={`Search ${category.name.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>

            {/* Sort and View Controls */}
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:border-[#3182CE] focus:ring-[#3182CE]/20"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="stock">Stock Level</option>
                </select>
              </div>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-[#3182CE]' 
                      : 'text-gray-500 hover:text-[#3182CE]'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-[#3182CE]' 
                      : 'text-gray-500 hover:text-[#3182CE]'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {searchQuery && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              <div className="bg-[#3182CE]/10 text-[#3182CE] px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                Search: "{searchQuery}"
                <button 
                  onClick={() => setSearchQuery('')}
                  className="hover:bg-[#3182CE]/20 rounded-full p-1 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#2D3748]">
            Products <span className="text-[#3182CE]">({filteredAndSortedProducts.length})</span>
          </h2>
          {searchQuery && (
            <Button 
              onClick={() => setSearchQuery('')}
              variant="outline"
              className="border-[#3182CE] text-[#3182CE] hover:bg-[#3182CE] hover:text-white"
            >
              Clear Search
            </Button>
          )}
        </div>

        {/* Products Loading */}
        {productsLoading ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="animate-pulse bg-white rounded-2xl p-6 shadow-lg">
                <div className="bg-gray-200 rounded-xl h-48 w-full mb-4"></div>
                <div className="bg-gray-200 rounded-lg h-6 w-3/4 mb-3"></div>
                <div className="bg-gray-200 rounded-lg h-4 w-1/2 mb-4"></div>
                <div className="bg-gray-200 rounded-lg h-10 w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-center max-w-md mx-auto">
              <div className="bg-gray-50 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-600 mb-4">
                {searchQuery ? 'No products found' : 'No products available'}
              </h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {searchQuery 
                  ? `No products match "${searchQuery}" in ${category.name}. Try adjusting your search terms.`
                  : `We're working on adding products to ${category.name}. Check back soon!`
                }
              </p>
              {searchQuery && (
                <Button 
                  onClick={() => setSearchQuery('')}
                  className="bg-[#3182CE] hover:bg-[#2C5282] text-white px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Products Display */
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {filteredAndSortedProducts.map((product) => {
              const buttonConfig = getAddToCartButton(product)
              
              if (viewMode === 'list') {
                return (
                  <div 
                    key={product._id} 
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                    onClick={(e) => handleProductClick(product._id, e)}
                  >
                    <div className="flex p-6 gap-6">
                      {/* Product Image */}
                      <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                        <img 
                          src={product.images?.find(img => img.isPrimary)?.url || 
                                product.images?.[0]?.url || 
                                '/placeholder-product.jpeg'} 
                          alt={product.images?.find(img => img.isPrimary)?.alt || product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-product.jpeg'
                          }}
                        />
                        {/* Stock badges */}
                        {product.stock <= 5 && product.stock > 0 && (
                          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Low Stock
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Out of Stock
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-[#2D3748] mb-2 group-hover:text-[#3182CE] transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-[#3182CE]">
                              ${product.price.toFixed(2)}
                            </span>
                            <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                              product.stock > 10 
                                ? 'bg-green-100 text-green-700' 
                                : product.stock > 0
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {product.stock > 10 
                                ? 'In Stock' 
                                : product.stock > 0 
                                ? `${product.stock} left`
                                : 'Out of Stock'
                              }
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="border-gray-200 hover:border-[#3182CE] hover:text-[#3182CE] p-2"
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToCart(product)
                              }}
                              disabled={buttonConfig.disabled}
                              className={`${buttonConfig.className}`}
                            >
                              {buttonConfig.icon}
                              {buttonConfig.text}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div 
                  key={product._id} 
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                  onClick={(e) => handleProductClick(product._id, e)}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden relative">
                    <img 
                      src={product.images?.find(img => img.isPrimary)?.url || 
                            product.images?.[0]?.url || 
                            '/placeholder-product.jpeg'} 
                      alt={product.images?.find(img => img.isPrimary)?.alt || product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-product.jpeg'
                      }}
                    />
                    {/* Stock badges */}
                    {product.stock <= 5 && product.stock > 0 && (
                      <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                        Low Stock
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                        Out of Stock
                      </div>
                    )}
                    {/* Quick Actions */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200"
                      >
                        <Heart className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#2D3748] mb-2 group-hover:text-[#3182CE] transition-colors line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                    
                    {/* Price and Stock Info */}
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-[#3182CE]">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        product.stock > 10 
                          ? 'bg-green-100 text-green-700' 
                          : product.stock > 0
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {product.stock > 10 
                          ? 'In Stock' 
                          : product.stock > 0 
                          ? `${product.stock} left`
                          : 'Out of Stock'
                        }
                      </span>
                    </div>
                    
                    {/* Add to Cart Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(product)
                      }}
                      disabled={buttonConfig.disabled}
                      className={`w-full h-12 rounded-xl font-semibold ${buttonConfig.className}`}
                    >
                      {buttonConfig.icon}
                      {buttonConfig.text}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryPage