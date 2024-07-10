from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template import loader

from .models import Post


def index(request):
    latest_post_list = Post.objects.filter(deleted=False).order_by("-created")
    template = loader.get_template("pages/profile.html")
    context = {
        "latest_post_list": latest_post_list,
    }
    return HttpResponse(template.render(context, request))


def detail(request, post_id):
    post_detail = get_object_or_404(Post, pk=post_id, deleted=False)
    template = loader.get_template("pages/post_detail.html")
    context = {
        "post_detail": post_detail,
    }
    return HttpResponse(template.render(context, request))
