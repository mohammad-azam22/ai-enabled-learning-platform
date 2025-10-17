google.charts.load("current", { packages: ["calendar"] });

window.onload = async function () {
    studentId = window.location.href.split('/').pop();
    await fetch(`/student/${studentId}/data`)
        .then(response => response.json())
        .then(student => {
            console.log("Student", student);
            document.getElementById("profile").querySelector("text").innerHTML = student.name.at(0);
            if (student.enrolledCourses.length) {
                document.querySelector("#your-courses>.content").innerHTML = `
                    <h2>Your Courses</h2>
                    <div class="cards">
                    <button id="courses-scroll-left" class="scroll-btn" onclick="scroll_left(this)"><img
                            src="/images/left-arrow.png" alt="scroll left"></button>
                    <div class="list">
                        <div id="your-courses-list">
                        </div>
                    </div>
                    <button id="courses-scroll-right" class="scroll-btn" onclick="scroll_right(this)"><img
                            src="/images/left-arrow.png" alt="scroll right"></button>
                </div>
                `;
                for (let course of student.enrolledCourses) {
                    fetch(`/course/${course.courseId}/data`)
                        .then(response => response.json())
                        .then(response => {
                            console.log("Course Data", response);
                            let total_lessons = 0;
                            for (unit of response.units) {
                                total_lessons += unit.lessons.length;
                            }

                            const cardList = document.querySelector("#your-courses #your-courses-list");
                            const card = document.createElement("div");
                            card.setAttribute("class", "card");
                            card.innerHTML = `
                                <div class="top">
                                    <img src=${response.poster} alt="${response.title}">
                                </div>
                                <div class="bottom">
                                    <div class="title"><a href="/course/${response._id}?referrer=${studentId}" class="link">${response.title}</a></div>
                                    <div class="instructor ">
                                        <span></span>
                                    </div>
                                    <div class="progress-container">
                                        <span class="progress-text">${parseInt(course.lessonsCompleted.length * 100 / total_lessons)}%</span>
                                        <div class="progress">
                                            <div class="progress-bar" style="width: ${parseInt(course.lessonsCompleted.length * 100 / total_lessons)}%"></div>
                                        </div>
                                        <span class="lessons">${course.lessonsCompleted.length}/${total_lessons}</span>
                                    </div>
                                </div>
                            `;

                            fetch(`/instructor/${response.instructor}/data`)
                                .then(response => response.json())
                                .then(response => card.querySelector(".bottom .instructor span").innerText = response.name)
                                .catch(error => console.error(error));

                            cardList.appendChild(card);
                        })
                        .catch(error => console.error(error));
                }

                const currentYear = new Date().getFullYear();
                const lessonsPerDay = {};
                student.enrolledCourses.forEach(course => {
                    course.lessonsCompleted.forEach(lesson => {
                        const lessonDate = new Date(lesson.createdAt);
                        if (lessonDate.getFullYear() === currentYear) {
                            const formattedDate = lessonDate.toISOString().split('T')[0]; // YYYY-MM-DD
                            lessonsPerDay[formattedDate] = (lessonsPerDay[formattedDate] || 0) + 1;
                        }
                    });
                });
                const formattedData = Object.entries(lessonsPerDay).map(([date, count]) => {
                    const [year, month, day] = date.split('-').map(Number);
                    return [new Date(year, month - 1, day), count];
                });
                activityChart(formattedData);
            }
            else {
                document.getElementById("your-courses").style.display = "none";
                activityChart([]);
            }
        })
        .catch(error => console.error(error));

    await fetch(`/course/recommended`)
        .then(response => response.json())
        .then(response => {
            console.log("Recommended Courses", response);
            if (response.length) {
                document.querySelector("#recommended>.content").innerHTML = `
                <h2>Recommended For You</h2>
                <div class="cards">
                    <button id="courses-scroll-left" class="scroll-btn" onclick="scroll_left(this)"><img
                            src="/images/left-arrow.png" alt="scroll left">
                    </button>
                    <div class="list">
                        <div id="recommended-courses-list">
                        </div>
                    </div>
                    <button id="courses-scroll-right" class="scroll-btn" onclick="scroll_right(this)"><img
                            src="/images/left-arrow.png" alt="scroll right">
                    </button>
                </div>
            `;
            }
            else {
                document.getElementById("recommended").style.display = "none";
            }
            for (let i = 0; i < response.length; i++) {
                const poster = response[i].poster;
                const title = response[i].title;
                const id = response[i]._id;
                const instructor = response[i].instructor;
                const rating = response[i].overall_rating;
                const reviewsCount = response[i].reviewsCount;
                const price = response[i].price;

                const cardList = document.querySelector("#recommended #recommended-courses-list");
                const card = document.createElement("div");
                card.setAttribute("class", "card");
                card.innerHTML = `
                <div class="top">
                    <img src="${poster}" alt="${title}">
                </div>
                <div class="bottom">
                    <div class="title"><a href="/course/${id}?referrer=${studentId}" class="link">${title}</a></div>
                    <div class="instructor">
                        <span>${instructor}</span>
                    </div>
                    <div class="rating">
                        <div class="stars">
                            <svg height="2rem" width="3rem" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 47.94 47.94" xml:space="preserve" fill="#000000" stroke="#000000" stroke-width="1.9587999999999999">
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                <g id="SVGRepo_iconCarrier">
                                    <path style="fill:#ED8A19;" d="M26.285,2.486l5.407,10.956c0.376,0.762,1.103,1.29,1.944,1.412l12.091,1.757 c2.118,0.308,2.963,2.91,1.431,4.403l-8.749,8.528c-0.608,0.593-0.886,1.448-0.742,2.285l2.065,12.042 c0.362,2.109-1.852,3.717-3.746,2.722l-10.814-5.685c-0.752-0.395-1.651-0.395-2.403,0l-10.814,5.685 c-1.894,0.996-4.108-0.613-3.746-2.722l2.065-12.042c0.144-0.837-0.134-1.692-0.742-2.285l-8.749-8.528 c-1.532-1.494-0.687-4.096,1.431-4.403l12.091-1.757c0.841-0.122,1.568-0.65,1.944-1.412l5.407-10.956 C22.602,0.567,25.338,0.567,26.285,2.486z"></path>
                                </g>
                            </svg>
                        </div>
                        <span class="score">${rating}</span>
                        <span class="reviews">(${reviewsCount})</span>
                    </div>
                    <div class="cost">
                        <span>$${price}</span>
                    </div>
                </div>
            `;
                cardList.appendChild(card);
            }
        })
        .catch(error => console.error(error))

    await fetch(`/course/popular`)
        .then(response => {
            console.log("Popular Courses", response);
            return response.json();
        })
        .then(response => {
            for (let i = 0; i < response.length; i++) {
                const poster = response[i].poster;
                const title = response[i].title;
                const id = response[i]._id;
                const instructor = response[i].instructor;
                const rating = response[i].overall_rating;
                const reviewsCount = response[i].reviewsCount;
                const price = response[i].price;

                const cardList = document.querySelector("#popular #popular-courses-list");
                const card = document.createElement("div");
                card.setAttribute("class", "card");
                card.innerHTML = `
                    <div class="top">
                        <img src="${poster}" alt="${title}">
                    </div>
                    <div class="bottom">
                        <div class="title"><a href="/course/${id}?referrer=${studentId}" class="link">${title}</a></div>
                        <div class="instructor">
                            <span></span>
                        </div>
                        <div class="rating">
                            <div class="stars">
                                <svg height="2rem" width="3rem" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 47.94 47.94" xml:space="preserve" fill="#000000" stroke="#000000" stroke-width="1.9587999999999999">
                                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                    <g id="SVGRepo_iconCarrier">
                                        <path style="fill:#ED8A19;" d="M26.285,2.486l5.407,10.956c0.376,0.762,1.103,1.29,1.944,1.412l12.091,1.757 c2.118,0.308,2.963,2.91,1.431,4.403l-8.749,8.528c-0.608,0.593-0.886,1.448-0.742,2.285l2.065,12.042 c0.362,2.109-1.852,3.717-3.746,2.722l-10.814-5.685c-0.752-0.395-1.651-0.395-2.403,0l-10.814,5.685 c-1.894,0.996-4.108-0.613-3.746-2.722l2.065-12.042c0.144-0.837-0.134-1.692-0.742-2.285l-8.749-8.528 c-1.532-1.494-0.687-4.096,1.431-4.403l12.091-1.757c0.841-0.122,1.568-0.65,1.944-1.412l5.407-10.956 C22.602,0.567,25.338,0.567,26.285,2.486z"></path>
                                    </g>
                                </svg>
                            </div>
                            <span class="score">${rating}</span>
                            <span class="reviews">(${reviewsCount})</span>
                        </div>
                        <div class="cost">
                            <span>$${price}</span>
                        </div>
                    </div>
                `;
                fetch(`/instructor/${instructor}/data`)
                    .then(response => response.json())
                    .then(response => card.querySelector(".bottom .instructor span").innerText = response.name)
                    .catch(error => console.error(error));

                cardList.appendChild(card);
            }
        })
        .catch(error => console.error(error));
}

