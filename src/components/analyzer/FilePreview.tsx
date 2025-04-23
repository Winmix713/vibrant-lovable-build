
import CodePreview from "../CodePreview";

interface FilePreviewProps {
  file: { name: string; content: string } | null;
}

const FilePreview = ({ file }: FilePreviewProps) => {
  if (!file) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium mb-2">Sample File Preview</h3>
      <CodePreview title={file.name} code={file.content} />
    </div>
  );
};

export default FilePreview;
