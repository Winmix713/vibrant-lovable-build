
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowRight } from "lucide-react";
import { ConversionOptions } from "@/types/conversion";

interface ConversionOptionsProps {
  options: ConversionOptions;
  onOptionToggle: (option: string) => void;
  onStartConversion: () => void;
  isConverting: boolean;
}

const ConversionOptions = ({ 
  options, 
  onOptionToggle, 
  onStartConversion, 
  isConverting 
}: ConversionOptionsProps) => {
  return (
    <Card className="w-full md:w-1/4">
      <CardHeader>
        <CardTitle>Conversion Options</CardTitle>
        <CardDescription>Customize your migration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(options).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <label htmlFor={key} className="text-sm font-medium">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
            <Switch
              id={key}
              checked={value}
              onCheckedChange={() => onOptionToggle(key)}
            />
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={onStartConversion}
          disabled={isConverting}
        >
          {isConverting ? "Converting..." : "Start Conversion"}
          {!isConverting && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConversionOptions;
