import os
import shutil
import json
import redis
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from app.core.db import get_db, Base, engine
from app.models.models import Document
from app.schemas.schemas import DocumentOut, DocumentUpdate
from app.workers.tasks import process_document
from app.core.config import get_settings

Base.metadata.create_all(bind=engine)

router = APIRouter()
settings = get_settings()
redis_client = redis.from_url(settings.redis_url)
os.makedirs(settings.upload_dir, exist_ok=True)

@router.post("/upload", response_model=DocumentOut)
async def upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    path = os.path.join(settings.upload_dir, file.filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = Document(filename=file.filename, status="queued", progress=0)
    db.add(doc)
    db.commit()
    db.refresh(doc)

    process_document.delay(doc.id)   # Async: do NOT process in request handler
    return doc

@router.get("/documents", response_model=List[DocumentOut])
def list_docs(status: str = None, db: Session = Depends(get_db)):
    q = db.query(Document)
    if status:
        q = q.filter(Document.status == status)
    return q.order_by(Document.created_at.desc()).all()

@router.get("/documents/{doc_id}", response_model=DocumentOut)
def get_doc(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc

@router.delete("/documents/{doc_id}", status_code=204)
def delete_doc(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    file_path = os.path.join(settings.upload_dir, doc.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    redis_client.delete(f"doc:{doc_id}")
    db.delete(doc)
    db.commit()

@router.get("/documents/{doc_id}/progress")
def get_progress(doc_id: int):
    data = redis_client.hgetall(f"doc:{doc_id}")
    if not data:
        return {"status": "unknown", "progress": "0", "message": ""}
    return {k.decode(): v.decode() for k, v in data.items()}

@router.post("/documents/{doc_id}/retry", response_model=DocumentOut)
def retry(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or doc.status != "failed":
        raise HTTPException(status_code=400, detail="Can only retry failed jobs")
    doc.status = "queued"
    doc.progress = 0
    doc.error_message = None
    db.commit()
    process_document.delay(doc_id)
    db.refresh(doc)
    return doc

@router.put("/documents/{doc_id}", response_model=DocumentOut)
def update(doc_id: int, payload: DocumentUpdate, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    doc.result = payload.result
    db.commit()
    db.refresh(doc)
    return doc

@router.post("/documents/{doc_id}/finalize", response_model=DocumentOut)
def finalize(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    doc.status = "finalized"
    db.commit()
    db.refresh(doc)
    return doc

@router.get("/documents/{doc_id}/export/json")
def export_json(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not doc.result:
        raise HTTPException(status_code=404, detail="No result")
    payload = json.dumps(doc.result, indent=2)
    return Response(
        content=payload,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="doc_{doc_id}.json"'},
    )

@router.get("/documents/{doc_id}/export/csv")
def export_csv(doc_id: int, db: Session = Depends(get_db)):
    import csv, io

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not doc.result:
        raise HTTPException(status_code=404, detail="No result")

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["field", "value"])
    for k, v in doc.result.items():
        writer.writerow([k, json.dumps(v) if isinstance(v, (list, dict)) else v])
    payload = out.getvalue().encode("utf-8")
    return Response(
        content=payload,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="doc_{doc_id}.csv"'},
    )
