
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4">Next.js to Vite Converter</h3>
            <p className="text-slate-300 mb-6">
              Transform your Next.js projects to Vite with our powerful conversion tool.
              Enjoy faster development, flexible build processes, and enhanced performance.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800">
                Documentation
              </Button>
              <Button variant="outline" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800">
                GitHub
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-slate-300">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Examples</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Learn</h4>
            <ul className="space-y-2 text-slate-300">
              <li><a href="#" className="hover:text-white transition-colors">Why Vite?</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Migration Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Performance Tips</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Next.js to Vite Converter. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
