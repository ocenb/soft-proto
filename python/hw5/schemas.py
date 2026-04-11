from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class GradeBase(BaseModel):
    subject: str
    score: int


class GradeCreate(GradeBase):
    pass


class Grade(GradeBase):
    id: int
    student_id: int

    model_config = ConfigDict(from_attributes=True)


class StudentBase(BaseModel):
    first_name: str
    last_name: str
    faculty: str


class StudentCreate(StudentBase):
    pass


class Student(StudentBase):
    id: int
    grades: List[Grade] = []

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    token: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str
