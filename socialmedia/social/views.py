from django.shortcuts import get_object_or_404
from django.shortcuts import redirect
from django.shortcuts import render

from .forms import CommentForm
from .forms import PostForm
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
        posts_with_comments.append((post, comments))

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

    context = {
        "post_detail": post,
        "comment_form": comment_form,
        "comments": comments,
    }
    return render(request, "pages/post_detail.html", context)
