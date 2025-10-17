function getRandomColor(char) {
    char = char.toUpperCase();
    if (['A', 'G', 'N', 'U'].includes(char)) {
        return 'green';
    }
    else if (['B', 'H', 'O', 'V'].includes(char)) {
        return 'blue';
    }
    else if (['C', 'I', 'P', 'W'].includes(char)) {
        return 'red';
    }
    else if (['D', 'J', 'Q', 'X'].includes(char)) {
        return 'orange'
    }
    else if (['E', 'K', 'R', 'Y'].includes(char)) {
        return 'pink';
    }
    else {
        return 'purple';
    }
}

// function to attach event listener to an element
function attachEventListener(element, event, eventListener) {
    element.addEventListener(event, eventListener);
}

window.onload = async function () {

    const courseId = window.location.pathname.split("/")[2];
    await fetch(`/course/${courseId}/data`)
        .then(response => response.json())
        .then(response => {
            console.log(response);
            document.querySelector("title").innerText += response.title;
            for (unit of response.units) {
                const unitButton = document.createElement("button");
                unitButton.setAttribute("class", "panel-btn");
                unitButton.setAttribute("data-unit-order", unit.order);
                unitButton.innerText = unit.title;
                document.querySelector(".content .left .accordion").appendChild(unitButton);

                const panel = document.createElement("div");
                panel.setAttribute("class", "panel");
                for (lesson of unit.lessons) {
                    const resourceButton = document.createElement("button");
                    resourceButton.setAttribute("class", "resource-btn");
                    resourceButton.setAttribute("data-resource-order", lesson.order);
                    resourceButton.setAttribute("onclick", `show_content(${unit.order}, ${lesson.order})`);
                    resourceButton.innerText = lesson.title;
                    panel.appendChild(resourceButton);
                }
                const resourceButton = document.createElement("button");
                resourceButton.setAttribute("class", "resource-btn");
                resourceButton.setAttribute("onclick", `show_declaration(${unit.order})`);
                resourceButton.innerText = "Unit Assessment";
                panel.appendChild(resourceButton);
                document.querySelector(".content .left .accordion").appendChild(panel);    // adding panel to accordion
            }
            const form = document.createElement("form");
            form.setAttribute("id", "content-query-form");
            form.setAttribute("onsubmit", "submit_content_query(event)")
            const div = document.createElement("div");
            div.setAttribute("id", "query-response-text");
            form.innerHTML = `
                <label for="query">Query</label>
                <input name="query" id="query" placeholder="Write your question here..." required>
            `;
            form.appendChild(div);
            document.querySelector(".content .left .accordion").appendChild(form);
        })
        .catch(error => console.error(error));

    const studentId = window.location.href.split("=")[1];
    await fetch(`/student/${studentId}/data`)
        .then(response => response.json())
        .then(response => {
            console.log("Student", response);
            document.getElementById("profile").querySelector("text").innerHTML = response.name.at(0);
            document.getElementById("profile").querySelector("circle").style.fill = getRandomColor(document.getElementById("profile").querySelector("circle + text").innerHTML);
            for (let course of response.enrolledCourses) {
                if (course.courseId === courseId) {
                    for (let lesson of course.lessonsCompleted) {
                        document.querySelector(`.content .left .accordion [data-unit-order='${lesson.unitOrder}']+.panel>[data-resource-order='${lesson.lessonOrder}']`).innerHTML += `
                            <img src="/images/checked.png" alt="Completed">
                        `;
                    }
                    break;
                }
            }
        })
        .catch(error => console.error(error));
}

