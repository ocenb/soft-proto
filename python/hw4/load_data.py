import csv
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Student, Grade

def load_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        db = SessionLocal()
        student_cache = {}
        
        try:
            for row in reader:
                last_name = row['Фамилия']
                first_name = row['Имя']
                faculty = row['Факультет']
                subject = row['Курс']
                score = int(row['Оценка'])
                
                key = (last_name, first_name, faculty)
                if key not in student_cache:
                    student = db.query(Student).filter(
                        Student.last_name == last_name,
                        Student.first_name == first_name,
                        Student.faculty == faculty
                    ).first()
                    
                    if not student:
                        student = Student(
                            last_name=last_name,
                            first_name=first_name,
                            faculty=faculty
                        )
                        db.add(student)
                        db.flush()
                    student_cache[key] = student.id
                
                grade = Grade(
                    student_id=student_cache[key],
                    subject=subject,
                    score=score
                )
                db.add(grade)
            
            db.commit()
            print("Data loaded successfully.")
        except Exception as e:
            db.rollback()
            print(f"Error loading data: {e}")
        finally:
            db.close()

if __name__ == "__main__":
    load_data("students.csv")
