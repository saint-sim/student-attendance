import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "frontend" / "data" / "classmates.json"
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(title="Student Attendance")


class StudentCreate(BaseModel):
    fullName: str = Field(min_length=1)
    present: bool = False


class StudentUpdate(BaseModel):
    present: bool


def read_students() -> list[dict]:
    with DATA_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_students(students: list[dict]) -> None:
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(students, file, ensure_ascii=False, indent=2)


@app.get("/api/students")
def list_students() -> list[dict]:
    return read_students()


@app.post("/api/students", status_code=201)
def create_student(payload: StudentCreate) -> dict:
    name_parts = payload.fullName.split()
    if len(name_parts) != 3:
        raise HTTPException(
            status_code=422,
            detail="Укажите ФИО полностью: Фамилия Имя Отчество",
        )

    students = read_students()
    next_id = max((int(s["studentId"]) for s in students if str(s["studentId"]).isdigit()), default=0) + 1

    student = {
        "studentId": str(next_id),
        "lastName": name_parts[0],
        "firstName": name_parts[1],
        "middleName": name_parts[2],
        "present": payload.present,
    }
    students.append(student)
    write_students(students)
    return student


@app.patch("/api/students/{student_id}")
def update_student(student_id: str, payload: StudentUpdate) -> dict:
    students = read_students()
    for student in students:
        if str(student["studentId"]) == student_id:
            student["present"] = payload.present
            write_students(students)
            return student
    raise HTTPException(status_code=404, detail="Студент не найден")


@app.delete("/api/students/{student_id}", status_code=204)
def delete_student_api(student_id: str):
    students = read_students()
    
    # Ищем студента с нужным ID
    for i, student in enumerate(students):
        if str(student["studentId"]) == student_id:
            # Удаляем студента из списка
            students.pop(i)
            # Перезаписываем JSON-файл
            write_students(students)
            return  # Статус 204 не требует возврата body
            
    raise HTTPException(status_code=404, detail="Студент не найден")


app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")
