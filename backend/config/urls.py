from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from config.views import health_check

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    
    # API v1 routes
    path('api/v1/auth/', include('authentication.urls')),
    path('api/v1/academy/', include('academy.urls')),
    path('api/v1/homework/', include('homework.urls')),
    path('api/v1/gamification/', include('gamification.urls')),
    path('api/v1/blogs/', include('blogs.urls')),
    path('api/v1/tournaments/', include('tournaments.urls')),
    path('api/v1/classroom/', include('classroom.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
