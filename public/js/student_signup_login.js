if (document.getElementById("student-signup-form")) {
    document.getElementById("student-signup-form").addEventListener("submit", (e) => {
        e.preventDefault();

        const data = {
            name: e.target.name.value,
            email: e.target.email.value,
            mobile: e.target.mobile.value,
            gender: e.target.gender.value,
            dob: e.target.dob.value,
            password: e.target.password.value
        };

        fetch("/student/signup", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
            .then(async response => {
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.errors ? errData.errors.join(", ") : "Incorrect credentials");
                }
                return response.json();
            })
            .then(data => {
                console.log("Success:", data);
                document.getElementById("message").style.border = "var(--border-width) solid green";
                document.getElementById("message").innerHTML = `
                    <span style="color: green;">Signup Successful. Redirecting to login page in a moment.</span>
                `;
                $("#message").slideUp();
                $("#message").slideDown(500);
                setTimeout(() => {
                    window.location.href = "/student/login";
                }, 5000);
            })
            .catch((error) => {
                document.getElementById("message").style.border = "var(--border-width) solid red";
                document.getElementById("message").innerHTML = "";
                error.message.split(",").forEach(message => {
                    document.getElementById("message").innerHTML += `
                        <span style="color: red;">${message}</span>
                        <br>
                    `;
                });
                $("#message").slideUp();
                $("#message").slideDown(500);
                setTimeout(() => {
                    $("#message").slideUp(500);
                }, 10000)
            });
    });
}

if (document.getElementById("student-login-form")) {
    document.getElementById("student-login-form").addEventListener("submit", (e) => {
        e.preventDefault();

        const data = {
            email: e.target.email.value,
            password: e.target.password.value
        };
        console.log(data)

        fetch("/student/login", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
            .then(async response => {
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error("Error: Login Failed.");
                }
                return response.json();
            })
            .then(data => {
                console.log("Success:", data);
                document.getElementById("message").style.border = "var(--border-width) solid green";
                document.getElementById("message").innerHTML = `
                    <span style="color: green;">${data.message}. Redirecting in a moment.</span>
                `;
                $("#message").slideDown(500);
                setTimeout(() => {
                    localStorage.setItem("userSession", JSON.stringify({
                        isLoggedIn: true,
                        userId: data.studentId,
                        role: "student"
                    }));                    
                    window.location.href = `/student/${data.studentId}`;
                }, 3000);
            })
            .catch((error) => {
                document.getElementById("message").style.border = "var(--border-width) solid red";
                document.getElementById("message").innerHTML = `
                        <span style="color: red;">${error.message}.</span>
                `;
                $("#message").slideDown(500);
                setTimeout(() => {
                    $("#message").slideUp(500);
                }, 5000)
            });
    });
}