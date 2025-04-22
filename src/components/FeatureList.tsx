
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Code Transformation",
    description: "Automatically convert Next.js syntax to Vite-compatible code with smart transformations",
    icon: "⚡"
  },
  {
    title: "Dependency Management",
    description: "Optimize package.json by removing Next.js dependencies and adding Vite equivalents",
    icon: "📦"
  },
  {
    title: "Routing Conversion",
    description: "Transform file-based Next.js routing to React Router with equivalent patterns",
    icon: "🗺️"
  },
  {
    title: "API Route Handling",
    description: "Convert API routes to Express or other server solutions with implementation guidance",
    icon: "🔌"
  },
  {
    title: "Data Fetching",
    description: "Transform getStaticProps and getServerSideProps to React Query hooks or standard fetch",
    icon: "📊"
  },
  {
    title: "Component Replacement",
    description: "Replace Next.js-specific components with standard React equivalents",
    icon: "🧩"
  }
];

const FeatureList = () => {
  return (
    <div className="py-16">
      <h2 className="text-3xl font-bold text-center mb-12">Powerful Conversion Features</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
            <CardHeader>
              <div className="text-3xl mb-2">{feature.icon}</div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-16 text-center">
        <h3 className="text-2xl font-semibold mb-4">Ready to migrate from Next.js to Vite?</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Our converter handles the heavy lifting so you can enjoy faster development, 
          flexible build processes, and enhanced performance.
        </p>
      </div>
    </div>
  );
};

export default FeatureList;
