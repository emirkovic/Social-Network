document.addEventListener("DOMContentLoaded", function () {
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const csrftoken = getCookie('csrftoken');

    function csrfSafeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    function setupCSRFToken() {
        $.ajaxSetup({
            beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
    }

    setupCSRFToken();

    function showAlert(message) {
        var alertBox = document.getElementById("customAlert");
        var alertMessage = document.getElementById("alertMessage");
        alertMessage.textContent = message;
        alertBox.style.display = "block";
    }

    function updateFollowButtons(userId, isFollow) {
        const button = document.querySelector(`button[data-user-id='${userId}']`);
        if (button) {
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
    }

    function removeSuggestion(userId) {
        const suggestionItem = document.getElementById(`suggestion-${userId}`);
        if (suggestionItem) {
            suggestionItem.remove();
        }
    }

    function updateFollowersCount(userId, followersCount) {
        const followersCountElement = document.getElementById(`followers-count-${userId}`);
        if (followersCountElement) {
            followersCountElement.textContent = `${followersCount} Followers`;
        }
    }

    function createPostHtml(post) {
        const postHtml = `
            <div class="post mt-4 p-3 bg-light rounded" id="post-${post.id}">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <img src="${post.profile_image}" class="rounded-circle" height="40" alt="User Avatar" />
                        <strong class="ml-2">
                            <a href="/social/profile/${post.username}/" class="text-dark">${post.username}</a>
                        </strong>
                    </div>
                </div>
                <div class="mt-3">
                    ${post.image ? `<img src="${post.image}" alt="Post Image" class="img-fluid" />` : ''}
                    ${post.video ? `<video controls class="img-fluid mt-3"><source src="${post.video}" type="video/mp4" />Your browser does not support the video tag.</video>` : ''}
                    ${post.youtube_link ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${post.youtube_link}" frameborder="0" allowfullscreen></iframe>` : ''}
                    <p class="mt-3">${post.text}</p>
                    <div class="d-flex justify-content-between mt-2">
                        <div>
                            <button class="btn btn-light like-btn ${post.user_liked ? 'liked' : ''}" data-post-id="${post.id}">
                                <i class="far fa-thumbs-up"></i> Like
                            </button>
                            <a href="/social/post/${post.id}/" class="btn btn-light text-dark ml-2">
                                <i class="far fa-comment"></i> Comment
                            </a>
                        </div>
                        <small class="text-muted">
                            Liked by <strong id="last-liked-${post.id}">${post.last_liked_user || ''}</strong> and <strong id="likes-count-${post.id}">${post.likes_count}</strong> others
                        </small>
                    </div>
                    <div id="comments-${post.id}" class="comments mt-3">
                        ${post.comments.map(comment => `
                            <div class="comment mb-2 d-flex">
                                <img src="https://via.placeholder.com/150" alt="Profile Picture" class="rounded-circle comment-img" height="30" />
                                <div class="comment-details ml-2">
                                    <p class="mb-1">
                                        <strong>
                                            <a href="/social/profile/${comment.username}/" class="text-dark">${comment.username}</a>
                                        </strong> ${comment.text}
                                    </p>
                                    <small class="text-muted">${comment.created}</small>
                                </div>
                            </div>
                        `).join('')}
                        <form method="post" action="/social/post/${post.id}/" class="comment-form mt-2">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector("[name=csrfmiddlewaretoken]").value}" />
                            <input type="text" name="text" class="form-control" placeholder="Leave a comment" />
                            <button type="submit" class="btn btn-info ml-2">Post</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        return postHtml;
    }

    function handleFollowUnfollow(button) {
        const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;
        const userId = button.dataset.userId;
        const isFollow = !button.classList.contains("following");
        const url = isFollow ? `/social/follow/${userId}/` : `/social/unfollow/${userId}/`;

        fetch(url, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/json"
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateFollowButtons(userId, isFollow);
                removeSuggestion(userId);
                if (document.getElementById("suggestionsList")) {
                    updateSuggestions(data.suggestions);
                }
                updateFollowersCount(userId, data.followers_count);
                if (isFollow) {
                    fetchNewPosts(userId);
                }
            } else {
                showAlert("An error occurred. Please try again.");
            }
        });
    }

    function fetchNewPosts(userId) {
        fetch(`/social/fetch_new_posts/${userId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.posts && data.posts.length > 0) {
                const postsContainer = document.querySelector(".profile-content");
                data.posts.forEach(post => {
                    const postHtml = createPostHtml(post);
                    if (postsContainer) {
                        postsContainer.insertAdjacentHTML("afterbegin", postHtml);
                    }
                });
                addEventListenersToNewPosts();
            }
        });
    }

    function addEventListenersToNewPosts() {
        document.querySelectorAll(".like-btn").forEach(button => {
            button.addEventListener("click", function () {
                handleLikeButtonClick(this);
            });
        });

        document.querySelectorAll(".comment-form").forEach(form => {
            form.addEventListener("submit", function (event) {
                const textField = form.querySelector("input[name='text']");
                const maxWords = 10;
                const maxChars = 20;
                const words = textField.value.trim().split(/\s+/);
                const chars = textField.value.trim().length;
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
    }

    function handleLikeButtonClick(button) {
        const postId = button.dataset.postId;
        const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;

        button.disabled = true;

        fetch(`/social/post/${postId}/like/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/json"
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.total_likes !== undefined) {
                const likesCountElement = document.getElementById(`likes-count-${postId}`);
                const lastLikedElement = document.getElementById(`last-liked-${postId}`);
                const likeButton = button;

                if (likesCountElement && likeButton) {
                    likesCountElement.textContent = data.total_likes;
                    lastLikedElement.textContent = data.last_liked_user || '';
                    likeButton.classList.toggle("liked", data.user_liked);
                    const icon = likeButton.querySelector('i');
                    icon.classList.toggle("fas", data.user_liked);
                    icon.classList.toggle("far", !data.user_liked);
                }
            }
        })
        .catch(error => console.error('Error handling like/unlike:', error))
        .finally(() => {
            button.disabled = false;
        });
    }

    function updateSuggestions(suggestions) {
        const suggestionsList = document.getElementById("suggestionsList");
        if (!suggestionsList) {
            console.error("Element #suggestionsList not found in the DOM");
            return;
        }
        suggestionsList.innerHTML = "";
        suggestions.forEach(suggestion => {
            const suggestionItem = `
                <div class="suggestion-item" id="suggestion-${suggestion.id}">
                    <img src="https://via.placeholder.com/150" class="rounded-circle" height="40" alt="User Avatar" />
                    <div class="suggestion-info">
                        <small><strong><a href="/social/profile/${suggestion.username}/" class="text-dark">${suggestion.username}</a></strong></small>
                        <br />
                        <small>Followed by <span id="followers-count-${suggestion.id}">${suggestion.followers_count}</span> others</small>
                    </div>
                    <div class="follow-text">
                        <button class="btn btn-primary follow-btn" data-user-id="${suggestion.id}">Follow</button>
                    </div>
                </div>`;
            suggestionsList.insertAdjacentHTML("beforeend", suggestionItem);
        });

        document.querySelectorAll(".follow-btn").forEach(button => {
            button.addEventListener("click", function () {
                handleFollowUnfollow(button);
            });
        });
    }

    document.querySelectorAll(".follow-btn").forEach(button => {
        button.addEventListener("click", function () {
            handleFollowUnfollow(button);
        });
    });

    document.querySelectorAll(".like-btn").forEach(button => {
        button.addEventListener("click", function () {
            handleLikeButtonClick(this);
        });
    });

    document.querySelectorAll(".comment-form").forEach(form => {
        form.addEventListener("submit", function (event) {
            const textField = form.querySelector("input[name='text']");
            const maxWords = 10;
            const maxChars = 20;
            const words = textField.value.trim().split(/\s+/);
            const chars = textField.value.trim().length;
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

    var seeAllBtn = document.getElementById("seeAllBtn");
    if (seeAllBtn) {
        seeAllBtn.addEventListener("click", function () {
            var suggestionsList = document.getElementById("suggestionsList");
            if (suggestionsList && (suggestionsList.style.display === "none" || suggestionsList.style.display === "")) {
                suggestionsList.style.display = "block";
            } else if (suggestionsList) {
                suggestionsList.style.display = "none";
            }
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
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
    }

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

    addEventListenersToNewPosts();
});
