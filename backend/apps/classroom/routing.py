from django.urls import re_path
from classroom import consumers

websocket_urlpatterns = [
    re_path(r'ws/classroom/(?P<session_id>[^/]+)/$', consumers.ClassroomConsumer.as_asgi()),
]
