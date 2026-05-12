import { cloneElement, useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import Header from "./Header"
import axios from "axios"
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Clock3,
  HeartPulse,
  PackageSearch,
  Search,
  Shield,
  Sparkles,
  Star,
  Stethoscope,
  Truck,
  Upload,
  Users,
} from "lucide-react"
import Footer from "./Footer"
import { useNavigate } from "react-router-dom"

interface Category {
  _id: string
  name: string
  slug: string
  description: string
  icon: string
  isActive: boolean
  createdAt: string
  image?: string
  link?: string
}

interface ApiResponse {
  success: boolean
  data: Category[]
  count: number
}

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

interface ProductsApiResponse {
  success: boolean
  data: Product[]
  count: number
}

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [showResults, setShowResults] = useState<boolean>(false)

  const navigate = useNavigate()
  const categoryUrl = `${import.meta.env.VITE_BACKEND_URL}/api/categories`
  const popularSearches = ["Paracetamol", "Pain Relief", "Vitamins", "Skin Care"]

  const getCategoryImage = (categoryName: string): string => {
    const imageMap: Record<string, string> = {
      "Pain Relief": "/pain-relief.jpeg",
      "Cold and Flu": "/cold-flu.jpeg",
      "Allergy Relief": "/allergy-relief.jpeg",
      "Vitamins and Supplements": "/vitamins-suplements.jpeg",
      "Skin Care": "/skin-care.jpeg",
    }
    return imageMap[categoryName] || "/cold-flu.jpeg"
  }

  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get<ApiResponse>(categoryUrl)

        if (!response.data.success || !response.data.data) {
          throw new Error("Invalid API response format")
        }

        const activeCategories = response.data.data
          .filter((category) => category.isActive)
          .map((category) => ({
            ...category,
            image: getCategoryImage(category.name),
            link: `/category/${category.slug}`,
          }))

        setCategories(activeCategories)
      } catch (err) {
        console.error("Error fetching categories:", err)
        setError("Failed to load categories. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [categoryUrl])

  const searchProducts = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    try {
      setIsSearching(true)
      const response = await axios.get<ProductsApiResponse>(
        `${import.meta.env.VITE_BACKEND_URL}/api/medications/search?q=${encodeURIComponent(query.trim())}`
      )

      if (response.data.success && response.data.data) {
        setSearchResults(response.data.data)
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(true)
      }
    } catch (err) {
      console.error("Error searching products:", err)
      setSearchResults([])
      setShowResults(true)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery)
      } else {
        setShowResults(false)
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleSearchSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleProductClick = (productId: string): void => {
    navigate(`/product/${productId}`)
    setShowResults(false)
    setSearchQuery("")
  }

  const handleSearchBlur = (): void => {
    setTimeout(() => setShowResults(false), 200)
  }

  const stats = [
    { number: "50K+", label: "Happy Customers", icon: <Users className="h-5 w-5" /> },
    { number: "1000+", label: "Medications", icon: <Award className="h-5 w-5" /> },
    { number: "4.8", label: "Average Rating", icon: <Star className="h-5 w-5" /> },
    { number: "24/7", label: "Support", icon: <Clock3 className="h-5 w-5" /> },
  ]

  const features = [
    {
      icon: <Stethoscope className="h-7 w-7 text-[#2563eb]" />,
      title: "Expert Consultation",
      description: "Chat with qualified doctors anytime, anywhere for professional medical guidance.",
    },
    {
      icon: <Shield className="h-7 w-7 text-[#2563eb]" />,
      title: "Verified Medications",
      description: "All medications are 100% authentic, quality-tested, and sourced from licensed suppliers.",
    },
    {
      icon: <Truck className="h-7 w-7 text-[#2563eb]" />,
      title: "Fast Delivery",
      description: "Quick and secure doorstep delivery with real-time tracking on every order.",
    },
    {
      icon: <Clock3 className="h-7 w-7 text-[#2563eb]" />,
      title: "24/7 Support",
      description: "Round-the-clock customer service to help you with orders, refunds, and more.",
    },
  ]

  const trustItems = [
    {
      icon: <BadgeCheck className="h-6 w-6 text-[#2563eb]" />,
      title: "Secure Payments",
      description: "Your transactions are safe and encrypted",
    },
    {
      icon: <Shield className="h-6 w-6 text-[#2563eb]" />,
      title: "Privacy Protected",
      description: "We protect your personal information",
    },
    {
      icon: <HeartPulse className="h-6 w-6 text-[#2563eb]" />,
      title: "Quality Guaranteed",
      description: "Genuine products from trusted brands",
    },
    {
      icon: <PackageSearch className="h-6 w-6 text-[#2563eb]" />,
      title: "Easy Returns",
      description: "Hassle-free returns within 7 days",
    },
  ]

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-900">
      <Header />

      <main className="relative overflow-hidden">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_20%,rgba(37,99,235,0.08),transparent),radial-gradient(ellipse_60%_50%_at_90%_80%,rgba(14,165,233,0.06),transparent)]" />

        {/* ── HERO ── */}
        <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-28 lg:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left — Copy */}
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 shadow-[0_8px_30px_rgba(37,99,235,0.08)] ring-1 ring-slate-200/80">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-sm font-medium text-slate-600">Trusted by 50,000+ customers</span>
              </div>

              <div className="space-y-6">
                <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-[#13315c] sm:text-5xl lg:text-6xl">
                  Your Trusted
                  <span className="mt-1 block bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent">
                    Online Pharmacy
                  </span>
                </h1>
                <p className="max-w-lg text-lg leading-relaxed text-slate-500 sm:text-xl">
                  Browse and buy medications with confidence. Get professional medical advice through our doctor chat
                  service, available 24/7.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  onClick={() => navigate("/chat")}
                  className="h-13 cursor-pointer rounded-2xl bg-[#2563eb] px-8 text-base font-semibold text-white shadow-[0_12px_32px_rgba(37,99,235,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1d4ed8] hover:shadow-[0_16px_40px_rgba(37,99,235,0.35)]"
                >
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Chat with Doctor
                </Button>
                <Button
                  onClick={() => navigate("/prescription")}
                  className="h-13 cursor-pointer rounded-2xl border-2 border-emerald-500 bg-emerald-500 px-8 text-base font-semibold text-white shadow-[0_12px_32px_rgba(16,185,129,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_16px_40px_rgba(16,185,129,0.3)]"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Prescription
                </Button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="group rounded-2xl bg-white px-4 py-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)]"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ff] transition-colors group-hover:bg-[#dbeafe]">
                      {cloneElement(stat.icon, { className: "h-4.5 w-4.5 text-[#2563eb]" })}
                    </div>
                    <div className="text-2xl font-bold text-[#13315c]">{stat.number}</div>
                    <p className="mt-1 text-xs font-medium text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Visual */}
            <div className="relative hidden lg:block">
              {/* Glow effects */}
              <div className="absolute -left-8 top-16 h-48 w-48 rounded-full bg-[#2563eb]/10 blur-[80px]" />
              <div className="absolute -right-8 bottom-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-[70px]" />

              <div className="relative">
                {/* Main image card */}
                <div className="overflow-hidden rounded-[32px] bg-white p-3 shadow-[0_24px_64px_rgba(37,99,235,0.12)] ring-1 ring-slate-200/60">
                  <div className="relative overflow-hidden rounded-[26px]">
                    <img
                      src="/vitamins-suplements.jpeg"
                      alt="Healthcare products"
                      className="h-[420px] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#13315c]/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-md">
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        <span className="text-sm font-medium text-white">Trusted Healthcare Partner</span>
                      </div>
                      <h3 className="mt-4 text-2xl font-bold text-white">
                        Personal care, medicine support & doctor guidance
                      </h3>
                      <p className="mt-2 max-w-sm text-sm leading-relaxed text-blue-100/90">
                        Safe medication, fast delivery, and reliable support from a modern digital pharmacy.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating card — top right */}
                <div className="absolute -right-4 -top-4 z-10 rounded-2xl bg-white px-5 py-4 shadow-[0_16px_48px_rgba(15,23,42,0.12)] ring-1 ring-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Live support</p>
                  <p className="mt-1 text-xl font-bold text-[#13315c]">24/7</p>
                  <p className="text-xs text-emerald-600 font-medium">Available now</p>
                </div>

                {/* Floating card — bottom left */}
                <div className="absolute -bottom-5 -left-5 z-10 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_16px_48px_rgba(15,23,42,0.12)] ring-1 ring-slate-100">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <HeartPulse className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#13315c]">Prescription Care</p>
                    <p className="text-xs text-slate-400">Upload & get matched</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SEARCH ── */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-white p-8 shadow-[0_16px_48px_rgba(37,99,235,0.06)] ring-1 ring-slate-100 lg:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold text-[#13315c] sm:text-4xl">What are you searching for?</h2>
              <p className="mt-3 text-lg text-slate-500">
                Find medications, health products, and wellness solutions quickly and easily.
              </p>

              <form onSubmit={handleSearchSubmit} className="relative mt-8">
                <div className="flex flex-col gap-3 rounded-2xl bg-[#f6f9ff] p-2 ring-1 ring-slate-200/80 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="h-13 border-none bg-transparent pl-12 pr-4 text-base shadow-none focus-visible:ring-0"
                      placeholder="Search for medications, health products, and more..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={handleSearchBlur}
                      onFocus={() => searchQuery && setShowResults(true)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-13 cursor-pointer rounded-xl bg-[#2563eb] px-8 text-base font-semibold text-white transition-all hover:bg-[#1d4ed8]"
                    disabled={isSearching}
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>

                {showResults && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/70">
                    {isSearching ? (
                      <div className="p-8 text-center text-slate-500">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      <>
                        <div className="border-b border-slate-100 px-6 py-4 text-sm font-medium text-slate-500">
                          Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "
                          {searchQuery}"
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {searchResults.map((product) => (
                            <div
                              key={product._id}
                              onClick={() => handleProductClick(product._id)}
                              className="flex cursor-pointer items-center gap-4 border-b border-slate-50 px-6 py-4 transition-colors hover:bg-slate-50"
                            >
                              <img
                                src={
                                  product.images?.find((img) => img.isPrimary)?.url ||
                                  product.images?.[0]?.url ||
                                  "/placeholder-product.jpeg"
                                }
                                alt={product.name}
                                className="h-12 w-12 rounded-xl object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/pain-relief.jpeg"
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate font-semibold text-[#13315c]">{product.name}</h3>
                                <p className="truncate text-sm text-slate-500">{product.description}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-[#2563eb]">${product.price.toFixed(2)}</div>
                                <div
                                  className={`text-xs font-medium ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}
                                >
                                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center text-slate-500">
                        No results found for "{searchQuery}". Try a different keyword.
                      </div>
                    )}
                  </div>
                )}
              </form>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <span className="text-sm font-medium text-slate-400">Popular:</span>
                {popularSearches.map((item) => (
                  <button
                    key={item}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(item)}`)}
                    className="rounded-full bg-[#f0f4ff] px-4 py-2 text-sm font-medium text-[#2563eb] transition-all duration-200 hover:bg-[#2563eb] hover:text-white hover:shadow-md"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY CHOOSE ── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#2563eb]">
              <Sparkles className="h-4 w-4" />
              Why Us
            </div>
            <h2 className="text-3xl font-bold text-[#13315c] sm:text-4xl">Why Choose Puremed?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              We provide comprehensive healthcare solutions with the highest standards of quality and service.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-3xl bg-white p-8 shadow-[0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(37,99,235,0.1)]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf4ff] transition-colors duration-300 group-hover:bg-[#2563eb]">
                  {cloneElement(feature.icon, {
                    className: "h-7 w-7 text-[#2563eb] transition-colors duration-300 group-hover:text-white",
                  })}
                </div>
                <h3 className="mt-6 text-lg font-bold text-[#13315c]">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SHOP BY CATEGORY ── */}
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-white p-8 shadow-[0_16px_48px_rgba(37,99,235,0.06)] ring-1 ring-slate-100 lg:p-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-[#13315c] sm:text-4xl">Shop by Category</h2>
                <p className="mt-2 text-lg text-slate-500">
                  Browse our wide range of healthcare products and medications.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-red-600">{error}</div>
            )}

            {loading ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {categories.slice(0, 4).map((category) => (
                  <button
                    key={category._id}
                    onClick={() => navigate(category.link!)}
                    className="group overflow-hidden rounded-2xl bg-[#f8faff] text-left ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(37,99,235,0.1)] hover:ring-[#2563eb]/20"
                  >
                    <div className="overflow-hidden">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center justify-between p-5">
                      <div>
                        <h3 className="text-lg font-bold text-[#13315c]">{category.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {category.description || "Quality healthcare essentials"}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#edf4ff] text-[#2563eb] transition-all duration-300 group-hover:bg-[#2563eb] group-hover:text-white">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── TRUST BADGES ── */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {trustItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)]"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#edf4ff]">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[#13315c]">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home
