from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db import transaction
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

    following_users = request.user.profile.following.all()
    latest_post_list = Post.objects.filter(
        Q(user__in=following_users) | Q(user=request.user),
        deleted=False,
    ).order_by("-created")

    posts_with_comments = [
        (
            post,
            post.comments.filter(deleted=False).order_by("-created")[:2],
            post.likes.last().user.username if post.likes.count() > 0 else "",
        )
        for post in latest_post_list
    ]

    suggestions = (
        User.objects.exclude(id=request.user.id)
        .exclude(id__in=following_users)
        .order_by("?")[:5]
    )
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
    followers_count = user_to_follow.followers.count()
    suggestions = (
        User.objects.exclude(id=request.user.id)
        .exclude(id__in=request.user.profile.following.all())
        .order_by("?")[:5]
    )
    suggestion_list = [
        {
            "id": user.id,
            "username": user.username,
            "followers_count": user.followers.count(),
        }
        for user in suggestions
    ]
    return JsonResponse(
        {
            "success": True,
            "followers_count": followers_count,
            "suggestions": suggestion_list,
        },
    )


@login_required
@require_POST
def unfollow(request, user_id):
    user_to_unfollow = get_object_or_404(User, id=user_id)
    request.user.profile.following.remove(user_to_unfollow)
    followers_count = user_to_unfollow.followers.count()
    suggestions = (
        User.objects.exclude(id=request.user.id)
        .exclude(id__in=request.user.profile.following.all())
        .order_by("?")[:5]
    )
    suggestion_list = [
        {
            "id": user.id,
            "username": user.username,
            "followers_count": user.followers.count(),
        }
        for user in suggestions
    ]
    return JsonResponse(
        {
            "success": True,
            "followers_count": followers_count,
            "suggestions": suggestion_list,
        },
    )


@login_required
def fetch_new_posts(request, user_id):
    user = get_object_or_404(User, id=user_id)
    posts = Post.objects.filter(user=user, deleted=False).order_by("-created")
    posts_data = [
        {
            "id": post.id,
            "username": post.user.username,
            "profile_image": post.user.profile.profile_image.url
            if post.user.profile.profile_image
            else "https://via.placeholder.com/150",
            "text": post.text,
            "image": post.image.url if post.image else "",
            "video": post.video.url if post.video else "",
            "youtube_link": post.youtube_link,
            "created": post.created.strftime("%b %d, %Y"),
            "likes_count": post.likes.count(),
            "last_liked_user": post.likes.last().user.username
            if post.likes.count() > 0
            else "",
            "comments": [
                {
                    "username": comment.user.username,
                    "text": comment.text,
                    "created": comment.created.strftime("%b %d, %Y"),
                }
                for comment in post.comments.filter(deleted=False)
            ],
        }
        for post in posts
    ]

    return JsonResponse({"posts": posts_data})


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

    context = {"form": form}
    return render(request, "pages/settings.html", context)


@login_required
@require_POST
def like_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    user = request.user

    try:
        with transaction.atomic():
            existing_like = (
                Like.objects.select_for_update().filter(user=user, post=post).first()
            )
            if existing_like:
                existing_like.delete()
                user_liked = False
            else:
                Like.objects.create(user=user, post=post)
                user_liked = True

            total_likes = post.likes.count()
            last_liked_user = (
                post.likes.last().user.username if post.likes.exists() else ""
            )

            response_data = {
                "total_likes": total_likes,
                "user_liked": user_liked,
                "last_liked_user": last_liked_user,
            }
            return JsonResponse(response_data)
    except IntegrityError:
        return JsonResponse(
            {"error": "Like operation failed due to a race condition."},
            status=400,
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


@login_required
@require_POST
def delete_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, user=request.user)
    post.delete()
    return JsonResponse({"success": True})
