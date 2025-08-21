import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Upload, Camera, FileText, Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react';


interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
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


  // Enhanced file validation
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, WebP)';
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }
    
    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (errors.length > 0) {
      toast.error(`File validation errors:\n${errors.join('\n')}`);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
      toast.success(`Added ${validFiles.length} file(s) for processing`);
    }
  }, []);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Camera capture functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please upload an image instead.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `prescription-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedFiles(prev => [...prev, file]);
            stopCamera();
            toast.success('Photo captured successfully!');
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  // Process prescriptions with progress tracking
  const processPrescriptions = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image first');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        setProcessingProgress(((i + 0.5) / selectedFiles.length) * 100);

        const response = await fetch('http://localhost:8080/api/prescription/process', {
          method: 'POST',
          body: formData
        });

        const data: ExtractedPrescriptionData = await response.json();
        
        if (data.success) {
          setLastResult(data);
          onPrescriptionProcessed(data);
          
          const medicationCount = data.medications.length;
          const avgConfidence = medicationCount > 0 
            ? (data.medications.reduce((sum, med) => sum + med.confidence, 0) / medicationCount * 100).toFixed(1)
            : '0';
            
          toast.success(
            `✅ Processed ${file.name}\n` +
            `Found ${medicationCount} medication(s)\n` +
            `Confidence: ${avgConfidence}%\n` +
            `${data.cached ? '⚡ (Cached result)' : `⏱️ ${data.processingTime}ms`}`
          );
        } else {
          toast.error(`❌ Failed to process ${file.name}: ${data.message}`);
        }

        setProcessingProgress(((i + 1) / selectedFiles.length) * 100);
      }
      
      // Clear files after successful processing
      setSelectedFiles([]);
      
    } catch (error: any) {
      console.error('Processing error:', error);
      toast.error(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Remove file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get recommendation icon
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'caution': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Camera Section */}
      {showCamera && (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 object-cover"
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
            <button
              onClick={capturePhoto}
              className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <Camera className="w-6 h-6 text-gray-800" />
            </button>
            <button
              onClick={stopCamera}
              className="bg-red-500 text-white rounded-full p-3 shadow-lg hover:bg-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : selectedFiles.length > 0 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <Upload className="w-12 h-12 text-gray-400" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Upload Prescription Images
            </h3>
            <p className="text-gray-500 mb-4">
              Drag and drop prescription images here, or click to browse
            </p>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Browse Files
              </button>
              
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700">Selected Files ({selectedFiles.length}/5)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm truncate max-w-48">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="font-medium">Processing prescriptions...</span>
            <span className="text-sm text-gray-500">{processingProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Process Button */}
      <div className="flex justify-center">
        <button
          onClick={processPrescriptions}
          disabled={selectedFiles.length === 0 || isProcessing}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            selectedFiles.length === 0 || isProcessing 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : (
            `Process ${selectedFiles.length} Prescription${selectedFiles.length !== 1 ? 's' : ''}`
          )}
        </button>
      </div>

      {/* Last Result Summary */}
      {lastResult && (
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Last Processing Result
            </h4>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(lastResult.confidence)}`}>
              {(lastResult.confidence * 100).toFixed(1)}% confidence
            </span>
          </div>

          {/* Extracted Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Patient:</span>
              <span className="ml-2">{lastResult.patientName || 'Not detected'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Doctor:</span>
              <span className="ml-2">{lastResult.doctorName || 'Not detected'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Date:</span>
              <span className="ml-2">{lastResult.date || 'Not detected'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Medications:</span>
              <span className="ml-2">{lastResult.medications.length} found</span>
            </div>
          </div>

          {/* Medications List */}
          {lastResult.medications.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Detected Medications:</h5>
              <div className="space-y-2">
                {lastResult.medications.map((med, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{med.name}</span>
                      {med.dosage && <span className="text-gray-600 ml-2">• {med.dosage}</span>}
                      {med.frequency && <span className="text-gray-600 ml-2">• {med.frequency}</span>}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getConfidenceColor(med.confidence)}`}>
                      {(med.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {lastResult.recommendations && lastResult.recommendations.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Recommendations:</h5>
              <div className="space-y-2">
                {lastResult.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                    {getRecommendationIcon(rec.type)}
                    <span className="text-sm text-gray-700">{rec.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionUpload;