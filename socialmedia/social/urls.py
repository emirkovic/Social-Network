from django.urls import path

from .views import detail
from .views import index
from .views import like_post

app_name = "social"

urlpatterns = [
    path("", index, name="index"),
    path("post/<int:post_id>/", detail, name="detail"),
    path("post/<int:post_id>/like/", like_post, name="like_post"),
]
