from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Response,
    Header,
    APIRouter,
    BackgroundTasks,
)
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import List
import json
import redis

import models
import schemas
import crud
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Students API with Auth", version="2.0.0")
REDIS_URL = "redis://localhost:6379/0"
CACHE_TTL = 300
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Dependency for Auth
def get_current_user(db: Session = Depends(get_db), x_token: str = Header(None)):
    if not x_token:
        raise HTTPException(status_code=401, detail="X-Token header missing")
    user = crud.get_user_by_token(db, token=x_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session or token")
    return user


def build_cache_key(prefix: str, **kwargs):
    payload = "|".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
    return f"{prefix}:{payload}" if payload else prefix


def get_cached_response(cache_key: str):
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    return None


def set_cached_response(cache_key: str, value):
    redis_client.setex(cache_key, CACHE_TTL, json.dumps(jsonable_encoder(value)))


def invalidate_data_cache():
    for key in redis_client.scan_iter("students:*"):
        redis_client.delete(key)


def background_populate_from_csv(file_path: str):
    db = SessionLocal()
    try:
        crud.populate_from_csv(db, file_path)
        invalidate_data_cache()
    finally:
        db.close()


def background_delete_students(student_ids: List[int]):
    db = SessionLocal()
    try:
        crud.delete_students_by_ids(db, student_ids)
        invalidate_data_cache()
    finally:
        db.close()


# --- AUTH ROUTER ---
auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)


@auth_router.post("/login")
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if not db_user or not crud.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = crud.generate_token()
    crud.update_user_token(db, user_id=db_user.id, token=token)
    return {"access_token": token, "token_type": "bearer"}


@auth_router.post("/logout")
def logout(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    crud.update_user_token(db, user_id=current_user.id, token=None)
    return {"message": "Successfully logged out"}


app.include_router(auth_router)

# --- PROTECTED ENDPOINTS ---
# We use Depends(get_current_user) in each endpoint to ensure access is restricted


@app.post("/students/", response_model=schemas.Student)
def create_student(
    student: schemas.StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    result = crud.create_student(db=db, student=student)
    invalidate_data_cache()
    return result


@app.get("/students/", response_model=List[schemas.Student])
def read_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cache_key = build_cache_key("students:list", skip=skip, limit=limit)
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached
    result = crud.get_students(db, skip=skip, limit=limit)
    set_cached_response(cache_key, result)
    return result


@app.get("/students/{student_id}", response_model=schemas.Student)
def read_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cache_key = build_cache_key("students:by-id", student_id=student_id)
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached
    student = crud.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    set_cached_response(cache_key, student)
    return student


@app.put("/students/{student_id}", response_model=schemas.Student)
def update_student(
    student_id: int,
    student: schemas.StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_student = crud.update_student(db, student_id=student_id, student=student)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    invalidate_data_cache()
    return db_student


@app.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    success = crud.delete_student(db, student_id=student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Student not found")
    invalidate_data_cache()
    return {"ok": True}


@app.post("/populate/")
def populate_db(
    file_path: str,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
):
    background_tasks.add_task(background_populate_from_csv, file_path)
    return {"message": "Population started in background", "file_path": file_path}


@app.post("/students/delete-batch")
def delete_students_batch(
    payload: schemas.StudentsDeleteRequest,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
):
    background_tasks.add_task(background_delete_students, payload.student_ids)
    return {
        "message": "Batch delete started in background",
        "student_ids": payload.student_ids,
    }


@app.get("/faculties/{faculty}/students", response_model=List[schemas.Student])
def get_students_by_faculty(
    faculty: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cache_key = build_cache_key("students:faculty", faculty=faculty)
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached
    result = crud.get_students_by_faculty(db, faculty=faculty)
    set_cached_response(cache_key, result)
    return result


@app.get("/courses/unique", response_model=List[str])
def get_unique_courses(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    cache_key = "students:courses:unique"
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached
    result = crud.get_unique_courses(db)
    set_cached_response(cache_key, result)
    return result


@app.get("/courses/{course}/students-low-score", response_model=List[schemas.Student])
def get_students_by_course_low_score(
    course: str,
    max_score: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cache_key = build_cache_key(
        "students:course-low-score", course=course, max_score=max_score
    )
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached
    result = crud.get_students_by_course_and_score(db, course=course, max_score=max_score)
    set_cached_response(cache_key, result)
    return result


@app.get("/faculties/average-scores")
def get_average_scores(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    cache_key = "students:faculties:average-scores"
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached
    result = crud.get_average_score_by_faculty(db)
    set_cached_response(cache_key, result)
    return result


@app.get("/export/csv")
def export_csv(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    cache_key = "students:export:csv"
    cached = redis_client.get(cache_key)
    if cached is not None:
        csv_data = cached
    else:
        csv_data = crud.export_to_csv_string(db)
        redis_client.setex(cache_key, CACHE_TTL, csv_data)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=exported_students.csv"},
    )
