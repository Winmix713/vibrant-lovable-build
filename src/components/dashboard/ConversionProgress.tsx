
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConversion } from "@/context/ConversionContext";

const ConversionProgress = () => {
  const { state } = useConversion();
  const { progress, logs } = state;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Conversion Progress
          <Badge variant="outline" className="ml-2">
            {Math.round(progress)}%
          </Badge>
        </CardTitle>
        <CardDescription>Converting your Next.js project to React + Vite</CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="h-2 mb-6" />
        
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Conversion Logs</h3>
          <ScrollArea className="h-[200px] rounded-md border p-4">
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={index}>
                  <div className={`text-sm ${
                    log.type === 'error' ? 'text-red-500' : 
                    log.type === 'warning' ? 'text-yellow-500' : 
                    log.type === 'success' ? 'text-green-500' : 
                    'text-gray-500'
                  }`}>
                    {log.message}
                  </div>
                  {index < logs.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionProgress;
