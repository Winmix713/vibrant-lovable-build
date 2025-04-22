
import { useState } from "react";
import { toast } from "sonner";
import ProjectAnalyzer from "@/components/ProjectAnalyzer";
import ConversionDashboard from "@/components/ConversionDashboard";
import ConversionStepper from "@/components/ConversionStepper";
import Hero from "@/components/Hero";
import FeatureList from "@/components/FeatureList";
import Footer from "@/components/Footer";
import { ConversionProvider } from "@/context/ConversionContext";

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [projectData, setProjectData] = useState<null | any>(null);

  const handleStartAnalysis = (files: File[]) => {
    setIsAnalyzing(true);
    // Simulate file analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setProjectData({
        files: files,
        totalFiles: files.length,
        nextJsComponents: Math.floor(files.length * 0.4),
        apiRoutes: Math.floor(files.length * 0.1),
        dataFetchingMethods: Math.floor(files.length * 0.2),
        complexityScore: Math.floor(Math.random() * 100),
      });
      toast.success("Project analysis completed successfully!");
    }, 2000);
  };

  const handleStartConversion = () => {
    setIsConverting(true);
    // In a real implementation, this would execute the conversion logic
    setTimeout(() => {
      setIsConverting(false);
      toast.success("Project conversion completed! Ready for download.");
    }, 3000);
  };

  return (
    <ConversionProvider>
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          {!projectData ? (
            <>
              <Hero onStartAnalysis={handleStartAnalysis} isAnalyzing={isAnalyzing} />
              <FeatureList />
            </>
          ) : (
            <>
              <ConversionStepper 
                currentStep={isConverting ? 2 : 1} 
                totalSteps={3} 
              />
              <ConversionDashboard 
                projectData={projectData} 
                onStartConversion={handleStartConversion}
                isConverting={isConverting}
              />
            </>
          )}
        </div>
        <Footer />
      </div>
    </ConversionProvider>
  );
};

export default Index;
