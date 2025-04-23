
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "./analyzer/FileUploader";
import SelectedFiles from "./analyzer/SelectedFiles";
import FilePreview from "./analyzer/FilePreview";

interface ProjectAnalyzerProps {
  onFilesProcessed: (results: any) => void;
  files?: File[];
}

const ProjectAnalyzer = ({ files = [], onFilesProcessed }: ProjectAnalyzerProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filePreview, setFilePreview] = useState<{name: string, content: string} | null>(null);
  const { toast } = useToast();

  // Use either the provided files prop or the internally selected files
  const filesToProcess = files.length > 0 ? files : selectedFiles;

  useEffect(() => {
    if (files.length > 0 && !isAnalyzing) {
      setSelectedFiles([]);
      setFilePreview(null);
    }
  }, [files, isAnalyzing]);

  const handleFilesSelected = (newFiles: File[]) => {
    setSelectedFiles(newFiles);
    setFilePreview(null);
    
    // Preview first text file
    const previewFile = newFiles.find(file => 
      file.name.endsWith('.js') || 
      file.name.endsWith('.jsx') || 
      file.name.endsWith('.ts') || 
      file.name.endsWith('.tsx')
    );

    if (previewFile) {
      readFileContent(previewFile).then(content => {
        setFilePreview({
          name: previewFile.name,
          content
        });
      }).catch(error => {
        console.error("Error reading file content:", error);
      });
    }
  };

  const handleStartAnalysis = () => {
    if (filesToProcess.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    onFilesProcessed(filesToProcess);
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error("File reading error"));
      reader.readAsText(file);
    });
  };

  return (
    <div className="space-y-4">
      <FileUploader 
        onFilesSelected={handleFilesSelected}
        isAnalyzing={isAnalyzing}
      />
      
      <SelectedFiles files={filesToProcess} />
      
      {filesToProcess.length > 0 && !isAnalyzing && (
        <Button 
          className="w-full" 
          onClick={handleStartAnalysis}
        >
          Start Analysis
        </Button>
      )}
      
      <FilePreview file={filePreview} />
    </div>
  );
};

export default ProjectAnalyzer;