$('.content-div').hide();
function show_content(unitOrder, lessonOrder) {

    document.querySelector(".right").innerHTML = '';
    const contentDiv = document.createElement("div");
    contentDiv.setAttribute("class", "content-div");
    contentDiv.setAttribute("data-for-unit", unitOrder);
    contentDiv.setAttribute("data-for-lesson", lessonOrder);
    document.querySelector(".right").appendChild(contentDiv);

    const courseId = window.location.pathname.split("/")[2];
    fetch(`/course/${courseId}/data`)
        .then(response => response.json())
        .then(response => {
            console.log(response);
            for (content of response.units[unitOrder - 1].lessons[lessonOrder - 1].content) {
                if (content.includes("</video-link>")) {
                    const iframe = document.createElement("iframe");
                    const videoId = new DOMParser().parseFromString(content, "text/html").body.innerText.split("/")[3];
                    iframe.setAttribute("src", `https://www.youtube.com/embed/${videoId}`);
                    iframe.setAttribute("allowfullscreen", 'true');
                    document.querySelector(`.content-div[data-for-unit='${unitOrder}'][data-for-lesson='${lessonOrder}']`).appendChild(iframe);
                }
                else {
                    const container = document.createElement('div');
                    const quill = new Quill(container, {
                        theme: 'snow'
                    });
                    quill.root.innerHTML = content;
                    quill.enable(false);
                    document.querySelector(`.content-div[data-for-unit='${unitOrder}'][data-for-lesson='${lessonOrder}']`).appendChild(container);
                }
            }
            const controls = document.createElement("div");
            controls.setAttribute("class", "controls");
            const prev = document.createElement("button");
            prev.setAttribute("id", "prev");
            prev.setAttribute("onclick", "prev(event)");
            prev.innerText = "<<Previous";
            const markCompleted = document.createElement("button");
            markCompleted.setAttribute("id", "mark-completed");
            markCompleted.setAttribute("onclick", "mark_completed(event)")
            if (document.querySelector(`.content .left .accordion [data-unit-order='${unitOrder}']+.panel>[data-resource-order='${lessonOrder}']`).querySelector("img")) {
                markCompleted.setAttribute("disabled", true)
            }
            markCompleted.innerText = "Mark completed";
            const next = document.createElement("button");
            next.setAttribute("id", "next");
            next.setAttribute("onclick", "next(event)");
            next.innerText = "Next>>";
            controls.appendChild(prev);
            controls.appendChild(markCompleted);
            controls.appendChild(next);
            document.querySelector(`.content-div[data-for-unit='${unitOrder}'][data-for-lesson='${lessonOrder}']`).appendChild(controls);
        })
}

function submit_content_query(event) {
    event.preventDefault();

    if (document.querySelector(".content .right .content-div form")) {
        document.getElementById("query-response-text").innerHTML = "<p>You cannot utilize this functionality while your assessment is in progress.</p>"
        return;
    }

    const query = event.target.query.value;

    document.getElementById("query-response-text").innerHTML = "<p>Thinking...</p>"

    const courseId = window.location.pathname.split("/")[2];
    fetch(`/course/${courseId}/query`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: query })
    })
        .then(response => response.json())
        .then(response => {
            console.log(response);

            if (response.answer.content) {
                document.getElementById("query-response-text").innerHTML = response.answer.content.split("---")[0];
                if (response.sources.length) {
                    document.getElementById("query-response-text").innerHTML += `<br><p>Reference:</p><p>${response.sources[0]}</p>`;
                }
            }
            else {
                document.getElementById("query-response-text").innerHTML = "<p>I can't answer that as it seems unrelated to the course content.</p>";
            }
        })
        .catch(error => console.error(error));
}

