from datetime import datetime
from pydantic import BaseModel

class EvidenceOut(BaseModel):
    id: int
    return_case_id: int
    file_name: str
    file_path: str
    evidence_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True
