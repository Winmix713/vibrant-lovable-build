
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectAnalyzerProps {
  files: File[];
  onAnalysisComplete: (results: any) => void;
}

const ProjectAnalyzer = ({ files, onAnalysisComplete }: ProjectAnalyzerProps) => {
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [stats, setStats] = useState({
    totalFiles: 0,
    nextComponents: 0,
    apiRoutes: 0,
    dataFetching: 0,
    complexityScore: 0
  });

  useEffect(() => {
    if (!files.length) return;
    
    const totalFiles = files.length;
    let processedFiles = 0;
    let nextComponents = 0;
    let apiRoutes = 0;
    let dataFetching = 0;

    // Simulate analyzing files
    const analyzeFiles = async () => {
      for (const file of files) {
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
      onAnalysisComplete(results);
    };

    analyzeFiles();
  }, [files, onAnalysisComplete]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analyzing Project</CardTitle>
        <CardDescription>Scanning files and determining conversion complexity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{currentFile}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
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
      </CardContent>
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
    </Card>
  );
};

export default ProjectAnalyzer;