function show_declaration(unit_order) {
    document.querySelector(".right").innerHTML = '';
    const contentDiv = document.createElement("div");
    contentDiv.setAttribute("class", "content-div");
    document.querySelector(".right").appendChild(contentDiv);

    contentDiv.innerHTML = `
        <h1>Cognito Learn's Code of Honour</h1>    
        <p>As a student at <strong>Cognito Learn</strong>, I acknowledge the importance of integrity and honesty in my academic pursuits. By accepting this Code of Honour, I commit to the following principles during the administration of tests, examinations, and all assessments:</p>
        <br>
        <p><strong>Commitment to Honesty:</strong> I will approach all assessments with honesty and integrity, understanding that my efforts reflect not only my capabilities but also my character.</p>
        <p><strong>No Cheating:</strong> I will not engage in any form of cheating, including but not limited to, using unauthorized resources, copying from others, or receiving help from outside sources during the test.<p>
        <p><strong>Respect for Rules:</strong> I will adhere to all exam rules and instructions. This includes not using any external source of information during examination.</p>
        <p><strong>Personal Integrity:</strong> I recognize that my actions reflect my values, and I will act in a manner that aligns with the principles of honesty, respect, and fairness.</p>
        <p><strong>Accountability:</strong> I understand that upholding this Code of Honour is my responsibility.</p>
        <br>
        <p>I pledge that I will uphold these principles and conduct myself with integrity throughout my academic journey. By proceeding further, I affirm my commitment to this Code of Honour.</p>
        <button onclick="show_assessment(${unit_order})">Proceed</button>
    `;

}

function show_assessment(unit_order) {
    document.querySelector(".right").innerHTML = '';
    const contentDiv = document.createElement("div");
    contentDiv.setAttribute("class", "content-div");
    document.querySelector(".right").appendChild(contentDiv);

    contentDiv.innerHTML = `
        <h1>Unit Assessment</h1>
        <p>Generating Assessment. Please wait. Estimated Time: 1 Minute</p>
        <div class="loader">
            <div class="loaderBar"></div>
        </div>
    `;
    const courseId = window.location.pathname.split("/")[2];
    fetch(`/course/${courseId}/generate_assessment?unit_order=${unit_order}`)
        .then(response => response.json())
        .then(response => {
            console.log(response);
            contentDiv.innerHTML = `
                <h1>Unit Assessment</h1>
                <form id="assessment-unit-${unit_order}"></form>
            `;
            for (let i = 0; i < response.questions.length; i++) {
                document.getElementById(`assessment-unit-${unit_order}`).innerHTML += `
                    <fieldset>
                        <legend>Question ${i + 1}</legend>
                        <p>${response.questions[i].question_statement}</p>
                        <input type="radio" id="q${i + 1}o1" name="q${i + 1}" required>
                        <label for="q${i + 1}o1"></label><br>
                        <input type="radio" id="q${i + 1}o2" name="q${i + 1}" required>
                        <label for="q${i + 1}o2"></label><br>
                        <input type="radio" id="q${i + 1}o3" name="q${i + 1}" required>
                        <label for="q${i + 1}o3"></label><br>
                        <input type="radio" id="q${i + 1}o4" name="q${i + 1}" required>
                        <label for="q${i + 1}o4"></label><br>
                        ${response.questions[i].E ?
                        `<input type="radio" id="q${i + 1}o5" name="q${i + 1}" required>
                            <label for="q${i + 1}o5"></label><br>` : ""}
                        ${response.questions[i].F ?
                        `<input type="radio" id="q${i + 1}o6" name="q${i + 1}" required>
                            <label for="q${i + 1}o6"></label><br>` : ""}
                    </fieldset>
                    <br>
                `;
                const fieldset = document.querySelectorAll(`#assessment-unit-${unit_order} fieldset`)[i];
                fieldset.querySelectorAll(`label`)[0].innerHTML = response.questions[i].A;
                fieldset.querySelectorAll(`input`)[0].value = response.questions[i].A;
                fieldset.querySelectorAll(`label`)[1].innerHTML = response.questions[i].B;
                fieldset.querySelectorAll(`input`)[1].value = response.questions[i].B;
                fieldset.querySelectorAll(`label`)[2].innerHTML = response.questions[i].C;
                fieldset.querySelectorAll(`input`)[2].value = response.questions[i].C;
                fieldset.querySelectorAll(`label`)[3].innerHTML = response.questions[i].D;
                fieldset.querySelectorAll(`input`)[3].value = response.questions[i].D;
                if (fieldset.querySelectorAll(`label`)[4]) {
                    fieldset.querySelectorAll(`label`)[4].innerHTML = response.questions[i].E;
                    fieldset.querySelectorAll(`input`)[4].value = response.questions[i].E;
                }
                if (fieldset.querySelectorAll(`label`)[5]) {
                    fieldset.querySelectorAll(`label`)[5].innerHTML = response.questions[i].F;
                    fieldset.querySelectorAll(`input`)[5].value = response.questions[i].F;
                }
            }
            document.getElementById(`assessment-unit-${unit_order}`).innerHTML += `<button type="button" id="submit-assessment" onclick="submit_assessment(${unit_order})">Submit</button>`;
        })
        .catch(error => console.error(error));
}