function activityChart(data) {
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'date', id: 'Date' });
    dataTable.addColumn({ type: 'number', id: 'Activity' });

    console.log(data);
    dataTable.addRows(data);

    var chart = new google.visualization.Calendar(document.getElementById('graph-container'));

    var options = {
        height: 250,
        calendar: {
            cellSize: 20,
            cellColor: {
                stroke: '#c9c9c9',
                strokeOpacity: 1,
                strokeWidth: 1
            },
            dayOfWeekLabel: {
                fontSize: 12,
                color: '#1a8763',
                bold: false,
                italic: false,
            },
            dayOfWeekRightSpace: 10,
            daysOfWeek: 'SMTWTFS',
            monthLabel: {
                fontSize: 12,
                color: '#000000',
                bold: false,
                italic: false
            },
            monthOutlineColor: {
                stroke: '#c9c9c9',
                strokeOpacity: 0.0,
                strokeWidth: 1
            },
            unusedMonthOutlineColor: {
                stroke: '#c9c9c9',
                strokeOpacity: 0.0,
                strokeWidth: 1
            },
            underMonthSpace: 16,
        },
        noDataPattern: {
            backgroundColor: '#ffffff',
            color: '#ffffff'
        },
        colorAxis: {
            colors: ['#CCEDD5', '#6CCB94', '#3C7253'],
        },
    };
    chart.draw(dataTable, options);
}

