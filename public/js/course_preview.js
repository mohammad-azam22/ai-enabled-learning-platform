window.onload = async function () {
    courseId = window.location.href.split('/').pop().split('?')[0];
    await fetch(`/course/${courseId}/data?query=preview`)
        .then(response => response.json())
        .then(response => {
            console.log(response);
            document.querySelector("title").innerHTML += response.title;
            document.getElementById("course-poster").setAttribute("src", response.poster);
            document.getElementById("course-title").innerText = response.title;
            document.getElementById("course-instructor").innerText = response.instructor;
            document.getElementById("poster").querySelector(".stars-received").style.width = `${response.overall_rating * 4}rem`;
            document.getElementById("poster").querySelector(".stars-total").setAttribute("title", response.overall_rating === 0 ? "Unrated" : `${response.overall_rating}/5`)
            document.getElementById("course-price").innerText = response.price !== 0 ? "Cost: $" + response.price : "Cost: Free";
            if (response.price === 0) {
                document.getElementById("course-enroll").innerText = "Enroll";
                document.getElementById("course-enroll").setAttribute("onclick", "course_enroll()");
            }
            else {
                document.getElementById("course-enroll").innerText = "Purchase";
                document.getElementById("course-enroll").setAttribute("onclick", "course_purchase()");
            }
            document.getElementById("description").querySelector("p").innerText = response.description;

            const studentId = window.location.href.split("=")[1];
            if (studentId) {
                fetch(`/student/${studentId}/data`)
                    .then(response => response.json())
                    .then(student => {
                        console.log(student);
                        for (course of student.enrolledCourses) {
                            if (course.courseId === courseId) {
                                document.getElementById("course-enroll").innerText = "Go to course";
                                document.getElementById("course-enroll").setAttribute("onclick", "go_to_course()");
                            }
                        }
                    })
                    .catch(error => {
                        console.error(error)
                        document.getElementById("course-enroll").innerText = "Go to course";
                        document.getElementById("course-enroll").setAttribute("onclick", "go_to_course()");
                    });
            }

            for (unit of response.units) {
                const unitBtn = document.createElement("button");
                unitBtn.setAttribute("class", "panel-btn")
                unitBtn.innerText = unit.title;
                const descriptionPanel = document.createElement("div");
                descriptionPanel.setAttribute("class", "panel");
                descriptionPanel.innerHTML = `<p>${unit.description}</p>`
                const accordion = document.getElementById("course-content").querySelector(".accordion");
                accordion.appendChild(unitBtn);
                accordion.appendChild(descriptionPanel);
            }

            for (faq of response.faqs) {
                const questionBtn = document.createElement("button");
                questionBtn.setAttribute("class", "panel-btn")
                questionBtn.innerText = faq.question;
                const answerPanel = document.createElement("div");
                answerPanel.setAttribute("class", "panel");
                answerPanel.innerHTML = `<p>${faq.answer}</p>`
                const accordion = document.getElementById("faqs").querySelector(".accordion");
                accordion.appendChild(questionBtn);
                accordion.appendChild(answerPanel);
            }

            document.querySelector("#reviews .reviews-container .left .top span").innerHTML = response.overall_rating === 0 ? "-" : response.overall_rating;

            document.getElementById("star5-rating").style.width = `${isNaN(response.star5) ? 0 : response.star5}%`;
            document.getElementById("star5-rating").parentNode.nextElementSibling.innerText = `${isNaN(response.star5) ? 0 : response.star5}%`;
            document.getElementById("star4-rating").style.width = `${isNaN(response.star4) ? 0 : response.star4}%`;
            document.getElementById("star4-rating").parentNode.nextElementSibling.innerText = `${isNaN(response.star4) ? 0 : response.star4}%`;
            document.getElementById("star3-rating").style.width = `${isNaN(response.star3) ? 0 : response.star3}%`;
            document.getElementById("star3-rating").parentNode.nextElementSibling.innerText = `${isNaN(response.star3) ? 0 : response.star3}%`;
            document.getElementById("star2-rating").style.width = `${isNaN(response.star2) ? 0 : response.star2}%`;
            document.getElementById("star2-rating").parentNode.nextElementSibling.innerText = `${isNaN(response.star2) ? 0 : response.star2}%`;
            document.getElementById("star1-rating").style.width = `${isNaN(response.star1) ? 0 : response.star1}%`;
            document.getElementById("star1-rating").parentNode.nextElementSibling.innerText = `${isNaN(response.star1) ? 0 : response.star1}%`;

            for (revInstance of response.reviews) {
                if (studentId === revInstance.studentId) {
                    change_stars(document.querySelectorAll("#write-review-form .num-stars svg")[revInstance.rating - 1]);
                    document.querySelector("#write-review-form #review-text").value = revInstance.review;
                }
                else {
                    const review = document.createElement("div");
                    review.setAttribute("class", "review");
                    review.innerHTML = `
                        <div class="left">
                            <svg width="4rem" height="4rem" xmlns="http://www.w3.org/2000/svg">
                                <rect width="100%" height="100%" fill="none"></rect>
                                <circle cx="50%" cy="50%" r="50%" style="fill: rgb(98, 141, 184);"></circle>
                                <text x="50%" y="70%" font-size="20" font-family="Poppins, sans-serif"
                                    text-anchor="middle" fill="white">${revInstance.name.at(0)}</text>
                            </svg>
                            <span>${revInstance.name}</span>
                        </div>
                        <div class="vr"></div>
                        <div class="right">
                            <div class="rating">
                                <svg height="2rem" width="3rem" version="1.1" id="Capa_1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 47.94 47.94"
                                    xml:space="preserve" fill="#000000" stroke="#000000"
                                    stroke-width="1.9587999999999999">
                                    <g id="SVGRepo_bgCarrier" stroke-width="0" />
                                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                    <g id="SVGRepo_iconCarrier">
                                        <path style="fill:#ED8A19;"
                                            d="M26.285,2.486l5.407,10.956c0.376,0.762,1.103,1.29,1.944,1.412l12.091,1.757 c2.118,0.308,2.963,2.91,1.431,4.403l-8.749,8.528c-0.608,0.593-0.886,1.448-0.742,2.285l2.065,12.042 c0.362,2.109-1.852,3.717-3.746,2.722l-10.814-5.685c-0.752-0.395-1.651-0.395-2.403,0l-10.814,5.685 c-1.894,0.996-4.108-0.613-3.746-2.722l2.065-12.042c0.144-0.837-0.134-1.692-0.742-2.285l-8.749-8.528 c-1.532-1.494-0.687-4.096,1.431-4.403l12.091-1.757c0.841-0.122,1.568-0.65,1.944-1.412l5.407-10.956 C22.602,0.567,25.338,0.567,26.285,2.486z" />
                                    </g>
                                </svg>
                                <span>${revInstance.rating}</span>
                            </div>
                            <p>${revInstance.review}</p>
                        </div>
                    `;
                    const reviews = document.getElementById("reviews").querySelector(".right>.reviews");
                    reviews.appendChild(review);
                }
            }

            if (document.querySelector("#write-review-form #review-text").value) {
                document.querySelector("#write-review-form #buttons").innerHTML += `<button type="button" id="delete-review" onclick="delete_review()">Delete</button>`;

            }

            if (response.reviews.length >= 10) {    // if the reviews are equal to 10, then there may be more reviews or not.
                const loadMore = document.createElement("button");
                loadMore.setAttribute("id", "load-reviews");
                loadMore.innerText = "Load More";
                document.querySelector(".reviews-container>.right").appendChild(loadMore);
            }
        })
        .catch(error => console.error(error));

    $('.panel').hide();    // to initially hide all the panels
    document.querySelectorAll(".accordion .panel-btn").forEach(button => {
        attachEventListener(button, "click", accordion);
    });
}

