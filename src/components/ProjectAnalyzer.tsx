
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import CodePreview from "./CodePreview";

interface ProjectAnalyzerProps {
  onFilesProcessed: (results: any) => void;
  files?: File[];
}

const ProjectAnalyzer = ({ files = [], onFilesProcessed }: ProjectAnalyzerProps) => {
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [stats, setStats] = useState({
    totalFiles: 0,
    nextComponents: 0,
    apiRoutes: 0,
    dataFetching: 0,
    complexityScore: 0
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filePreview, setFilePreview] = useState<{name: string, content: string} | null>(null);

  // Use either the provided files prop or the internally selected files
  const filesToProcess = files.length > 0 ? files : selectedFiles;

  useEffect(() => {
    // Reset state when new files are provided
    if (files.length > 0 && !isAnalyzing) {
      console.log("Files provided externally:", files.length);
      setProgress(0);
      setStats({
        totalFiles: 0,
        nextComponents: 0,
        apiRoutes: 0,
        dataFetching: 0,
        complexityScore: 0
      });
    }
  }, [files]);

  useEffect(() => {
    // Ensure we have files to process and we're in analyzing state
    if (!filesToProcess.length || !isAnalyzing) return;
    
    console.log("Starting analysis of", filesToProcess.length, "files");
    const totalFiles = filesToProcess.length;
    let processedFiles = 0;
    let nextComponents = 0;
    let apiRoutes = 0;
    let dataFetching = 0;

    // Analyze files
    const analyzeFiles = async () => {
      try {
        for (const file of filesToProcess) {
          // Update UI with current file
          setCurrentFile(file.name);
          
          // Preview first text file
          if (!filePreview && (file.name.endsWith('.js') || file.name.endsWith('.jsx') || 
              file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
            try {
              const content = await readFileContent(file);
              setFilePreview({
                name: file.name,
                content: content
              });
            } catch (error) {
              console.error("Error reading file content:", error);
            }
          }
          
          // Analyze file content
          try {
            const content = await readFileContent(file);
            
            // Check for Next.js components and features
            if (content.includes("import") && content.includes("from 'next")) {
              nextComponents++;
            }
            
            if (file.name.includes("/api/") || file.name.includes("pages/api/")) {
              apiRoutes++;
            }
            
            if (content.includes("getStaticProps") || content.includes("getServerSideProps")) {
              dataFetching++;
            }
          } catch (error) {
            console.error("Error analyzing file:", error);
          }
          
          // Update progress
          processedFiles++;
          setProgress(Math.floor((processedFiles / totalFiles) * 100));
          
          // Small delay to prevent UI freezing
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Calculate complexity score (0-100)
        const complexity = Math.min(
          100,
          Math.floor((nextComponents * 2 + apiRoutes * 3 + dataFetching * 4) / totalFiles * 100) || 25
        );

        const results = {
          totalFiles,
          nextComponents,
          apiRoutes,
          dataFetching,
          complexityScore: complexity
        };

        setStats(results);
        
        // Call the callback with the results
        onFilesProcessed(results);
        
        toast({
          title: "Analysis Complete",
          description: `Analyzed ${totalFiles} files successfully.`,
        });
      } catch (error) {
        console.error("Error analyzing files:", error);
        toast({
          title: "Analysis Error",
          description: "There was an error analyzing your files. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeFiles();
  }, [filesToProcess, onFilesProcessed, isAnalyzing, filePreview]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      console.log("Files selected:", newFiles.length);
      setSelectedFiles(newFiles);
      setFilePreview(null);
      
      // Show success toast for file selection
      if (newFiles.length > 0) {
        toast({
          title: "Files Selected",
          description: `${newFiles.length} files selected for analysis.`,
        });
      }
    }
  };

  const handleStartAnalysis = () => {
    if (selectedFiles.length === 0 && files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Starting analysis manually");
    setProgress(0);
    setIsAnalyzing(true);
  };
  
  // If files are provided from parent, automatically start analysis
  useEffect(() => {
    if (files.length > 0 && !isAnalyzing && progress === 0) {
      console.log("Auto-starting analysis with provided files");
      setIsAnalyzing(true);
    }
  }, [files, isAnalyzing, progress]);

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error("File reading error"));
      reader.readAsText(file);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analyze Next.js Project</CardTitle>
        <CardDescription>Upload your project files to analyze conversion complexity</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Show file upload UI if no files are provided */}
        {filesToProcess.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-4">Drag & drop your project files or click to browse</p>
            <input
              type="file"
              id="file-upload"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" className="cursor-pointer">
                Select Files
              </Button>
            </label>
            {selectedFiles.length > 0 && (
              <div className="mt-4 w-full">
                <p className="text-sm font-medium">{selectedFiles.length} files selected</p>
                <Button 
                  className="mt-2 w-full" 
                  onClick={handleStartAnalysis}
                >
                  Start Analysis
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {isAnalyzing ? (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{currentFile}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ) : progress > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-sm text-gray-500">Total Files</div>
                    <div className="text-2xl font-semibold">{stats.totalFiles}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-sm text-gray-500">Next.js Components</div>
                    <div className="text-2xl font-semibold">{stats.nextComponents}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-sm text-gray-500">API Routes</div>
                    <div className="text-2xl font-semibold">{stats.apiRoutes}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-sm text-gray-500">Data Fetching</div>
                    <div className="text-2xl font-semibold">{stats.dataFetching}</div>
                  </div>
                </div>
                
                {filePreview && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">Sample File Preview</h3>
                    <CodePreview title={filePreview.name} code={filePreview.content} />
                  </div>
                )}
              </>
            ) : (
              <div>
                <Button 
                  className="w-full" 
                  onClick={handleStartAnalysis}
                >
                  Start Analysis
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {(stats.totalFiles > 0 || progress === 100) && (
        <CardFooter>
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Complexity Score</span>
              <div>
                <Badge variant={
                  stats.complexityScore < 30 ? "outline" : 
                  stats.complexityScore < 60 ? "secondary" : 
                  "destructive"
                }>
                  {stats.complexityScore < 30 ? "Easy" : 
                   stats.complexityScore < 60 ? "Moderate" : 
                   "Complex"}
                </Badge>
              </div>
            </div>
            <Progress 
              value={stats.complexityScore} 
              className={`h-2 ${
                stats.complexityScore < 30 ? "bg-green-400" : 
                stats.complexityScore < 60 ? "bg-yellow-400" : 
                "bg-red-400"
              }`}
            />
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default ProjectAnalyzer;
