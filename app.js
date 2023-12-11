import { getGradeData } from "./api.js";

async function setUp() {
    // get key for api call
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get('key');
    const name = urlParams.get('name');
    // do api call
    let data = await getGradeData(key, name);
    console.log(data);
    const students = data.map(d => new Student(d));

    // Find elms for adding children
    const studentBriefReportsDiv = document.getElementById("student-brief-reports");
    const studentReportsDiv = document.getElementById("student-reports");
    // We can't iterate directly on weeklyData
    // since it's not actually an array.
    // We get around this by keeping a weeklyDataIdxs 
    // :(
    for (const student of students) {
        // create html reports
        const studentReport = new StudentReport(student);
        console.log(studentReport);
        console.log(studentReport.template());
        const html = studentReport.template();
        const elm = document.createElement('div');
        elm.innerHTML = html;
        studentReportsDiv.appendChild(elm);
    }
    for (const student of students) {
        // create html reports
        const studentBriefReport = new StudentBriefReport(student);
        console.log(studentBriefReport);
        console.log(studentBriefReport.template());
        const html = studentBriefReport.template();
        const elm = document.createElement('div');
        elm.innerHTML = html;
        studentBriefReportsDiv.appendChild(elm);
    }


}


// const attendanceRegEx = /^week([1-9]+$)/i;
// const performanceRegEx = /^week([0-9]+)([^0-9].+)$/i;
// function getWeekFromAttendanceHeader(header) {
//     const m = header.match(attendanceRegEx);
//     return parseInt(m[1], 10);
// }
// function getWeekFromPerformanceHeader(header) {
//     const m = header.match(performanceRegEx);
//     return parseInt(m[1], 10);
// }
// function determineWeekHeaders(data) {
//     const example = data[0];
//     const keys = Object.keys(example);
//     const attdKeys = keys.filter(k => attendanceRegEx.test(k));
//     attdKeys.sort((k, j) => getWeekFromAttendanceHeader(k) - getWeekFromAttendanceHeader(j));
//     const perfKeys = keys.filter(k => performanceRegEx.test(k));
//     perfKeys.sort((k, j) => getWeekFromPerformanceHeader(k) - getWeekFromPerformanceHeader(j));
//     return {
//         performanceHeaders: perfKeys,
//         attendanceHeaders: attdKeys
//     };
// }

class AttendanceForWeek {
    static isValid(attendanceHeader, attendenceContent) {
        return /^week([1-9]+$)/i.test(attendanceHeader);
    }
    constructor(attendanceHeader, attendenceContent) {
        const regEx = /^week([1-9]+$)/i;
        const m = attendanceHeader.match(regEx);
        this.catchupEstimate = 0;
        if (m) {
            this.header = m[0];
            this.week = parseInt(m[1], 10);
            const w = attendenceContent.split(" of ");
            if (w.length === 2) {
                this.dayCount = parseInt(w[1], 10);
                this.attended = parseInt(w[0], 10);
                // estimate catch up time
                this.catchupEstimate += (this.dayCount - this.attended) * 180;
            } else {
                console.log("Invalid Attendance data encountered");
            }
        } else {
            console.log("Invalid Week encountered")
        }

    }
}

class PerformanceForWeek {
    static isValid(performanceHeader, performanceData) {
        console.log(`perf: ${performanceHeader}`);
        return /^week([0-9]+)([^0-9].+)$/i.test(performanceHeader);
    }
    constructor(performanceHeader, performanceData) {
        const regEx = /^week([0-9]+)([^0-9].+)$/i;
        const m = performanceHeader.match(regEx);
        this.catchupEstimate = 0;
        if (m) {
            this.topic = m[2];
            console.log(`topic: ${this.topic}`)
            this.week = parseInt(m[1], 10);
            if (/PASS/i.test(performanceData)) {
                this.result = 'PASS';
            } else if (/SOFT FAIL/i.test(performanceData)) {
                this.result = 'SOFT FAIL';
                // estimate catch up time
                this.catchupEstimate += 60;
            } else if (/HARD FAIL/i.test(performanceData)) {
                this.result = 'HARD FAIL';
                // estimate catch up time
                this.catchupEstimate += 180;
            }
            else if(/NOT GRADED/i.test(performanceData)) {
                this.result = 'NOT GRADED';
            } else if (/ of /i.test(performanceData)) {
                const p = performanceData.split(" of ");
                console.log(p);
                if (p.length === 2) {
                    this.result = 'INCOMPLETE';
                    this.assignmentCount = parseInt(p[1], 10);
                    this.completed = parseInt(p[0]);
                    // estimate catch up time
                    this.catchupEstimate += (this.assignmentCount - this.completed) * 60;
                } else {
                    console.log("Invalid Performance data encountered");
                }
            }
        } else {
            console.log("Invalid Performance header encountered");
        }
        console.log(this);
    }
}

class Student {

