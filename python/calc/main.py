from fastapi import FastAPI, HTTPException
from typing import Dict

app = FastAPI(
    title="Calculator API",
    description="Простое FastAPI-приложение для вычислений.",
    version="1.0.0",
)

# Ограниченный и безопасный словарь для функции eval()
SAFE_EVAL_DICT = {
    "__builtins__": None,
}

@app.get("/add", summary="Сложение двух чисел")
def add(a: float, b: float) -> Dict[str, float]:
    """
    Складывает два числа и возвращает результат.
    """
    result = a + b
    return {"result": result}

@app.get("/subtract", summary="Вычитание двух чисел")
def subtract(a: float, b: float) -> Dict[str, float]:
    """
    Вычитает второе число из первого и возвращает результат.
    """
    result = a - b
    return {"result": result}

@app.get("/multiply", summary="Умножение двух чисел")
def multiply(a: float, b: float) -> Dict[str, float]:
    """
    Умножает два числа и возвращает результат.
    """
    result = a * b
    return {"result": result}

@app.get("/divide", summary="Деление двух чисел")
def divide(a: float, b: float) -> Dict[str, float]:
    """
    Делит первое число на второе и возвращает результат.
    Вызывает ошибку при делении на ноль.
    """
    if b == 0:
        raise HTTPException(status_code=400, detail="Деление на ноль невозможно.")
    result = a / b
    return {"result": result}

@app.get("/calculate", summary="Вычисление строкового выражения")
def calculate(expression: str) -> Dict[str, float]:
    """
    Вычисляет математическое выражение из строки.
    
    Пример: `(10 + 5) * 2 - 3 / 1.5`
    
    Поддерживаемые операции: `+`, `-`, `*`, `/`.
    Используйте скобки для управления порядком операций.
    """
    try:
        # Проверка на наличие недопустимых символов
        for char in expression:
            if char not in "0123456789.+-*/() ":
                raise ValueError(f"Недопустимый символ в выражении: '{char}'")
        
        result = eval(expression, SAFE_EVAL_DICT, {})
        return {"result": result}
    except (SyntaxError, ZeroDivisionError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Ошибка в выражении: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Произошла внутренняя ошибка: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