function submit_assessment(unit_order) {
    document.getElementById("submit-assessment").setAttribute("disabled", true);
    const loading = document.createElement("div");
    loading.innerHTML = `
        <p>Evaluating Assessment. Please Wait...</p>
        <div class="loader">
            <div class="loaderBar"></div>
        </div>
    `;
    document.querySelector(".content-div").appendChild(loading);
    const form = document.getElementById(`assessment-unit-${unit_order}`);
    data = [];
    for (const element of form.querySelectorAll("fieldset")) {
        const quesObject = {};
        quesObject.question = element.querySelector("p").innerText + " " + (element.querySelector("pre") ?
            element.querySelector("pre").innerText : "");
        quesObject.A = element.querySelectorAll('input')[0].value;
        quesObject.B = element.querySelectorAll('input')[1].value;
        quesObject.C = element.querySelectorAll('input')[2].value;
        quesObject.D = element.querySelectorAll('input')[3].value;
        if (element.querySelectorAll('input')[4]) quesObject.E = element.querySelectorAll('input')[4].value;
        if (element.querySelectorAll('input')[5]) quesObject.F = element.querySelectorAll('input')[5].value;

        if (element.querySelectorAll('input')[0] == element.querySelector('input:checked')) quesObject.response = 'A';
        else if (element.querySelectorAll('input')[1] == element.querySelector('input:checked')) quesObject.response = 'B';
        else if (element.querySelectorAll('input')[2] == element.querySelector('input:checked')) quesObject.response = 'C';
        else if (element.querySelectorAll('input')[3] == element.querySelector('input:checked')) quesObject.response = 'D';
        else if (element.querySelectorAll('input')[4] && element.querySelectorAll('input')[4] == element.querySelector('input:checked')) quesObject.response = 'E';
        else if (element.querySelectorAll('input')[5] && element.querySelectorAll('input')[5] == element.querySelector('input:checked')) quesObject.response = 'F';
        else quesObject.response = 'Z';
        data.push(quesObject);
    }

    const studentId = window.location.href.split("=")[1];
    const courseId = window.location.href.split("/")[4];
    fetch(`/student/${studentId}/assessment`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: data, courseId: courseId, studentId: studentId, unit_order: unit_order })
    })
        .then(response => response.json())
        .then(response => {
            loading.remove();
            console.log(response);
            for (let i = 0; i < response.correctAnswers.length; i++) {
                const element = document.getElementById(`assessment-unit-${unit_order}`).querySelectorAll("fieldset")[i];
                const answer = document.createElement("p");
                answer.style.fontWeight = "600";

                element.querySelectorAll('input')[0].setAttribute("disabled", true);
                element.querySelectorAll('input')[1].setAttribute("disabled", true);
                element.querySelectorAll('input')[2].setAttribute("disabled", true);
                element.querySelectorAll('input')[3].setAttribute("disabled", true);
                if (element.querySelectorAll('input')[4]) element.querySelectorAll('input')[4].setAttribute("disabled", true);
                if (element.querySelectorAll('input')[5]) element.querySelectorAll('input')[5].setAttribute("disabled", true);

                if ((element.querySelectorAll('input')[0] == element.querySelector('input:checked') && response.correctAnswers[i] == 'A') ||
                    (element.querySelectorAll('input')[1] == element.querySelector('input:checked') && response.correctAnswers[i] == 'B') ||
                    (element.querySelectorAll('input')[2] == element.querySelector('input:checked') && response.correctAnswers[i] == 'C') ||
                    (element.querySelectorAll('input')[3] == element.querySelector('input:checked') && response.correctAnswers[i] == 'D') ||
                    (element.querySelectorAll('input')[4] && element.querySelectorAll('input')[4] == element.querySelector('input:checked') && response.correctAnswers[i] == 'E') ||
                    (element.querySelectorAll('input')[5] && element.querySelectorAll('input')[5] == element.querySelector('input:checked') && response.correctAnswers[i] == 'F')) {
                    element.style.backgroundColor = '#E3FFE5';
                    answer.style.color = "green";
                    answer.innerText = `Your answer is correct!`;
                }
                else {
                    element.style.backgroundColor = '#FFE6E8';
                    answer.style.color = "red";
                    answer.innerText = `Your answer is incorrect! Correct Answer is ${response.correctAnswers[i]}`;
                }
                element.appendChild(answer);
            }
        })
        .catch(error => console.error(error));
}

