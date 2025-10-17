window.onload = async function () {
    get_tag_courses("all");
    await fetch(`/course/trending`)
    .then(response => response.json())
    .then(response => {
        console.log(response);
        for (let course of response) {
            const card = document.createElement("div");
            card.setAttribute("class", "card");
            card.innerHTML = `
                <div class="top">
                    <img src=${course.poster} alt=${course.title}>
                </div>
                <div class="bottom">
                    <div class="title"><a href="/course/${course._id}" class="link">${course.title}</a></div>
                    <div class="instructor">
                        <span>${course.instructor}</span>
                    </div>
                    <div class="rating">
                        <div class="stars"></div>
                            <span class="score">${course.overall_rating}</span>
                            <span class="reviews">(${course.reviewsCount})</span>
                        </div>
                        <div class="cost">
                            <span>$${course.price}</span>
                        </div>
                    </div>
                </div> 
            `;
            document.querySelector("#trending .cards").appendChild(card);
        }

        
    })
    .catch(error => console.error(error));
}

let currentTagsOffset = 0;
let currentCoursesOffset = 0;
let currentTestimonialsOffset = 0;
const scrollAmount = 300;

function scroll_left(btn) {
    if (btn.parentNode.querySelector("#list")) {
        if (currentCoursesOffset >= 0) return;

        currentCoursesOffset += scrollAmount;

        const list = btn.parentNode.querySelector("#list");
        list.style.transform = `translateX(${currentCoursesOffset}px)`;
    }
    else if (btn.parentNode.querySelector("#tags-list")) {
        if (currentTagsOffset >= 0) return;

        currentTagsOffset += scrollAmount;

        const list = btn.parentNode.querySelector("#tags-list");
        list.style.transform = `translateX(${currentTagsOffset}px)`;
    }
    else {
        if (currentTestimonialsOffset >= 0) return;

        currentTestimonialsOffset += scrollAmount;

        const list = btn.parentNode.querySelector("#testimonials-list");
        list.style.transform = `translateX(${currentTestimonialsOffset}px)`;
    }
}

function scroll_right(btn) {
    if (btn.parentNode.querySelector("#list")) {
        const containerWidth = btn.parentNode.querySelector(".list").clientWidth;
        const listWidth = btn.parentNode.querySelector("#list").scrollWidth;

        if (currentCoursesOffset < -1 * (listWidth - containerWidth)) return;

        currentCoursesOffset -= scrollAmount;

        const list = btn.parentNode.querySelector("#list");
        list.style.transform = `translateX(${currentCoursesOffset}px)`;
    }
    else if (btn.parentNode.querySelector("#tags-list")) {
        const containerWidth = btn.parentNode.querySelector(".list").clientWidth;
        const listWidth = btn.parentNode.querySelector("#tags-list").scrollWidth;

        if (currentTagsOffset < -1 * (listWidth - containerWidth)) return;

        currentTagsOffset -= scrollAmount;

        const list = btn.parentNode.querySelector("#tags-list");
        list.style.transform = `translateX(${currentTagsOffset}px)`;
    }
    else {
        const containerWidth = btn.parentNode.querySelector(".testimonials").clientWidth;
        const listWidth = btn.parentNode.querySelector("#testimonials-list").scrollWidth;

        if (currentTestimonialsOffset < -1 * (listWidth - containerWidth)) return;

        currentTestimonialsOffset -= scrollAmount;

        const list = btn.parentNode.querySelector("#testimonials-list");
        list.style.transform = `translateX(${currentTestimonialsOffset}px)`;
    }
}

async function get_tag_courses(value) {
    await fetch(`/course/tag/${value}`)
        .then(response => response.json())
        .then(response => {
            console.log(response);
            
            const list = document.querySelector("#list");
            list.style.transform = `translateX(0px)`;
            currentCoursesOffset = 0;

            document.querySelector("#courses .cards .list #list").innerHTML = "";
            for (let course of response) {
                const card = document.createElement("div");
                card.setAttribute("class", "card");
                card.innerHTML = `
                    <div class="top">
                        <img src=${course.poster} alt="ChatGPT Complete Guide">
                    </div>
                    <div class="bottom">
                        <div class="title"><a href="/course/${course._id}" class="link">${course.title}</a></div>
                        <div class="instructor">
                            <span>${course.instructor}</span>
                        </div>
                        <div class="rating">
                            <div class="stars"></div>
                            <span class="score">${course.overall_rating}</span>
                            <span class="reviews">(${course.reviewsCount})</span>
                        </div>
                        <div class="cost">
                            <span>$${course.price}</span>
                        </div>
                    </div>
                `;
                document.querySelector("#courses .cards .list #list").appendChild(card);
            }
        })
        .catch(error => console.error(error));
}

function describe_feature(id) {
    switch (id) {
        case 0: document.querySelector("#features .right .description p").innerText = "Discover a learning journey tailored just for you. Our platform utilizes intelligent pre-assessments to understand your existing knowledge and goals. Based on this, we generate a unique learning path, guiding you through the most relevant content at your own pace, ensuring efficient and effective skill development.";
            break;
        case 1: document.querySelector("#features .right .description p").innerText = "Experience assessments that go beyond simple right or wrong answers. Our integrated AI dynamically generates pre-assessments and unit quizzes, adapting to your learning progress. This provides targeted feedback and helps you identify areas for improvement, leading to a deeper understanding of the material.";
            break;
        case 2: document.querySelector("#features .right .description p").innerText = "Get your questions answered quickly and accurately. Our platform employs advanced AI and Retrieval-Augmented Generation (RAG) to understand your queries and provide contextually relevant information directly from the course content, minimizing learning roadblocks and maximizing comprehension.";
            break;
        case 3: document.querySelector("#features .right .description p").innerText = "Stay informed about your learning journey with our detailed progress tracking. Monitor your completed lessons, assessment scores, and overall course advancement. Visualize your achievements and identify areas where you might need to focus, empowering you to take control of your learning outcomes.";
            break;
        default: "";
    }
}

