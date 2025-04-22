
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useConversion } from "@/context/ConversionContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

interface ConversionProgressProps {
  currentProgress?: number;
  currentMessage?: string;
}

const ConversionProgress = ({ 
  currentProgress = 67, 
  currentMessage = "Fájlok feldolgozása..."
}: ConversionProgressProps) => {
  const { state } = useConversion();
  const [progress, setProgress] = useState(currentProgress);
  const [message, setMessage] = useState(currentMessage);
  const [activeTab, setActiveTab] = useState("progress");
  const [logs, setLogs] = useState<{text: string, type: 'success' | 'info' | 'pending' | 'error'}[]>([
    { text: "Projekt struktúra elemzése", type: "success" },
    { text: "vite.config.js létrehozása", type: "success" },
    { text: "React Router beállítása", type: "success" },
    { text: "Oldalak konvertálása route-okra", type: "success" },
    { text: "Adatlekérési metódusok átalakítása", type: "success" },
    { text: "Next.js komponensek cseréje...", type: "pending" },
    { text: "API route-ok konvertálása", type: "info" },
    { text: "package.json frissítése", type: "info" },
  ]);
  
  // Conversion statistics
  const [stats, setStats] = useState({
    totalFiles: 0,
    convertedFiles: 0,
    components: {
      image: 0,
      link: 0,
      head: 0,
      script: 0,
      dynamic: 0
    },
    dataFetching: {
      getServerSideProps: 0,
      getStaticProps: 0,
      getStaticPaths: 0
    },
    apiRoutes: 0,
    dependencies: {
      added: 0,
      removed: 0,
      updated: 0
    }
  });

  useEffect(() => {
    // Szimuláljuk a valós idejű konverziós folyamatot
    const interval = setInterval(() => {
      setProgress(oldProgress => {
        // Legfeljebb 95%-ig megy, hogy lássuk, hogy még fut
        if (oldProgress >= 95) {
          clearInterval(interval);
          return 95;
        }
        return oldProgress + 1;
      });

      // Frissítsük az állapotokat a szimuláció során 
      if (progress > 75 && logs[5].type === "pending") {
        setLogs(oldLogs => {
          const newLogs = [...oldLogs];
          newLogs[5].type = "success";
          newLogs[6].type = "pending";
          return newLogs;
        });
        setMessage("API route-ok konvertálása...");
        
        // Update component conversion stats
        setStats(oldStats => ({
          ...oldStats,
          components: {
            image: 12,
            link: 24,
            head: 8,
            script: 5,
            dynamic: 3
          },
          convertedFiles: oldStats.convertedFiles + 15,
        }));
      } else if (progress > 85 && logs[6].type === "pending") {
        setLogs(oldLogs => {
          const newLogs = [...oldLogs];
          newLogs[6].type = "success";
          newLogs[7].type = "pending";
          return newLogs;
        });
        setMessage("package.json frissítése...");
        
        // Update API routes stats
        setStats(oldStats => ({
          ...oldStats,
          apiRoutes: 6,
          convertedFiles: oldStats.convertedFiles + 6,
        }));
      } else if (progress >= 95 && logs[7].type === "pending") {
        setLogs(oldLogs => {
          const newLogs = [...oldLogs];
          newLogs[7].type = "success";
          return newLogs;
        });
        setMessage("Konverzió befejezve!");
        
        // Update dependency stats
        setStats(oldStats => ({
          ...oldStats,
          dependencies: {
            added: 4,
            removed: 2,
            updated: 3
          },
          totalFiles: 45,
          convertedFiles: 42,
        }));
      }
    }, 200);

    return () => clearInterval(interval);
  }, [progress, logs]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Projekt konvertálása</CardTitle>
            <CardDescription>Next.js konvertálása Vite-ra</CardDescription>
          </div>
          <Badge variant={progress < 100 ? "secondary" : "default"}>
            {progress < 100 ? "Folyamatban..." : "Befejezve"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{message}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <Tabs defaultValue="progress" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-2">
              <TabsTrigger value="progress">Folyamat</TabsTrigger>
              <TabsTrigger value="stats">Statisztikák</TabsTrigger>
              <TabsTrigger value="details">Részletek</TabsTrigger>
            </TabsList>
            
            <TabsContent value="progress" className="mt-0">
              <div className="bg-gray-50 p-3 rounded border text-sm font-mono text-gray-700 h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className={`
                    ${log.type === 'success' ? "text-green-600" : 
                      log.type === 'pending' ? "text-blue-600" : 
                      log.type === 'error' ? "text-red-600" : 
                      "text-gray-500"}
                    mb-1 flex items-center
                  `}>
                    {log.type === 'success' && <CheckCircle size={14} className="mr-1" />}
                    {log.type === 'pending' && <Clock size={14} className="mr-1" />}
                    {log.type === 'error' && <AlertCircle size={14} className="mr-1" />}
                    {log.text}
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="mt-0">
              <div className="bg-gray-50 p-3 rounded border h-64 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-2 rounded shadow-sm">
                    <div className="text-sm font-medium">Fájlok</div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">Összesen:</span>
                      <span className="font-mono">{stats.totalFiles}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">Konvertálva:</span>
                      <span className="font-mono">{stats.convertedFiles}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">Arány:</span>
                      <span className="font-mono">
                        {stats.totalFiles > 0 ? Math.round((stats.convertedFiles / stats.totalFiles) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-2 rounded shadow-sm">
                    <div className="text-sm font-medium">Komponensek</div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">Image:</span>
                      <span className="font-mono">{stats.components.image}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">Link:</span>
                      <span className="font-mono">{stats.components.link}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">Head:</span>
                      <span className="font-mono">{stats.components.head}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-2 rounded shadow-sm">
                    <div className="text-sm font-medium">Adatlekérés</div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">SSR:</span>
                      <span className="font-mono">{stats.dataFetching.getServerSideProps}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">SSG:</span>
                      <span className="font-mono">{stats.dataFetching.getStaticProps}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">Paths:</span>
                      <span className="font-mono">{stats.dataFetching.getStaticPaths}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-2 rounded shadow-sm">
                    <div className="text-sm font-medium">Függőségek</div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">Hozzáadva:</span>
                      <span className="font-mono">{stats.dependencies.added}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">Eltávolítva:</span>
                      <span className="font-mono">{stats.dependencies.removed}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-500">Frissítve:</span>
                      <span className="font-mono">{stats.dependencies.updated}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="mt-0">
              <div className="bg-gray-50 p-3 rounded border h-64 overflow-y-auto">
                {state.conversionOptions.useReactRouter && progress >= 40 && (
                  <div className="mb-3">
                    <h3 className="text-sm font-medium mb-2">React Router konvertálása</h3>
                    <div className="text-xs bg-white p-2 rounded shadow-sm">
                      <div><span className="font-semibold">Next.js:</span> pages/blog/[id].tsx</div>
                      <div><span className="font-semibold">Vite:</span> src/routes/blog/:id</div>
                    </div>
                  </div>
                )}
                
                {state.conversionOptions.transformDataFetching && progress >= 60 && (
                  <div className="mb-3">
                    <h3 className="text-sm font-medium mb-2">Adatlekérési átalakítások</h3>
                    <div className="text-xs bg-white p-2 rounded shadow-sm">
                      <div><span className="font-semibold">Next.js:</span> getServerSideProps, getStaticProps</div>
                      <div><span className="font-semibold">Vite:</span> React Query vagy SWR</div>
                      <div className="mt-1 text-gray-500 text-xs">
                        Az adatlekérési logika kliensoldali React Query hook-okká lett alakítva.
                        A szerveroldali props helyett minden kliensoldali fetching megoldással
                        kerül megvalósításra.
                      </div>
                    </div>
                  </div>
                )}
                
                {state.conversionOptions.replaceComponents && progress >= 75 && (
                  <div className="mb-3">
                    <h3 className="text-sm font-medium mb-2">Komponens átalakítások</h3>
                    <div className="text-xs bg-white p-2 rounded shadow-sm">
                      <div><span className="font-semibold">Next/Image:</span> @unpic/react Image</div>
                      <div><span className="font-semibold">Next/Link:</span> React Router Link</div>
                      <div><span className="font-semibold">Next/Head:</span> react-helmet-async Helmet</div>
                      <div><span className="font-semibold">Next/dynamic:</span> React.lazy és Suspense</div>
                      <div className="mt-1 text-gray-500 text-xs">
                        A Next.js-specifikus komponensek átalakultak Vite-kompatibilis változatokra,
                        megőrizve a hasonló funkcionalitást, ahol lehetséges.
                      </div>
                    </div>
                  </div>
                )}
                
                {state.conversionOptions.convertApiRoutes && progress >= 85 && (
                  <div className="mb-3">
                    <h3 className="text-sm font-medium mb-2">API Route átalakítások</h3>
                    <div className="text-xs bg-white p-2 rounded shadow-sm">
                      <div><span className="font-semibold">Next.js:</span> pages/api/users.ts</div>
                      <div><span className="font-semibold">Vite:</span> Express/Fastify route handlerek</div>
                      <div className="mt-1 text-gray-500 text-xs">
                        Az API route-ok Express/Fastify route handlerekké alakultak.
                        Ezeket egy különálló szerveroldali alkalmazásban kell futtatni.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {progress >= 95 && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription>
                A konverzió befejeződött! Az átalakított projekt letölthető vagy előnézhető.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionProgress;
