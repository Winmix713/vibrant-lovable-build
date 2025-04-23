
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CodePreviewProps {
  title: string;
  code: string;
}

const CodePreview = ({ title, code }: CodePreviewProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard"
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-slate-950">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-slate-200 hover:text-white hover:bg-slate-700"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4 mr-1" />
          {isCopied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="p-4 overflow-auto max-h-96">
        <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap">
          {code}
        </pre>
      </div>
    </div>
  );
};

export default CodePreview;
