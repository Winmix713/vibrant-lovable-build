
import { useState } from "react";
import Hero from "@/components/Hero";
import FeatureList from "@/components/FeatureList";
import Footer from "@/components/Footer";
import ConversionStepper from "@/components/ConversionStepper";
import ProjectAnalyzer from "@/components/ProjectAnalyzer";
import RouteAnalyzer from "@/components/RouteAnalyzer";
import ConversionDashboard from "@/components/ConversionDashboard";
import { useToast } from "@/hooks/use-toast";
import { ConversionProvider } from "@/context/ConversionContext";
import { NextJsRoute } from "@/services/routeConverter";

const Index = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState<any>(null);
  const [routeData, setRouteData] = useState<NextJsRoute[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const handleFilesProcessed = (data: any) => {
    setProjectData(data);
    toast({
      title: "Project Analyzed",
      description: "Your Next.js project structure has been analyzed successfully."
    });
    setStep(2);
  };

  const handleRoutesProcessed = (routes: NextJsRoute[]) => {
    setRouteData(routes);
    toast({
      title: "Routes Analyzed",
      description: "All routes in your Next.js project have been analyzed."
    });
    setStep(3);
  };

  const handleStartConversion = () => {
    setIsConverting(true);
    toast({
      title: "Starting Conversion",
      description: "Converting your Next.js project to React with Vite..."
    });

    // Simulate conversion process
    setTimeout(() => {
      setIsConverting(false);
      toast({
        title: "Conversion Complete",
        description: "Your project has been successfully converted!",
        variant: "default" // Using the allowed variant
      });
    }, 5000);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <ProjectAnalyzer onFilesProcessed={handleFilesProcessed} />;
      case 2:
        return (
          <RouteAnalyzer
            files={projectData?.files || []}
            onRoutesAnalyzed={handleRoutesProcessed}
          />
        );
      case 3:
        return (
          <ConversionDashboard
            projectData={projectData}
            onStartConversion={handleStartConversion}
            isConverting={isConverting}
          />
        );
      default:
        return <ProjectAnalyzer onFilesProcessed={handleFilesProcessed} />;
    }
  };

  return (
    <ConversionProvider>
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow container mx-auto px-4 py-8">
          <Hero
            onStartAnalysis={() => setStep(1)}
            isAnalyzing={isConverting}
          />
          <ConversionStepper currentStep={step} totalSteps={3} />
          <div className="mt-8">{renderStepContent()}</div>
          <div className="mt-16">
            <FeatureList />
          </div>
        </div>
        <Footer />
      </div>
    </ConversionProvider>
  );
};

export default Index;
