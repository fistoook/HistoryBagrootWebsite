from django.contrib import admin
from .models import UserProfile, QuizResult, MapProgress


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'avatar', 'avatar_title')


@admin.register(QuizResult)
class QuizResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz_title', 'correct', 'total', 'score_percent', 'created_at')
    list_filter = ('quiz_id', 'created_at')


@admin.register(MapProgress)
class MapProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'current_station', 'points', 'correct_answers', 'updated_at')
