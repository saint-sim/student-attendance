"use strict";

async function loadClassmates() {
    try {
        const res = await fetch("./data/classmates.json");
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.url}`);
        const students = await res.json();
        renderClassmates(students);
    } catch (error) {
        console.error("Ошибка при чтении JSON:", error.message);
    }
}

function renderClassmates(students) {
    const rows = students
        .map(
            (student) =>
                `<tr>
                    <td>${student.studentId}</td>
                    <td>${student.lastName} ${student.firstName} ${student.middleName}</td>
                    <td>${student.present}</td>
                </tr>`,
        ).join("");

    document.querySelector("main").innerHTML = `
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

loadClassmates();