$(".dropdown").hide();

// Toggle user dropdown
document.getElementById("profile").addEventListener("click", (event) => {
    // Prevent event from bubbling up to the document
    event.stopPropagation();
    $("#explore-dropdown").slideUp(300, "swing");
    $("#user-dropdown").slideToggle(300, "swing");
});

// Toggle explore dropdown
document.getElementById("explore").addEventListener("click", (event) => {
    // Prevent event from bubbling up to the document
    event.stopPropagation();
    $("#user-dropdown").slideUp(300, "swing");
    $("#explore-dropdown").slideToggle(300, "swing");
});

// Click outside dropdown to hide it
$(document).on("click", (event) => {
    // Check if the target is not the dropdowns or the buttons
    if (!$(event.target).closest('#user-dropdown, #explore-dropdown, #profile, #explore').length) {
        $("#user-dropdown").slideUp(300, "swing");
        $("#explore-dropdown").slideUp(300, "swing");
    }
});

let yourCoursesOffset = 0;
let recommendedCoursesOffset = 0;
let popularCoursesOffset = 0;
const scrollAmount = 300;

function scroll_left(btn) {
    if (btn.parentNode.querySelector("#your-courses-list")) {
        if (yourCoursesOffset >= 0) return;

        yourCoursesOffset += scrollAmount;

        const list = btn.parentNode.querySelector("#your-courses-list");
        list.style.transform = `translateX(${yourCoursesOffset}px)`;
    }
    else if (btn.parentNode.querySelector("#recommended-courses-list")) {
        if (recommendedCoursesOffset >= 0) return;

        recommendedCoursesOffset += scrollAmount;

        const list = btn.parentNode.querySelector("#recommended-courses-list");
        list.style.transform = `translateX(${recommendedCoursesOffset}px)`;
    }
    else {
        if (popularCoursesOffset >= 0) return;

        popularCoursesOffset += scrollAmount;

        const list = btn.parentNode.querySelector("#popular-courses-list");
        list.style.transform = `translateX(${popularCoursesOffset}px)`;
    }
}

function scroll_right(btn) {
    if (btn.parentNode.querySelector("#your-courses-list")) {
        const containerWidth = btn.parentNode.querySelector(".list").clientWidth;
        const listWidth = btn.parentNode.querySelector("#your-courses-list").scrollWidth;

        if (yourCoursesOffset < -1 * (listWidth - containerWidth)) return;

        yourCoursesOffset -= scrollAmount;

        const list = btn.parentNode.querySelector("#your-courses-list");
        list.style.transform = `translateX(${yourCoursesOffset}px)`;
    }
    else if (btn.parentNode.querySelector("#recommended-courses-list")) {
        const containerWidth = btn.parentNode.querySelector(".list").clientWidth;
        const listWidth = btn.parentNode.querySelector("#recommended-courses-list").scrollWidth;

        if (recommendedCoursesOffset < -1 * (listWidth - containerWidth)) return;

        recommendedCoursesOffset -= scrollAmount;

        const list = btn.parentNode.querySelector("#recommended-courses-list");
        list.style.transform = `translateX(${recommendedCoursesOffset}px)`;
    }
    else {
        const containerWidth = btn.parentNode.querySelector(".list").clientWidth;
        const listWidth = btn.parentNode.querySelector("#popular-courses-list").scrollWidth;

        if (popularCoursesOffset < -1 * (listWidth - containerWidth)) return;

        popularCoursesOffset -= scrollAmount;

        const list = btn.parentNode.querySelector("#popular-courses-list");
        list.style.transform = `translateX(${popularCoursesOffset}px)`;
    }
}

function navigateToProfile() {
    studentId = window.location.href.split('/').pop();
    window.location.href = `/student/${studentId}/profile`;
}

function logout() {
    fetch('/student/logout')
        .then(response => response.json())
        .then(response => {
            console.log(response);
            window.location.href = `/`;
        })
        .catch(error => {
            console.error(error);
        })
    return false;
}

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

document.getElementById("profile").querySelector("circle").style.fill = getRandomColor(document.getElementById("profile").querySelector("circle + text").innerHTML);