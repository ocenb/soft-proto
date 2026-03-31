from datetime import datetime
import re
from typing import List, Union, Dict, Any, Optional
from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
    model_validator,
    ValidationError,
)

class UserRegistration(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=20,
        description="3-20 символов, только латинские буквы, цифры и нижнее подчеркивание"
    )
    email: EmailStr
    password: str = Field(..., min_length=8)
    password_confirm: str = Field(..., exclude=True)
    real_name: str = Field(..., min_length=2)
    phone: str = Field(..., pattern=r"^\+\d-\d{3}-\d{2}-\d{2}$")
    age: int = Field(..., ge=18, le=120)
    registration_date: datetime = Field(default_factory=datetime.now)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_]+$", value):
            raise ValueError(
                "Имя пользователя может содержать только латинские буквы, цифры и символ подчеркивания"
            )
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(char.isdigit() for char in value):
            raise ValueError("Пароль должен содержать хотя бы одну цифру")
        if not any(char.isupper() for char in value):
            raise ValueError("Пароль должен содержать хотя бы одну заглавную букву")
        if not any(char.islower() for char in value):
            raise ValueError("Пароль должен содержать хотя бы одну строчную букву")
        return value

    @field_validator("real_name")
    @classmethod
    def validate_real_name(cls, value: str) -> str:
        if not value[0].isupper():
            raise ValueError("Имя должно начинаться с заглавной буквы")
        return value

    @model_validator(mode="after")
    def check_passwords_match(self) -> "UserRegistration":
        if self.password != self.password_confirm:
            raise ValueError("Пароли не совпадают")
        return self

def register_user(data: dict) -> Union[UserRegistration, List[Dict[str, Any]]]:
    """
    Валидирует данные пользователя.
    Возвращает модель UserRegistration или список ошибок.
    """
    try:
        user = UserRegistration(**data)
        return user
    except ValidationError as e:
        # Формируем список понятных ошибок
        errors = []
        for error in e.errors():
            errors.append({
                "field": " -> ".join(map(str, error["loc"])),
                "message": error["msg"]
            })
        return errors

# Пример использования
if __name__ == "__main__":
    test_data_success = {
        "username": "alex32",
        "email": "alex@example.com",
        "password": "Password123",
        "password_confirm": "Password123",
        "real_name": "Алексей",
        "phone": "+7-999-12-34",
        "age": 25
    }

    test_data_fail = {
        "username": "al",  # слишком короткий
        "email": "not-an-email",
        "password": "password",  # нет цифры и заглавной буквы
        "password_confirm": "Password123", # не совпадает
        "real_name": "алексей", # с маленькой буквы
        "phone": "89991234567", # неверный формат
        "age": 15 # слишком молодой
    }

    print("--- Успешная регистрация ---")
    result_success = register_user(test_data_success)
    if isinstance(result_success, UserRegistration):
        print("Данные валидны:")
        print(result_success.model_dump_json(indent=4))
    else:
        print("Ошибки:", result_success)

    print("\n--- Ошибочная регистрация ---")
    result_fail = register_user(test_data_fail)
    if isinstance(result_fail, UserRegistration):
        print("Данные валидны:", result_fail)
    else:
        print("Обнаружены ошибки:")
        for err in result_fail:
            print(f"- {err['field']}: {err['message']}")
