from django.urls import path, include
from rest_framework.routers import DefaultRouter
from blogs.views import BlogCategoryViewSet, BlogPostViewSet

router = DefaultRouter()
router.register('categories', BlogCategoryViewSet, basename='blog_category')
router.register('posts', BlogPostViewSet, basename='blog_post')

urlpatterns = [
    path('', include(router.urls)),
]
