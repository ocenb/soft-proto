from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import schemas
import csv
import io

# 1. CRUD Opertions
def get_student(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def get_students(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Student).offset(skip).limit(limit).all()

def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(**student.model_dump())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student: schemas.StudentCreate):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if db_student:
        for key, value in student.model_dump().items():
            setattr(db_student, key, value)
        db.commit()
        db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_id: int):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if db_student:
        db.delete(db_student)
        db.commit()
        return True
    return False

# 2. Populate from CSV
def populate_from_csv(db: Session, file_path: str = "students.csv"):
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        student_cache = {}
        for row in reader:
            last_name = row['Фамилия']
            first_name = row['Имя']
            faculty = row['Факультет']
            subject = row['Курс']
            score = int(row['Оценка'])
            
            key = (last_name, first_name, faculty)
            if key not in student_cache:
                student = db.query(models.Student).filter(
                    models.Student.last_name == last_name,
                    models.Student.first_name == first_name,
                    models.Student.faculty == faculty
                ).first()
                if not student:
                    student = models.Student(
                        last_name=last_name,
                        first_name=first_name,
                        faculty=faculty
                    )
                    db.add(student)
                    db.flush()
                student_cache[key] = student.id
            
            grade = models.Grade(
                student_id=student_cache[key],
                subject=subject,
                score=score
            )
            db.add(grade)
        db.commit()


# 3. Lists logic
def get_students_by_faculty(db: Session, faculty: str):
    return db.query(models.Student).filter(models.Student.faculty == faculty).all()

def get_unique_courses(db: Session):
    courses = db.query(models.Grade.subject).distinct().all()
    return [c[0] for c in courses]

def get_students_by_course_and_score(db: Session, course: str, max_score: int = 30):
    return db.query(models.Student).join(models.Grade).filter(
        models.Grade.subject == course,
        models.Grade.score < max_score
    ).all()


# 4. Average score by faculty
def get_average_score_by_faculty(db: Session):
    results = db.query(
        models.Student.faculty,
        func.avg(models.Grade.score).label('average_score')
    ).join(models.Grade).group_by(models.Student.faculty).all()
    return [{"faculty": r[0], "average_score": r[1]} for r in results]


# 5. Export to CSV string
def export_to_csv_string(db: Session) -> str:
    grades = db.query(models.Grade).join(models.Student).all()
    output = io.StringIO()
    writer = csv.writer(output, lineterminator='\n')
    writer.writerow(['Фамилия', 'Имя', 'Факультет', 'Курс', 'Оценка'])
    for grade in grades:
        writer.writerow([
            grade.student.last_name,
            grade.student.first_name,
            grade.student.faculty,
            grade.subject,
            grade.score
        ])
    return output.getvalue()