function prev(e) {
    const unitNum = parseInt(e.target.parentNode.parentNode.getAttribute("data-for-unit"));
    const lessonNum = parseInt(e.target.parentNode.parentNode.getAttribute("data-for-lesson"));
    if (lessonNum > 1) {
        document.querySelector(`.panel-btn[data-unit-order='${unitNum}']+.panel>[data-resource-order='${lessonNum - 1}']`).click();
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    }
    else if (unitNum > 1) {
        document.querySelector(`.panel-btn[data-unit-order='${unitNum - 1}']+.panel`).lastChild.click();
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    }
}

function next(e) {
    const unitNum = parseInt(e.target.parentNode.parentNode.getAttribute("data-for-unit"));
    const lessonNum = parseInt(e.target.parentNode.parentNode.getAttribute("data-for-lesson"));
    if (document.querySelector(`.panel-btn[data-unit-order='${unitNum}']+.panel>[data-resource-order='${lessonNum + 1}']`)) {
        document.querySelector(`.panel-btn[data-unit-order='${unitNum}']+.panel>[data-resource-order='${lessonNum + 1}']`).click();
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    }
    else if (document.querySelector(`.panel-btn[data-unit-order='${unitNum + 1}']+.panel`)) {
        document.querySelector(`.panel-btn[data-unit-order='${unitNum + 1}']+.panel`).firstChild.click();
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    }
}

async function mark_completed(e) {
    const unitNum = parseInt(e.target.parentNode.parentNode.getAttribute("data-for-unit"));
    const lessonNum = parseInt(e.target.parentNode.parentNode.getAttribute("data-for-lesson"));

    const courseId = window.location.pathname.split("/")[2];
    const studentId = window.location.href.split("=")[1];
    fetch(`/student/${studentId}/mark_lesson`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ course_id: courseId, unit_num: unitNum, lesson_num: lessonNum })
    })
        .then(response => response.json())
        .then(response => {
            console.log(response);

            if (!document.querySelector(`.panel-btn[data-unit-order='${unitNum}']+.panel>[data-resource-order='${lessonNum}']`).querySelector("img")) {
                e.target.setAttribute("disabled", "true");
                document.querySelector(`.panel-btn[data-unit-order='${unitNum}']+.panel>[data-resource-order='${lessonNum}']`).innerHTML += `
                    <img src="/images/checked.png" alt="Completed">
                `;
            }
        })
        .catch(error => console.error(error));

}

