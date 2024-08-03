document.addEventListener("DOMContentLoaded", function () {
    const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]") ? document.querySelector("[name=csrfmiddlewaretoken]").value : null;
    const currentPath = window.location.pathname;

    function showAlert(message) {
        const alertBox = document.getElementById("customAlert");
        if (alertBox) {
            const alertMessage = document.getElementById("alertMessage");
            alertMessage.textContent = message;
            alertBox.style.display = "block";
        }
    }

    function updateFollowButtons(userId, isFollow) {
        const button = document.querySelector(`button[data-user-id='${userId}']`);
        if (button) {
            button.textContent = isFollow ? "Following" : "Follow";
            button.classList.toggle("following", isFollow);
            button.classList.toggle("btn-primary", !isFollow);
            button.classList.toggle("btn-secondary", isFollow);
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

    function updateSuggestions(suggestions) {
        const suggestionsList = document.getElementById("suggestionsList");
        if (!suggestionsList) {
            console.error("Element #suggestionsList not found in the DOM");
            return;
        }
        suggestionsList.innerHTML = "";
        suggestions.forEach(suggestion => {
            const profileImage = suggestion.profile_image ? suggestion.profile_image : 'https://via.placeholder.com/150';
            const suggestionItem = `
                <div class="suggestion-item" id="suggestion-${suggestion.id}">
                    <img src="${profileImage}" class="rounded-circle" height="40" alt="User Avatar" />
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
        attachEventListenersToNewElements();
    }

    function handleFollowUnfollow(button) {
        const userId = button.dataset.userId;
        const isFollow = !button.classList.contains("following");
        const url = isFollow ? `/social/follow/${userId}/` : `/social/unfollow/${userId}/`;

        fetch(url, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/json"
            }
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

                if (currentPath.includes('/social/') && !currentPath.includes('/social/profile/')) {
                    if (isFollow) {
                        fetchNewPosts(userId);
                    }
                }
            } else {
                showAlert("An error occurred. Please try again.");
            }
        });
    }

    function fetchNewPosts(userId) {
        console.log("fetchNewPosts called on path:", currentPath);
        if (currentPath.includes('/social/profile/') && !currentPath.includes('/social/')) {
            console.log("Skipping fetchNewPosts on my_profile page");
            return;
        }
        fetch(`/social/fetch_new_posts/${userId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.posts && data.posts.length > 0) {
                const postsContainer = document.querySelector(".profile-posts");
                if (postsContainer) {
                    data.posts.forEach(post => {
                        const postHtml = createPostHtml(post);
                        postsContainer.insertAdjacentHTML("afterbegin", postHtml);
                    });
                    attachEventListenersToNewElements();
                }
            }
        })
        .catch(error => console.error('Error fetching new posts:', error));
    }

    function createPostHtml(post) {
        const currentUser = "{{ user.username }}";
        const isCurrentUserPost = post.username === currentUser;
        const profileImage = post.profile_image ? post.profile_image : 'https://via.placeholder.com/150';
        return `
            <div class="post mt-4 p-3 bg-light rounded" id="post-${post.id}">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <img src="${profileImage}" class="rounded-circle" height="40" alt="User Avatar" />
                        <strong class="ml-2">
                            <a href="/social/profile/${post.username}/" class="text-dark">${post.username}</a>
                        </strong>
                    </div>
                    ${isCurrentUserPost ? `
                    <div class="dropdown">
                        <button class="btn btn-secondary dropdown-toggle" type="button" id="postOptions-${post.id}" data-bs-toggle="dropdown" aria-expanded="false">
                            Options
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="postOptions-${post.id}">
                            <li><a class="dropdown-item edit-post" href="#" data-post-id="${post.id}">Edit Post</a></li>
                            <li><a class="dropdown-item toggle-comments" href="#" data-post-id="${post.id}">${post.comments_disabled ? 'Enable Comments' : 'Disable Comments'}</a></li>
                            <li><a class="dropdown-item delete-post" href="#" data-post-id="${post.id}">Delete</a></li>
                        </ul>
                    </div>` : ''}
                </div>
                <div class="mt-3">
                    ${post.image ? `<img src="${post.image}" alt="Post Image" class="img-fluid post-image" />` : ''}
                    ${post.video ? `<video controls class="img-fluid mt-3 post-video"><source src="${post.video}" type="video/mp4" />Your browser does not support the video tag.</video>` : ''}
                    ${post.youtube_link ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${post.youtube_link}" frameborder="0" allowfullscreen class="post-youtube-link"></iframe>` : ''}
                    <p class="mt-3 post-text">${post.text}</p>
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
                            Liked by <strong id="last-liked-${post.id}">${post.last_liked_user}</strong> and <strong id="likes-count-${post.id}">${post.likes_count}</strong> others
                        </small>
                    </div>
                    <div id="comments-${post.id}" class="comments mt-3" ${post.comments_disabled ? 'style="display: none;"' : ''}>
                        ${post.comments.map(comment => `
                            <div class="comment mb-2 d-flex" id="comment-${comment.id}">
                                <img src="${comment.profile_image ? comment.profile_image : 'https://via.placeholder.com/150'}" alt="Profile Picture" class="rounded-circle comment-img" height="30" />
                                <div class="comment-details ml-2">
                                    <p class="mb-1">
                                        <strong>
                                            <a href="/social/profile/${comment.username}/" class="text-dark">${comment.username}</a>
                                        </strong> ${comment.text}
                                    </p>
                                    <small class="text-muted">${comment.created}</small>
                                    ${comment.user == currentUser ? `<button class="btn btn-danger btn-sm delete-comment" data-comment-id="${comment.id}">Delete</button>` : ''}
                                </div>
                            </div>
                        `).join('')}
                        <form method="post" action="/social/post/${post.id}/" class="comment-form mt-2" ${post.comments_disabled ? 'style="display: none;"' : ''}>
                            <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}" />
                            <input type="text" name="text" class="form-control" placeholder="Leave a comment" />
                            <button type="submit" class="btn btn-info ml-2">Post</button>
                        </form>
                    </div>
                </div>
            </div>`;
    }

    function handleLikeButtonClick(button) {
        const postId = button.dataset.postId;

        fetch(`/social/post/${postId}/like/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/json"
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.total_likes !== undefined) {
                const buttons = document.querySelectorAll(`.like-btn[data-post-id='${postId}']`);
                buttons.forEach(btn => {
                    btn.classList.toggle("liked", data.user_liked);
                    btn.querySelector("i").classList.toggle("fas", data.user_liked);
                    btn.querySelector("i").classList.toggle("far", !data.user_liked);
                });
                document.getElementById(`likes-count-${postId}`).textContent = data.total_likes;
                document.getElementById(`last-liked-${postId}`).textContent = data.last_liked_user || '';
            }
        })
        .catch(error => console.error('Error handling like:', error));
    }

    function handleDeleteComment(button) {
        const commentId = button.dataset.commentId;
        if (confirm("Are you sure you want to delete this comment?")) {
            fetch(`/social/delete_comment/${commentId}/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken,
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById(`comment-${commentId}`).remove();
                } else {
                    alert("Failed to delete the comment.");
                }
            });
        }
    }

    function handleDeletePost(button) {
        const postId = button.dataset.postId;
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
    }

    function openEditPostModal(postId) {
        const post = document.getElementById(`post-${postId}`);
        const text = post.querySelector('.post-text').innerText;
        const image = post.querySelector('.post-image') ? post.querySelector('.post-image').src : '';
        const video = post.querySelector('.post-video') ? post.querySelector('.post-video').src : '';
        const youtubeLink = post.querySelector('.post-youtube-link') ? post.querySelector('.post-youtube-link').src : '';

        document.getElementById('editPostId').value = postId;
        document.getElementById('editPostText').value = text;
        document.getElementById('editPostImage').value = '';
        document.getElementById('editPostVideo').value = '';
        document.getElementById('editPostYoutubeLink').value = youtubeLink;

        const editPostModal = new bootstrap.Modal(document.getElementById('editPostModal'));
        editPostModal.show();
    }

    function handleEditPost(button) {
        const postId = button.dataset.postId;
        openEditPostModal(postId);
    }

    function handleToggleComments(button) {
        const postId = button.dataset.postId;

        fetch(`/social/disable_comments/${postId}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/json"
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const newState = data.comments_disabled ? "Enable Comments" : "Disable Comments";
                button.textContent = newState;
                const commentsSection = document.getElementById(`comments-${postId}`);
                if (data.comments_disabled) {
                    commentsSection.style.display = 'none';
                    showAlert("Comments have been disabled for this post.");
                } else {
                    commentsSection.style.display = 'block';
                    fetch(`/social/fetch_comments/${postId}/`)
                        .then(response => response.json())
                        .then(comments => {
                            const commentsContainer = document.getElementById(`comments-${postId}`);
                            commentsContainer.innerHTML = comments.map(comment => `
                                <div class="comment mb-2 d-flex" id="comment-${comment.id}">
                                    <img src="${comment.profile_image ? comment.profile_image : 'https://via.placeholder.com/150'}" alt="Profile Picture" class="rounded-circle comment-img" height="30" />
                                    <div class="comment-details ml-2">
                                        <p class="mb-1">
                                            <strong>
                                                <a href="/social/profile/${comment.username}/" class="text-dark">${comment.username}</a>
                                            </strong> ${comment.text}
                                        </p>
                                        <small class="text-muted">${comment.created}</small>
                                    </div>
                                </div>
                            `).join('');
                            attachEventListenersToNewElements();
                        });
                    showAlert("Comments have been enabled for this post.");
                }
            } else {
                showAlert("An error occurred. Please try again.");
            }
        })
        .catch(error => console.error('Error toggling comments:', error));
    }

    function attachEventListenersToNewElements() {
        document.querySelectorAll(".follow-btn").forEach(button => {
            button.addEventListener("click", function () {
                handleFollowUnfollow(button);
            });
        });

        document.querySelectorAll(".like-btn").forEach(button => {
            button.addEventListener("click", function () {
                handleLikeButtonClick(button);
            });
        });

        document.querySelectorAll(".delete-comment").forEach(button => {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                handleDeleteComment(button);
            });
        });

        document.querySelectorAll(".delete-post").forEach(button => {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                handleDeletePost(button);
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
                if (form.closest('.post').querySelector('.toggle-comments').textContent.includes('Enable Comments')) {
                    event.preventDefault();
                    showAlert("Comments have been disabled for this post.");
                }
            });
        });

        document.querySelectorAll(".edit-post").forEach(button => {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                handleEditPost(button);
            });
        });

        document.querySelectorAll(".toggle-comments").forEach(button => {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                handleToggleComments(button);
            });
        });
    }

    attachEventListenersToNewElements();

    const postForm = document.getElementById("postForm");
    if (postForm) {
        postForm.addEventListener("submit", function (event) {
            const textField = document.querySelector("textarea[name='text']");
            const imageField = document.querySelector("input[name='image']");
            const videoField = document.querySelector("input[name='video']");
            const youtubeLinkField = document.querySelector("input[name='youtube_link']");
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
            } else if (!textField.value.trim() || (!imageField.files.length && !videoField.files.length && !youtubeLinkField.value.trim())) {
                event.preventDefault();
                showAlert("You must provide text, an image, a video, or a YouTube link.");
            }
        });
    }

    const uploadBtn = document.getElementById("uploadBtn");
    if (uploadBtn) {
        uploadBtn.addEventListener("click", function () {
            const postForm = document.getElementById("postForm");
            postForm.style.display = postForm.style.display === "block" ? "none" : "block";
        });
    }

    const seeAllBtn = document.getElementById("seeAllBtn");
    if (seeAllBtn) {
        seeAllBtn.addEventListener("click", function () {
            const suggestionsList = document.getElementById("suggestionsList");
            suggestionsList.style.display = suggestionsList.style.display === "block" ? "none" : "block";
        });
    }

    const searchInput = document.getElementById('searchInput');
    const searchResultsDropdown = document.createElement('div');
    searchResultsDropdown.id = 'searchResultsDropdown';
    searchResultsDropdown.className = 'dropdown-menu';
    if (searchInput) {
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

    const editPostForm = document.getElementById('editPostForm');
    if (editPostForm) {
        editPostForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const postId = document.getElementById('editPostId').value;
            const formData = new FormData(editPostForm);

            fetch(`/social/edit_post/${postId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const post = document.getElementById(`post-${postId}`);
                    post.querySelector('.post-text').innerText = data.post.text;
                    if (data.post.image) {
                        let img = post.querySelector('.post-image');
                        if (!img) {
                            img = document.createElement('img');
                            img.className = 'img-fluid post-image';
                            post.insertBefore(img, post.querySelector('.post-video, .post-youtube-link, .post-text'));
                        }
                        img.src = data.post.image;
                    } else {
                        const img = post.querySelector('.post-image');
                        if (img) {
                            img.remove();
                        }
                    }
                    if (data.post.video) {
                        let video = post.querySelector('.post-video');
                        if (!video) {
                            video = document.createElement('video');
                            video.className = 'img-fluid mt-3 post-video';
                            video.controls = true;
                            post.insertBefore(video, post.querySelector('.post-youtube-link, .post-text'));
                        }
                        video.src = data.post.video;
                    } else {
                        const video = post.querySelector('.post-video');
                        if (video) {
                            video.remove();
                        }
                    }
                    if (data.post.youtube_link) {
                        let iframe = post.querySelector('.post-youtube-link');
                        if (!iframe) {
                            iframe = document.createElement('iframe');
                            iframe.className = 'post-youtube-link';
                            iframe.width = 560;
                            iframe.height = 315;
                            iframe.frameBorder = 0;
                            iframe.allowFullscreen = true;
                            post.insertBefore(iframe, post.querySelector('.post-text'));
                        }
                        iframe.src = `https://www.youtube.com/embed/${data.post.youtube_link}`;
                    } else {
                        const iframe = post.querySelector('.post-youtube-link');
                        if (iframe) {
                            iframe.remove();
                        }
                    }
                    showAlert("Post updated successfully.");
                } else {
                    showAlert("Failed to update the post.");
                }
            })
            .catch(error => console.error('Error updating post:', error));
        });
    }

    const notificationsIcon = document.getElementById('notifications-icon');
    const notificationsPanel = document.getElementById('notifications-panel');

    if (notificationsIcon) {
        notificationsIcon.addEventListener('click', function () {
            if (notificationsPanel.classList.contains('show')) {
                notificationsPanel.classList.remove('show');
            } else {
                notificationsPanel.classList.add('show');
                fetchNotifications();
            }
        });
    }

    function fetchNotifications() {
        fetch('/social/notifications/')
            .then(response => response.json())
            .then(data => {
                const notificationsContent = document.getElementById('notifications-content');
                notificationsContent.innerHTML = '';
                data.forEach(notification => {
                    const notificationElement = document.createElement('div');
                    notificationElement.classList.add('notification');
                    if (!notification.is_read) {
                        notificationElement.classList.add('new');
                    }
                    notificationElement.innerHTML = `
                        <p>${notification.text}</p>
                        <small>${notification.created}</small>
                    `;
                    notificationsContent.appendChild(notificationElement);
                });
            })
            .catch(error => console.error('Error fetching notifications:', error));
    }
});
