const mainAccordion = document.getElementById("main-accordion");
mainAccordion.querySelectorAll(".panel-btn").forEach(button => {
    attachEventListener(button, "click", accordion);
});

window.onload = function () {
    const courseId = window.location.pathname.split("/")[2];
    fetch(`/course/${courseId}/data`)
        .then(response => response.json())
        .then(async response => {
            console.log(response);

            fetch(`/instructor/${response.instructor}/data`)
                .then(response => response.json())
                .then(response => document.getElementById("instructor").value = response.name)
                .catch(error => console.error(error));

            document.getElementById("title").value = response.title;
            document.getElementById("poster").value = response.poster;
            document.getElementById("difficulty").value = response.difficulty;
            document.getElementById("price").value = response.price;
            document.getElementById("tags").value = response.tags.join(", ");
            document.getElementById("description").value = response.description;

            const numUnits = response.units.length;
            for (let i = 1; i <= numUnits; i++) {
                const unit = response.units[i - 1];

                document.getElementById("add-unit-btn").click();

                const unitDetailsForm = document.querySelector(`#unit-details[data-for-unit="${i}"]`);
                unitDetailsForm.querySelector("#unit-name").value = unit.title;
                unitDetailsForm.querySelector("#unit-desc").value = unit.description;

                const numResources = response.units[i - 1].lessons.length;
                for (let j = 1; j <= numResources; j++) {
                    const resourceNameForm = document.querySelector(`#resource-name-form[data-for-unit="${i}"]`);
                    resourceNameForm.querySelector("#resource-name").value = response.units[i - 1].lessons[j - 1].title;
                    resourceNameForm.querySelector("#resource-name-form-btn").click();

                    for (content of response.units[i - 1].lessons[j - 1].content) {
                        if (content.includes("</video-link>")) {
                            const videoLink = document.createElement("div");
                            videoLink.setAttribute("class", "video-link");
                            videoLink.innerHTML = `
                                <form class="video-link-form">
                                    <label for="video-link">Video Link</label>
                                    <input class="video-link" name="video-link" placeholder="YouTube video link" value=${new DOMParser().parseFromString(content, "text/html").body.innerText}>
                                </form>
                            `;
                            document.querySelector(`.editors[data-for-unit="${i}"][data-for-resource="${j}"]`).appendChild(videoLink);
                        }
                        else {
                            await new Promise((resolve, reject) => {
                                const numEditors = document.querySelectorAll(`.editors[data-for-unit="${i}"][data-for-resource="${j}"] .ql-editor`).length;
                                document.querySelector(`.resource-buttons[data-for-unit="${i}"][data-for-resource="${j}"] #add-article-btn`).click();
                                resolve(numEditors);
                            })
                                .then((numEditors) => {
                                    const editors = document.querySelectorAll(`.editors[data-for-unit="${i}"][data-for-resource="${j}"] .ql-editor`);
                                    editors[numEditors].innerHTML = content;
                                });
                        }
                    }
                }
            }

            for (faq of response.faqs) {
                document.getElementById("add-question").click();
                const faqForm = document.getElementsByClassName("course-faqs-form")[document.getElementsByClassName("course-faqs-form").length - 1];
                faqForm.querySelector("input").value = faq.question;
                faqForm.querySelector("textarea").value = faq.answer;
            }
        })
        .catch(error => console.error(error));
}

// function to attach event listener to an element
function attachEventListener(element, event, eventListener) {
    element.addEventListener(event, eventListener);
}

// function to make an accoridon
$('.panel').hide();    // to initially hide all the panels
function accordion(event) {
    event.preventDefault();
    const nextPanel = $(event.target).next('.panel');
    $('#content-accordion>.panel').each(panel => {
        if (panel !== nextPanel[0]) {
            $(panel).slideUp(300, 'swing');
        }
    });
    $(nextPanel).slideToggle(300, 'swing');
}

