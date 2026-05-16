import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteDoc, listDocs } from "../api";
import StatusBadge from "../components/StatusBadge";
import type { Document } from "../types";

export default function Dashboard() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [filter, setFilter] = useState("");

  const loadDocs = async () => {
    const nextDocs = await listDocs(filter || undefined);
    setDocs(nextDocs);
  };

  useEffect(() => {
    loadDocs();
  }, [filter]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadDocs();
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [filter]);

  const handleDelete = async (docId: number) => {
    await deleteDoc(docId);
    setDocs((current) => current.filter((doc) => doc.id !== docId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded p-1 text-sm">
          <option value="">All</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="finalized">Finalized</option>
        </select>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Filename</th>
              <th className="p-3">Status</th>
              <th className="p-3">Progress</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {docs.map(d => (
              <tr key={d.id} className="border-t">
                <td className="p-3">{d.id}</td>
                <td className="p-3">{d.filename}</td>
                <td className="p-3"><StatusBadge status={d.status} /></td>
                <td className="p-3">{d.progress}%</td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Link to={`/docs/${d.id}`} className="text-blue-600 hover:underline">View</Link>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-gray-500 text-center">No documents yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
