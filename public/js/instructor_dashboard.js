google.charts.load('current', { 'packages': ['corechart'] });

function generate_plot(cols, rows) {
    var data = new google.visualization.DataTable({
        'cols': cols,
        'rows': rows
    });

    var options = {
        title: '',    // title of the chart
        animation: {    // starting graph animation
            startup: true,
            duration: 1000,
            easing: 'out',
        },
        curveType: 'function',    // smooth curves instead of pointed line
        lineWidth: 3,    // line width
        series: {
            0: {
                color: '#6ccb94',    // line color
                pointSize: 5    // point size
            }
        },
        legend: "none",    // legend position
        hAxis: {
            title: cols[0].label,    // title for horizontal axis
            // minorGridlines: { color: "transparent" },    // options for minor grid lines (vertical gird lines)
            // gridlines: { color: "#919191" },    // options for major grid lines (vertical grid lines)
            // ticks: [0, 2, 4, 6, 8, 10, 12, 14, 16],    // x-ticks
            textStyle: {
                fontSize: 12,    // x-ticks font size
                color: "#000000"    // x-ticks font color
            },
            titleTextStyle: {
                fontSize: 16,    // x-axis title font size
                color: '#000000'    // x-axis title font color
            }
        },
        vAxis: {
            title: cols[1].label,
            viewWindow: {
                min: 0
            },
            minorGridlines: { color: "transparent" },    // options for minor grid lines (horizontal gird lines)
            gridlines: { color: "#919191" },    // options for major grid lines (horizontal grid lines)
            // ticks: [0, 2, 4, 6, 8, 10, 12, 14, 16],    // y-ticks
            textStyle: {
                fontSize: 12,    // y-ticks font size
                color: "#000000"    // y-ticks font color
            },
            titleTextStyle: {
                fontSize: 16,    // y-axis title font size
                color: '#000000'    // y-axis title font color
            }
        }
    };

    var chart = new google.visualization.LineChart(document.querySelector('#charts #right'));
    chart.draw(data, options);
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

window.onload = function () {
    const instructorId = window.location.pathname.split("/").pop();
    fetch(`/instructor/${instructorId}/data`)
        .then(response => response.json())
        .then(response => {
            console.log(response);
            document.getElementById("profile").querySelector("text").innerHTML = response.name.at(0);
            document.getElementById("profile").querySelector("circle").style.fill = getRandomColor(document.getElementById("profile").querySelector("circle + text").innerHTML);

            return fetch('/course/data', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ ids: response.courses_created })
            })
        })
        .then(response => response.json())
        .then(response => {
            console.log(response);
            if (!response.data.length) document.querySelector(".cards > .scrollable").innerHTML = `<p style="text-align: center;">You have no courses yet!</p>`
            for (course of response.data) {
                document.querySelector(".cards > .scrollable").innerHTML += `
                    <div class="card">
                        <div class="left">
                            <svg width="80%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <rect width="100%" height="100%" fill="none" />
                                <circle cx="50%" cy="50%" r="35%" fill=${getRandomColor(course.title.at(0))} />
                                <text x="50%" y="62%" font-size="30" font-family="Poppins, sans-serif"
                                    text-anchor="middle" fill="white">${course.title.at(0)}</text>
                            </svg>
                        </div>
                        <div class="mid">
                            <h2>${course.title}</h2>
                            <div>
                                <span>${course.num_units} Unit(s)</span><span> | ${course.published ? "Published" : "Unpublished"}</span>
                            </div>
                        </div>
                        <div class="right">
                            <button id="edit-course" title="Edit course" onclick=editCourse('${course.id}')><img src="/images/edit.png"
                                    alt="edit course"></button>
                            <button id="view-course" title="View course" onclick=viewCourse('${course.id}') ${course.published ? "enabled" : "disabled"}><img src="/images/view.png"
                                    alt="view course"></button>
                            <button id="view-analytics" title="Course analytics" onclick=courseAnalytics('${course.id}') ${course.published ? "enabled" : "disabled"}><img src="/images/analytics.png"
                                    alt="view course analytics"></button>
                        </div>
                    </div>
                `;
                if (course.published) {
                    document.querySelector("#info > .left > span").innerText = parseInt(document.querySelector("#info > .left > span").innerText) + 1;
                }
                else {
                    document.querySelector("#info > .right > span").innerText = parseInt(document.querySelector("#info > .right > span").innerText) + 1;
                }
            }
            document.getElementById("chart-form-btn").click();
        })
        .catch(error => console.error(error));
}

document.getElementById("create-course").addEventListener("click", async function (event) {
    event.preventDefault();
    const instructorId = window.location.pathname.split("/").pop();
    data = {
        title: "Course title",
        instructorId: instructorId,
        poster: "Course poster",
        difficulty: "beginner",
        tags: [],
        description: "Course description"
    }

    await fetch("/course/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            return response.json();
        })
        .then(response => {
            window.location.href = `/course/${response._id}/edit`;
        })
        .catch(error => {
            console.error(error);
        })
});

function logout() {
    fetch('/instructor/logout')
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

$(".dropdown").hide();

// Toggle user dropdown
document.getElementById("profile").addEventListener("click", (event) => {
    // Prevent event from bubbling up to the document
    event.stopPropagation();
    $("#user-dropdown").slideToggle(300, "swing");
});

// Click outside dropdown to hide it
$(document).on("click", (event) => {
    // Check if the target is not the dropdowns or the buttons
    if (!$(event.target).closest('#user-dropdown, #explore-dropdown, #profile, #explore').length) {
        $("#user-dropdown").slideUp(300, "swing");
        // $("#explore-dropdown").slideUp(300, "swing");
    }
});

function navigateToProfile() {
    const instructorId = window.location.href.split("/")[4];
    window.location.href = `/instructor/${instructorId}/profile`;
}

function editCourse(courseId) {
    window.location.href = `/course/${courseId}/edit`;
}

function viewCourse(courseId) {
    const instructorId = window.location.pathname.split("/").pop();
    window.location.href = `/course/${courseId}?referrer=${instructorId}`;
}

function courseAnalytics(courseId) {
    window.location.href = `/course/${courseId}/analytics`;
}

function get_plot_data(event) {
    const form = event.target.parentNode.children[0];

    const plot = form.querySelector("#plot").value;
    const granularity = form.querySelector("#granularity").value;
    if (!plot || !granularity) {
        return;
    }
    const data = { plot, granularity };

    const instructorId = window.location.pathname.split("/")[2];
    fetch(`/instructor/${instructorId}/plot`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(response => {
            console.log(response);
            const cols = [
                { label: granularity === "Daily" ? "Days" : granularity === "Monthly" ? "Months" : "Years", type: "string" },
                { label: plot, type: "number" }
            ];
            const rows = [];

            for (let datum of response) {
                rows.push({ 'c': [{ 'v': datum.label }, { 'v': datum.value }] });
            }

            generate_plot(cols, rows);

        })
        .catch(error => console.error(error));
}
