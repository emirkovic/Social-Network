document.addEventListener("DOMContentLoaded", function () {
    function showAlert(message) {
        var alertBox = document.getElementById("customAlert");
        var alertMessage = document.getElementById("alertMessage");
        alertMessage.textContent = message;
        alertBox.style.display = "block";
    }

    document.querySelectorAll(".follow-btn").forEach(button => {
        button.addEventListener("click", function () {
            const csrfTokenElement = document.querySelector("[name=csrfmiddlewaretoken]");
            if (!csrfTokenElement) {
                console.error("CSRF token element not found");
                return;
            }
            const csrfToken = csrfTokenElement.value;

            const userId = this.dataset.userId;
            const isFollow = !this.classList.contains("following");
            const url = isFollow ? `/social/follow/${userId}/` : `/social/unfollow/${userId}/`;
            const method = "POST";
            const button = this;

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
                    followersCountElement.textContent = `${data.followers_count} Followers`;
                    if (isFollow) {
                        button.textContent = "Following";
                        button.classList.add("following");
                        button.classList.remove("btn-primary");
                        button.classList.add("btn-secondary");
                    } else {
                        button.textContent = "Follow";
                        button.classList.remove("following");
                        button.classList.remove("btn-secondary");
                        button.classList.add("btn-primary");
                    }
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
    if (postForm) {
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
    }

    var uploadBtn = document.getElementById("uploadBtn");
    if (uploadBtn) {
        uploadBtn.addEventListener("click", function () {
            var postForm = document.getElementById("postForm");
            if (postForm.style.display === "none" || postForm.style.display === "") {
                postForm.style.display = "block";
            } else {
                postForm.style.display = "none";
            }
        });
    }

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

    var seeAllBtn = document.getElementById("seeAllBtn");
    if (seeAllBtn) {
        seeAllBtn.addEventListener("click", function () {
            var suggestionsList = document.getElementById("suggestionsList");
            if (suggestionsList.style.display === "none" || suggestionsList.style.display === "") {
                suggestionsList.style.display = "block";
            } else {
                suggestionsList.style.display = "none";
            }
        });
    }

    const searchInput = document.getElementById('searchInput');
    const searchResultsDropdown = document.createElement('div');
    searchResultsDropdown.id = 'searchResultsDropdown';
    searchResultsDropdown.className = 'dropdown-menu';
    searchInput.parentNode.appendChild(searchResultsDropdown);

    searchInput.addEventListener('input', function () {
        const query = searchInput.value;
        if (query.length > 2) {
            fetch(`/social/search/?q=${query}`, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            })
            .then(response => response.json())
            .then(data => {
                searchResultsDropdown.innerHTML = '';
                if (data.users.length > 0) {
                    data.users.forEach(user => {
                        const userItem = document.createElement('a');
                        userItem.href = `/social/profile/${user.username}/`;
                        userItem.className = 'dropdown-item';
                        userItem.textContent = user.username;
                        searchResultsDropdown.appendChild(userItem);
                    });
                    searchResultsDropdown.style.display = 'block';
                } else {
                    searchResultsDropdown.style.display = 'none';
                }
            });
        } else {
            searchResultsDropdown.style.display = 'none';
        }
    });

    document.addEventListener('click', function (event) {
        if (!searchInput.contains(event.target) && !searchResultsDropdown.contains(event.target)) {
            searchResultsDropdown.style.display = 'none';
        }
    });

    document.querySelectorAll(".delete-post").forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            const postId = this.dataset.postId;
            const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;
            if (confirm("Are you sure you want to delete this post?")) {
                fetch(`/social/delete_post/${postId}/`, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken,
                        "Content-Type": "application/json"
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById(`post-${postId}`).remove();
                    } else {
                        alert("Failed to delete the post.");
                    }
                });
            }
        });
    });
});
