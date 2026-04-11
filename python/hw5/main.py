from fastapi import FastAPI, Depends, HTTPException, Response, status, Header, APIRouter
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import crud
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Students API with Auth", version="2.0.0")


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
    return crud.create_student(db=db, student=student)


@app.get("/students/", response_model=List[schemas.Student])
def read_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_students(db, skip=skip, limit=limit)


@app.get("/students/{student_id}", response_model=schemas.Student)
def read_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    student = crud.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
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
    return {"ok": True}


@app.post("/populate/")
def populate_db(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    try:
        crud.populate_from_csv(db, "students.csv")
        return {"message": "Database populated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/faculties/{faculty}/students", response_model=List[schemas.Student])
def get_students_by_faculty(
    faculty: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_students_by_faculty(db, faculty=faculty)


@app.get("/courses/unique", response_model=List[str])
def get_unique_courses(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    return crud.get_unique_courses(db)


@app.get("/courses/{course}/students-low-score", response_model=List[schemas.Student])
def get_students_by_course_low_score(
    course: str,
    max_score: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_students_by_course_and_score(db, course=course, max_score=max_score)


@app.get("/faculties/average-scores")
def get_average_scores(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    return crud.get_average_score_by_faculty(db)


@app.get("/export/csv")
def export_csv(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    csv_data = crud.export_to_csv_string(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=exported_students.csv"},
    )
