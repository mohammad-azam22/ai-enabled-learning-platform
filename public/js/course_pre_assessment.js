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

window.onload = async function () {

    const studentId = window.location.href.split("=")[1];
    await fetch(`/student/${studentId}/data`)
        .then(response => response.json())
        .then(response => {
            console.log("Student", response);
            document.getElementById("profile").querySelector("text").innerHTML = response.name.at(0);
            document.getElementById("profile").querySelector("circle").style.fill = getRandomColor(document.getElementById("profile").querySelector("circle + text").innerHTML);
        })
        .catch(error => console.error(error));

    courseId = window.location.href.split('/').pop().split('?')[0];
    await fetch(`/course/${courseId}/generate_pre_assessment`)
        .then(response => response.json())
        .then(response => {
            console.log(response);
            document.getElementById("pre-assessment-form").innerHTML = "";
            for (let i = 0; i < response.questions.length; i++) {
                document.getElementById("pre-assessment-form").innerHTML += `
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
                    </fieldset>
                    <br>
                `;
                const fieldset = document.querySelectorAll(`#pre-assessment-form fieldset`)[i];
                fieldset.querySelectorAll(`label`)[0].innerHTML = response.questions[i].A;
                fieldset.querySelectorAll(`input`)[0].value = response.questions[i].A;
                fieldset.querySelectorAll(`label`)[1].innerHTML = response.questions[i].B;
                fieldset.querySelectorAll(`input`)[1].value = response.questions[i].B;
                fieldset.querySelectorAll(`label`)[2].innerHTML = response.questions[i].C;
                fieldset.querySelectorAll(`input`)[2].value = response.questions[i].C;
                fieldset.querySelectorAll(`label`)[3].innerHTML = response.questions[i].D;
                fieldset.querySelectorAll(`input`)[3].value = response.questions[i].D;
            }
            document.getElementById("pre-assessment-form").innerHTML += `<button id="submit-assessment" type="submit">Submit</button>`;

        })
        .catch(error => console.error(error));
}

document.getElementById("pre-assessment-form").addEventListener("submit", (e) => {
    e.preventDefault();

    document.getElementById("submit-assessment").setAttribute("disabled", true);
    const loading = document.createElement("div");
    loading.innerHTML = `
        <p>Evaluating Assessment. Please Wait. Estimated Time: 2 Minutes</p>
        <div class="loader"style="margin-bottom: 2rem;">
            <div class="loaderBar"></div>
        </div>
    `;
    document.querySelector("#pre-assessment-form").appendChild(loading);

    data = [];
    for (const element of e.target.querySelectorAll("fieldset")) {
        const quesObject = {};
        quesObject.question = element.querySelector("p").innerText;
        quesObject.A = element.querySelectorAll('input')[0].value;
        quesObject.B = element.querySelectorAll('input')[1].value;
        quesObject.C = element.querySelectorAll('input')[2].value;
        quesObject.D = element.querySelectorAll('input')[3].value;
        quesObject.response = element.querySelectorAll('input')[0] == element.querySelector('input:checked') ? 'A' :
            element.querySelectorAll('input')[1] == element.querySelector('input:checked') ? 'B' :
                element.querySelectorAll('input')[2] == element.querySelector('input:checked') ? 'C' :
                    'D';
        data.push(quesObject);
    }

    const studentId = window.location.href.split("=")[1];
    const courseId = window.location.href.split("/")[4];
    fetch(`/student/${studentId}/pre_assessment`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: data, courseId: courseId, studentId: studentId })
    })
        .then(response => response.json())
        .then(response => {
            console.log(response);
            window.location.href = `/course/${courseId}/learn?referrer=${studentId}`;
        })
        .catch(error => console.error(error));
});