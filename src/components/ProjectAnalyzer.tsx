
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

  // Use either the provided files prop or the internally selected files
  const filesToProcess = files.length > 0 ? files : selectedFiles;

  useEffect(() => {
    // Ensure we have files to process and we're in analyzing state
    if (!filesToProcess.length || isAnalyzing === false) return;
    
    const totalFiles = filesToProcess.length;
    let processedFiles = 0;
    let nextComponents = 0;
    let apiRoutes = 0;
    let dataFetching = 0;

    // Simulate analyzing files
    const analyzeFiles = async () => {
      try {
        for (const file of filesToProcess) {
          // In a real implementation, we would actually analyze the file content
          setCurrentFile(file.name);
          
          // Simulate some analysis based on file names/paths
          if (file.name.includes("page") || file.name.includes("Page")) {
            nextComponents++;
          }
          if (file.name.includes("api")) {
            apiRoutes++;
          }
          if (file.name.includes("getStaticProps") || file.name.includes("getServerSideProps")) {
            dataFetching++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
          processedFiles++;
          setProgress(Math.floor((processedFiles / totalFiles) * 100));
        }

        // Calculate complexity score (0-100)
        const complexity = Math.min(
          100,
          Math.floor((nextComponents * 2 + apiRoutes * 3 + dataFetching * 4) / totalFiles * 100)
        );

        const results = {
          totalFiles,
          nextComponents,
          apiRoutes,
          dataFetching,
          complexityScore: complexity
        };

        setStats(results);
        onFilesProcessed(results);
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
  }, [filesToProcess, onFilesProcessed, isAnalyzing]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
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
    
    setProgress(0);
    setIsAnalyzing(true);
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
            {isAnalyzing && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{currentFile}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
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