    constructor(studentData) {
        const sd = studentData;
        this.firstName = sd.firstName;
        this.lastName = sd.lastName;
        this.studentName = sd.studentName;
        this.email = sd.email;
        this.id = sd.id;
        this.weeklyData = {};
        const weeklyDataIdxs = new Set();
        const weekAttendanceData = Student.parseAttendance(sd);
        const weekPerformanceData = Student.parsePerformance(sd);
        // convert arrays to objects
        const attObjs = weekAttendanceData.reduce((acc, n) => (acc[n.week] = n, acc), {})
        const perfObjs = weekPerformanceData.reduce((acc, n) => (acc[n.week] = n, acc), {})
        // merge objects
        for (const k of Object.keys(attObjs)) {
            this.weeklyData[k] = this.weeklyData[k] ? this.weeklyData[k] : {};
            this.weeklyData[k].attendance = attObjs[k];
            this.weeklyData[k].week = attObjs[k].week; // set week
            weeklyDataIdxs.add(this.weeklyData[k].week); // keep track of weeks for our index.
        }
        for (const k of Object.keys(perfObjs)) {
            this.weeklyData[k] = this.weeklyData[k] ? this.weeklyData[k] : {};
            this.weeklyData[k].performance = perfObjs[k];
            this.weeklyData[k].week = perfObjs[k].week; // set week
            weeklyDataIdxs.add(this.weeklyData[k].week); // keep track of weeks for our index.
        }
        this.weeklyDataIdxs = Array.from(weeklyDataIdxs).sort();
        this.initializeSummary();
    }

    static parseAttendance(data) {
        let keys = Object.keys(data);
        const weekRegEx = /^week[1-9]+/i
        let attKeys = keys.filter(k => AttendanceForWeek.isValid(k, data[k]));
        attKeys.sort((a, b) => a.week - b.week);
        return attKeys.map((k) => new AttendanceForWeek(k, data[k]));
    }

    static parsePerformance(data) {
        let keys = Object.keys(data);
        let perfKeys = keys.filter(k => PerformanceForWeek.isValid(k, data[k]));
        perfKeys.sort((a, b) => a.week - b.week);
        console.log(perfKeys);
        return perfKeys.map((k) => new PerformanceForWeek(k, data[k]));
    }

    initializeSummary() {
        this.successfulWeekCount = 0;
        this.totalWeeks = this.weeklyDataIdxs.length;
        this.catchupEstimate = 0;
        for(const week of this.weeklyDataIdxs) {
            const weeklyData = this.weeklyData[week];
            weeklyData.catchupEstimate = 0;
            if(weeklyData.result === 'PASS') {
                this.successfulWeekCount++;
            } else {
                const attdTime = weeklyData?.attendance?.catchupEstimate;
                const perfTime = weeklyData?.performance?.catchupEstimate;
                if(attdTime) {
                    this.catchupEstimate += attdTime;
                    weeklyData.catchupEstimate += attdTime;
                }
                if(perfTime) {
                    this.catchupEstimate += perfTime;
                    weeklyData.catchupEstimate += perfTime;
                }
            }
            console.log(this.catchupEstimate);
        }
    }

}

class StudentBriefReport {
    constructor(student) {
        this.student = student;
    }
    template() {
        const student = this.student;
        return `
            <a href="#student-report-${student.id}">
                <button 
                    class="btn btn-link student-brief-report" 
                    role="button" 
                    id="student-brief-report-${student.id}"
                    data-id="${student.id}"
                    >
                    ${student.studentName}
                     (${Math.round(student.catchupEstimate/60)} hours behind)
                </button>
            </a>
        `;
    }
}

class StudentReport {
    constructor(student) {
        this.student = student;
    }
    template() {
        const student = this.student;
        this.weeklyReports = [];
        for(const weekIdx of student.weeklyDataIdxs) {
            const weekData = student.weeklyData[weekIdx];
            const s = student;
            const wr = {
                student: {firstName: s.firstName, lastName: s.lastName, studentName: s.studentName},
                week: weekIdx,
                ...weekData,
            };
            const report = new WeeklyReport(wr);
            this.weeklyReports.push(report);
        }
        const weeklyReportTemplates = this.weeklyReports.map(wr => wr.template());
        return `
            <div class="container" id="student-report-${student.id}">
                ${weeklyReportTemplates.join("\n")}
            </div>
        `
    }
}

class WeeklyReport {
    constructor({student, attendance, performance, week, catchupEstimate}) {
        this.student = student;
        this.attendance = attendance;
        this.performance = performance;
        this.week = week;
        this.catchupEstimate = catchupEstimate;
    }

    template() {
        const {student, attendance, performance, week, catchupEstimate} = this;
        if(student && attendance && performance && week) {
            const header = `
            Week: ${week}
            ${student.studentName}
        `;
            const body = [
                `Attendance: ${attendance.attended} / ${attendance.dayCount}`,
                `Result: ${performance.result}`
            ];
            if(performance.result === 'INCOMPLETE') {
                body.push(
                    `Progress: ${performance.completed} / ${performance.assignmentCount} assignments completed`
                );
            }
            if(this.catchupEstimate) {
                body.push(`
                    Estimate to catchup this week: ${Math.round(this.catchupEstimate/60)} hours.
                `);
            }
            return cardHTML(header, body);
        } else {
            return `<p>No results for ${student?.studentName}</p>`
        }

    }
}

function cardHTML(header, paragraphs) {
    const body = paragraphs.map(text => `<p class="card-text">${text}</p>`).join("\n");
    return `
        <div class="card">
            <div class="card-header">
                <h1>${header}</h1>
            </div>
            <div class="card-body">
                ${body}
            </div>
        </div>
    `;
}

setUp();