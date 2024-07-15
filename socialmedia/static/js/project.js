// static/js/project.js

document.addEventListener("DOMContentLoaded", function () {
    function showAlert(message) {
        var alertBox = document.getElementById("customAlert");
        var alertMessage = document.getElementById("alertMessage");
        alertMessage.textContent = message;
        alertBox.style.display = "block";
    }

    var commentForms = document.querySelectorAll(".comment-form");
    commentForms.forEach(function (form) {
        form.addEventListener("submit", function (event) {
            var textField = form.querySelector("input[name='text']");
            if (!textField.value.trim()) {
                event.preventDefault();
                showAlert("You need to insert a comment");
            }
        });
    });

    var postForm = document.getElementById("postForm");
    postForm.addEventListener("submit", function (event) {
        var textField = document.querySelector("textarea[name='text']");
        var imageField = document.querySelector("input[name='image']");
        var videoField = document.querySelector("input[name='video']");
        if (!textField.value.trim() || (!imageField.files.length && !videoField.files.length)) {
            event.preventDefault();
            showAlert("You need to insert a comment and image or video");
        }
    });

    document.getElementById("uploadBtn").addEventListener("click", function () {
        var postForm = document.getElementById("postForm");
        if (postForm.style.display === "none" || postForm.style.display === "") {
            postForm.style.display = "block";
        } else {
            postForm.style.display = "none";
        }
    });
});
