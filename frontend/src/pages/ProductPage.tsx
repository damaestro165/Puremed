import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import Header from "../components/Header"
import { Button } from "../components/ui/button"
import { Toaster } from "sonner"
import { useCartStore } from "../stores/cartStore"
import { ShoppingCart, Package, AlertTriangle, Pill, Info, AlertCircle, Star, Heart, Share2, ShieldCheck } from "lucide-react"

// Type definitions
interface Product {
  _id: string
  name: string
  genericName: string
  brandName: string
  description: string
  price: number
  salePrice?: number
  images: Array<{
    url: string
    alt: string
    isPrimary: boolean
  }>
  stock: number
  requiresPrescription: boolean
  dosageInstructions: string
  warnings: string[]
  sideEffects: string[]
  contraindications: string[]
  activeIngredients: Array<{
    name: string
    strength: string
  }>
  manufacturer: {
    name: string
    country: string
  }
  expiryDate: Date
  tags: string[]
  isOnSale: boolean
  ratings: {
    average: number
    count: number
  }
}

interface ProductApiResponse {
  success: boolean
  data: Product
}

const ProductPage: React.FC = () => {
  const params = useParams()
  const productId = params.slug
  const navigate = useNavigate()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<string>('dosage')

  // Cart store
  const { 
    addToCart, 
    updatingItems, 
    isItemInCart, 
    getItemQuantity 
  } = useCartStore()

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async (): Promise<void> => {
      if (!productId) return
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get<ProductApiResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/medications/${productId}`
        )
        
        if (response.data.success && response.data.data) {
          setProduct(response.data.data)
        } else {
          throw new Error('Product not found')
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Product not found')
        setTimeout(() => navigate('/'), 3000)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId, navigate])

  // Add to cart using Zustand store
  const handleAddToCart = async (): Promise<void> => {
    if (!product || product.stock <= 0) {
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
  const getAddToCartButton = () => {
    if (!product) return { text: 'Loading...', disabled: true }

    const isUpdating = updatingItems.has(product._id)
    const inCart = isItemInCart(product._id)
    const quantity = getItemQuantity(product._id)

    if (product.stock <= 0) {
      return {
        text: 'Out of Stock',
        disabled: true,
        className: 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300',
        icon: <Package className="w-5 h-5 mr-2" />
      }
    }

    if (isUpdating) {
      return {
        text: 'Adding...',
        disabled: true,
        className: 'bg-[#3182CE] text-white shadow-lg',
        icon: <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
      }
    }

    if (inCart) {
      return {
        text: `In Cart (${quantity})`,
        disabled: false,
        className: 'bg-green-600 hover:bg-green-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200',
        icon: <ShoppingCart className="w-5 h-5 mr-2" />
      }
    }

    return {
      text: 'Add to Cart',
      disabled: false,
      className: 'bg-[#3182CE] hover:bg-[#2C5282] text-white shadow-lg transform hover:scale-105 transition-all duration-200',
      icon: <ShoppingCart className="w-5 h-5 mr-2" />
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
            <p className="text-lg text-gray-600 font-medium">Loading product details...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col justify-center items-center min-h-[70vh] p-8">
          <div className="text-center bg-white rounded-2xl p-12 shadow-xl max-w-md mx-auto">
            <div className="bg-red-50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Package className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              {error || 'Product Not Found'}
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              The product you're looking for doesn't exist or has been removed from our catalog.
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

  const buttonConfig = getAddToCartButton()
  const displayPrice = product.isOnSale && product.salePrice ? product.salePrice : product.price
  const currentImage = product.images[selectedImageIndex] || product.images[0] || { url: '/placeholder-product.jpeg', alt: product.name }

  const tabConfig = [
    { id: 'dosage', label: 'Dosage', icon: <Pill className="w-4 h-4" /> },
    { id: 'ingredients', label: 'Ingredients', icon: <Info className="w-4 h-4" /> },
    { id: 'warnings', label: 'Warnings', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'effects', label: 'Side Effects', icon: <AlertTriangle className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toaster />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-8">
          <span className="hover:text-[#3182CE] cursor-pointer" onClick={() => navigate('/')}>Home</span> 
          <span className="mx-2">›</span> 
          <span className="hover:text-[#3182CE] cursor-pointer">Medications</span> 
          <span className="mx-2">›</span> 
          <span className="text-gray-800 font-medium">{product.name}</span>
        </nav>

        {/* Product Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg group">
              <div className="aspect-square">
                <img 
                  src={currentImage.url} 
                  alt={currentImage.alt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-product.jpeg'
                  }}
                />
              </div>
              {product.isOnSale && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  SALE
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200">
                  <Heart className="w-5 h-5 text-gray-600" />
                </button>
                <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square bg-white rounded-lg overflow-hidden shadow-md transition-all duration-200 ${
                      index === selectedImageIndex 
                        ? 'ring-2 ring-[#3182CE] ring-offset-2' 
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <img 
                      src={img.url} 
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-[#3182CE]/10 text-[#3182CE] px-3 py-1 rounded-full text-sm font-semibold">
                  {product.brandName}
                </span>
                {product.requiresPrescription && (
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Prescription Required
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold text-[#2D3748] mb-2">{product.name}</h1>
              <p className="text-xl text-gray-600">
                Generic: {product.genericName}
              </p>
            </div>

            {/* Ratings */}
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-6 h-6 ${i < Math.floor(product.ratings.average) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <div>
                <span className="text-lg font-bold text-[#2D3748]">
                  {product.ratings.average.toFixed(1)}
                </span>
                <span className="text-gray-500 ml-2">
                  ({product.ratings.count} reviews)
                </span>
              </div>
            </div>

            {/* Price and Stock */}
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-[#3182CE]">
                    ${displayPrice.toFixed(2)}
                  </span>
                  {product.isOnSale && product.salePrice && (
                    <span className="text-xl text-gray-500 line-through">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  product.stock > 0 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  <Package className="w-5 h-5" />
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={buttonConfig.disabled}
                className={`w-full h-14 text-lg font-semibold rounded-xl ${buttonConfig.className}`}
              >
                {buttonConfig.icon}
                {buttonConfig.text}
              </Button>
            </div>

            {/* Description */}
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-[#2D3748] mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <span key={index} className="bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-xl font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-[#3182CE] border-b-2 border-[#3182CE] bg-blue-50/50'
                    : 'text-gray-600 hover:text-[#3182CE] hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'dosage' && (
              <div>
                <h3 className="text-2xl font-bold text-[#2D3748] mb-6 flex items-center gap-3">
                  <div className="p-2 bg-[#3182CE]/10 rounded-lg">
                    <Pill className="w-6 h-6 text-[#3182CE]" />
                  </div>
                  Dosage Instructions
                </h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">
                    {product.dosageInstructions}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div>
                <h3 className="text-2xl font-bold text-[#2D3748] mb-6 flex items-center gap-3">
                  <div className="p-2 bg-[#3182CE]/10 rounded-lg">
                    <Info className="w-6 h-6 text-[#3182CE]" />
                  </div>
                  Active Ingredients
                </h3>
                <div className="space-y-3">
                  {product.activeIngredients.map((ing, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-[#2D3748]">{ing.name}</span>
                      <span className="text-[#3182CE] font-semibold">{ing.strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'warnings' && (
              <div>
                <h3 className="text-2xl font-bold text-[#2D3748] mb-6 flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  Warnings & Contraindications
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-red-700 mb-3">⚠️ Important Warnings</h4>
                    <ul className="space-y-2">
                      {product.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-red-800">{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-orange-700 mb-3">🚫 Contraindications</h4>
                    <ul className="space-y-2">
                      {product.contraindications.map((contra, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-orange-800">{contra}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'effects' && (
              <div>
                <h3 className="text-2xl font-bold text-[#2D3748] mb-6 flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  Possible Side Effects
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {product.sideEffects.map((effect, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-yellow-800">{effect}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manufacturer Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-[#2D3748] mb-6 flex items-center gap-3">
            <div className="p-2 bg-[#3182CE]/10 rounded-lg">
              <Info className="w-6 h-6 text-[#3182CE]" />
            </div>
            Manufacturer Information
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Company</label>
                <p className="text-lg font-semibold text-[#2D3748] mt-1">{product.manufacturer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Country of Origin</label>
                <p className="text-lg text-gray-700 mt-1">{product.manufacturer.country}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Expiry Date</label>
                <p className="text-lg text-gray-700 mt-1">
                  {new Date(product.expiryDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage