from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.shortcuts import redirect
from django.shortcuts import render
from django.views.decorators.http import require_POST

from .forms import CommentForm
from .forms import PostForm
from .forms import UserProfileForm
from .models import Like
from .models import Post
from .models import User
from .models import UserProfile


@login_required
def index(request):
    if request.method == "POST":
        post_form = PostForm(request.POST, request.FILES)
        if post_form.is_valid():
            post = post_form.save(commit=False)
            post.user = request.user
            post.save()
            return redirect("social:index")
    else:
        post_form = PostForm()

    latest_post_list = Post.objects.filter(deleted=False).order_by("-created")
    posts_with_comments = []
    for post in latest_post_list:
        comments = post.comments.filter(deleted=False).order_by("-created")[:2]
        last_liked_user = (
            post.likes.last().user.username if post.likes.count() > 0 else ""
        )
        posts_with_comments.append((post, comments, last_liked_user))

    suggestions = User.objects.exclude(id=request.user.id)[:5]
    context = {
        "posts_with_comments": posts_with_comments,
        "post_form": post_form,
        "suggestions": suggestions,
        "user": request.user,
    }
    return render(request, "pages/profile.html", context)


@login_required
def my_profile(request, username):
    user = get_object_or_404(User, username=username)
    posts = Post.objects.filter(user=user, image__isnull=False, deleted=False).order_by(
        "-created",
    )
    followers_count = user.followers.count()
    following_count = user.profile.following.count()
    context = {
        "user": user,
        "posts": posts,
        "followers_count": followers_count,
        "following_count": following_count,
    }
    return render(request, "pages/my_profile.html", context)


@login_required
@require_POST
def follow(request, user_id):
    user_to_follow = get_object_or_404(User, id=user_id)
    request.user.profile.following.add(user_to_follow)
    return JsonResponse(
        {"success": True, "followers_count": user_to_follow.followers.count()},
    )


@login_required
@require_POST
def unfollow(request, user_id):
    user_to_unfollow = get_object_or_404(User, id=user_id)
    request.user.profile.following.remove(user_to_unfollow)
    return JsonResponse(
        {"success": True, "followers_count": user_to_unfollow.followers.count()},
    )


@login_required
def detail(request, post_id):
    post = get_object_or_404(Post, pk=post_id, deleted=False)
    if request.method == "POST":
        comment_form = CommentForm(request.POST)
        if comment_form.is_valid():
            comment = comment_form.save(commit=False)
            comment.post = post
            comment.user = request.user
            comment.save()
            return redirect("social:detail", post_id=post_id)
    else:
        comment_form = CommentForm()

    comments = post.comments.filter(deleted=False).order_by("-created")
    last_liked_user = post.likes.last().user.username if post.likes.count() > 0 else ""

    context = {
        "post_detail": post,
        "comment_form": comment_form,
        "comments": comments,
        "last_liked_user": last_liked_user,
    }
    return render(request, "pages/post_detail.html", context)


@login_required
def settings_view(request):
    user_profile, created = UserProfile.objects.get_or_create(user=request.user)
    if request.method == "POST":
        form = UserProfileForm(request.POST, request.FILES, instance=user_profile)
        if form.is_valid():
            form.save()
            return redirect("social:index")
    else:
        form = UserProfileForm(instance=user_profile)

    context = {
        "form": form,
    }
    return render(request, "pages/settings.html", context)


@login_required
@require_POST
def like_post(request, post_id):
    post = get_object_or_404(Post, pk=post_id, deleted=False)
    like, created = Like.objects.get_or_create(user=request.user, post=post)
    if not created:
        like.delete()
    total_likes = post.likes.count()
    last_liked_user = post.likes.last().user.username if total_likes > 0 else None
    return JsonResponse(
        {"total_likes": total_likes, "last_liked_user": last_liked_user},
    )


@login_required
def search_users(request):
    query = request.GET.get("q")
    users = []
    if query:
        users = User.objects.filter(
            Q(username__icontains=query)
            | Q(profile__first_name__icontains=query)
            | Q(profile__last_name__icontains=query),
        )
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        user_list = [{"username": user.username} for user in users]
        return JsonResponse({"users": user_list})
    return render(
        request,
        "pages/search_results.html",
        {"users": users, "query": query},
    )
