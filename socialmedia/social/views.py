from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
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
from .models import Comment
from .models import Like
from .models import Notification
from .models import Post
from .models import User
from .models import UserProfile

PLACEHOLDER_IMAGE_URL = "https://via.placeholder.com/150"


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

    paginator = Paginator(latest_post_list, 10)
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)

    posts_with_comments = [
        (
            post,
            post.comments.filter(deleted=False).order_by("-created")[:2],
            post.likes.last().user.username if post.likes.exists() else "",
        )
        for post in page_obj
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
        "page_obj": page_obj,
    }
    return render(request, "pages/profile.html", context)


@login_required
def my_profile(request, username):
    user = get_object_or_404(User, username=username)
    posts = Post.objects.filter(
        user=user,
        image__isnull=False,
        deleted=False,
    ).order_by("-created")
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
    Notification.objects.create(
        user=user_to_follow,
        text="started following you.",
        trigger_user=request.user,
        type="follow",
    )
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
            "profile_image": user.profile.profile_image.url
            if user.profile.profile_image
            else PLACEHOLDER_IMAGE_URL,
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
    posts_to_remove = list(
        Post.objects.filter(user=user_to_unfollow).values_list("id", flat=True),
    )
    suggestions = (
        User.objects.exclude(id=request.user.id)
        .exclude(id__in=request.user.profile.following.all())
        .order_by("?")[:5]
    )
    suggestion_list = [
        {
            "id": user.id,
            "username": user.username,
            "profile_image": user.profile.profile_image.url
            if user.profile.profile_image
            else PLACEHOLDER_IMAGE_URL,
            "followers_count": user.followers.count(),
        }
        for user in suggestions
    ]
    return JsonResponse(
        {
            "success": True,
            "followers_count": followers_count,
            "suggestions": suggestion_list,
            "posts_to_remove": posts_to_remove,
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
            else PLACEHOLDER_IMAGE_URL,
            "text": post.text,
            "image": post.image.url if post.image else "",
            "video": post.video.url if post.video else "",
            "youtube_link": post.youtube_link,
            "created": post.created.strftime("%b %d, %Y"),
            "likes_count": post.likes.count(),
            "last_liked_user": post.likes.last().user.username
            if post.likes.exists()
            else "",
            "comments": [
                {
                    "id": comment.id,
                    "username": comment.user.username,
                    "text": comment.text,
                    "created": comment.created.strftime("%b %d, %Y"),
                    "profile_image": comment.user.profile.profile_image.url
                    if comment.user.profile.profile_image
                    else None,
                }
                for comment in post.comments.filter(deleted=False).order_by(
                    "-created",
                )[:2]
            ],
            "comments_disabled": post.comments_disabled,
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
            Notification.objects.create(
                user=post.user,
                text="commented on your post.",
                trigger_user=request.user,
                type="comment",
                post=post,
            )
            return redirect("social:detail", post_id=post_id)
    else:
        comment_form = CommentForm()

    comments = post.comments.filter(deleted=False).order_by("-created")
    last_liked_user = post.likes.last().user.username if post.likes.exists() else ""

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
                if post.user != user:
                    Notification.objects.create(
                        user=post.user,
                        text="liked your post.",
                        trigger_user=user,
                        type="like",
                        post=post,
                    )
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
def fetch_comments(request, post_id):
    post = get_object_or_404(Post, pk=post_id, deleted=False)
    comments = post.comments.filter(deleted=False).order_by("-created")
    comments_data = [
        {
            "id": comment.id,
            "username": comment.user.username,
            "text": comment.text,
            "created": comment.created.strftime("%b %d, %Y"),
            "profile_image": comment.user.profile.profile_image.url
            if comment.user.profile.profile_image
            else None,
        }
        for comment in comments
    ]
    return JsonResponse({"comments": comments_data})


@login_required
@require_POST
def delete_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, user=request.user)
    post.deleted = True
    post.save()
    return JsonResponse({"success": True})


@login_required
@require_POST
def delete_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id, user=request.user)
    comment.deleted = True
    comment.save()
    return JsonResponse({"success": True})


@login_required
@require_POST
def edit_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, user=request.user)
    form = PostForm(request.POST, request.FILES, instance=post)
    if form.is_valid():
        form.save()
        updated_post = {
            "text": post.text,
            "image": post.image.url if post.image else "",
            "video": post.video.url if post.video else "",
            "youtube_link": post.youtube_link,
        }
        return JsonResponse({"success": True, "post": updated_post})
    return JsonResponse({"success": False, "errors": form.errors})


@login_required
@require_POST
def disable_comments(request, post_id):
    post = get_object_or_404(Post, id=post_id, user=request.user)
    post.comments_disabled = not post.comments_disabled
    post.save()
    return JsonResponse({"success": True, "comments_disabled": post.comments_disabled})


@login_required
def get_notifications(request):
    notifications = request.user.notifications.all()
    notifications_list = []

    for n in notifications:
        profile_image_url = (
            n.trigger_user.profile.profile_image.url
            if n.trigger_user.profile.profile_image
            else PLACEHOLDER_IMAGE_URL
        )

        notification_data = {
            "text": n.text,
            "created": n.created.strftime("%b %d, %Y"),
            "is_read": n.is_read,
            "profile_image": profile_image_url,
            "trigger_user": n.trigger_user.username,
            "trigger_user_id": n.trigger_user.id,
            "type": n.type,
            "is_following": request.user.profile.following.filter(
                id=n.trigger_user.id,
            ).exists(),
        }

        if n.type == "like" and n.post:
            post_likes_count = n.post.likes.count()
            if post_likes_count > 1:
                notification_data["text"] = (
                    f"and {post_likes_count - 1} others liked your post"
                )

        notifications_list.append(notification_data)

    return JsonResponse(notifications_list, safe=False)


@login_required
@require_POST
def clear_notifications(request):
    request.user.notifications.all().delete()
    return JsonResponse({"success": True})


@login_required
def get_followers(request, user_id):
    user = get_object_or_404(User, id=user_id)
    followers = user.profile.following.all()
    followers_data = [
        {
            "username": follower.username,
            "profile_image": follower.profile.profile_image.url
            if follower.profile.profile_image
            else PLACEHOLDER_IMAGE_URL,
            "full_name": f"{follower.profile.first_name} {follower.profile.last_name}"
            if follower.profile.first_name and follower.profile.last_name
            else "",
        }
        for follower in followers
    ]
    return JsonResponse({"followers": followers_data})


@login_required
def get_following(request, user_id):
    user = get_object_or_404(User, id=user_id)
    following = user.profile.following.all()
    following_data = [
        {
            "username": follow.username,
            "profile_image": follow.profile.profile_image.url
            if follow.profile.profile_image
            else PLACEHOLDER_IMAGE_URL,
            "full_name": f"{follow.profile.first_name} {follow.profile.last_name}"
            if follow.profile.first_name and follow.profile.last_name
            else "",
        }
        for follow in following
    ]
    return JsonResponse({"following": following_data})
