
interface ConversionStepperProps {
  currentStep: number;
  totalSteps: number;
}

const ConversionStepper = ({ currentStep, totalSteps }: ConversionStepperProps) => {
  const steps = [
    { name: "Analysis", description: "Analyzing your Next.js project" },
    { name: "Conversion", description: "Converting to Vite" },
    { name: "Download", description: "Ready for download" }
  ];

  return (
    <div className="py-8">
      <div className="flex items-center justify-between w-full max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center relative w-1/3">
            <div 
              className={`h-10 w-10 rounded-full flex items-center justify-center font-medium 
                ${index + 1 < currentStep 
                  ? 'bg-blue-600 text-white' 
                  : index + 1 === currentStep 
                  ? 'bg-blue-500 text-white animate-pulse' 
                  : 'bg-gray-200 text-gray-500'}`}
            >
              {index + 1 < currentStep ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <div className="text-sm mt-2 font-medium">{step.name}</div>
            <div className="text-xs text-gray-500">{step.description}</div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div 
                className={`absolute top-5 left-1/2 h-0.5 w-full 
                  ${index + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`}
                style={{ width: 'calc(100% - 2.5rem)', left: '60%' }}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversionStepper;
