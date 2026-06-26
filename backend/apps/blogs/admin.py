from django.contrib import admin
from blogs.models import BlogCategory, BlogPost

@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category', 'author', 'published_status', 'published_at', 'created_at')
    list_filter = ('published_status', 'category', 'author')
    prepopulated_fields = {'slug': ('title',)}
