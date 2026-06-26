from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from blogs.models import BlogCategory, BlogPost
from blogs.serializers import BlogCategorySerializer, BlogPostSerializer
from authentication.permissions import IsAcademyManager, IsCoach, IsManagerOrCoach


class BlogCategoryViewSet(viewsets.ModelViewSet):
    queryset = BlogCategory.objects.all().order_by('name')
    serializer_class = BlogCategorySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsManagerOrCoach()]
        return [permissions.AllowAny()]


class BlogPostViewSet(viewsets.ModelViewSet):
    serializer_class = BlogPostSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsManagerOrCoach()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user
        # Authenticated Managers and Coaches can see everything (including drafts)
        if user and user.is_authenticated and (user.role == 'manager' or user.role == 'coach'):
            return BlogPost.objects.all().order_by('-created_at')
        
        # Public users and students can only see published articles
        return BlogPost.objects.filter(published_status=True).order_by('-published_at')

    def perform_create(self, serializer):
        published_status = self.request.data.get('published_status', False)
        published_at = timezone.now() if published_status else None
        serializer.save(
            author=self.request.user,
            published_status=published_status,
            published_at=published_at
        )

    def perform_update(self, serializer):
        published_status = self.request.data.get('published_status', False)
        # If toggling published from False to True, update published_at date
        instance = self.get_object()
        published_at = instance.published_at
        if published_status and not instance.published_status:
            published_at = timezone.now()
        elif not published_status:
            published_at = None
            
        serializer.save(
            published_status=published_status,
            published_at=published_at
        )
