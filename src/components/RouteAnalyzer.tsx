
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { analyzeNextJsRoutes, convertToReactRoutes, NextJsRoute } from "@/services/routeConverter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RouteAnalyzerProps {
  files: File[];
  onRoutesAnalyzed: (routes: NextJsRoute[]) => void;
}

const RouteAnalyzer = ({ files, onRoutesAnalyzed }: RouteAnalyzerProps) => {
  const [analyzedRoutes, setAnalyzedRoutes] = useState<NextJsRoute[]>([]);
  const [convertedRoutes, setConvertedRoutes] = useState<any[]>([]);
  const [complexityScores, setComplexityScores] = useState<{[key: string]: number}>({});
  const [warnings, setWarnings] = useState<{[key: string]: string[]}>({});

  useEffect(() => {
    if (files.length > 0) {
      const routes = analyzeNextJsRoutes(files);
      const reactRoutes = convertToReactRoutes(routes);
      
      // Calculate complexity scores and potential warnings for each route
      const complexity: {[key: string]: number} = {};
      const routeWarnings: {[key: string]: string[]} = {};
      
      routes.forEach((route, index) => {
        // Simple complexity calculation based on route features
        let score = 0;
        
        // Adjust score based on route characteristics
        if (route.isDynamic) score += 2;
        if (route.params && route.params.length > 1) score += route.params.length;
        if (route.path.includes('[[')) score += 5; // Optional catch-all route
        
        complexity[route.path] = score;
        
        // Generate warnings for complex patterns
        const warnings: string[] = [];
        
        if (route.path.includes('[[') && route.path.includes(']]')) {
          warnings.push('Optional catch-all routes need special handling in React Router');
        }
        
        if (route.params && route.params.some(p => p.includes('...'))) {
          warnings.push('Catch-all routes use different syntax in React Router (*all)');
        }
        
        if (route.layout) {
          warnings.push('Layout routes need manual setup with Outlet in React Router');
        }
        
        routeWarnings[route.path] = warnings;
      });
      
      setAnalyzedRoutes(routes);
      setConvertedRoutes(reactRoutes);
      setComplexityScores(complexity);
      setWarnings(routeWarnings);
      onRoutesAnalyzed(routes);
    }
  }, [files, onRoutesAnalyzed]);

  const getComplexityBadge = (score: number) => {
    if (score < 2) {
      return <Badge variant="outline" className="bg-green-50">Egyszerű</Badge>;
    } else if (score < 5) {
      return <Badge variant="secondary" className="bg-yellow-50">Közepes</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-red-50 text-red-600">Komplex</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Analysis</CardTitle>
        <CardDescription>Next.js routes detected and their React Router equivalents</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analyzedRoutes.map((route, index) => (
            <div key={index} className="space-y-2">
              <div className="p-4 bg-slate-50 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{route.path}</span>
                  <div className="flex items-center space-x-2">
                    {route.isDynamic && (
                      <Badge className="text-sm px-2 py-1 bg-blue-100 text-blue-700">
                        Dynamic Route
                      </Badge>
                    )}
                    {getComplexityBadge(complexityScores[route.path] || 0)}
                  </div>
                </div>
                {route.hasParams && (
                  <div className="mt-2 text-sm text-gray-500">
                    Parameters: {route.params?.join(', ')}
                  </div>
                )}
                {warnings[route.path] && warnings[route.path].length > 0 && (
                  <div className="mt-2 text-sm text-amber-600 flex items-center">
                    <AlertTriangle size={14} className="mr-1" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {warnings[route.path].length} warning{warnings[route.path].length > 1 ? 's' : ''}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="w-72 p-2">
                          <ul className="list-disc pl-4 text-xs space-y-1">
                            {warnings[route.path].map((warning, i) => (
                              <li key={i}>{warning}</li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center">
                <ChevronRight className="text-gray-400" />
              </div>

              <Alert className={
                complexityScores[route.path] > 4 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"
              }>
                <AlertDescription className="font-mono text-sm">
                  {convertedRoutes[index]?.path || 'Converting...'}
                </AlertDescription>
              </Alert>
            </div>
          ))}
          
          {analyzedRoutes.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No routes detected yet. Upload your Next.js project to begin analysis.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteAnalyzer;
