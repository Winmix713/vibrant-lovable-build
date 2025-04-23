
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ProjectStats from "./dashboard/ProjectStats";
import ConversionOptions from "./dashboard/ConversionOptions";
import CodePreviewTabs from "./dashboard/CodePreviewTabs";
import ConversionProgress from "./dashboard/ConversionProgress";
import { ConversionOptions as ConversionOptionsType } from "@/types/conversion";
import { ConversionExecutor } from "@/services/conversionExecutor";
import { useConversion } from "@/context/ConversionContext";

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
  
  // Use parent state if provided, otherwise use local state
  const conversionInProgress = parentIsConverting || isConverting;

  const toggleOption = (option: keyof ConversionOptionsType) => {
    setOptions(prev => {
      const newOptions = { ...prev, [option]: !prev[option] };
      
      // Update the context when options change
      dispatch({ 
        type: "SET_OPTIONS", 
        payload: newOptions 
      });
      
      return newOptions;
    });
  };

  const handleStartConversion = async () => {
    try {
      // Update local state
      setIsConverting(true);
      setProgress(0);
      setProgressMessage("Starting conversion...");
      
      // Notify parent component
      parentOnStartConversion();
      
      // Update context state
      dispatch({ type: "START_CONVERSION" });
      dispatch({ type: "SET_OPTIONS", payload: options });
      
      toast.info("Starting Next.js to Vite conversion process...");
      
      if (projectData && projectData.files && projectData.packageJson) {
        // Create conversion executor with the files and options
        const executor = new ConversionExecutor(
          projectData.files,
          options
        );
        
        // Set up progress callback
        executor.setProgressCallback((progress, message) => {
          setProgress(progress);
          setProgressMessage(message);
          dispatch({ 
            type: "SET_PROGRESS", 
            payload: { progress, message } 
          });
        });
        
        // Execute conversion process
        const result = await executor.execute();
        
        // Handle conversion result
        if (result.success) {
          toast.success("Conversion completed successfully!");
          dispatch({ 
            type: "SET_RESULT", 
            payload: result 
          });
        } else {
          toast.error(`Conversion completed with ${result.errors.length} errors.`);
          dispatch({ 
            type: "SET_RESULT", 
            payload: result 
          });
        }
      } else {
        toast.error("Project data is missing. Please upload a valid Next.js project.");
      }
    } catch (error) {
      toast.error(`Error during conversion: ${error instanceof Error ? error.message : String(error)}`);
      dispatch({ 
        type: "ADD_LOG", 
        payload: {
          type: "error",
          message: error instanceof Error ? error.message : String(error)
        }
      });
    } finally {
      setIsConverting(false);
      // Update context state
      dispatch({ type: "RESET" });
    }
  };

  // When component mounts, update the context with initial options
  useEffect(() => {
    dispatch({ type: "SET_OPTIONS", payload: options });
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
