'use strict';
import {parse} from "https://www.unpkg.com/csv-parse@5.5.3/dist/esm/sync.js";
import { parseSheet } from "./parse-sheet.js";
import {weeklyReportHTML, summaryReportHTML} from "./templates.js";

import {setDataToUrl, getDataFromUrl} from "./storage.js";

function setUp(){
  const students = getDataFromUrl();
  if(students) {
    displayStudentList(students);
  }
}
setUp();

function processData() {
  const rawData = document.getElementById('courseData').value;
  const input = rawData;
  const options = {delimiter: "\t"};
  const data = parse(input, options);
  const students = parseSheet(data);

  console.log(students);

  setDataToUrl(students);
  displayStudentList(students);
}

function displayStudentList(students) {
  const studentListDiv = document.getElementById('studentList');
  studentListDiv.innerHTML = '';

  students.forEach((student) => {
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-secondary', 'm-2');
    button.innerText = student.studentName;

    button.onclick = () => {
      toggleStudentList();
      return displayStudentSummary(student);
    };
    studentListDiv.appendChild(button);
  });
}

function displayStudentSummary(student) {
  console.log("displayStudentSummary");
  const summaryDiv = document.getElementById('studentSummary');
  let html = '';
  html += `
        <div class="container">
            <h2 class="mt-4">${student.studentName}</h2>
            <p>Email: ${student.studentEmail}</p>
            <div class="row">`;
  student.weeklyReports.forEach((report) => {
    // Render the course card
    const weeklyReport = weeklyReportHTML(report);
    html += weeklyReport;
  });
  const summaryReport = summaryReportHTML(student);
  console.log(summaryReport);
  console.log(summaryDiv);
  html += summaryReport;
  html += `</div>`;
  summaryDiv.innerHTML = html;
  summaryDiv.style.display = 'block';
}

function toggleStudentList() {
  const studentListDiv = document.getElementById('studentList');
  const toggleButton = document.getElementById('toggleStudentsButton');
  if (studentListDiv.style.display === 'none') {
    studentListDiv.style.display = 'flex';
    toggleButton.textContent = 'Hide Students';
  } else {
    studentListDiv.style.display = 'none';
    toggleButton.textContent = 'Show Students';
  }
}

// Add the event listener to the toggle button
document
  .getElementById('toggleStudentsButton')
  .addEventListener('click', toggleStudentList);

// Add the event listener to the process button
document
  .getElementById('processDataButton')
  .addEventListener('click', processData);
