from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time

import main
import models


class FakeRedis:
    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def setex(self, key, ttl, value):
        self.store[key] = value

    def scan_iter(self, pattern):
        if pattern == "students:*":
            for key in list(self.store.keys()):
                if key.startswith("students:"):
                    yield key

    def delete(self, key):
        self.store.pop(key, None)


engine = create_engine(
    "sqlite:///./test_students.db", connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)


main.redis_client = FakeRedis()


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


main.app.dependency_overrides[main.get_db] = override_get_db


def patched_background_delete_students(student_ids):
    db = TestingSessionLocal()
    try:
        main.crud.delete_students_by_ids(db, student_ids)
        main.invalidate_data_cache()
    finally:
        db.close()


main.background_delete_students = patched_background_delete_students
client = TestClient(main.app)


def register_and_login(username: str = "tester", password: str = "secret") -> str:
    client.post("/auth/register", json={"username": username, "password": password})
    response = client.post("/auth/login", json={"username": username, "password": password})
    return response.json()["access_token"]


def auth_headers(token: str):
    return {"X-Token": token}


def create_student(token: str, first: str, last: str, faculty: str):
    return client.post(
        "/students/",
        headers=auth_headers(token),
        json={"first_name": first, "last_name": last, "faculty": faculty},
    )


def test_register_success_and_duplicate_username():
    response = client.post(
        "/auth/register", json={"username": "user_a", "password": "pass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "user_a"
    assert "id" in data

    duplicate = client.post(
        "/auth/register", json={"username": "user_a", "password": "pass123"}
    )
    assert duplicate.status_code == 400
    assert duplicate.json()["detail"] == "Username already registered"


def test_register_validation_error_when_password_missing():
    response = client.post("/auth/register", json={"username": "user_missing_pwd"})
    assert response.status_code == 422


def test_login_success_and_wrong_password():
    client.post("/auth/register", json={"username": "user_b", "password": "mypwd"})

    ok = client.post("/auth/login", json={"username": "user_b", "password": "mypwd"})
    assert ok.status_code == 200
    token_data = ok.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    bad = client.post("/auth/login", json={"username": "user_b", "password": "bad"})
    assert bad.status_code == 401
    assert bad.json()["detail"] == "Incorrect username or password"


def test_login_unknown_user():
    response = client.post(
        "/auth/login", json={"username": "user_not_exists", "password": "none"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"


def test_create_student_requires_auth_and_success():
    unauthorized = client.post(
        "/students/",
        json={"first_name": "Ivan", "last_name": "Petrov", "faculty": "Math"},
    )
    assert unauthorized.status_code == 401
    assert unauthorized.json()["detail"] == "X-Token header missing"

    token = register_and_login("user_c", "pass")
    response = create_student(token, "Ivan", "Petrov", "Math")
    assert response.status_code == 200
    student = response.json()
    assert student["first_name"] == "Ivan"
    assert student["last_name"] == "Petrov"
    assert student["faculty"] == "Math"


def test_create_student_validation_error():
    token = register_and_login("user_create_invalid", "pass")
    response = client.post(
        "/students/",
        headers=auth_headers(token),
        json={"first_name": "Ivan", "last_name": "Petrov"},
    )
    assert response.status_code == 422


def test_read_student_found_and_not_found():
    token = register_and_login("user_d", "pass")
    created = create_student(token, "Anna", "Sidorova", "Physics")
    student_id = created.json()["id"]

    ok = client.get(f"/students/{student_id}", headers=auth_headers(token))
    assert ok.status_code == 200
    assert ok.json()["id"] == student_id

    missing = client.get("/students/999999", headers=auth_headers(token))
    assert missing.status_code == 404
    assert missing.json()["detail"] == "Student not found"


def test_read_student_requires_auth():
    response = client.get("/students/1")
    assert response.status_code == 401
    assert response.json()["detail"] == "X-Token header missing"


def test_delete_batch_endpoint_runs_and_changes_list():
    token = register_and_login("user_e", "pass")
    s1 = create_student(token, "N1", "L1", "CS").json()["id"]
    s2 = create_student(token, "N2", "L2", "CS").json()["id"]

    before = client.get("/students/", headers=auth_headers(token))
    before_ids = {item["id"] for item in before.json()}
    assert s1 in before_ids and s2 in before_ids

    batch = client.post(
        "/students/delete-batch",
        headers=auth_headers(token),
        json={"student_ids": [s1, s2]},
    )
    assert batch.status_code == 200
    assert batch.json()["student_ids"] == [s1, s2]

    after_ids = set()
    for _ in range(10):
        after = client.get("/students/", headers=auth_headers(token))
        after_ids = {item["id"] for item in after.json()}
        if s1 not in after_ids and s2 not in after_ids:
            break
        time.sleep(0.05)
    assert s1 not in after_ids and s2 not in after_ids


def test_delete_batch_requires_auth_and_handles_empty_list():
    unauthorized = client.post("/students/delete-batch", json={"student_ids": [1, 2]})
    assert unauthorized.status_code == 401
    assert unauthorized.json()["detail"] == "X-Token header missing"

    token = register_and_login("user_f", "pass")
    empty_payload = client.post(
        "/students/delete-batch",
        headers=auth_headers(token),
        json={"student_ids": []},
    )
    assert empty_payload.status_code == 200
    assert empty_payload.json()["student_ids"] == []


def test_delete_batch_validation_error_for_wrong_payload():
    token = register_and_login("user_batch_invalid", "pass")
    response = client.post(
        "/students/delete-batch",
        headers=auth_headers(token),
        json={"student_ids": "not-a-list"},
    )
    assert response.status_code == 422
