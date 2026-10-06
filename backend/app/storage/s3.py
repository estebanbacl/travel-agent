"""S3 backend (scaffold, untested against a real bucket).
Enable with STORAGE_BACKEND=s3, S3_BUCKET=..., and `pip install boto3`."""
from app.models import PlanSummary, TravelPlan
from app.storage.base import summarize


class S3PlanRepository:
    def __init__(self, bucket: str, prefix: str = "plans/"):
        import boto3  # lazy: only required when this backend is selected

        if not bucket:
            raise ValueError("S3_BUCKET is required for STORAGE_BACKEND=s3")
        self._s3 = boto3.client("s3")
        self._bucket = bucket
        self._prefix = prefix

    def _key(self, plan_id: str) -> str:
        return f"{self._prefix}{plan_id}.json"

    def list(self) -> list[PlanSummary]:
        out: list[PlanSummary] = []
        paginator = self._s3.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=self._bucket, Prefix=self._prefix):
            for obj in page.get("Contents", []):
                plan = self.get(obj["Key"][len(self._prefix):].removesuffix(".json"))
                if plan:
                    out.append(summarize(plan))
        return sorted(out, key=lambda s: s.createdAt, reverse=True)

    def get(self, plan_id: str) -> TravelPlan | None:
        try:
            body = self._s3.get_object(Bucket=self._bucket, Key=self._key(plan_id))["Body"].read()
        except self._s3.exceptions.NoSuchKey:
            return None
        return TravelPlan.model_validate_json(body)

    def save(self, plan: TravelPlan) -> None:
        self._s3.put_object(
            Bucket=self._bucket,
            Key=self._key(plan.id),
            Body=plan.model_dump_json().encode(),
            ContentType="application/json",
        )

    def delete(self, plan_id: str) -> bool:
        if not self.get(plan_id):
            return False
        self._s3.delete_object(Bucket=self._bucket, Key=self._key(plan_id))
        return True
