from django.urls import path

from .views import chat
from .views import comment_post
from .views import follow_user
from .views import like_post
from .views import notifications
from .views import settings_view
from .views import upload_post
from .views import user_profile
from .views import user_search

app_name = "social"

urlpatterns = [
    path("profile/<str:username>/", user_profile, name="profile"),
    path("upload/", upload_post, name="upload_post"),
    path("like/<int:post_id>/", like_post, name="like_post"),
    path("comment/<int:post_id>/", comment_post, name="comment_post"),
    path("follow/<str:username>/", follow_user, name="follow_user"),
    path("search/", user_search, name="user_search"),
    path("notifications/", notifications, name="notifications"),
    path("chat/", chat, name="chat"),
    path("settings/", settings_view, name="settings"),
]
