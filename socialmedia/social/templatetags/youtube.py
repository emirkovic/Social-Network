import re

from django import template

register = template.Library()


@register.filter
def youtube_id(value):
    """
    Extracts YouTube ID from a URL
    """
    pattern = r"(https?://)?(www\.)?(youtube\.com|youtu\.be)/(watch\?v=)?(?P<id>[^&]+)"
    match = re.match(pattern, value)
    return match.group("id") if match else value
