const API = "http://localhost:8000/api";

const downloadFile = async (path: string, fallbackFilename: string) => {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status}`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || fallbackFilename;
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const uploadFile = async (file: File) => {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API}/upload`, { method: "POST", body: form });
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  return JSON.parse(text);
};

export const listDocs = (status?: string) =>
  fetch(`${API}/documents${status ? `?status=${status}` : ""}`).then(r => r.json());

export const getDoc = (id: number) =>
  fetch(`${API}/documents/${id}`).then(r => r.json());

export const deleteDoc = (id: number) =>
  fetch(`${API}/documents/${id}`, { method: "DELETE" });

export const getProgress = (id: number) =>
  fetch(`${API}/documents/${id}/progress`).then(r => r.json());

export const retryDoc = (id: number) =>
  fetch(`${API}/documents/${id}/retry`, { method: "POST" }).then(r => r.json());

export const updateDoc = (id: number, result: any) =>
  fetch(`${API}/documents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result }),
  }).then(r => r.json());

export const finalizeDoc = (id: number) =>
  fetch(`${API}/documents/${id}/finalize`, { method: "POST" }).then(r => r.json());

export const exportJson = (id: number) => downloadFile(`/documents/${id}/export/json`, `doc_${id}.json`);
export const exportCsv = (id: number) => downloadFile(`/documents/${id}/export/csv`, `doc_${id}.csv`);
