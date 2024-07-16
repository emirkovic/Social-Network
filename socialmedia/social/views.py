from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.shortcuts import redirect
from django.shortcuts import render
from django.views.decorators.http import require_POST

from .forms import CommentForm
from .forms import PostForm
from .models import Like
from .models import Post


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

    context = {
        "posts_with_comments": posts_with_comments,
        "post_form": post_form,
    }
    return render(request, "pages/profile.html", context)


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
