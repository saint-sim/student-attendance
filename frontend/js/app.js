"use strict";

const API_URL = "/api/students";
let localStudentsList = [];
let isConsoleLog = false;

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
        if (isConsoleLog) {
            console.error("Ошибка при чтении JSON:", error.message);
        }
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
        if (isConsoleLog) {
            console.error("Не удалось обновить всех студентов:", error.message);
        }
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
    if (isConsoleLog) {
        console.log(student)
    }
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
    if (isConsoleLog) {
        console.log(finalText);
    }
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

document.querySelector(".drag-and-drop").addEventListener("drop", (e) => {
    e.preventDefault();
    // 1. Берем самый первый файл из тех, что сбросил пользователь
    const file = e.dataTransfer.files[0];

    // Проверяем, что файл вообще есть и это именно JSON
    if (
        !file ||
        (file.type !== "application/json" && !file.name.endsWith(".json"))
    ) {
        alert("Пожалуйста, сбросьте файл в формате JSON!");
        return;
    }

    // 2. Создаем инструмент для чтения файлов
    const reader = new FileReader();

    // 3. Настраиваем событие: что делать, когда файл полностью прочитается
    reader.onload = (event) => {
        try {
            // event.target.result содержит сырой текст из JSON-файла
            const jsonText = event.target.result;

            // Парсим строку в настоящий JavaScript-массив/объект
            const parsedData = JSON.parse(jsonText);

            // Записываем данные в вашу глобальную переменную
            localStudentsList = parsedData;
            updateStudents();
            renderStudents(localStudentsList);
            if (isConsoleLog) {
                console.log(
                    "Данные успешно загружены в глобальную переменную:",
                    localStudentsList,
                )};
        } catch (error) {
            console.error("Ошибка при чтении JSON:", error);
        }
    };
    reader.readAsText(file);
});

document.querySelector("#load-file").addEventListener("change", (e) => {
    // 1. Берем самый первый файл из тех, что сбросил пользователь
    const file = e.target.files[0];

    // Проверяем, что файл вообще есть и это именно JSON
    if (
        !file ||
        (file.type !== "application/json" && !file.name.endsWith(".json"))
    ) {
        alert("Пожалуйста, сбросьте файл в формате JSON!");
        return;
    }

    // 2. Создаем инструмент для чтения файлов
    const reader = new FileReader();

    // 3. Настраиваем событие: что делать, когда файл полностью прочитается
    reader.onload = (event) => {
        try {
            // event.target.result содержит сырой текст из JSON-файла
            const jsonText = event.target.result;

            // Парсим строку в настоящий JavaScript-массив/объект
            const parsedData = JSON.parse(jsonText);

            // Записываем данные в вашу глобальную переменную
            localStudentsList = parsedData;
            updateStudents();
            renderStudents(localStudentsList);
            if (isConsoleLog) {
                console.log(
                    "Данные успешно загружены в глобальную переменную:",
                    localStudentsList,
                );
            }
        } catch (error) {
            console.error("Ошибка при чтении JSON:", error);
        }
    };
    reader.readAsText(file);
})

document.querySelector(".drag-and-drop").addEventListener("dragover", (e) => {
    e.preventDefault();
});

document.querySelector("#save-file").addEventListener("click", () => {
    // 1. Проверяем, есть ли вообще данные для сохранения
    if (
        !localStudentsList ||
        (Array.isArray(localStudentsList) && localStudentsList.length === 0)
    ) {
        alert("Нет данных для сохранения!");
        return;
    }

    try {
        // 2. Превращаем JavaScript-объект/массив обратно в красивую JSON-строку
        // Параметры null и 2 делают текст читаемым (с отступами и переносами строк)
        const jsonString = JSON.stringify(localStudentsList, null, 2);

        // 3. Создаем Blob — специальный объект для работы с бинарными/текстовыми данными
        const blob = new Blob([jsonString], { type: "application/json" });

        // 4. Создаем виртуальную ссылку <a> в памяти браузера
        const link = document.createElement("a");

        // 5. Генерируем временный URL-адрес для нашего Blob-объекта
        link.href = URL.createObjectURL(blob);

        // 6. Указываем имя файла, под которым он сохранится у пользователя
        link.download = "students.json";

        // 7. Программно кликаем по ссылке, чтобы началось скачивание
        link.click();

        // 8. Очищаем память, удаляя созданный временный URL
        URL.revokeObjectURL(link.href);

        if (typeof isConsoleLog !== "undefined" && isConsoleLog) {
            console.log("Файл students.json успешно сохранен!");
        }
    } catch (error) {
        console.error("Ошибка при сохранении файла:", error);
        alert("Не удалось сохранить файл.");
    }
});

loadStudents();
