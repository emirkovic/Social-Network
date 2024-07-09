from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.shortcuts import redirect
from django.shortcuts import render
from django.templatetags.static import static

from .forms import CommentForm
from .forms import PostForm
from .models import Like
from .models import Post

User = get_user_model()


@login_required
def user_profile(request, username):
    user = get_object_or_404(User, username=username)
    profile = user.profile
    posts = user.posts.all()
    suggested_users = User.objects.exclude(id=request.user.id)[:5]
    context = {
        "user": user,
        "profile": profile,
        "posts": posts,
        "suggested_users": suggested_users,
        "default_profile_image": static("images/profile-placeholder.png"),
    }
    return render(request, "profile.html", context)


@login_required
def upload_post(request):
    if request.method == "POST":
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.user = request.user
            post.save()
            return redirect("home")
    else:
        form = PostForm()
    context = {
        "form": form,
        "default_profile_image": static("images/profile-placeholder.png"),
    }
    return render(request, "upload_post.html", context)


@login_required
def like_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    Like.objects.get_or_create(user=request.user, post=post)
    return redirect("home")


@login_required
def comment_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    if request.method == "POST":
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.user = request.user
            comment.post = post
            comment.save()
            return redirect("home")
    else:
        form = CommentForm()
    context = {
        "form": form,
        "default_profile_image": static("images/profile-placeholder.png"),
    }
    return render(request, "comment_post.html", context)


@login_required
def settings_view(request):
    return render(request, "settings.html")


@login_required
def follow_user(request, username):
    user_to_follow = get_object_or_404(User, username=username)
    profile = request.user.profile
    profile.following.add(user_to_follow)
    return redirect("profile", username=username)


@login_required
def user_search(request):
    query = request.GET.get("q")
    users = User.objects.filter(username__icontains=query)
    context = {
        "users": users,
        "default_profile_image": static("images/profile-placeholder.png"),
    }
    return render(request, "user_search.html", context)


@login_required
def notifications(request):
    context = {
        "default_profile_image": static("images/profile-placeholder.png"),
    }
    return render(request, "notifications.html", context)


@login_required
def chat(request):
    context = {
        "default_profile_image": static("images/profile-placeholder.png"),
    }
    return render(request, "chat.html", context)
