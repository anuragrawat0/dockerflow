import { useState } from "react";

interface Props {
  onUpload: (file: File) => void;
}

export default function UploadBox({ onUpload }: Props) {
  const [drag, setDrag] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files?.[0]) onUpload(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded p-10 text-center cursor-pointer transition ${drag ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
    >
      <input
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        id="file-input"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />
      <label htmlFor="file-input" className="cursor-pointer block text-gray-600">
        Drag & drop or click to upload PDF / TXT
      </label>
    </div>
  );
}