function course_enroll() {
    courseId = window.location.href.split('/').pop().split('?')[0];
    studentId = window.location.search.split("=")[1];
    const data = {
        courseId: courseId,
        studentId: studentId
    }
    fetch("/course/enroll", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(response => {
            console.log(response);
            window.location.reload();
        })
        .catch(error => console.error(error));
}

function course_purchase() {
    course_enroll();    // I am not integrating a gateway for this project as of now. Purchasing a course is equivalent to simply enrolling it.
}

function go_to_course() {
    courseId = window.location.href.split('/').pop().split('?')[0];
    const studentId = window.location.href.split("=")[1];
    fetch(`/student/${studentId}/data`)
        .then(response => response.json())
        .then(student => {
            console.log(student);
            for (let course of student.enrolledCourses) {
                if (course.courseId === courseId && course.preAssessmentScore === -1) {
                    window.location.href = `/course/${courseId}/pre_assessment?referrer=${studentId}`;
                    return;
                }
            }
            window.location.href = `/course/${courseId}/learn?referrer=${studentId}`;
        });
}

// function to attach event listener to an element
function attachEventListener(element, event, eventListener) {
    element.addEventListener(event, eventListener);
}

// function to make an accoridon
function accordion(event) {
    event.preventDefault();
    const nextPanel = $(event.target).next('.panel');
    $('.accordion .panel').each(function () {
        if (this !== nextPanel[0]) {
            $(this).slideUp(300, 'swing');
        }
    });
    $(nextPanel).slideToggle(300, 'swing');
}

function change_stars(svg) {
    let found = false;
    for (let element of document.querySelectorAll("#write-review-form .num-stars svg")) {
        if (element !== svg && !found) {
            element.setAttribute("class", "checked");
        }
        else if (element === svg) {
            element.setAttribute("class", "checked");
            found = true;
        }
        else {
            element.removeAttribute("class");
        }
    }
}

function submit_review(e) {
    e.preventDefault();

    data = {
        rating: document.querySelectorAll("#write-review-form .num-stars .checked").length,
        review: e.target["review-text"].value
    }

    if (data.rating === 0) {
        return;
    }

    courseId = window.location.href.split('/').pop().split('?')[0];
    fetch(`/course/${courseId}/review`, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(response => {
            console.log(response);
            window.location.reload();
        })
        .catch(error => console.error(error));
}

function delete_review() {
    fetch(`/course/${courseId}/delete_review`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);
        window.location.reload();
    })
    .catch(error => console.error(error));
}