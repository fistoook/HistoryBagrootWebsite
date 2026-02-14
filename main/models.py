from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    """פרופיל משתמש מורחב - אווטר וכינוי."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    avatar = models.CharField(max_length=50, default='churchill', blank=True)
    avatar_title = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = 'פרופיל'
        verbose_name_plural = 'פרופילים'

    def __str__(self):
        return self.user.get_username()


class QuizResult(models.Model):
    """תוצאת חידון של תלמיד."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_results')
    quiz_id = models.CharField(max_length=80)
    quiz_title = models.CharField(max_length=200)
    correct = models.PositiveIntegerField()
    total = models.PositiveIntegerField()
    score_percent = models.FloatField()
    time_minutes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'תוצאת חידון'
        verbose_name_plural = 'תוצאות חידונים'

    def __str__(self):
        return f"{self.user.get_username()} – {self.quiz_title}: {self.correct}/{self.total}"


class MapProgress(models.Model):
    """שמירת התקדמות מפת התחנות בפרופיל המשתמש."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='map_progress')
    current_station = models.PositiveIntegerField(default=1)
    completed_stations = models.JSONField(default=list, blank=True)
    completed_super_stations = models.JSONField(default=list, blank=True)
    points = models.PositiveIntegerField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)
    achievements = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'התקדמות מפה'
        verbose_name_plural = 'התקדמות מפה'

    def __str__(self):
        return f"{self.user.get_username()} - תחנה {self.current_station}"
