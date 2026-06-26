from rest_framework import serializers
from blogs.models import BlogCategory, BlogPost
from authentication.serializers import UserSerializer


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ('id', 'name', 'slug')


class BlogPostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category_detail = BlogCategorySerializer(source='category', read_only=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=BlogCategory.objects.all(), write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = BlogPost
        fields = (
            'id', 'title', 'slug', 'category', 'category_detail', 'content',
            'featured_image_url', 'seo_title', 'seo_description', 'seo_keywords',
            'author', 'published_status', 'published_at', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'slug', 'published_at', 'created_at', 'updated_at')

    def create(self, validated_data):
        # Automatically generate slug if not provided, or derive from title
        title = validated_data.get('title')
        from django.utils.text import slugify
        slug = slugify(title)
        
        # Ensure slug is unique
        original_slug = slug
        counter = 1
        while BlogPost.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
            
        validated_data['slug'] = slug
        return super().create(validated_data)
