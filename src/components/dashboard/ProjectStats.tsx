
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectStatsProps {
  projectData: {
    totalFiles: number;
    nextJsComponents: number;
    apiRoutes: number;
    dataFetchingMethods: number;
    complexityScore: number;
  };
}

const ProjectStats = ({ projectData }: ProjectStatsProps) => {
  const getComplexityLabel = (score: number) => {
    if (score < 30) return { label: "Easy", color: "bg-green-100 text-green-800" };
    if (score < 60) return { label: "Moderate", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Complex", color: "bg-red-100 text-red-800" };
  };

  const complexityInfo = getComplexityLabel(projectData.complexityScore);

  return (
    <Card className="w-full md:w-3/4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Analysis Results</CardTitle>
            <CardDescription>Your Next.js project analysis summary</CardDescription>
          </div>
          <Badge className={complexityInfo.color}>
            {complexityInfo.label} Conversion
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="text-sm text-gray-500">Total Files</div>
            <div className="text-2xl font-semibold">{projectData.totalFiles}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="text-sm text-gray-500">Next.js Components</div>
            <div className="text-2xl font-semibold">{projectData.nextJsComponents}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="text-sm text-gray-500">API Routes</div>
            <div className="text-2xl font-semibold">{projectData.apiRoutes}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="text-sm text-gray-500">Data Fetching Methods</div>
            <div className="text-2xl font-semibold">{projectData.dataFetchingMethods}</div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Complexity Score</h3>
          <div className="flex items-center gap-2">
            <Progress value={projectData.complexityScore} className="h-2" />
            <span className="text-sm font-medium">{projectData.complexityScore}/100</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectStats;
