import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArtifactUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain",
];

export default function ArtifactUpload({ onFileSelect, isLoading = false }: ArtifactUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setError(`File type not supported. Supported: Images, Video, PDF, Text`);
      return false;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("File size exceeds 100MB limit");
      return false;
    }
    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes float-cube {
          0%, 100% { transform: translateY(0px) rotateX(5deg) rotateY(-5deg) rotateZ(1deg); }
          50% { transform: translateY(-25px) rotateX(5deg) rotateY(-5deg) rotateZ(1deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.6), 
                        0 0 40px rgba(34, 211, 238, 0.3),
                        0 20px 60px rgba(34, 211, 238, 0.2),
                        inset 0 0 20px rgba(34, 211, 238, 0.1);
          }
          50% { 
            box-shadow: 0 0 40px rgba(34, 211, 238, 0.8), 
                        0 0 80px rgba(34, 211, 238, 0.5),
                        0 30px 80px rgba(34, 211, 238, 0.3),
                        inset 0 0 30px rgba(34, 211, 238, 0.2);
          }
        }
        .neon-cube {
          perspective: 1200px;
          animation: float-cube 4s ease-in-out infinite;
        }
        .neon-cube-inner {
          animation: glow-pulse 2.5s ease-in-out infinite;
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%);
          backdrop-filter: blur(8px);
          border-radius: 1rem;
        }
      `}</style>

      {/* Drop Zone - 3D Neon Cube */}
      <div className="neon-cube">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`neon-cube-inner relative border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer ${
            isDragging
              ? "border-cyan-300 bg-cyan-950/70 shadow-2xl shadow-cyan-500/60"
              : "border-cyan-500/50 bg-cyan-950/40 hover:border-cyan-400/80 hover:bg-cyan-950/60"
          } ${selectedFile ? "border-emerald-500/70 bg-emerald-950/40" : ""}`}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInput}
            accept={SUPPORTED_TYPES.join(",")}
            className="hidden"
            disabled={isLoading}
          />

          {!selectedFile ? (
            <>
              <div className="text-5xl mb-4 animate-bounce">📦</div>
              <h3 className="text-xl font-bold text-cyan-300 mb-2 tracking-wider">
                DROP YOUR ARTIFACT
              </h3>
              <p className="text-sm text-cyan-300/70 mb-4">
                Upload your digital file to seal it in time-on-chain.
              </p>
              <p className="text-xs text-cyan-400/60 mb-4">
                Supports: Images, Video, PDF, Documents (Max 100MB)
              </p>
              <Button
                className="bg-gradient-to-r from-cyan-500/40 to-purple-500/40 border border-cyan-400/60 text-cyan-300 hover:from-cyan-500/60 hover:to-purple-500/60 font-mono transition-all hover:shadow-lg hover:shadow-cyan-500/30"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isLoading ? "Uploading..." : "Select File"}
              </Button>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-emerald-300 mb-2 tracking-wider">
                FILE SEALED
              </h3>
              <p className="text-sm text-emerald-300/80 mb-4 break-all font-mono">
                {selectedFile.name}
              </p>
              <p className="text-xs text-emerald-400/70 mb-4">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button
                onClick={handleClear}
                className="bg-gradient-to-r from-red-500/40 to-orange-500/40 border border-red-400/60 text-red-300 hover:from-red-500/60 hover:to-orange-500/60 font-mono transition-all hover:shadow-lg hover:shadow-red-500/30"
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Selection
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-950/50 border border-red-600/60 rounded-lg p-3 text-red-300 text-sm font-mono shadow-lg shadow-red-500/20">
          ⚠️ {error}
        </div>
      )}

      {/* File Info */}
      {selectedFile && (
        <div className="bg-cyan-950/40 border border-cyan-600/50 rounded-lg p-3 text-xs text-cyan-300/80 font-mono space-y-1 shadow-lg shadow-cyan-500/10">
          <div>📄 Name: {selectedFile.name}</div>
          <div>📊 Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
          <div>🔍 Type: {selectedFile.type || "Unknown"}</div>
        </div>
      )}
    </div>
  );
}
