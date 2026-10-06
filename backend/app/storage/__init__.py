from app.config import Settings
from app.storage.base import PlanRepository


def build_repository(s: Settings) -> PlanRepository:
    """Single switch point for storage backends."""
    if s.storage_backend == "s3":
        from app.storage.s3 import S3PlanRepository

        return S3PlanRepository(s.s3_bucket, s.s3_prefix)
    from app.storage.local import LocalJsonRepository

    return LocalJsonRepository(s.local_data_dir)
