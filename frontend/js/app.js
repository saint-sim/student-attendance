"use strict";

const API_URL = "/api/students";
let localStudentsList = [];

function showFormError(message) {
    const element = document.querySelector("#form-error");
    element.textContent = message;
    element.hidden = message === "";
}

function sortStudent(students) {
    const jsonArray = students;
    jsonArray.sort((a,b) => {
        const ValueA = String(a.lastName || "");
        const ValueB = String(b.lastName || "");
        return ValueA.localeCompare(ValueB, "ru");
    });
    return jsonArray;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[char]);
}

async function loadStudents() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.url}`);
        localStudentsList = await res.json();
        localStudentsList = sortStudent(localStudentsList);
        renderStudents(localStudentsList);
    } catch (error) {
        console.error("Ошибка при чтении JSON:", error.message);
    }
}

async function updateStudents() {
    showFormError(""); 
    const saveBtn = document.querySelector("#save-all-btn");
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Сохранение...";
    }
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(localStudentsList),
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} — ${res.url}`);
        }
    } catch (error) {
        console.error("Не удалось обновить всех студентов:", error.message);
        showFormError(
            "Критическая ошибка: изменения не были сохранены на сервере.",
        );
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "Сохранить изменения";
        }
    }
}

function renderStudents(students) {
    const rows = students
        .map(
            (student, index) =>
                `<tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(student.lastName)} ${escapeHtml(student.firstName)} ${escapeHtml(student.middleName)}</td>
                    <td><input type="checkbox" data-student-id="${escapeHtml(student.studentId)}" aria-label="На паре" ${student.present ? "checked" : ""}></td>
                    <td><button onclick="deleteStudent(${student.studentId})">Удалить</button></td>
                </tr>`,
        )
        .join("");

    document.querySelector("#students").innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>№</th>
                    <th>ФИО</th>
                    <th>На паре</th>
                    <th>Удалить студента</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function chooseAll(presentStatus) {
    localStudentsList.forEach((student) => {
        student.present = presentStatus;
    });
    renderStudents(localStudentsList);
}

function deleteStudent(studentId) {
    const index = localStudentsList.findIndex((s) => String(s.studentId) === String(studentId));
    localStudentsList.splice(index, 1);
    renderStudents(localStudentsList);
}

function addStudent(student) {
    console.log(student);
    showFormError("");
    const nameParts = student.split(/\s+/);
    const maxId = localStudentsList.reduce((max, s) => {
        const idNum = parseInt(s.studentId);
        return !isNaN(idNum) && idNum > max ? idNum : max;
    }, 0);
    const nextId = String(maxId + 1);
    const newStudent = {
        studentId: nextId,
        lastName: nameParts[0],
        firstName: nameParts[1],
        middleName: nameParts[2],
        present: false,
    };
    localStudentsList.push(newStudent);
    localStudentsList = sortStudent(localStudentsList);
    renderStudents(localStudentsList);
    return true;
}

function copyStudents(present) {
    if (!navigator.clipboard) {
        showFormError(
            "Ваш браузер не поддерживает копирование или сайт работает не по HTTPS",
        );
        return;
    }
    const presentStudents = localStudentsList.filter(
        (student) => student.present === present,
    );
    const textLines = presentStudents.map((student) => {
        return `${student.lastName} ${student.firstName}`;
    });
    const finalText = textLines.join("\n");
    navigator.clipboard.writeText(finalText);
    console.log(finalText);
}


document.querySelector("#students").addEventListener("change", (event) => {
    const checkbox = event.target;
    if (!(checkbox instanceof HTMLInputElement) || checkbox.type !== "checkbox")
        return;
    showFormError(""); 
    const student = localStudentsList.find(
        (s) => String(s.studentId) === String(checkbox.dataset.studentId),
    );
    if (student) {
        student.present = checkbox.checked; // записываем true или false
    }
});

document.querySelector("#add-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const added = addStudent(form.fullName.value.trim());
    if (added) form.reset();
});

loadStudents();
