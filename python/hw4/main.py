from fastapi import FastAPI, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import crud
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Students API", version="1.0.0")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 1. CRUD Opertions for Students
@app.post("/students/", response_model=schemas.Student)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    return crud.create_student(db=db, student=student)

@app.get("/students/", response_model=List[schemas.Student])
def read_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    students = crud.get_students(db, skip=skip, limit=limit)
    return students

@app.get("/students/{student_id}", response_model=schemas.Student)
def read_student(student_id: int, db: Session = Depends(get_db)):
    student = crud.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@app.put("/students/{student_id}", response_model=schemas.Student)
def update_student(student_id: int, student: schemas.StudentCreate, db: Session = Depends(get_db)):
    db_student = crud.update_student(db, student_id=student_id, student=student)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student

@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    success = crud.delete_student(db, student_id=student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"ok": True}

# 2. Populate from CSV
@app.post("/populate/")
def populate_db(db: Session = Depends(get_db)):
    try:
        crud.populate_from_csv(db, "students.csv")
        return {"message": "Database populated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. Lists logic
@app.get("/faculties/{faculty}/students", response_model=List[schemas.Student])
def get_students_by_faculty(faculty: str, db: Session = Depends(get_db)):
    return crud.get_students_by_faculty(db, faculty=faculty)

@app.get("/courses/unique", response_model=List[str])
def get_unique_courses(db: Session = Depends(get_db)):
    return crud.get_unique_courses(db)

@app.get("/courses/{course}/students-low-score", response_model=List[schemas.Student])
def get_students_by_course_low_score(course: str, max_score: int = 30, db: Session = Depends(get_db)):
    """Получает студентов по выбранному курсу с оценкой ниже max_score баллов"""
    return crud.get_students_by_course_and_score(db, course=course, max_score=max_score)

# 4. Average score by faculty
@app.get("/faculties/average-scores")
def get_average_scores(db: Session = Depends(get_db)):
    return crud.get_average_score_by_faculty(db)

# 5. Export to CSV
@app.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    csv_data = crud.export_to_csv_string(db)
    # Return as file download
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=exported_students.csv"}
    )
