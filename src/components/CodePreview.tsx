
interface CodePreviewProps {
  title: string;
  code: string;
}

const CodePreview = ({ title, code }: CodePreviewProps) => {
  return (
    <div className="border rounded-lg overflow-hidden bg-slate-950">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
        <div className="text-sm font-medium text-slate-200">{title}</div>
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
