import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, FileText, Loader2, CheckCircle, AlertTriangle, Info, X, Pill, Clock, Hash, Syringe } from 'lucide-react';

// Type definitions
interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: string;
  confidence: number;
}

interface ExtractedPrescriptionData {
  patientName?: string;
  doctorName?: string;
  medications: Medication[];
  date?: string;
  rawText: string;
  confidence: number;
  processingTime?: number;
  cached?: boolean;
  recommendations?: Array<{
    type: 'warning' | 'caution' | 'info';
    message: string;
  }>;
}

async function runLocalPrescriptionOcr(file: File): Promise<string> {
  const { recognize } = await import('tesseract.js');
  const result = await recognize(file, 'eng');
  return result.data.text || '';
}

interface PrescriptionUploadProps {
  onPrescriptionProcessed: (data: ExtractedPrescriptionData) => void;
}

const PrescriptionUpload: React.FC<PrescriptionUploadProps> = ({ onPrescriptionProcessed }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [lastResult, setLastResult] = useState<ExtractedPrescriptionData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  const processExtractedText = async (rawText: string): Promise<ExtractedPrescriptionData> => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/prescription/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText }),
    });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      throw new Error(errorPayload?.message || 'Failed to parse OCR text');
    }
    return response.json();
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return 'Please upload a valid image file (JPEG, PNG, WebP)';
    if (file.size > maxSize) return 'File size must be less than 10MB';
    return null;
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const validFiles: File[] = [];
    const errors: string[] = [];
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) errors.push(`${file.name}: ${error}`);
      else validFiles.push(file);
    });
    if (errors.length > 0) alert(`File validation errors:\n${errors.join('\n')}`);
    if (validFiles.length > 0) setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5));
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; setShowCamera(true); }
    } catch { alert('Unable to access camera. Please upload an image instead.'); }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current, video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            setSelectedFiles(prev => [...prev, new File([blob], `prescription-${Date.now()}.jpg`, { type: 'image/jpeg' })]);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    setShowCamera(false);
  };

  const processPrescriptions = async () => {
    if (selectedFiles.length === 0) { alert('Please select at least one image first'); return; }
    setIsProcessing(true);
    setProcessingProgress(0);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setProcessingProgress(((i + 0.5) / selectedFiles.length) * 100);
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/prescription/process`, { method: 'POST', body: formData });
        let result: ExtractedPrescriptionData;
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const serverMessage = errorPayload?.message || 'Processing failed';
          console.warn('Falling back to local OCR:', serverMessage);
          const rawText = await runLocalPrescriptionOcr(file);
          if (!rawText.trim()) throw new Error(serverMessage);
          result = await processExtractedText(rawText);
          result.recommendations = [...(result.recommendations || []), { type: 'info', message: 'Processed with local OCR. Please review carefully.' }];
        } else {
          result = await response.json();
        }
        if (result) { setLastResult(result); onPrescriptionProcessed(result); }
        else alert('Processing failed');
        setProcessingProgress(((i + 1) / selectedFiles.length) * 100);
      }
      setSelectedFiles([]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Processing failed: ${msg}`);
    } finally { setIsProcessing(false); setProcessingProgress(0); }
  };

  const removeFile = (index: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));

  const getConfidenceColor = (c: number) => {
    if (c >= 0.8) return 'text-emerald-700 bg-emerald-50';
    if (c >= 0.6) return 'text-amber-700 bg-amber-50';
    return 'text-red-700 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Camera */}
      {showCamera && (
        <div className="relative overflow-hidden rounded-xl bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-72 object-cover" />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <button onClick={capturePhoto} className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg hover:bg-slate-50">
              <Camera className="w-5 h-5 text-slate-700" />
            </button>
            <button onClick={stopCamera} className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Upload zone */}
      <div
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
          dragActive ? 'border-[#2563eb] bg-blue-50/50' : selectedFiles.length > 0 ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
        }`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      >
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/jpg,image/webp" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
        <Upload className="mx-auto h-8 w-8 text-slate-300" />
        <h3 className="mt-4 text-base font-bold text-[#0f1d31]">Upload your prescription</h3>
        <p className="mt-1 text-sm text-slate-400">Drag & drop or click to browse. JPEG, PNG, WebP up to 10MB.</p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <button onClick={() => fileInputRef.current?.click()} className="cursor-pointer rounded-lg bg-[#0f1d31] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2d4a]">
            Browse Files
          </button>
          <button onClick={startCamera} className="cursor-pointer rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <Camera className="mr-1.5 inline h-4 w-4" />Use Camera
          </button>
        </div>
      </div>

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">Selected ({selectedFiles.length}/5)</p>
          {selectedFiles.map((file, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <span className="truncate text-sm font-medium text-[#0f1d31]">{file.name}</span>
                <span className="flex-shrink-0 text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <button onClick={() => removeFile(i)} className="ml-2 text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Process button */}
      <button
        onClick={processPrescriptions}
        disabled={isProcessing || selectedFiles.length === 0}
        className="w-full cursor-pointer rounded-lg bg-[#2563eb] py-3 text-sm font-bold text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isProcessing ? (
          <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Processing... {processingProgress.toFixed(0)}%</span>
        ) : (
          <span className="inline-flex items-center gap-2"><Pill className="h-4 w-4" />Process Prescription</span>
        )}
      </button>

      {isProcessing && (
        <div className="h-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-[#2563eb] transition-all duration-500" style={{ width: `${processingProgress}%` }} />
        </div>
      )}

      {/* Results */}
      {lastResult && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-[#0f1d31] px-6 py-5 text-white">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold">Processing Complete</h2>
            </div>
            <p className="mt-1 text-sm text-slate-400">Extracted information from your prescription</p>
          </div>

          {/* Details */}
          <div className="border-b border-slate-100 px-6 py-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Details</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {lastResult.patientName && (
                <div><span className="block text-[11px] text-slate-400">Patient</span><span className="text-sm font-semibold text-[#0f1d31]">{lastResult.patientName}</span></div>
              )}
              {lastResult.doctorName && (
                <div><span className="block text-[11px] text-slate-400">Doctor</span><span className="text-sm font-semibold text-[#0f1d31]">{lastResult.doctorName}</span></div>
              )}
              {lastResult.date && (
                <div><span className="block text-[11px] text-slate-400">Date</span><span className="text-sm font-semibold text-[#0f1d31]">{lastResult.date}</span></div>
              )}
              <div>
                <span className="block text-[11px] text-slate-400">Confidence</span>
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${getConfidenceColor(lastResult.confidence)}`}>
                  {(lastResult.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {lastResult.recommendations && lastResult.recommendations.length > 0 && (
            <div className="border-b border-slate-100 px-6 py-5 space-y-2">
              {lastResult.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {rec.type === 'warning' ? <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" /> :
                   rec.type === 'caution' ? <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" /> :
                   <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />}
                  <span className="text-slate-600">{rec.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Medications */}
          <div className="px-6 py-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Medications ({lastResult.medications.length})
            </p>
            <div className="space-y-3">
              {lastResult.medications.map((med, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Pill className="h-4 w-4 text-[#2563eb]" />
                    <div>
                      <span className="text-sm font-bold text-[#0f1d31]">{med.name}</span>
                      <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${getConfidenceColor(med.confidence)}`}>
                        {(med.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    {med.dosage && <span className="flex items-center gap-1"><Syringe className="h-3 w-3" />{med.dosage}</span>}
                    {med.frequency && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{med.frequency}</span>}
                    {med.quantity && <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{med.quantity}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default PrescriptionUpload;
