
import { useState } from "react";
import ProjectStats from "./dashboard/ProjectStats";
import ConversionOptions from "./dashboard/ConversionOptions";
import CodePreviewTabs from "./dashboard/CodePreviewTabs";
import ConversionProgress from "./dashboard/ConversionProgress";
import type { ConversionOptions as ConversionOptionsType } from "@/types/conversion";
import { useConversion } from "@/context/ConversionContext";

interface ConversionDashboardProps {
  projectData: any;
  onStartConversion: () => void;
  isConverting: boolean;
}

const ConversionDashboard = ({ 
  projectData, 
  onStartConversion,
  isConverting 
}: ConversionDashboardProps) => {
  const { dispatch } = useConversion();
  
  // Initialize with a default value to ensure options is never undefined
  const [options, setOptions] = useState<ConversionOptionsType>({
    useReactRouter: true,
    convertApiRoutes: true,
    transformDataFetching: true,
    replaceComponents: true,
    updateDependencies: true,
    preserveTypeScript: true,
    handleMiddleware: true
  });

  const toggleOption = (option: string) => {
    setOptions(prevOptions => ({
      ...prevOptions,
      [option]: !prevOptions[option as keyof ConversionOptionsType]
    }));
  };

  const handleStartConversion = () => {
    // Update the conversion context
    dispatch({ 
      type: 'START_CONVERSION', 
      options 
    });
    
    // Call the parent component's handler
    onStartConversion();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <ProjectStats projectData={projectData} />
        <ConversionOptions 
          options={options}
          onOptionToggle={toggleOption}
          onStartConversion={handleStartConversion}
          isConverting={isConverting}
        />
      </div>

      <CodePreviewTabs />

      {isConverting && <ConversionProgress />}
    </div>
  );
};

export default ConversionDashboard;
