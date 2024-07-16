document.addEventListener("DOMContentLoaded", function () {
    function showAlert(message) {
        var alertBox = document.getElementById("customAlert");
        var alertMessage = document.getElementById("alertMessage");
        alertMessage.textContent = message;
        alertBox.style.display = "block";
    }

    document.querySelectorAll(".follow-btn, .unfollow-btn").forEach(button => {
        button.addEventListener("click", function () {
            const userId = this.dataset.userId;
            const isFollow = this.classList.contains("follow-btn");
            const url = isFollow ? `/social/follow/${userId}/` : `/social/unfollow/${userId}/`;
            const method = "POST";
            const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;

            fetch(url, {
                method: method,
                headers: {
                    "X-CSRFToken": csrfToken,
                    "Content-Type": "application/json"
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const followersCountElement = document.getElementById(`followers-count-${userId}`);
                    followersCountElement.textContent = data.followers_count;
                    this.textContent = isFollow ? "Following" : "Follow";
                    this.classList.toggle("follow-btn");
                    this.classList.toggle("unfollow-btn");
                }
            });
        });
    });

    var commentForms = document.querySelectorAll(".comment-form");
    commentForms.forEach(function (form) {
        form.addEventListener("submit", function (event) {
            var textField = form.querySelector("input[name='text']");
            var maxWords = 10;
            var maxChars = 20;
            var words = textField.value.trim().split(/\s+/);
            var chars = textField.value.trim().length;
            if (words.length > maxWords) {
                event.preventDefault();
                showAlert(`This field cannot contain more than ${maxWords} words.`);
            } else if (chars > maxChars) {
                event.preventDefault();
                showAlert(`This field cannot contain more than ${maxChars} characters.`);
            } else if (!textField.value.trim()) {
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
        var youtubeLinkField = document.querySelector("input[name='youtube_link']");
        var maxWords = 10;
        var maxChars = 20;
        var words = textField.value.trim().split(/\s+/);
        var chars = textField.value.trim().length;
        if (words.length > maxWords) {
            event.preventDefault();
            showAlert(`This field cannot contain more than ${maxWords} words.`);
        } else if (chars > maxChars) {
            event.preventDefault();
            showAlert(`This field cannot contain more than ${maxChars} characters.`);
        } else if (!textField.value.trim() || (!imageField.files.length && !videoField.files.length && !youtubeLinkField.value.trim())) {
            event.preventDefault();
            showAlert("You must provide text, an image, a video, or a YouTube link.");
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

    document.querySelectorAll(".like-btn").forEach(button => {
        button.addEventListener("click", function () {
            const postId = this.dataset.postId;
            fetch(`/social/post/${postId}/like/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
                    "Content-Type": "application/json"
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.total_likes !== undefined) {
                    document.getElementById(`likes-count-${postId}`).textContent = data.total_likes;
                    document.getElementById(`last-liked-${postId}`).textContent = data.last_liked_user || '';
                }
            });
        });
    });

    document.getElementById("seeAllBtn").addEventListener("click", function () {
        var suggestionsList = document.getElementById("suggestionsList");
        if (suggestionsList.style.display === "none" || suggestionsList.style.display === "") {
            suggestionsList.style.display = "block";
        } else {
            suggestionsList.style.display = "none";
        }
    });

    document.querySelectorAll(".follow-btn, .unfollow-btn").forEach(button => {
        button.addEventListener("click", function () {
            const userId = this.dataset.userId;
            const isFollow = this.classList.contains("follow-btn");
            const url = isFollow ? `/social/follow/${userId}/` : `/social/unfollow/${userId}/`;
            const method = "POST";
            const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;

            fetch(url, {
                method: method,
                headers: {
                    "X-CSRFToken": csrfToken,
                    "Content-Type": "application/json"
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const followersCountElement = document.getElementById(`followers-count-${userId}`);
                    followersCountElement.textContent = data.followers_count;
                    this.textContent = isFollow ? "Following" : "Follow";
                    this.classList.toggle("follow-btn");
                    this.classList.toggle("unfollow-btn");
                }
            });
        });
    });
});
