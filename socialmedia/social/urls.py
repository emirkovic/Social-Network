from django.contrib.auth import views as auth_views
from django.urls import path

from .views import chat
from .views import clear_notifications
from .views import copy_message
from .views import delete_comment
from .views import delete_message
from .views import delete_post
from .views import detail
from .views import disable_comments
from .views import edit_post
from .views import fetch_comments
from .views import fetch_followers
from .views import fetch_following
from .views import fetch_new_posts
from .views import follow
from .views import get_messages
from .views import get_notifications
from .views import index
from .views import like_post
from .views import my_profile
from .views import search_users
from .views import send_message
from .views import settings_view
from .views import unfollow

app_name = "social"

urlpatterns = [
    path("", index, name="index"),
    path("post/<int:post_id>/", detail, name="detail"),
    path("post/<int:post_id>/like/", like_post, name="like_post"),
    path("settings/", settings_view, name="settings"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("profile/<str:username>/", my_profile, name="my_profile"),
    path("profile/<str:username>/followers/", fetch_followers, name="fetch_followers"),
    path("profile/<str:username>/following/", fetch_following, name="fetch_following"),
    path("follow/<int:user_id>/", follow, name="follow"),
    path("unfollow/<int:user_id>/", unfollow, name="unfollow"),
    path("search/", search_users, name="search_users"),
    path("delete_post/<int:post_id>/", delete_post, name="delete_post"),
    path("fetch_new_posts/<int:user_id>/", fetch_new_posts, name="fetch_new_posts"),
    path("delete_comment/<int:comment_id>/", delete_comment, name="delete_comment"),
    path("edit_post/<int:post_id>/", edit_post, name="edit_post"),
    path("disable_comments/<int:post_id>/", disable_comments, name="disable_comments"),
    path("fetch_comments/<int:post_id>/", fetch_comments, name="fetch_comments"),
    path("notifications/", get_notifications, name="get_notifications"),
    path("clear_notifications/", clear_notifications, name="clear_notifications"),
    path("chat/", chat, name="chat"),
    path("send_message/<int:user_id>/", send_message, name="send_message"),
    path("get_messages/<int:user_id>/", get_messages, name="get_messages"),
    path("delete_message/<int:message_id>/", delete_message, name="delete_message"),
    path("copy_message/<int:message_id>/", copy_message, name="copy_message"),
]
