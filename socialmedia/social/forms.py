from django import forms

from .models import Comment
from .models import Post
from .models import UserProfile


class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ["profile_image", "bio", "location", "first_name", "last_name"]


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ["text", "image", "video", "youtube_link"]

    def clean(self):
        cleaned_data = super().clean()
        text = cleaned_data.get("text")
        image = cleaned_data.get("image")
        video = cleaned_data.get("video")
        youtube_link = cleaned_data.get("youtube_link")

        post_text_error = "Post text cannot be empty."

        upload_error = "You must upload an image or a video or a youtube link."

        if not text.strip():
            raise forms.ValidationError(post_text_error)

        if not image and not video and not youtube_link:
            raise forms.ValidationError(upload_error)

        return cleaned_data


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ["text"]

    def clean_text(self):
        text = self.cleaned_data.get("text")
        comment_text_error = "Comment text cannot be empty."
        if not text.strip():
            raise forms.ValidationError(comment_text_error)
        return text
