import base64
import os
import sys
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


os.environ.setdefault("DATABASE_URL", "sqlite:///./test_print_proxy.db")
os.environ.setdefault("PRINT_PROXY_DISABLE_PRINT", "1")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app  # noqa: E402
from app.core.database import Base, engine  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def prepare_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def admin_token(client: TestClient) -> str:
    response = client.post(
        "/api/auth/token",
        data={"username": "admin", "password": "admin123", "grant_type": "password"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_printer_sync(client: TestClient, admin_token: str):
    response = client.post(
        "/api/printers/sync",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200


def test_create_text_job(client: TestClient, admin_token: str):
    payload = {
        "title": "示例文本打印",
        "file_type": "txt",
        "copies": 1,
        "content_base64": base64.b64encode(b"print proxy test").decode(),
        "priority": 5,
    }
    response = client.post(
        "/api/jobs",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    job = response.json()

    job_id = job["id"]
    for _ in range(20):
        status_response = client.get(
            f"/api/jobs/{job_id}/status",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert status_response.status_code == 200
        status_payload = status_response.json()
        if status_payload["status"] in {"completed", "failed"}:
            break
        time.sleep(0.2)
    else:
        pytest.fail("打印任务未在预期时间内完成")


def test_create_image_job_and_preview(client: TestClient, admin_token: str):
    png_base64 = (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
    )
    payload = {
        "title": "示例图片打印",
        "file_type": "png",
        "copies": 1,
        "content_base64": png_base64,
        "priority": 4,
    }
    response = client.post(
        "/api/jobs",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    job = response.json()
    job_id = job["id"]

    preview_response = client.get(
        f"/api/jobs/{job_id}/preview",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert preview_response.status_code == 200
    assert len(preview_response.text) > 0
