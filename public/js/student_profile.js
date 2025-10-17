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

$(".dropdown").hide();

// Toggle user dropdown
document.getElementById("profile").addEventListener("click", (event) => {
    // Prevent event from bubbling up to the document
    event.stopPropagation();
    $("#explore-dropdown").slideUp(300, "swing");
    $("#user-dropdown").slideToggle(300, "swing");
});

// Click outside dropdown to hide it
$(document).on("click", (event) => {
    // Check if the target is not the dropdowns or the buttons
    if (!$(event.target).closest('#user-dropdown, #explore-dropdown, #profile, #explore').length) {
        $("#user-dropdown").slideUp(300, "swing");
        $("#explore-dropdown").slideUp(300, "swing");
    }
});

window.onload = function () {
    const studentId = window.location.pathname.split("/")[2];
    fetch(`/student/${studentId}/data`)
        .then(response => response.json())
        .then(response => {
            console.log(response);
            document.querySelector("title").innerText += response.name;
            document.getElementById("profile").querySelector("text").innerHTML = response.name.at(0);
            document.getElementById("profile").querySelector("circle").style.fill = getRandomColor(document.getElementById("profile").querySelector("circle + text").innerHTML);
        })
        .catch(error => console.error(error));
}

function general_data() {
    document.querySelector(".right .workarea").innerHTML = `
        <h1>General Information</h1>
        <form id="user-info-form" onsubmit=update_user_info(event)>
            <label for="name">Name</label>
            <input type="text" name="name" id="name" placeholder="Name" required>
            <label for="email">Email</label>
            <input type="email" name="email" id="email" placeholder="Email" required>
            <label for="mobile">Mobile</label>
            <input type="text" name="mobile" id="mobile" placeholder="Mobile" required>
            <label for="gender">Gender</label>
            <select name="gender" id="gender" required>
                <option value="" disabled selected>Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
            <label for="dob">DOB</label>
            <input type="date" name="dob" id="dob" placeholder="Date of Birth" required>
            <button type="submit">Update</button>
        </form>
        <div id="message"></div>
    `;

    const studentId = window.location.pathname.split("/")[2];
    fetch(`/student/${studentId}/data`)
        .then(response => response.json())
        .then(response => {
            document.getElementById("profile").querySelector("text").innerHTML = response.name.at(0);
            document.getElementById("name").value = response.name;
            document.getElementById("email").value = response.email;
            document.getElementById("mobile").value = response.mobile;
            document.getElementById("gender").value = response.gender;
            const month = (new Date(response.dob).getMonth() + 1).toString().length === 1 ? "0"+(new Date(response.dob).getMonth() + 1) : (new Date(response.dob).getMonth() + 1);
            const date = new Date(response.dob).getDate().toString().length === 1 ? "0"+new Date(response.dob).getDate() : new Date(response.dob).getDate();
            document.getElementById("dob").value = new Date(response.dob).getFullYear() + "-" + month + "-" + date;
        })
        .catch(error => {
            console.error(error);
        })
}

function account_settings() {
    document.querySelector(".right .workarea").innerHTML = `
        <h1>Change Password</h1>
        <form id="change-password-form" onsubmit=update_user_pwd(event)>
            <label for="currpwd">Current Password</label>
            <input type="text" name="currpwd" id="currpwd" placeholder="Current Password" required>
            <label for="newpwd">Email</label>
            <input type="password" name="newpwd" id="newpwd" placeholder="New Password" required>
            <label for="renewpwd">Mobile</label>
            <input type="password" name="renewpwd" id="renewpwd" placeholder="Re-enter New Password" required>
            <button type="submit">Update</button>
        </form>
        <h1>Delete Account</h1>
        <div>
            <button id="del-account-btn" onclick="delete_account()">Delete Account</button>
        </div>
        <div id="message"></div>
    `;
}

function navigateToHome() {
    studentId = window.location.href.split('/')[4];
    window.location.href = `/student/${studentId}`;
}

function logout() {
    fetch('/student/logout')
        .then(response => response.json())
        .then(response => {
            console.log(response);
            localStorage.removeItem("userSession");
            document.getElementById("message").style.border = "var(--border-width) solid green";
            document.getElementById("message").innerHTML = `
                <span style="color: green;">${response.message}. Redirecting in a moment.</span>
            `;
            $("#message").slideDown(500);
            setTimeout(() => {
                window.location.href = `/`;
            }, 3000);
        })
        .catch(error => {
            console.error(error);
            document.getElementById("message").style.border = "var(--border-width) solid red";
            document.getElementById("message").innerHTML = `
                <span style="color: red;">Error Occurred</span>
        `;
            $("#message").slideDown(500);
            setTimeout(() => {
                $("#message").slideUp(500);
            }, 5000);
        })
}

function update_user_info(e) {
    e.preventDefault();

    const data = {
        name: e.target.elements.name.value,
        email: e.target.elements.email.value,
        mobile: e.target.elements.mobile.value,
        gender: e.target.elements.gender.value,
        dob: e.target.elements.dob.value
    };

    const studentId = window.location.pathname.split("/")[2];
    fetch(`/student/${studentId}/update_info`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(response => {
            console.log(response);
            document.querySelector(".right #message").style.border = "var(--border-width) solid green";
            document.querySelector(".right #message").style.color = "green";
            document.querySelector(".right #message").innerHTML = `<span>${response.message}</span>`;
        })
        .catch(error => {
            console.error(error);
            document.querySelector(".right #message").style.border = "var(--border-width) solid red";
            document.querySelector(".right #message").style.color = "red";
            document.querySelector(".right #message").innerHTML = `<span>${error.message}</span>`;
        });
}

function update_user_pwd(e) {
    e.preventDefault();

    if (e.target.elements.newpwd.value !== e.target.elements.renewpwd.value) {
        document.querySelector(".right #message").style.border = "var(--border-width) solid red";
        document.querySelector(".right #message").style.color = "red";
        document.querySelector(".right #message").innerHTML = `<span>Passwords does not match!</span>`;
        return;
    }

    const data = {
        currpwd: e.target.elements.currpwd.value,
        newpwd: e.target.elements.newpwd.value,
    };

    const studentId = window.location.pathname.split("/")[2];
    fetch(`/student/${studentId}/update_pwd`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(response => {
            console.log(response);
            if (response.message) {
                document.querySelector(".right #message").style.border = "var(--border-width) solid green";
                document.querySelector(".right #message").style.color = "green";
                document.querySelector(".right #message").innerHTML = `<span>${response.message}</span>`;
            }
            else {
                document.querySelector(".right #message").style.border = "var(--border-width) solid red";
                document.querySelector(".right #message").style.color = "red";
                document.querySelector(".right #message").innerHTML = `<span>Error Occurred</span>`;
            }

        })
        .catch(error => {
            console.error(error);
            document.querySelector(".right #message").style.border = "var(--border-width) solid red";
            document.querySelector(".right #message").style.color = "red";
            document.querySelector(".right #message").innerHTML = `<span>Server Error</span>`;
        });
}


function delete_account() {
    const studentId = window.location.pathname.split("/")[2];
    fetch(`/student/${studentId}/delete_account`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);
        logout();
    })
    .catch(error => console.error(error));
}