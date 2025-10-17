window.onload = function () {
    const params = new URLSearchParams(window.location.search);
    const search_query = params.get('query');
    fetch('/course/search', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({query: search_query})
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);

        response.length ? 
            document.querySelector("h1").innerText = `Search results for: ${search_query}`: 
            document.querySelector("h1").innerText = `No results found for: ${search_query}`; 
        
        const container = document.querySelector(".cards");
        for (let i = 0; i < response.length; i++) {
            const course = response[i];
            const card = document.createElement("div");
            card.setAttribute("class", "card");
            card.innerHTML = `
                <div class="top">
                    <img src=${course.poster} alt=${course.title}>
                </div>
                <div class="bottom">
                    <div class="title "><a href="/course/${course._id}" class="link">${course.title}</a></div>
                    <div class="instructor ">
                        <span></span>
                    </div>
                    <div class="rating ">
                        <div class="stars"></div>
                        <span class="score">${course.overall_rating}</span>
                        <span class="reviews">(${course.review_count})</span>
                    </div>
                    <div class="cost">
                        <span>$${course.price}</span>
                    </div>
                </div>
            `;

            fetch(`/instructor/${course.instructor}/data`)
                .then(response => response.json())
                .then(response => card.querySelector(".bottom .instructor span").innerText = response.name)
                .catch(error => console.error(error));

            container.appendChild(card);
        }
    })
    .catch(error => console.error(error));
}