import os
import re
import tempfile
from pathlib import Path

from app.models import PlanSummary, TravelPlan
from app.storage.base import summarize

_ID_RE = re.compile(r"^[a-f0-9]{32}$")


class LocalJsonRepository:
    """One JSON file per plan under `root`. Writes are atomic."""

    def __init__(self, root: str):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, plan_id: str) -> Path | None:
        # Reject anything that is not a generated id (prevents path traversal).
        return self.root / f"{plan_id}.json" if _ID_RE.match(plan_id) else None

    def list(self) -> list[PlanSummary]:
        out = []
        for p in self.root.glob("*.json"):
            try:
                out.append(summarize(TravelPlan.model_validate_json(p.read_text("utf-8"))))
            except ValueError:
                continue  # skip corrupt files rather than failing the listing
        return sorted(out, key=lambda s: s.createdAt, reverse=True)

    def get(self, plan_id: str) -> TravelPlan | None:
        p = self._path(plan_id)
        if not p or not p.exists():
            return None
        return TravelPlan.model_validate_json(p.read_text("utf-8"))

    def save(self, plan: TravelPlan) -> None:
        p = self._path(plan.id)
        if not p:
            raise ValueError("invalid plan id")
        fd, tmp = tempfile.mkstemp(dir=self.root, suffix=".tmp")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(plan.model_dump_json(indent=2))
        os.replace(tmp, p)

    def delete(self, plan_id: str) -> bool:
        p = self._path(plan_id)
        if not p or not p.exists():
            return False
        p.unlink()
        return True
