
interface SelectedFilesProps {
  files: File[];
}

const SelectedFiles = ({ files }: SelectedFilesProps) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-6 w-full">
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm font-medium text-gray-700">
          {files.length} {files.length === 1 ? 'file' : 'files'} selected
        </p>
        <div className="mt-1 text-xs text-gray-500 truncate">
          {files.slice(0, 3).map((file, i) => (
            <div key={i} className="truncate">{file.name}</div>
          ))}
          {files.length > 3 && (
            <div>+ {files.length - 3} more files</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectedFiles;
