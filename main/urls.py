from django.urls import path
from django.contrib.auth.views import LogoutView
from . import views

urlpatterns = [
    path('', views.home_view),
    path('login/', views.CustomLoginView.as_view(), name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('leaderboard/', views.leaderboard_view, name='leaderboard'),
    path('api/quiz-result/', views.api_save_quiz_result),
    path('api/map-progress/', views.api_map_progress),
    # דפים סטטיים – נשמרים כמו שהם, מוגשים עם הזרקת auth
    path('quizzes/', lambda r: views.serve_static_page(r, 'quizzes.html')),
    path('topics/', lambda r: views.serve_static_page(r, 'topics.html')),
    path('study-materials/', lambda r: views.serve_static_page(r, 'study-materials.html')),
    path('about/', lambda r: views.serve_static_page(r, 'about.html')),
    path('guide/', lambda r: views.serve_static_page(r, 'guide.html')),
    path('timeline-map/', lambda r: views.serve_static_page(r, 'timeline-map.html')),
    path('interactive-timeline/', lambda r: views.serve_static_page(r, 'interactive-timeline.html')),
]
