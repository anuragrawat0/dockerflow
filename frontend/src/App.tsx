import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Detail from "./pages/Detail";
import { getProgress, uploadFile } from "./api";
import ProgressBar from "./components/ProgressBar";
import StatusBadge from "./components/StatusBadge";
import type { Document } from "./types";

interface ActiveUpload {
  doc: Document;
  progress: number;
  isSending: boolean;
}

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null);

  useEffect(() => {
    if (!activeUpload || activeUpload.isSending) return;
    if (activeUpload.doc.status !== "queued" && activeUpload.doc.status !== "processing") return;

    const intervalId = window.setInterval(async () => {
      const progressState = await getProgress(activeUpload.doc.id);
      const nextProgress = Number.parseFloat(progressState.progress || "0");

      setActiveUpload((current) => {
        if (!current || current.doc.id !== activeUpload.doc.id) return current;

        return {
          ...current,
          progress: Number.isNaN(nextProgress) ? current.progress : nextProgress,
          doc: {
            ...current.doc,
            status: progressState.status || current.doc.status,
            progress: Number.isNaN(nextProgress) ? current.doc.progress : nextProgress,
          },
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeUpload]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setActiveUpload({
      doc: {
        id: 0,
        filename: file.name,
        status: "uploading",
        progress: 0,
        result: null,
        error_message: null,
        created_at: new Date().toISOString(),
      },
      progress: 0,
      isSending: true,
    });

    try {
      const uploadedDoc: Document = await uploadFile(file);
      setActiveUpload({
        doc: uploadedDoc,
        progress: uploadedDoc.progress ?? 0,
        isSending: false,
      });
    } catch {
      setActiveUpload({
        doc: {
          id: 0,
          filename: file.name,
          status: "failed",
          progress: 0,
          result: null,
          error_message: "Upload failed",
          created_at: new Date().toISOString(),
        },
        progress: 0,
        isSending: false,
      });
    }
  };

  const uploadStatus = activeUpload?.isSending ? "uploading" : activeUpload?.doc.status;

  return (
    <BrowserRouter>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Doc Processor</h1>
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={handleFileSelected}
            />
            <button onClick={openFilePicker} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
              Upload
            </button>
          </>
        </div>

        {activeUpload && (
          <div className="mb-6 rounded border bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-sm">{activeUpload.doc.filename}</div>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={uploadStatus || "queued"} />
                  <span className="text-xs text-gray-500">{Math.round(activeUpload.progress)}%</span>
                </div>
              </div>
              {activeUpload.doc.id > 0 && (
                <Link to={`/docs/${activeUpload.doc.id}`} className="text-sm text-blue-600 hover:underline">
                  View
                </Link>
              )}
            </div>
            <ProgressBar progress={activeUpload.progress} />
            {activeUpload.doc.error_message && (
              <p className="text-sm text-red-600">{activeUpload.doc.error_message}</p>
            )}
          </div>
        )}

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/docs/:id" element={<Detail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default App;
