import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PrescriptionUpload from '../components/Prescription';
import { Button } from '../components/ui/button';
import { toast, Toaster } from 'sonner';
import CartService from '../services/cartService';
import { AlertTriangle, ArrowRight, CheckCircle, FileText, Pill, ShoppingCart, Upload } from 'lucide-react';

interface ExtractedPrescriptionData {
  patientName?: string;
  doctorName?: string;
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    quantity?: string;
  }>;
  date?: string;
  rawText: string;
  confidence: number;
}

const PrescriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [prescriptionData, setPrescriptionData] = useState<ExtractedPrescriptionData | null>(null);
  const [isSearchingMedications, setIsSearchingMedications] = useState(false);
  const [foundMedications, setFoundMedications] = useState<any[]>([]);

  const handlePrescriptionProcessed = (data: ExtractedPrescriptionData) => {
    setPrescriptionData(data);
    searchMedicationsInDatabase(data.medications);
  };

  const searchMedicationsInDatabase = async (medications: ExtractedPrescriptionData['medications']) => {
    if (medications.length === 0) return;
    setIsSearchingMedications(true);
    const found: any[] = [];
    try {
      for (const medication of medications) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/medications?search=${encodeURIComponent(medication.name)}&limit=3`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.length > 0) {
              found.push({ prescribed: medication, matches: data.data, selected: null });
            }
          }
        } catch (error) {
          console.error(`Error searching for ${medication.name}:`, error);
        }
      }
      setFoundMedications(found);
      if (found.length > 0) toast.success(`Found ${found.length} medications in our database!`);
      else toast.info('No matching medications found. You may need to consult with a pharmacist.');
    } catch (error) {
      console.error('Error searching medications:', error);
      toast.error('Error searching for medications');
    } finally {
      setIsSearchingMedications(false);
    }
  };

  const selectMedication = (medicationIndex: number, productIndex: number) => {
    const updated = [...foundMedications];
    updated[medicationIndex].selected = updated[medicationIndex].matches[productIndex];
    setFoundMedications(updated);
  };

  const addSelectedToCart = async () => {
    const selectedMedications = foundMedications.filter(med => med.selected);
    if (selectedMedications.length === 0) { toast.error('Please select at least one medication'); return; }
    try {
      for (const medication of selectedMedications) {
        const product = medication.selected;
        const imageUrl = product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url || '/placeholder-product.jpeg';
        await CartService.addToCart(product._id, 1, { name: product.name, price: product.price, imageUrl });
      }
      toast.success(`Added ${selectedMedications.length} medications to cart!`);
      navigate('/cart');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add medications to cart');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <Toaster richColors position="top-right" />

      <main>
        {/* Header */}
        <section className="border-b border-slate-100 bg-[#f0f4fa]">
          <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2563eb]">Prescription Assistant</p>
            <h1 className="mt-3 text-3xl font-extrabold text-[#0f1d31] sm:text-4xl">
              Upload your prescription
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
              Our AI extracts medication details from your prescription image, finds matching products, and lets you add them to your cart.
            </p>
            {/* Steps — simple horizontal */}
            <div className="mx-auto mt-8 flex max-w-md justify-between text-center">
              {[
                { num: "1", label: "Upload image" },
                { num: "2", label: "AI extracts meds" },
                { num: "3", label: "Add to cart" },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f1d31] text-xs font-bold text-white">
                    {step.num}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upload area */}
        <section className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
          <PrescriptionUpload onPrescriptionProcessed={handlePrescriptionProcessed} />
        </section>

        {/* Searching state */}
        {isSearchingMedications && (
          <section className="mx-auto max-w-2xl px-5 pb-8 sm:px-8">
            <div className="flex flex-col items-center rounded-xl border border-slate-200 py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#2563eb]" />
              <p className="mt-4 text-sm font-semibold text-[#0f1d31]">Searching medications...</p>
              <p className="mt-1 text-xs text-slate-400">Matching your prescription to our database</p>
            </div>
          </section>
        )}

        {/* Results */}
        {foundMedications.length > 0 && (
          <section className="mx-auto max-w-4xl px-5 pb-16 sm:px-8">
            <div className="space-y-5">
              {/* Results header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#0f1d31]">Medications Found</h3>
                  <p className="text-sm text-slate-400">Select products and add to cart</p>
                </div>
                <Button
                  onClick={addSelectedToCart}
                  disabled={!foundMedications.some(med => med.selected)}
                  className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  <ShoppingCart className="mr-1.5 h-4 w-4" />
                  Add to Cart ({foundMedications.filter(med => med.selected).length})
                </Button>
              </div>

              {/* Medication cards */}
              {foundMedications.map((medication, medIndex) => (
                <div key={medIndex} className="overflow-hidden rounded-xl border border-slate-200">
                  {/* Prescribed header */}
                  <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-[#2563eb]" />
                        <span className="text-sm font-bold text-[#0f1d31]">{medication.prescribed.name}</span>
                        {medication.prescribed.dosage && (
                          <span className="text-xs text-slate-400">• {medication.prescribed.dosage}</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{medication.matches.length} match{medication.matches.length !== 1 ? 'es' : ''}</span>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    {medication.matches.map((product: any, productIndex: number) => {
                      const isSelected = medication.selected?._id === product._id;
                      return (
                        <div
                          key={productIndex}
                          onClick={() => selectMedication(medIndex, productIndex)}
                          className={`group cursor-pointer overflow-hidden rounded-lg border-2 transition-colors ${
                            isSelected ? 'border-[#2563eb] bg-blue-50/30' : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          {isSelected && (
                            <div className="flex items-center gap-1 bg-[#2563eb] px-3 py-1 text-[10px] font-bold text-white">
                              <CheckCircle className="h-3 w-3" /> Selected
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <img
                              src={product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url || '/pain-relief.jpeg'}
                              alt={product.name}
                              className="h-32 w-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/pain-relief.jpeg'; }}
                            />
                          </div>
                          <div className="p-3">
                            <p className="line-clamp-1 text-sm font-bold text-[#0f1d31]">{product.name}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-400">{product.description}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-base font-bold text-[#2563eb]">${product.price.toFixed(2)}</span>
                              <span className={`text-[10px] font-semibold ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Medical notice */}
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-xs font-bold text-amber-800">Medical Notice</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
                    Always verify medications with a licensed pharmacist. Automated extraction may contain errors.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PrescriptionPage;