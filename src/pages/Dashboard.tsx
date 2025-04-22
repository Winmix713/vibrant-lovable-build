
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import ConversionOptions from '@/components/dashboard/ConversionOptions';
import { ArrowRight, Upload, Download, Settings, Code, FileCode, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('convert');
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate a conversion process
  const startConversion = () => {
    setConverting(true);
    setProgress(0);
    
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          setConverting(false);
          return 100;
        }
        return prevProgress + 5;
      });
    }, 300);
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Framework Converter</h1>
      
      <Tabs defaultValue="convert" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="convert">Convert</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="convert" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ConversionOptions />
            </div>
            
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Project Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                    <Upload className="h-10 w-10 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">Drag and drop project files</p>
                    <p className="text-sm text-gray-500 mt-1 mb-4">or select files from your computer</p>
                    <Button>
                      Select Files
                    </Button>
                  </div>
                  
                  {converting && (
                    <div className="mt-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Converting...</span>
                        <span className="text-sm font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <Button 
                      className="w-full" 
                      onClick={startConversion}
                      disabled={converting}
                    >
                      {converting ? 'Converting...' : 'Start Conversion'}
                      {!converting && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Conversion Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">Analyze project structure</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-6 w-6 rounded-full ${progress >= 25 ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center`}>
                        {progress >= 25 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">Convert components and pages</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-6 w-6 rounded-full ${progress >= 50 ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center`}>
                        {progress >= 50 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">Update routing and configuration</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-6 w-6 rounded-full ${progress >= 75 ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center`}>
                        {progress >= 75 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">Generate deployment files</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-6 w-6 rounded-full ${progress >= 100 ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center`}>
                        {progress >= 100 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">Finalize and package output</p>
                      </div>
                    </div>
                  </div>
                  
                  {progress >= 100 && (
                    <div className="mt-6">
                      <Button className="w-full" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download Converted Project
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Settings page content will go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion History</CardTitle>
            </CardHeader>
            <CardContent>
              <p>No conversion history yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
