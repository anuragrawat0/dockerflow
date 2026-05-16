import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadBox from "../components/UploadBox";
import { uploadFile } from "../api";

export default function Upload() {
  const [uploading, setUploading] = useState(false);
  const nav = useNavigate();

  const handleUpload = async (file: File) => {
    setUploading(true);
    await uploadFile(file);
    setUploading(false);
    nav("/");
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-lg font-semibold">Upload Document</h2>
      <UploadBox onUpload={handleUpload} />
      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
    </div>
  );
}