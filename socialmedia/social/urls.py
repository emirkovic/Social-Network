from django.urls import path

from .views import detail
from .views import index

app_name = "social"

urlpatterns = [
    path("", index, name="index"),
    path("post/<int:post_id>/", detail, name="detail"),
]
