import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import Header from "../components/Header"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Toaster } from "sonner"
import { useCartStore } from "../stores/cartStore"
import { ShoppingCart, Search, Package } from "lucide-react"

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

  // Cart store
  const { 
    addToCart, 
    updatingItems, 
    isItemInCart, 
    getItemQuantity 
  } = useCartStore()

  // Fetch category details
  useEffect(() => {
    const fetchCategory = async (): Promise<void> => {
      if (!slug) return
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get<CategoryApiResponse>(
          `http://localhost:8080/api/categories/slug/${slug}`
        )
        
        if (response.data.success && response.data.data) {
          setCategory(response.data.data)
        } else {
          throw new Error('Category not found')
        }
      } catch (err) {
        console.error('Error fetching category:', err)
        setError('Category not found')
        setTimeout(() => navigate('/'), 3000)
      } finally {
        setLoading(false)
      }
    }

    fetchCategory()
  }, [slug, navigate])

  // Fetch products for this category
  useEffect(() => {
    const fetchProducts = async (): Promise<void> => {
      if (!category?._id) return

      try {
        setProductsLoading(true)
        const response = await axios.get<ProductsApiResponse>(
          `http://localhost:8080/api/medications/category/${category._id}`
        )
        
        if (response.data.success && response.data.data) {
          setProducts(response.data.data)
        }
      } catch (err) {
        console.error('Error fetching products:', err)
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [category])

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      // Get primary image URL or first image URL
      const imageUrl = product.images?.find(img => img.isPrimary)?.url || 
                      product.images?.[0]?.url || 
                      '/placeholder-product.jpeg'

      await addToCart(product._id, 1, {
        name: product.name,
        price: product.price,
        imageUrl: imageUrl,
      })
    } catch (error) {
      // Error is already handled in the store
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
        className: 'bg-gray-300 text-gray-500 cursor-not-allowed',
        icon: <Package className="w-4 h-4 mr-2" />
      }
    }

    if (isUpdating) {
      return {
        text: 'Adding...',
        disabled: true,
        className: 'bg-[#3182CE] text-white',
        icon: <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      }
    }

    if (inCart) {
      return {
        text: `In Cart (${quantity})`,
        disabled: false,
        className: 'bg-green-600 hover:bg-green-700 text-white',
        icon: <ShoppingCart className="w-4 h-4 mr-2" />
      }
    }

    return {
      text: 'Add to Cart',
      disabled: false,
      className: 'bg-[#3182CE] hover:bg-[#2C5282] text-white',
      icon: <ShoppingCart className="w-4 h-4 mr-2" />
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <Header />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3182CE]"></div>
            <p className="text-gray-600">Loading category...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !category) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <Header />
        <div className="flex flex-col justify-center items-center min-h-[400px] p-4">
          <div className="text-center">
            <Package className="w-16 h-16 text-red-400 mb-4 mx-auto" />
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              {error || 'Category Not Found'}
            </h1>
            <p className="text-gray-600 mb-4">
              The category you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-[#3182CE] text-white"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <Header />
      <Toaster />
      
      {/* Category Header */}
      <div className="flex flex-col justify-center items-center w-full p-4 gap-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-2 max-w-4xl mx-auto text-center">
          <div className="flex items-center gap-3">
            <i className={`${category.icon} text-3xl text-[#3182CE]`}></i>
            <h1 className="font-bold text-3xl text-[#2D3748]">
              {category.name}
            </h1>
          </div>
          <p className="text-gray-600 text-sm lg:text-base max-w-2xl">
            {category.description}
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="flex flex-col justify-center items-center w-full p-4 gap-2">
        <Label className="text-xl lg:text-2xl font-bold text-[#2D3748] text-center">
          Search {category.name}
        </Label>
        <div className="relative w-full lg:w-1/2 mx-auto mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            className="pl-10"
            placeholder={`Search ${category.name.toLowerCase()}...`}
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Products Section */}
      <div className="flex flex-col w-full p-4 gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg lg:text-xl font-bold text-[#2D3748]">
            Products ({filteredProducts.length})
          </h2>
          {searchQuery && (
            <Button 
              onClick={() => setSearchQuery('')}
              variant="outline"
              size="sm"
            >
              Clear Search
            </Button>
          )}
        </div>

        {/* Products Loading */}
        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48 w-full mb-3"></div>
                <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
                <div className="bg-gray-200 rounded h-4 w-1/2 mb-2"></div>
                <div className="bg-gray-200 rounded h-8 w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <Search className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchQuery ? 'No products found' : 'No products available'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? `No products match "${searchQuery}" in ${category.name}`
                  : `We're working on adding products to ${category.name}`
                }
              </p>
              {searchQuery && (
                <Button 
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const buttonConfig = getAddToCartButton(product)
              
              return (
                <div 
                  key={product._id} 
                  className="border rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={(e) => handleProductClick(product._id, e)}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                    <img 
                      src={product.images?.find(img => img.isPrimary)?.url || 
                            product.images?.[0]?.url || 
                            '/placeholder-product.jpeg'} 
                      alt={product.images?.find(img => img.isPrimary)?.alt || product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-product.jpeg'
                      }}
                    />
                    {/* Stock badge */}
                    {product.stock <= 5 && product.stock > 0 && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                        Low Stock
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Out of Stock
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[#2D3748] line-clamp-2 group-hover:text-[#3182CE] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                    
                    {/* Price and Stock Info */}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-[#3182CE]">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
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
                      className={`w-full ${buttonConfig.className}`}
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