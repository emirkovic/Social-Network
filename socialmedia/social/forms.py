from django import forms

from .models import Comment
from .models import Post


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ["text", "image", "video"]


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ["text"]
