from django.contrib import admin

from .models import Comment
from .models import Like
from .models import Post
from .models import UserProfile


class CommentInline(admin.StackedInline):
    model = Comment
    extra = 3


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "profile_image", "active")
    search_fields = ("user__username",)
    list_filter = ("active",)
    ordering = ("user",)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("user", "created", "updated", "deleted")
    search_fields = ("user__username", "text")
    list_filter = ("deleted", "created", "updated")
    ordering = ("-created",)
    inlines = [CommentInline]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("user", "post", "created", "updated", "deleted")
    search_fields = ("user__username", "post__text", "text")
    list_filter = ("deleted", "created", "updated")
    ordering = ("-created",)


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("user", "post", "created")
    search_fields = ("user__username", "post__text")
    list_filter = ("created",)
    ordering = ("-created",)
