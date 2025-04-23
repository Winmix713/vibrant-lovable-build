
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ProjectStats from "./dashboard/ProjectStats";
import ConversionOptions from "./dashboard/ConversionOptions";
import CodePreviewTabs from "./dashboard/CodePreviewTabs";
import ConversionProgress from "./dashboard/ConversionProgress";
import { ConversionOptions as ConversionOptionsType } from "@/types/conversion";
import { useConversion } from "@/context/ConversionContext";
import { ConversionExecutor } from "@/services/conversion/conversionExecutor";

interface ConversionDashboardProps {
  projectData: any;
  onStartConversion: () => void;
  isConverting: boolean;
}

const ConversionDashboard = ({ 
  projectData, 
  onStartConversion: parentOnStartConversion,
  isConverting: parentIsConverting 
}: ConversionDashboardProps) => {
  const { state, dispatch } = useConversion();
  const [options, setOptions] = useState<ConversionOptionsType>({
    syntax: 'typescript',
    useReactRouter: true,
    convertApiRoutes: true,
    transformDataFetching: true,
    replaceComponents: true,
    updateDependencies: true,
    handleMiddleware: true,
    preserveComments: true,
    target: 'react-vite'
  });
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  
  const conversionInProgress = parentIsConverting || isConverting;

  const toggleOption = (option: keyof ConversionOptionsType) => {
    setOptions(prev => {
      const newOptions = { ...prev, [option]: !prev[option] };
      dispatch({ 
        type: "SET_CONVERSION_OPTIONS", 
        payload: newOptions 
      });
      return newOptions;
    });
  };

  const handleStartConversion = async () => {
    try {
      setIsConverting(true);
      setProgress(0);
      setProgressMessage("Starting conversion...");
      
      parentOnStartConversion();
      
      // Fixed dispatch action to use options directly instead of payload
      dispatch({ 
        type: "START_CONVERSION",
        options: options
      });
      
      if (projectData?.files && projectData?.packageJson) {
        const executor = new ConversionExecutor(
          projectData.files,
          projectData.packageJson,
          options
        );
        
        executor.setProgressCallback((progress, message) => {
          setProgress(progress);
          setProgressMessage(message);
          dispatch({ 
            type: "SET_CONVERSION_PROGRESS",
            payload: { progress, message }
          });
        });
        
        const result = await executor.execute();
        
        if (result.success) {
          toast.success("Conversion completed successfully!");
          dispatch({ 
            type: "SET_CONVERSION_RESULT",
            payload: { success: true, result }
          });
        } else {
          toast.error(`Conversion completed with ${result.errors.length} errors.`);
          dispatch({ 
            type: "SET_CONVERSION_RESULT",
            payload: { success: false, result }
          });
        }
      } else {
        toast.error("Project data is missing. Please upload a valid Next.js project.");
      }
    } catch (error) {
      toast.error(`Error during conversion: ${error instanceof Error ? error.message : String(error)}`);
      dispatch({ 
        type: "SET_CONVERSION_ERROR",
        payload: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsConverting(false);
      dispatch({ type: "RESET" });
    }
  };

  useEffect(() => {
    dispatch({ 
      type: "SET_CONVERSION_OPTIONS",
      payload: options
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <ProjectStats projectData={projectData} />
        <ConversionOptions 
          options={options}
          onOptionToggle={toggleOption}
          onStartConversion={handleStartConversion}
          isConverting={conversionInProgress}
        />
      </div>

      <CodePreviewTabs />

      {conversionInProgress && (
        <ConversionProgress 
          currentProgress={progress} 
          currentMessage={progressMessage}
        />
      )}
    </div>
  );
};

export default ConversionDashboard;
