import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import Header from "../components/Header"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import {toast} from "sonner"

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

interface CartItem {
  _id: string
  name: string
  price: number
  imageUrl: string
  quantity: number
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
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  // Cart management functions
  const getCartFromStorage = (): CartItem[] => {
    try {
      const cart = localStorage.getItem('cart')
      return cart ? JSON.parse(cart) : []
    } catch {
      return []
    }
  }

  const saveCartToStorage = (cart: CartItem[]): void => {
    localStorage.setItem('cart', JSON.stringify(cart))
    // Dispatch custom event to update cart count in header
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }))
  }

  const addToCart = async (product: Product): Promise<void> => {
    if (product.stock <= 0) {
            toast.message('Out of Stock', {
        description: 'This product is currently out of stock.',
      })
      
      return
    }

    setAddingToCart(product._id)

    try {
      const cart = getCartFromStorage()
      const existingItemIndex = cart.findIndex(item => item._id === product._id)

      // Get primary image URL or first image URL
      const imageUrl = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || '/placeholder-product.jpeg'

      if (existingItemIndex >= 0) {
        // Item already exists, increment quantity
        cart[existingItemIndex].quantity += 1
         toast.message('Quantity Updated', {
        description: `${product.name} quantity updated in cart.`,
      })
      
      } else {
        // New item, add to cart
        const cartItem: CartItem = {
          _id: product._id,
          name: product.name,
          price: product.price,
          imageUrl: imageUrl,
          quantity: 1
        }
        cart.push(cartItem)
          toast.message('Added to Cart', {
        description: `${product.name} has been added to your cart.`,
      })
        
      }

      saveCartToStorage(cart)
    } catch (error) {
      console.error('Error adding to cart:', error)
       toast.message('Error', {
        description: `${error}`,
      })
      
    } finally {
      setAddingToCart(null)
    }
  }

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
        // Redirect to home after 3 seconds
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
        // Don't set error for products, just show empty state
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
    // Prevent navigation if clicking on add to cart button
    if ((e.target as HTMLElement).closest('button')) {
      e.stopPropagation()
      return
    }
    navigate(`/product/${productId}`)
  }

  // Loading state
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

  // Error state
  if (error || !category) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <Header />
        <div className="flex flex-col justify-center items-center min-h-[400px] p-4">
          <div className="text-center">
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
      
      {/* Category Header */}
      <div className="flex flex-col justify-center items-center w-full p-4 gap-4 bg-gray-50">
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
        <Input
          className="w-full lg:w-1/2 mx-auto mt-2"
          placeholder={`Search ${category.name.toLowerCase()}...`}
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {/* Products Section */}
      <div className="flex flex-col w-full p-4 gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg lg:text-xl font-bold text-[#2D3748]">
            Products ({filteredProducts.length})
          </h2>
        </div>

        {/* Products Loading */}
        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48 w-full"></div>
                <div className="bg-gray-200 rounded h-4 w-3/4 mt-2"></div>
                <div className="bg-gray-200 rounded h-4 w-1/2 mt-1"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <i className="fas fa-search text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchQuery ? 'No products found' : 'No products available'}
              </h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? `No products match "${searchQuery}" in ${category.name}`
                  : `We're working on adding products to ${category.name}`
                }
              </p>
              {searchQuery && (
                <Button 
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div 
                key={product._id} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={(e) => handleProductClick(product._id, e)}
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  <img 
                    src={product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || '/placeholder-product.jpeg'} 
                    alt={product.images?.find(img => img.isPrimary)?.alt || product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-product.jpeg'
                    }}
                  />
                </div>
                <h3 className="font-semibold text-[#2D3748] mb-1 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-[#3182CE]">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    product.stock > 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                  </span>
                </div>
                
                {/* Add to Cart Button */}
                <Button
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0 || addingToCart === product._id}
                  className={`w-full ${
                    product.stock > 0 
                      ? 'bg-[#3182CE] hover:bg-[#2C5282] text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {addingToCart === product._id ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-shopping-cart mr-2"></i>
                      {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryPage