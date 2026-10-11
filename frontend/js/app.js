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

async function loadClassmates() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.url}`);
        // const students = await res.json();
        localStudentsList = await res.json();
        localStudentsList = sortStudent(localStudentsList);
        renderClassmates(localStudentsList);
    } catch (error) {
        console.error("Ошибка при чтении JSON:", error.message);
    }
}

function renderClassmates(students) {
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
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

async function deleteStudent(studentId) {
    const index = localStudentsList.findIndex((s) => String(s.studentId) === String(studentId));
    localStudentsList.splice(index, 1);
    renderClassmates(localStudentsList);
    showFormError("");
    try {
        const res = await fetch(`${API_URL}/${encodeURIComponent(studentId)}`, {
            method: "DELETE",
        });
        if (!res.ok) {
            const body = await res.json().catch(() => null);
            const detail =
                body && body.detail ? body.detail : `HTTP ${res.status}`;
            throw new Error(detail);
        }

        // 2. Если сервер успешно удалил, удаляем его из локального массива в памяти
        const index = localStudentsList.findIndex(
            (s) => String(s.studentId) === String(studentId),
        );
        if (index !== -1) {
            localStudentsList.splice(index, 1);
        }

        // 3. Перерисовываем таблицу с обновленным массивом
        renderClassmates(localStudentsList);
    } catch (error) {
        console.error("Не удалось удалить студента:", error.message);
        showFormError(error.message || "Не удалось удалить студента");
    }
}

async function addStudent(student) {
    showFormError("");
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => null);
            const detail = body && body.detail ? body.detail : `HTTP ${res.status}`;
            showFormError(typeof detail === "string" ? detail : "Не удалось добавить студента");
            return false;
        }
        await loadClassmates();
        return true;
    } catch (error) {
        console.error("Не удалось отправить данные:", error.message);
        showFormError("Сервер недоступен");
        return false;
    }
}

document.querySelector("#students").addEventListener("change", async (event) => {
    const checkbox = event.target;
    if (!(checkbox instanceof HTMLInputElement) || checkbox.type !== "checkbox") return;
    showFormError("");
    checkbox.disabled = true;
    try {
        const res = await fetch(`${API_URL}/${encodeURIComponent(checkbox.dataset.studentId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ present: checkbox.checked }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (error) {
        checkbox.checked = !checkbox.checked;
        showFormError("Не удалось обновить посещаемость");
        console.error("Не удалось обновить посещаемость:", error.message);
    } finally {
        checkbox.disabled = false;
    }
});

document.querySelector("#add-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const added = await addStudent({
        fullName: form.fullName.value.trim(),
        present: false,
    });
    if (added) form.reset();
});

loadClassmates();
