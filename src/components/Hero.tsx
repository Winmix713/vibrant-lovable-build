import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  onStartAnalysis: (files: File[]) => void;
  isAnalyzing: boolean;
}

const Hero = ({ onStartAnalysis, isAnalyzing }: HeroProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const handleStartAnalysis = () => {
    if (selectedFiles.length > 0) {
      onStartAnalysis(selectedFiles);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24">
      <h1 className="text-4xl md:text-6xl font-bold text-center bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
        Next.js to Vite Converter
      </h1>
      
      <p className="mt-6 text-xl text-gray-600 text-center max-w-2xl">
        Transform your Next.js project to Vite for faster development, 
        flexible build processes, and enhanced performance.
      </p>
      
      <div 
        className={`mt-12 w-full max-w-3xl p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold">Upload Your Next.js Project</h3>
          <p className="mt-2 text-gray-500">
            Drag and drop your project files or select them from your computer
          </p>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="px-6"
            >
              Browse Files
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              webkitdirectory=""
              directory=""
              multiple
            />
            
            <Button 
              onClick={handleStartAnalysis}
              disabled={isAnalyzing || selectedFiles.length === 0}
              className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isAnalyzing ? "Analyzing..." : "Start Analysis"}
              {!isAnalyzing && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {selectedFiles.length > 0 && (
          <div className="mt-6 w-full">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
              </p>
              <div className="mt-1 text-xs text-gray-500 truncate">
                {selectedFiles.slice(0, 3).map((file, i) => (
                  <div key={i} className="truncate">{file.name}</div>
                ))}
                {selectedFiles.length > 3 && (
                  <div>+ {selectedFiles.length - 3} more files</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;
