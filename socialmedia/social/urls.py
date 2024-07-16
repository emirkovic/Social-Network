from django.contrib.auth import views as auth_views
from django.urls import path

from .views import detail
from .views import follow
from .views import index
from .views import like_post
from .views import my_profile
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
    path("follow/<int:user_id>/", follow, name="follow"),
    path("unfollow/<int:user_id>/", unfollow, name="unfollow"),
]