// function to add a unit
document.getElementById("add-unit-btn").addEventListener("click", (e) => {
    e.preventDefault();

    const numUnits = document.getElementById("course-content-panel").querySelector(".top>.units").children.length;
    document.getElementById("course-content-panel").querySelector(".top>.units").innerHTML += `
        <button data-unit-order=${numUnits + 1} onclick=show_controls(${numUnits + 1})>Unit ${numUnits + 1}</button>
    `;

    const unit_form = document.createElement("form");
    unit_form.setAttribute("id", "unit-details");
    unit_form.setAttribute("class", "unit-details");
    unit_form.setAttribute("data-for-unit", numUnits + 1);
    unit_form.innerHTML = `
        <label for="unit-name">Unit Name</label>
        <input type="text" name="unit-name" id="unit-name" placeholder="Unit Name...">
        <label for="unit-desc">Unit Description</label>
        <textarea name="unit-desc" id="unit-desc" placeholder="Unit Description..."></textarea>
    `;
    const resources_div = document.createElement("div");
    resources_div.setAttribute("class", "resources");
    resources_div.setAttribute("data-for-unit", numUnits + 1);

    const resource_form = document.createElement("form");
    resource_form.setAttribute("id", "resource-name-form");
    resource_form.setAttribute("class", "resource-name-form");
    resource_form.setAttribute("data-for-unit", numUnits + 1);
    resource_form.innerHTML = `
        <label for="resource-name">Resource Name</label>
        <input type="text" name="resource-name" id="resource-name" class="resource-name" minlength="1"
            maxlength="100" placeholder="Resource Name..." required>
        <button type="submit" id="resource-name-form-btn"><img src="/images/add.png"
                alt="Add resource"></button>
    `;
    attachEventListener(resource_form, "submit", add_resource);

    document.getElementById("course-content-panel").querySelector(".left").appendChild(unit_form);
    document.getElementById("course-content-panel").querySelector(".left").appendChild(resources_div);
    document.getElementById("course-content-panel").querySelector(".left").appendChild(resource_form);

    $(`[data-for-unit=${numUnits + 1}]`).hide();
});

// function to show coutrols to add resource in a unit
function show_controls(unit_order) {
    if ($(`[data-for-unit=${unit_order}]`).css('display') == 'none') {
        $('.unit-details').hide(300, "swing");
        $('.resources').hide(300, "swing");
        $('.editors').hide(300, "swing");
        $('.resource-buttons').hide(300, "swing");
        $(`.resource-name-form`).hide(300, "swing", () => {
            $(`.left [data-for-unit=${unit_order}]`).show(300, "swing");
        });
    }
}

// function to add a resource
function add_resource(event) {
    event.preventDefault();

    const resourceButton = document.createElement("div");
    resourceButton.setAttribute("class", "resource-button");
    resourceButton.setAttribute("data-resource-order", event.target.previousElementSibling.children.length + 1);
    resourceButton.setAttribute("onclick", `show_editor(${event.target.getAttribute("data-for-unit")}, ${event.target.previousElementSibling.children.length + 1})`);
    resourceButton.innerHTML = `
        <div class="text">
            <span>${event.target["resource-name"].value}</span>
        </div>
    `;

    event.target.previousElementSibling.appendChild(resourceButton);

    const editors = document.createElement("div");
    editors.setAttribute("class", "editors");
    editors.setAttribute("data-for-unit", event.target.getAttribute("data-for-unit"));
    editors.setAttribute("data-for-resource", event.target.previousElementSibling.children.length);

    const buttons = document.createElement("div");
    buttons.setAttribute("class", "resource-buttons");
    buttons.setAttribute("data-for-unit", event.target.getAttribute("data-for-unit"));
    buttons.setAttribute("data-for-resource", event.target.previousElementSibling.children.length);
    buttons.innerHTML = `
        <button id="add-article-btn" onclick="add_article(this)">Add Article</button>
        <button id="add-video-btn" onclick="add_video(this)">Add Video</button>
        <button id="delete-resource-btn" onclick="delete_resource(this)" id="delete-resource-btn">Delete Resource</button>
    `;

    const rightDiv = document.getElementById("course-content-panel").querySelector(".bottom .right")
    rightDiv.appendChild(editors);
    rightDiv.appendChild(buttons);

    $(editors).hide();
    $(buttons).hide();

    event.target["resource-name"].value = "";
}

function show_editor(for_unit, for_resource) {
    if ($(`[data-for-unit=${for_unit}][data-for-resource=${for_resource}]`).css('display') == 'none') {
        $(`.editors`).slideUp(300, "swing");
        $(`.resource-buttons`).slideUp(300, "swing", () => {
            $(`[data-for-unit=${for_unit}][data-for-resource=${for_resource}]`).slideDown(300, "swing");
        });
    }
}

// to add article
function add_article(button) {
    const editor = document.createElement("div");
    editor.classList.add("editor");
    button.parentNode.previousElementSibling.appendChild(editor);
    initialize_editor(editor);
}

// to add video
function add_video(button) {
    const videoDiv = document.createElement("div");
    videoDiv.classList.add("video-link");
    videoDiv.innerHTML = `
        <form class="video-link-form">
            <label for="video-link">Video Link</label>
            <input class="video-link" name="video-link" placeholder="YouTube video link">
        </form>
    `;
    button.parentNode.previousElementSibling.appendChild(videoDiv);
}

