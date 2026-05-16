import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDoc, getProgress, retryDoc, updateDoc, finalizeDoc, exportJson, exportCsv, deleteDoc } from "../api";
import ProgressBar from "../components/ProgressBar";
import StatusBadge from "../components/StatusBadge";
import type { Document } from "../types";

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [progress, setProgress] = useState(0);
  const [editResult, setEditResult] = useState("");

  const load = async () => {
    const d = await getDoc(Number(id));
    setDoc(d);
    setEditResult(JSON.stringify(d.result || {}, null, 2));
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!doc || (doc.status !== "processing" && doc.status !== "queued")) return;
    const iv = setInterval(async () => {
      const p = await getProgress(Number(id));
      setProgress(parseFloat(p.progress || "0"));
      if (p.status === "completed" || p.status === "failed") load();
    }, 1000);
    return () => clearInterval(iv);
  }, [doc?.status]);

  const handleDelete = async () => {
    if (!doc) return;
    await deleteDoc(doc.id);
    navigate("/");
  };

  if (!doc) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{doc.filename}</h2>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={doc.status} />
            {(doc.status === "processing" || doc.status === "queued") && (
              <span className="text-sm text-gray-500">{progress}%</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {doc.status === "failed" && (
            <button onClick={() => retryDoc(doc.id).then(load)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Retry</button>
          )}
          <button onClick={handleDelete} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Delete</button>
          <button onClick={() => exportJson(doc.id)} className="border px-3 py-1 rounded text-sm">JSON</button>
          <button onClick={() => exportCsv(doc.id)} className="border px-3 py-1 rounded text-sm">CSV</button>
        </div>
      </div>

      {(doc.status === "processing" || doc.status === "queued") && <ProgressBar progress={progress} />}

      <div>
        <label className="block text-sm font-medium mb-1">Extracted Result (editable JSON)</label>
        <textarea
          className="w-full h-48 border rounded p-2 font-mono text-sm"
          value={editResult}
          onChange={e => setEditResult(e.target.value)}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={async () => { await updateDoc(doc.id, JSON.parse(editResult)); load(); }}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            Save Edits
          </button>
          <button
            onClick={() => finalizeDoc(doc.id).then(load)}
            className="bg-purple-600 text-white px-3 py-1 rounded text-sm"
          >
            Finalize
          </button>
        </div>
      </div>

      {doc.error_message && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
          Error: {doc.error_message}
        </div>
      )}
    </div>
  );
}
