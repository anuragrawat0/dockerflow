from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class DocumentOut(BaseModel):
    id: int
    filename: str
    status: str
    progress: float
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DocumentUpdate(BaseModel):
    result: Dict[str, Any]