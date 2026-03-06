"""Pydantic schemas for bulk import/export operations."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import BulkJobStatus, BulkJobType


class BulkJobRead(BaseModel):
    """Bulk job representation returned to clients."""

    job_id: uuid.UUID
    shop_id: uuid.UUID
    created_by: uuid.UUID
    type: BulkJobType
    status: BulkJobStatus
    file_url: str
    result_file_url: str | None = None
    total_rows: int | None = None
    success_count: int
    error_count: int
    error_details: dict | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
