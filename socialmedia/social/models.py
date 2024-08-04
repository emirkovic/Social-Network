from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

User = get_user_model()


def validate_word_count(value):
    max_words = 10
    max_chars = 20
    num_words = len(value.split())
    num_chars = len(value)

    if num_words > max_words:
        message = f"This field cannot contain more than {max_words} words."
        raise ValidationError(message)

    if num_chars > max_chars:
        message = f"This field cannot contain more than {max_chars} characters."
        raise ValidationError(message)


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    profile_image = models.ImageField(upload_to="profiles/", blank=True, null=True)
    bio = models.TextField(blank=True, default="")
    location = models.CharField(max_length=255, blank=True, default="")
    first_name = models.CharField(max_length=30, blank=True, default="")
    last_name = models.CharField(max_length=30, blank=True, default="")
    following = models.ManyToManyField(User, related_name="followers", blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.user.username

    @property
    def followers_count(self):
        return self.user.followers.count()

    @property
    def following_count(self):
        return self.following.count()


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    image = models.ImageField(upload_to="posts/images/", blank=True, null=True)
    video = models.FileField(upload_to="posts/videos/", blank=True, null=True)
    youtube_link = models.URLField(blank=True, default="")
    text = models.TextField(blank=True, default="", validators=[validate_word_count])
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    deleted = models.BooleanField(default=False)
    comments_disabled = models.BooleanField(default=False)

    def __str__(self):
        return f"Post by {self.user.username}"


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    text = models.TextField(blank=True, default="", validators=[validate_word_count])
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.post.id}"


class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likes")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    created = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("user", "post")

    def __str__(self):
        return f"Like by {self.user.username} on {self.post.id}"


class Notification(models.Model):
    user = models.ForeignKey(
        User,
        related_name="notifications",
        on_delete=models.CASCADE,
    )
    trigger_user = models.ForeignKey(
        User,
        related_name="triggered_notifications",
        on_delete=models.CASCADE,
        default=1,
    )
    text = models.CharField(max_length=255)
    created = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created"]

    def __str__(self):
        return f"Notification for {self.user.username}: {self.text}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