// to delete lesson
function delete_resource(button) {

}

// function to add FAQ
function add_faq() {

    const faq_form = document.createElement("form");
    faq_form.setAttribute("class", "course-faqs-form");

    faq_form.innerHTML = `
        <fieldset>
            <label for="question">Question</label>
            <input type="text" name="question" placeholder="Question..." required>
            <label for="answer">Answer</label>
            <textarea name="answer" placeholder="Answer..." required></textarea>
        </fieldset>
        <button type="button" onclick=delete_faq(this)><img src="/images/bin.png" alt="Delete question"></button>
    `;

    document.getElementById("course-faqs-panel").insertBefore(faq_form, document.getElementById("add-question"));
}

function delete_faq(button) {
    button.parentNode.remove();
}

// function to discard changes
function go_back() {
    history.back();
}

// function to save progress
async function update_course() {

    const title = document.getElementById("title").value;
    const poster = document.getElementById("poster").value;
    const difficulty = document.getElementById("difficulty").value;
    const price = document.getElementById("price").value;
    const tags = document.getElementById("tags").value.split(",").map(tag => {
        return (tag.trim().toLowerCase());
    });

    console.log("Tags: ",tags);
    const description = document.getElementById("description").value;

    if (!title || !poster || !price || !description) return;
    const units = [];
    const numUnits = document.querySelector("#course-content-panel .units").children.length;

    for (let i = 1; i <= numUnits; i++) {
        unitContent = {};

        unitContent.title = document.querySelector(`[data-for-unit="${i}"] #unit-name`).value;
        unitContent.description = document.querySelector(`[data-for-unit="${i}"] #unit-desc`).value;
        unitContent.order = i;

        const resources = [];
        [...document.querySelector(`.resources[data-for-unit="${i}"]`).children].forEach(resource => {
            resourceContent = {};
            resourceContent.title = resource.querySelector('span').innerText.trim();
            resourceContent.order = resource.getAttribute("data-resource-order");

            const data = [...document.querySelector(`.right>[data-for-unit="${i}"][data-for-resource="${resourceContent.order}"]`).children].filter(item => {
                return !item.classList.contains("ql-toolbar");
            });
            const content = [];
            for (let datum of data) {
                if (datum.classList.contains("editor")) {
                    if (datum.querySelector(".ql-editor").innerHTML === "") return;
                    content.push(datum.querySelector(".ql-editor").innerHTML)
                }
                else {
                    if (datum.querySelector("input").value === "") return;
                    content.push(`<video-link>${datum.querySelector("input").value}</video-link>`);
                }
            }
            resourceContent.content = content;
            resources.push(resourceContent);
            console.log(resourceContent);
        });
        unitContent.lessons = resources;
        units.push(unitContent);
    }

    const numQuestions = document.getElementById("course-faqs-panel").children.length - 1;
    const faqs = []
    for (let i = 0; i < numQuestions; i++) {
        const question = document.getElementById("course-faqs-panel").children[i].querySelector("input").value;
        const answer = document.getElementById("course-faqs-panel").children[i].querySelector("textarea").value;
        if (!question || !answer) return;
        faqs.push({
            question: question,
            answer: answer
        });
    }

    const courseData = {
        title: title,
        poster: poster,
        difficulty: difficulty,
        price: price,
        tags: tags,
        description: description,
        units: units,
        faqs: faqs
    };

    const courseId = window.location.pathname.split('/')[2]; // Get the course ID from the URL
    
    fetch(`/course/${courseId}/data`)
        .then(response => response.json())
        .then(async response => {
            console.log(response);
            courseData.instructor = response.instructor;
        })
        .catch(error => console.error(error));

    
    fetch(`/course/${courseId}`, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(courseData)
    })
        .then(response => {
            return response.json();
        })
        .then(response => {
            console.log(response);
            alert("Course has been updated!");
            window.location.reload();
        })
        .catch(error => {
            console.error(error);
        })
}

function publish_course(published) {
    const courseId = window.location.pathname.split('/')[2]; // Get the course ID from the URL
    
    const loading = document.createElement("div");
    loading.innerHTML = `
        <p>Publishing Course. Please Wait. Estimated time: 2 mins.</p>
        <div class="loader">
            <div class="loaderBar"></div>
        </div>
    `;
    document.querySelector("main .content").appendChild(loading);
    
    fetch(`/course/${courseId}`, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ published: published })
    })
        .then(response => {
            return response.json();
        })
        .then(response => {
            loading.remove();
            console.log(response);
            alert("Course has been updated!");
            window.location.reload();
        })
        .catch(error => {
            console.error(error);
        })
}
