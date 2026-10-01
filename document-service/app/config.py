import os
from pathlib import Path

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(20 * 1024 * 1024)))
STORAGE_PATH = Path(os.getenv("DOCUMENT_STORAGE_PATH", "/data" if Path("/data").exists() else "./uploads"))
STORAGE_PATH.mkdir(parents=True, exist_ok=True)
