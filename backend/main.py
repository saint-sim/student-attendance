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


@app.post("/api/students")
def update_all_students(payload: list[dict]) -> dict:
    write_students(payload) 
    return {"status": "success", "message": "Файл JSON успешно обновлен на сервере"}

app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")
