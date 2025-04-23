
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isAnalyzing: boolean;
}

const FileUploader = ({ onFilesSelected, isAnalyzing }: FileUploaderProps) => {
  const { toast } = useToast();
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      if (newFiles.length > 0) {
        onFilesSelected(newFiles);
        toast({
          title: "Files Selected",
          description: `${newFiles.length} files selected for analysis.`,
        });
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
      <Upload className="h-10 w-10 text-gray-400 mb-2" />
      <p className="text-sm text-gray-500 mb-4">
        Drag & drop your project files or click to browse
      </p>
      <input
        type="file"
        id="file-upload"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <label htmlFor="file-upload">
        <Button 
          variant="outline" 
          size="sm" 
          className="cursor-pointer"
          disabled={isAnalyzing}
        >
          Select Files
        </Button>
      </label>
    </div>
  );
};

export default FileUploader;
