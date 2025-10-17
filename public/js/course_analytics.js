google.charts.load('current', { 'packages': ['corechart'] });

window.onload = function () {
    const courseId = window.location.href.split("/")[4];
    fetch(`/course/${courseId}/analytics_data`)
        .then(response => response.json())
        .then(response => {
            console.log(response);

            document.getElementById("course-title").innerText = response.course.title;
            document.getElementById("course-price").innerText = response.course.price;
            document.getElementById("course-created-at").innerText = response.course.createdAt.split("T")[0].replaceAll("-", "/");
            document.getElementById("course-updated-at").innerText = response.course.updatedAt.split("T")[0].replaceAll("-", "/");

            
            if (Object.keys(response.genderStats).length) {
                createPieChart([
                    ["Gender", "Percentage"],
                    ["Male", parseFloat(response.genderStats.male) || 0],
                    ["Female", parseFloat(response.genderStats.female) || 0]
                ], "gender-dist", "Gender Distribution");
            }
            else {
                document.getElementById("gender-dist").innerHTML = `<p  style="text-align: center;">No data available!</p>`
            }

            if (Object.keys(response.ageGroups).length) {
                createPieChart([
                    ["Age Group", "Percentage"],
                    ["Under 18", parseFloat(response.ageGroups["Under 18"])],
                    ["18-25", parseFloat(response.ageGroups["18-25"])],
                    ["26-35", parseFloat(response.ageGroups["26-35"])],
                    ["36-50", parseFloat(response.ageGroups["36-50"])],
                    ["Above 50", parseFloat(response.ageGroups["Above 50"])]
                ], "age-dist", "Age Distribution");

            }
            else {
                document.getElementById("age-dist").innerHTML = `<p style="text-align: center;">No data available!</p>`
            }

            if (!Object.values(response.completionRate).every(value => value === 0)) {
                createPieChart([
                    ["Course Completion", "Percentage"],
                    ["Completed", parseFloat(response.completionRate["completedPercentage"])],
                    ["In-Progress", parseFloat(response.completionRate["inProgressPercentage"])]
                ], "course-comp", "Course Completion Rate");
            }
            else {
                document.getElementById("course-comp").innerHTML = `<p style="text-align: center;">No data available!</p>`
            }

            if (!Object.values(response.reviewStats).every(value => value === 0)) {
                createPieChart([
                    ["Reviews", "Percentage"],
                    ["1 Star", parseFloat(response.reviewStats["1Star"])],
                    ["2 Stars", parseFloat(response.reviewStats["2Star"])],
                    ["3 Stars", parseFloat(response.reviewStats["3Star"])],
                    ["4 Stars", parseFloat(response.reviewStats["4Star"])],
                    ["5 Stars", parseFloat(response.reviewStats["5Star"])]
                ], "review-rating", "Reviews");
            }
            else {
                document.getElementById("review-rating").innerHTML = `<p style="text-align: center;">No data available!</p>`
            }
            
        })
        .catch(error => console.error(error));
}

function createPieChart(data, elementId, title) {
    var data = google.visualization.arrayToDataTable(data);

    var options = {
        title: title,
    };

    var chart = new google.visualization.PieChart(document.getElementById(elementId));
    chart.draw(data, options);
}
