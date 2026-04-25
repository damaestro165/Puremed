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
      icon: <Stethoscope className="h-8 w-8 text-[#2563eb]" />,
      title: "Expert Consultation",
      description: "Chat with qualified doctors anytime, anywhere",
    },
    {
      icon: <Shield className="h-8 w-8 text-[#2563eb]" />,
      title: "Verified Medications",
      description: "100% authentic and quality assured",
    },
    {
      icon: <Truck className="h-8 w-8 text-[#2563eb]" />,
      title: "Fast Delivery",
      description: "Quick and secure doorstep delivery",
    },
    {
      icon: <Clock3 className="h-8 w-8 text-[#2563eb]" />,
      title: "24/7 Support",
      description: "Round-the-clock customer service",
    },
  ]

  const trustItems = [
    {
      icon: <BadgeCheck className="h-5 w-5 text-[#2563eb]" />,
      title: "Secure Payments",
      description: "Your transactions are safe and encrypted",
    },
    {
      icon: <Shield className="h-5 w-5 text-[#2563eb]" />,
      title: "Privacy Protected",
      description: "We protect your personal information",
    },
    {
      icon: <HeartPulse className="h-5 w-5 text-[#2563eb]" />,
      title: "Quality Guaranteed",
      description: "Genuine products from trusted brands",
    },
    {
      icon: <PackageSearch className="h-5 w-5 text-[#2563eb]" />,
      title: "Easy Returns",
      description: "Hassle-free returns within 7 days",
    },
  ]

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-900">
      <Header />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.10),_transparent_28%)]" />

        <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-18">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-[0_12px_40px_rgba(37,99,235,0.08)] ring-1 ring-slate-200/80">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-600">Trusted by 50,000+ customers</span>
              </div>

              <div className="max-w-2xl space-y-5">
                <h1 className="text-5xl font-bold leading-[1.04] tracking-tight text-[#13315c] sm:text-6xl lg:text-7xl">
                  Your Trusted
                  <span className="mt-2 block text-[#2563eb]">Online Pharmacy</span>
                </h1>
                <p className="max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                  Browse and buy medications with confidence. Get professional medical advice through our doctor chat service, available 24/7.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  onClick={() => navigate("/chat")}
                  className="h-14 rounded-2xl bg-[#2563eb] px-8 text-base font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] hover:bg-[#1d4ed8]"
                >
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Chat with Doctor
                </Button>
                <Button
                  onClick={() => navigate("/prescription")}
                  className="h-14 rounded-2xl bg-emerald-500 px-8 text-base font-semibold text-white shadow-[0_18px_40px_rgba(16,185,129,0.28)] hover:bg-emerald-600"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Prescription
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="rounded-[28px] bg-white px-5 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70"
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf4ff]">
                      {cloneElement(stat.icon, { className: "h-5 w-5 text-[#2563eb]" })}
                    </div>
                    <div className="text-3xl font-bold text-[#13315c]">{stat.number}</div>
                    <p className="mt-2 text-sm font-medium text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-12 hidden h-24 w-24 rounded-full bg-[#60a5fa]/20 blur-3xl lg:block" />
              <div className="absolute -right-8 bottom-10 hidden h-32 w-32 rounded-full bg-emerald-300/25 blur-3xl lg:block" />

              <div className="relative overflow-hidden rounded-[36px] bg-white p-4 shadow-[0_35px_80px_rgba(37,99,235,0.12)] ring-1 ring-white/60">
                <div className="grid min-h-[520px] gap-5 rounded-[30px] bg-[linear-gradient(145deg,#eff6ff_0%,#ffffff_55%,#eef8ff_100%)] p-5 lg:grid-cols-[0.82fr_1.18fr]">
                  <div className="flex flex-col justify-between rounded-[28px] bg-[#13315c] p-6 text-white shadow-[0_20px_40px_rgba(19,49,92,0.25)]">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm text-blue-100">
                        <HeartPulse className="h-4 w-4" />
                        Prescription care
                      </div>
                      <h3 className="mt-5 text-2xl font-semibold leading-snug">
                        Personal care, medicine support, and doctor guidance in one place.
                      </h3>
                    </div>
                    <div className="space-y-3 text-sm text-blue-100">
                      <div className="rounded-2xl bg-white/10 p-4">Licensed consultations with rapid response support.</div>
                      <div className="rounded-2xl bg-white/10 p-4">Prescription upload and verified medication matching.</div>
                    </div>
                  </div>

                  <div className="relative rounded-[30px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(226,236,255,0.88)_45%,_rgba(214,228,252,0.95)_100%)] p-6">
                    <div className="absolute inset-x-6 top-6 flex justify-between">
                      <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-md">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Live support</p>
                        <p className="mt-1 text-lg font-semibold text-[#13315c]">24/7 Available</p>
                      </div>
                      <div className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                        PlusMed Care
                      </div>
                    </div>

                    <div className="mt-24 flex h-full flex-col justify-end">
                      <div className="mx-auto w-full max-w-[360px] rounded-[34px] bg-white/90 p-5 shadow-[0_30px_60px_rgba(15,23,42,0.12)] backdrop-blur">
                        <div className="rounded-[28px] bg-[linear-gradient(150deg,#f8fbff_0%,#e8f1ff_48%,#dcecff_100%)] p-6">
                          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#60a5fa_0%,#2563eb_50%,#13315c_100%)] shadow-[0_20px_50px_rgba(37,99,235,0.35)]">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/30 bg-white/10">
                              <Stethoscope className="h-12 w-12 text-white" />
                            </div>
                          </div>
                          <div className="mt-6 text-center">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563eb]">Trusted care</p>
                            <h3 className="mt-3 text-3xl font-bold text-[#13315c]">Pharmacy + Doctor</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                              Safe medication guidance, fast delivery, and reliable support from a modern digital pharmacy.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-3xl bg-white/90 p-5 shadow-lg">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Most requested</p>
                          <p className="mt-2 text-lg font-semibold text-[#13315c]">Pain relief and cold care</p>
                        </div>
                        <div className="rounded-3xl bg-white/90 p-5 shadow-lg">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Fast dispatch</p>
                          <p className="mt-2 text-lg font-semibold text-[#13315c]">Same-day processing on selected orders</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-[38px] bg-[linear-gradient(135deg,#eef5ff_0%,#ffffff_48%,#edf7ff_100%)] p-6 shadow-[0_24px_60px_rgba(37,99,235,0.08)] ring-1 ring-white/80 lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-center">
              <div className="flex items-center justify-center">
                <div className="relative flex h-44 w-full max-w-[240px] items-center justify-center rounded-[32px] bg-white shadow-xl">
                  <img src="/logo.svg" alt="Puremed" className="w-28 opacity-95" />
                  <img src="/vitamins-suplements.jpeg" alt="supplements" className="absolute -left-3 bottom-4 h-20 w-20 rounded-2xl object-cover shadow-lg" />
                  <img src="/pain-relief.jpeg" alt="pain relief" className="absolute -right-3 top-4 h-24 w-24 rounded-3xl object-cover shadow-lg" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-[#13315c] sm:text-4xl">What are you searching for?</h2>
                <p className="mt-3 text-lg text-slate-600">
                  Find medications, health products, and wellness solutions quickly and easily.
                </p>

                <form onSubmit={handleSearchSubmit} className="relative mt-6">
                  <div className="flex flex-col gap-4 rounded-[28px] bg-white p-3 shadow-lg ring-1 ring-slate-200/80 md:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        className="h-14 border-none bg-transparent pl-12 pr-4 text-base shadow-none focus-visible:ring-0"
                        placeholder="Search for medications, health products, and more..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={handleSearchBlur}
                        onFocus={() => searchQuery && setShowResults(true)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="h-14 rounded-2xl bg-[#2563eb] px-8 text-base font-semibold text-white hover:bg-[#1d4ed8]"
                      disabled={isSearching}
                    >
                      {isSearching ? "Searching..." : "Search"}
                    </Button>
                  </div>

                  {showResults && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/70">
                      {isSearching ? (
                        <div className="p-8 text-center text-slate-600">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        <>
                          <div className="border-b border-slate-100 px-6 py-4 text-sm font-medium text-slate-500">
                            Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
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
                                  className="h-12 w-12 rounded-2xl object-cover"
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
                                  <div className={`text-xs font-medium ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                    {product.stock > 0 ? "In Stock" : "Out of Stock"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="p-8 text-center text-slate-600">
                          No results found for "{searchQuery}". Try a different keyword.
                        </div>
                      )}
                    </div>
                  )}
                </form>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-slate-500">Popular searches:</span>
                  {popularSearches.map((item) => (
                    <button
                      key={item}
                      onClick={() => navigate(`/search?q=${encodeURIComponent(item)}`)}
                      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#2563eb] shadow-sm ring-1 ring-slate-200 transition hover:bg-[#2563eb] hover:text-white"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-[#13315c]">Why Choose Puremed?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              We provide comprehensive healthcare solutions with the highest standards of quality and service.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-[30px] bg-white p-7 text-center shadow-[0_22px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/60 transition hover:-translate-y-1 hover:shadow-[0_28px_64px_rgba(37,99,235,0.12)]"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eff6ff]">
                  {feature.icon}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-[#13315c]">{feature.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="rounded-[38px] bg-[linear-gradient(135deg,#eef5ff_0%,#ffffff_52%,#eff8ff_100%)] p-6 shadow-[0_24px_60px_rgba(37,99,235,0.08)] ring-1 ring-white/80 lg:p-8">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-[#13315c]">Shop by Category</h2>
              <p className="mt-3 text-lg text-slate-600">Browse our wide range of healthcare products and medications.</p>
            </div>

            {error && (
              <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-red-600">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-64 animate-pulse rounded-[28px] bg-white shadow-md" />
                ))}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {categories.slice(0, 4).map((category) => (
                  <button
                    key={category._id}
                    onClick={() => navigate(category.link!)}
                    className="group overflow-hidden rounded-[28px] bg-white text-left shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 transition hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(37,99,235,0.12)]"
                  >
                    <div className="p-4">
                      <div className="overflow-hidden rounded-[24px] bg-[#eef4ff]">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-5 pb-5 pt-1">
                      <div>
                        <h3 className="text-xl font-semibold text-[#13315c]">{category.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{category.description || "Quality healthcare essentials"}</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf4ff] text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-[34px] bg-white px-6 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/70 md:grid-cols-2 xl:grid-cols-4 xl:px-8">
            {trustItems.map((item, index) => (
              <div key={index} className="flex items-start gap-4 border-slate-100 xl:border-r xl:pr-5 last:border-r-0">
                <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff]">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#13315c]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
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
