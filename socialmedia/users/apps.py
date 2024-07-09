import contextlib

from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = "socialmedia.users"
    verbose_name = "Users"

    def ready(self):
        with contextlib.suppress(ImportError):
            import socialmedia.users.signals  # type: ignore[import] # noqa: F401
