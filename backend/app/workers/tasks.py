import json
import os
import time

import redis

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.models.models import Document
from app.services.parser import parse_document
from app.workers.celery_app import celery_app

settings = get_settings()
redis_client = redis.from_url(settings.redis_url)


@celery_app.task
def process_document(doc_id: int):
    db = SessionLocal()
    if not db.query(Document.id).filter(Document.id == doc_id).first():
        db.close()
        return

    def push_progress(status: str, progress: float, message: str = ""):
        current_doc = db.query(Document).filter(Document.id == doc_id).first()
        if not current_doc:
            raise RuntimeError("document_deleted")

        payload = {"status": status, "progress": progress, "message": message}
        redis_client.publish(f"doc:{doc_id}:progress", json.dumps(payload))
        redis_client.hset(
            f"doc:{doc_id}",
            mapping={
                "status": status,
                "progress": str(progress),
                "message": message,
            },
        )
        current_doc.status = status
        current_doc.progress = progress
        db.commit()

    try:
        push_progress("processing", 10, "document_parsing_started")
        time.sleep(0.5)

        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            return

        path = os.path.join(settings.upload_dir, doc.filename)
        text = ""
        if os.path.exists(path):
            if doc.filename.lower().endswith(".txt"):
                with open(path, "r", encoding="utf-8", errors="ignore") as file_handle:
                    text = file_handle.read()
            else:
                text = f"PDF placeholder for {doc.filename}"
        else:
            text = f"Content for {doc.filename}"

        push_progress("processing", 50, "document_parsing_completed")
        time.sleep(0.5)

        push_progress("processing", 80, "field_extraction_started")
        result = parse_document(text, doc.filename)
        time.sleep(0.5)

        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            return

        doc.result = result
        push_progress("completed", 100, "job_completed")
        db.commit()

    except Exception as exc:
        message = str(exc)
        if message == "document_deleted":
            redis_client.delete(f"doc:{doc_id}")
            return

        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            redis_client.delete(f"doc:{doc_id}")
            return

        push_progress("failed", doc.progress, message)
        doc.error_message = message
        db.commit()
    finally:
        db.close()
