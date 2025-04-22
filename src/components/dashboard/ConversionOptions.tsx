
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { ConversionOptions as ConversionOptionsType } from '@/types';

const ConversionOptions: React.FC = () => {
  const [options, setOptions] = useState<ConversionOptionsType>({
    sourceFramework: 'nextjs',
    targetFramework: 'react',
    preserveComments: true,
    includeTests: true,
    useTypeScript: true,
    prettier: true,
    eslint: true
  });

  const handleChange = (name: keyof ConversionOptionsType, value: string | boolean) => {
    setOptions((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    console.log('Submitting conversion options:', options);
    // This will be implemented later to trigger conversion
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Conversion Options</h2>
      <Separator className="mb-4" />
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sourceFramework">Source Framework</Label>
            <Input 
              id="sourceFramework"
              value={options.sourceFramework}
              onChange={(e) => handleChange('sourceFramework', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="targetFramework">Target Framework</Label>
            <Input 
              id="targetFramework"
              value={options.targetFramework}
              onChange={(e) => handleChange('targetFramework', e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="preserveComments">Preserve Comments</Label>
            <Switch 
              id="preserveComments"
              checked={options.preserveComments}
              onCheckedChange={(checked) => handleChange('preserveComments', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="includeTests">Include Tests</Label>
            <Switch 
              id="includeTests"
              checked={options.includeTests}
              onCheckedChange={(checked) => handleChange('includeTests', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="useTypeScript">Use TypeScript</Label>
            <Switch 
              id="useTypeScript"
              checked={options.useTypeScript}
              onCheckedChange={(checked) => handleChange('useTypeScript', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="prettier">Run Prettier</Label>
            <Switch 
              id="prettier"
              checked={options.prettier}
              onCheckedChange={(checked) => handleChange('prettier', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="eslint">Run ESLint</Label>
            <Switch 
              id="eslint"
              checked={options.eslint}
              onCheckedChange={(checked) => handleChange('eslint', checked)}
            />
          </div>
        </div>
        
        <Button className="w-full mt-4" onClick={handleSubmit}>
          Start Conversion
        </Button>
      </div>
    </Card>
  );
};

export default ConversionOptions;
