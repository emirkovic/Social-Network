from django import forms

from .models import Comment
from .models import Post
from .models import UserProfile


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ["image", "video", "text"]


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ["text"]


class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ["profile_image"]
