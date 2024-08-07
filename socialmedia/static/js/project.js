document.addEventListener("DOMContentLoaded", function() {
    const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]")?.value || null;
    const currentPath = window.location.pathname;

    let isFetching = false;

    // Function to show alert messages
    function showAlert(message) {
        const alertBox = document.getElementById("customAlert");
        if (alertBox) {
            document.getElementById("alertMessage").textContent = message;
            alertBox.style.display = "block";
        }
    }

    // Function to handle clearing notifications
    function handleClearNotifications() {
        fetch("/social/clear_notifications/", {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/json"
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("notifications-content").innerHTML = '';
            } else {
                console.error("Failed to clear notifications. Please try again.");
            }
        })
        .catch(error => console.error('Error clearing notifications:', error));
    }

    // Attach the event listener for the "Clear all" text
    document.getElementById("clear-notifications")?.addEventListener("click", handleClearNotifications);

    // Function to fetch notifications
    function fetchNotifications() {
        fetch('/social/notifications/')
            .then(response => response.json())
            .then(data => {
                const notificationsContent = document.getElementById('notifications-content');
                notificationsContent.innerHTML = '';
                data.forEach(notification => {
                    const notificationElement = document.createElement('div');
                    notificationElement.classList.add('notification', !notification.is_read && 'new');
                    notificationElement.innerHTML = `
                        <div class="d-flex align-items-center">
                            <img src="${notification.profile_image}" class="rounded-circle" height="30" alt="User Avatar" />
                            <div class="ml-2">
                                <p><strong><a href="/social/profile/${notification.trigger_user}/">${notification.trigger_user}</a></strong> ${notification.text}</p>
                                <small>${notification.created}</small>
                            </div>
                            ${notification.type === 'follow' ?
                                `<div class="follow-text">
                                    <button class="btn ${notification.is_following ? 'btn-secondary following' : 'btn-primary'} follow-btn" data-user-id="${notification.trigger_user_id}">
                                        ${notification.is_following ? 'Following' : 'Follow'}
                                    </button>
                                </div>` : ''}
                        </div>`;
                    notificationsContent.appendChild(notificationElement);
                });
            })
            .catch(error => console.error('Error fetching notifications:', error));
    }

    // Attach event listener to notifications icon
    document.getElementById('notifications-icon')?.addEventListener('click', function() {
        const notificationsPanel = document.getElementById('notifications-panel');
        notificationsPanel.classList.toggle('show');
        if (notificationsPanel.classList.contains('show')) {
            fetchNotifications();
        }
    });

    // Function to update follow buttons
    function updateFollowButtons(userId, isFollow) {
        document.querySelectorAll(`button[data-user-id='${userId}']`).forEach(button => {
            button.textContent = isFollow ? "Following" : "Follow";
            button.classList.toggle("following", isFollow);
            button.classList.toggle("btn-primary", !isFollow);
            button.classList.toggle("btn-secondary", isFollow);
        });
    }

    // Function to remove suggestion
    function removeSuggestion(userId) {
        document.getElementById(`suggestion-${userId}`)?.remove();
    }

    // Function to update followers count
    function updateFollowersCount(userId, followersCount) {
        const followersCountElement = document.getElementById(`followers-count-${userId}`);
        if (followersCountElement) {
            followersCountElement.textContent = `${followersCount} Followers`;
        }
    }

    // Function to update suggestions
    function updateSuggestions(suggestions) {
        const suggestionsList = document.getElementById("suggestionsList");
        if (!suggestionsList) {
            console.error("Element #suggestionsList not found in the DOM");
            return;
        }
        suggestionsList.innerHTML = "";
        suggestions.forEach(suggestion => {
            const profileImage = suggestion.profile_image || 'https://via.placeholder.com/150';
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
    }

    // Function to handle follow/unfollow
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
                if (data.suggestions) {
                    removeSuggestion(userId);
                    updateSuggestions(data.suggestions);
                }
                updateFollowersCount(userId, data.followers_count);
                if (currentPath.includes('/social/') && !currentPath.includes('/social/profile/')) {
                    if (isFollow) {
                        fetchNewPosts(userId);
                    } else {
                        removePostsByIds(data.posts_to_remove);
                    }
                }
            } else {
                showAlert("An error occurred. Please try again.");
            }
        });
    }

    // Function to fetch new posts
    function fetchNewPosts(userId) {
        if (isFetching) return;
        isFetching = true;

        if (currentPath.includes('/social/profile/') && !currentPath.includes('/social/')) {
            isFetching = false;
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
                }
            }
            isFetching = false;
        })
        .catch(error => {
            console.error('Error fetching new posts:', error);
            isFetching = false;
        });
    }

    // Function to create post HTML
    function createPostHtml(post) {
        const currentUser = "{{ user.username }}";
        const isCurrentUserPost = post.username === currentUser;
        const profileImage = post.profile_image || 'https://via.placeholder.com/150';
        return `
            <div class="post mt-4 p-3 bg-light rounded" id="post-${post.id}">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <img src="${profileImage}" class="rounded-circle" height="40" alt="User Avatar" />
                        <strong class="ml-2">
                            <a href="/social/profile/${post.username}/" class="text-dark">${post.username}</a>
                        </strong>
                    </div>
                    ${isCurrentUserPost ?
                    `<div class="dropdown">
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
                        ${post.comments.map(comment =>
                            `<div class="comment mb-2 d-flex" id="comment-${comment.id}">
                                <img src="${comment.profile_image || 'https://via.placeholder.com/150'}" alt="Profile Picture" class="rounded-circle comment-img" height="30" />
                                <div class="comment-details ml-2">
                                    <p class="mb-1">
                                        <strong>
                                            <a href="/social/profile/${comment.username}/" class="text-dark">${comment.username}</a>
                                        </strong> ${comment.text}
                                    </p>
                                    <small class="text-muted">${comment.created}</small>
                                    ${comment.user == currentUser ? `<button class="btn btn-danger btn-sm delete-comment" data-comment-id="${comment.id}">Delete</button>` : ''}
                                </div>
                            </div>`
                        ).join('')}
                        <form method="post" action="/social/post/${post.id}/" class="comment-form mt-2" ${post.comments_disabled ? 'style="display: none;"' : ''}>
                            <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}" />
                            <input type="text" name="text" class="form-control" placeholder="Leave a comment" />
                            <button type="submit" class="btn btn-info ml-2">Post</button>
                        </form>
                    </div>
                </div>
            </div>`;
    }

    // Function to handle like button click
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
                document.querySelectorAll(`.like-btn[data-post-id='${postId}']`).forEach(btn => {
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

    // Function to handle delete comment
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

    // Function to handle delete post
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

    // Function to open edit post modal
    function openEditPostModal(postId) {
        const post = document.getElementById(`post-${postId}`);
        const text = post.querySelector('.post-text').innerText;
        const image = post.querySelector('.post-image')?.src || '';
        const video = post.querySelector('.post-video')?.src || '';
        const youtubeLink = post.querySelector('.post-youtube-link')?.src || '';

        document.getElementById('editPostId').value = postId;
        document.getElementById('editPostText').value = text;
        document.getElementById('editPostImage').value = '';
        document.getElementById('editPostVideo').value = '';
        document.getElementById('editPostYoutubeLink').value = youtubeLink;

        const editPostModal = new bootstrap.Modal(document.getElementById('editPostModal'));
        editPostModal.show();
    }

    // Function to handle edit post
    function handleEditPost(button) {
        openEditPostModal(button.dataset.postId);
    }

    // Function to handle toggle comments
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
                commentsSection.style.display = data.comments_disabled ? 'none' : 'block';
                if (!data.comments_disabled) {
                    fetch(`/social/fetch_comments/${postId}/`)
                        .then(response => response.json())
                        .then(comments => {
                            const commentsContainer = document.getElementById(`comments-${postId}`);
                            commentsContainer.innerHTML = comments.map(comment =>
                                `<div class="comment mb-2 d-flex" id="comment-${comment.id}">
                                    <img src="${comment.profile_image || 'https://via.placeholder.com/150'}" alt="Profile Picture" class="rounded-circle comment-img" height="30" />
                                    <div class="comment-details ml-2">
                                        <p class="mb-1">
                                            <strong>
                                                <a href="/social/profile/${comment.username}/" class="text-dark">${comment.username}</a>
                                            </strong> ${comment.text}
                                        </p>
                                        <small class="text-muted">${comment.created}</small>
                                    </div>
                                </div>`
                            ).join('');
                        });
                }
                showAlert(`Comments have been ${data.comments_disabled ? 'disabled' : 'enabled'} for this post.`);
            } else {
                showAlert("An error occurred. Please try again.");
            }
        })
        .catch(error => console.error('Error toggling comments:', error));
    }

    // Function to remove posts by their IDs
    function removePostsByIds(postIds) {
        postIds.forEach(postId => document.getElementById(`post-${postId}`)?.remove());
    }

    // Event delegation for dynamically added elements
    document.body.addEventListener("click", function(event) {
        if (event.target.matches(".follow-btn")) {
            handleFollowUnfollow(event.target);
        } else if (event.target.matches(".like-btn")) {
            handleLikeButtonClick(event.target);
        } else if (event.target.matches(".delete-comment")) {
            event.preventDefault();
            handleDeleteComment(event.target);
        } else if (event.target.matches(".delete-post")) {
            event.preventDefault();
            handleDeletePost(event.target);
        } else if (event.target.matches(".edit-post")) {
            event.preventDefault();
            handleEditPost(event.target);
        } else if (event.target.matches(".toggle-comments")) {
            event.preventDefault();
            handleToggleComments(event.target);
        } else if (event.target.matches(".user-item")) {
            handleUserItemClick(event.target);
        } else if (event.target.matches(".message-action-copy")) {
            handleCopyMessage(event.target);
        } else if (event.target.matches(".message-action-delete")) {
            handleDeleteMessage(event.target);
        }
    });

    // Handling post form submission
    const postForm = document.getElementById("postForm");
    if (postForm) {
        postForm.addEventListener("submit", function(event) {
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
            } else if (!textField.value.trim() && !imageField.files.length && !videoField.files.length && !youtubeLinkField.value.trim()) {
                event.preventDefault();
                showAlert("You must provide text, an image, a video, or a YouTube link.");
            }
        });
    }

    // Toggle visibility of post form
    document.getElementById("uploadBtn")?.addEventListener("click", function() {
        const postForm = document.getElementById("postForm");
        postForm.style.display = postForm.style.display === "block" ? "none" : "block";
    });

    // Toggle visibility of suggestions list
    document.getElementById("seeAllBtn")?.addEventListener("click", function() {
        const suggestionsList = document.getElementById("suggestionsList");
        suggestionsList.style.display = suggestionsList.style.display === "block" ? "none" : "block";
    });

    // Handle search input and results dropdown with debounce
    function debounce(func, delay) {
        let debounceTimer;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        }
    }

    const searchInput = document.getElementById('searchInput');
    const searchResultsDropdown = document.createElement('div');
    searchResultsDropdown.id = 'searchResultsDropdown';
    searchResultsDropdown.className = 'dropdown-menu';
    if (searchInput) {
        searchInput.parentNode.appendChild(searchResultsDropdown);

        searchInput.addEventListener('input', debounce(function() {
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
        }, 300));

        document.addEventListener('click', function(event) {
            if (!searchInput.contains(event.target) && !searchResultsDropdown.contains(event.target)) {
                searchResultsDropdown.style.display = 'none';
            }
        });
    }

    // Handle edit post form submission
    const editPostForm = document.getElementById('editPostForm');
    if (editPostForm) {
        editPostForm.addEventListener('submit', function(event) {
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
                        video.querySelector('source').src = data.post.video;
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
                            iframe.width = '560';
                            iframe.height = '315';
                            iframe.frameBorder = '0';
                            iframe.allowFullscreen = true;
                            iframe.className = 'post-youtube-link';
                            post.insertBefore(iframe, post.querySelector('.post-text'));
                        }
                        iframe.src = `https://www.youtube.com/embed/${data.post.youtube_link}`;
                    } else {
                        const iframe = post.querySelector('.post-youtube-link');
                        if (iframe) {
                            iframe.remove();
                        }
                    }
                    editPostForm.reset();
                    bootstrap.Modal.getInstance(document.getElementById('editPostModal')).hide();
                    showAlert('Post updated successfully.');
                } else {
                    showAlert('Failed to update post.');
                }
            })
            .catch(error => {
                console.error('Error updating post:', error);
                showAlert('Failed to update post.');
            });
        });
    }

    // Function to handle user item click
    function handleUserItemClick(userItem) {
        const userId = userItem.dataset.userId;
        const username = userItem.textContent.trim();
        const profileImageSrc = userItem.querySelector(".profile-image").src;

        document.getElementById("chat-profile-image").src = profileImageSrc;
        document.getElementById("chat-username").textContent = username;
        document.getElementById("message-form").dataset.userId = userId;

        fetchMessages(userId);
    }

    // Function to fetch messages
    function fetchMessages(userId) {
        fetch(`/social/get_messages/${userId}/`)
            .then(response => response.json())
            .then(data => {
                const messagesContainer = document.getElementById("messages");
                messagesContainer.innerHTML = "";
                data.messages.forEach(message => {
                    const messageHtml = createMessageHtml(message);
                    messagesContainer.insertAdjacentHTML("beforeend", messageHtml);
                });
            })
            .catch(error => console.error('Error fetching messages:', error));
    }

    // Function to create message HTML
    function createMessageHtml(message) {
        return `
            <div class="message ${message.is_sender ? 'sent' : 'received'}">
                <p>${message.text}</p>
                ${message.image ? `<img src="${message.image}" alt="Image" />` : ''}
                <div class="message-actions">
                    <span class="action message-action-copy" data-message-id="${message.id}">Copy</span>
                    <span class="action message-action-delete" data-message-id="${message.id}">Delete</span>
                </div>
            </div>`;
    }

    // Handling message form submission
    const messageForm = document.getElementById("message-form");
    if (messageForm) {
        messageForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const userId = messageForm.dataset.userId;
            const text = document.getElementById("message-input").value;
            const imageInput = document.getElementById("image-input");
            const formData = new FormData();
            formData.append("text", text);
            if (imageInput.files.length > 0) {
                formData.append("image", imageInput.files[0]);
            }

            fetch(`/social/send_message/${userId}/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const messagesContainer = document.getElementById("messages");
                    const messageHtml = createMessageHtml(data.message);
                    messagesContainer.insertAdjacentHTML("beforeend", messageHtml);
                    messageForm.reset();
                } else {
                    showAlert("Failed to send message.");
                }
            })
            .catch(error => {
                console.error('Error sending message:', error);
                showAlert("Failed to send message.");
            });
        });
    }

    // Function to handle copy message
    function handleCopyMessage(copyButton) {
        const messageId = copyButton.dataset.messageId;

        fetch(`/social/copy_message/${messageId}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert("Message copied.");
            } else {
                showAlert("Failed to copy message.");
            }
        })
        .catch(error => console.error('Error copying message:', error));
    }

    // Function to handle delete message
    function handleDeleteMessage(deleteButton) {
        const messageId = deleteButton.dataset.messageId;

        if (confirm("Are you sure you want to delete this message?")) {
            fetch(`/social/delete_message/${messageId}/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.querySelector(`.message [data-message-id='${messageId}']`).closest('.message').remove();
                } else {
                    showAlert("Failed to delete message.");
                }
            })
            .catch(error => console.error('Error deleting message:', error));
        }
    }
});
