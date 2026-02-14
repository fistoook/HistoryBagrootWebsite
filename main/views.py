import json
import os
import re
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import login, logout, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView
from django.http import HttpResponse, JsonResponse, HttpResponseNotFound
from django.shortcuts import render, redirect, get_object_or_404
from django.template.context_processors import csrf
from django.template.loader import render_to_string
from django.utils.decorators import method_decorator
from django.views import View
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.views.generic import TemplateView

from .forms import LoginForm, RegisterForm
from .models import QuizResult, UserProfile, MapProgress

User = get_user_model()

# דמויות היסטוריות לאווטר (תואם ל־user-system.js)
AVATAR_ICONS = {
    'churchill': '🎩',
    'roosevelt': '🤠',
    'naked_frog': '🐸',
    'einstein': '👨‍🔬',
    'florence': '🏥',
    'ada': '🔢',
    'joan': '⚔️',
    'eva': '👑',
}


def get_user_json(request):
    """נתוני משתמש ל־JS (להצגת כפתור פרופיל)."""
    if request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
        avatar = profile.avatar if profile else 'churchill'
        return {
            'isAuthenticated': True,
            'username': request.user.get_username(),
            'avatar': avatar,
            'avatarIcon': AVATAR_ICONS.get(avatar, '👤'),
        }
    return {'isAuthenticated': False, 'username': None, 'avatarIcon': '👤'}


def _encode_utf8_safe(text):
    """Encode to UTF-8, replacing surrogate code points so HttpResponse never fails."""
    if isinstance(text, bytes):
        return text
    return text.encode('utf-8', errors='replace').decode('utf-8')


def inject_auth_script(html_content, request):
    """מזריק סקריפט עם __USER__, __CSRF__ ועדכון כפתור פרופיל/התחברות."""
    user_data = json.dumps(get_user_json(request), ensure_ascii=False)
    csrf_token = get_token(request)
    # Use escaped backslash-u in JS so Python string has no surrogate code points (UTF-8 safe)
    update_header = """
    document.addEventListener('DOMContentLoaded', function() {
      var u = window.__USER__;
      var h = document.getElementById('userProfileHeader');
      var a = document.getElementById('authButtons');
      var actions = document.querySelector('.header-actions');
      if (actions && !a) {
        a = document.createElement('div');
        a.id = 'authButtons';
        a.className = 'auth-buttons';
        a.innerHTML = '<a href="/login/" class="cta-button">התחברות</a>';
        actions.appendChild(a);
      }
      if (actions && !h) {
        h = document.createElement('div');
        h.id = 'userProfileHeader';
        h.className = 'user-profile-header';
        h.style.display = 'none';
        h.innerHTML = '<a href="/profile/" class="profile-link profile-circle"><span id="userProfileIcon">👤</span><span id="userProfileName">משתמש</span></a>';
        actions.appendChild(h);
      }
      if (u && u.isAuthenticated && h) {
        h.style.display = 'flex';
        var nameEl = document.getElementById('userProfileName');
        var iconEl = document.getElementById('userProfileIcon');
        if (nameEl) nameEl.textContent = u.username || '';
        if (iconEl) iconEl.textContent = u.avatarIcon || '\\uD83D\\uDC64';
        h.querySelector('.profile-link') && h.querySelector('.profile-link').classList.add('profile-circle');
      }
      if (a) a.style.display = (u && u.isAuthenticated) ? 'none' : 'flex';
      if (h && (!u || !u.isAuthenticated)) h.style.display = 'none';
    });
    """
    script = '<script>window.__USER__ = %s; window.__CSRF__ = "%s";%s</script>' % (
        user_data,
        csrf_token.replace('\\', '\\\\').replace('"', '\\"'),
        update_header,
    )
    return html_content.replace('</body>', script + '\n</body>')


def serve_static_page(request, filename):
    """מגיש דף HTML סטטי (מהשורש) עם הזרקת auth."""
    base_dir = settings.BASE_DIR
    filepath = base_dir / filename
    if not filepath.is_file():
        return HttpResponseNotFound()
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception:
        return HttpResponseNotFound()
    # עדכון קישורים לדפים ל־URLs של Django
    replacements = [
        ('href="styles/', 'href="/styles/'),
        ('src="styles/', 'src="/styles/'),
        ('href="scripts/', 'href="/scripts/'),
        ('src="scripts/', 'src="/scripts/'),
        ('href="images/', 'href="/images/'),
        ('src="images/', 'src="/images/'),
        ('href="videos/', 'href="/videos/'),
        ('src="videos/', 'src="/videos/'),
        ('href="auth.html"', 'href="/login/"'),
        ('href="profile.html"', 'href="/profile/"'),
        ('href="index.html"', 'href="/"'),
        ('href="quizzes.html"', 'href="/quizzes/"'),
        ('href="topics.html"', 'href="/topics/"'),
        ('href="study-materials.html"', 'href="/study-materials/"'),
        ('href="about.html"', 'href="/about/"'),
        ('href="guide.html"', 'href="/guide/"'),
        ('href="timeline-map.html"', 'href="/timeline-map/"'),
        ('href="interactive-timeline.html"', 'href="/interactive-timeline/"'),
        ("window.location.href='timeline-map.html'", "window.location.href='/timeline-map/'"),
        ("window.location.href='topics.html'", "window.location.href='/topics/'"),
        ("window.location.href='quizzes.html'", "window.location.href='/quizzes/'"),
        ("window.location.href='study-materials.html'", "window.location.href='/study-materials/'"),
        ("window.location.href='about.html'", "window.location.href='/about/'"),
        ("window.location.href='guide.html'", "window.location.href='/guide/'"),
        ("window.location.href='interactive-timeline.html'", "window.location.href='/interactive-timeline/'"),
    ]
    for old, new in replacements:
        html = html.replace(old, new)
    # Add page-specific body class hooks for styling
    if filename == 'timeline-map.html':
        html = html.replace('<body dir="rtl">', '<body dir="rtl" class="timeline-map-page">')
    elif filename == 'index.html':
        html = html.replace('<body dir="rtl" class="home-page">', '<body dir="rtl" class="home-page">')
    else:
        html = html.replace('<body dir="rtl">', '<body dir="rtl" class="content-page">')
    # Unified header for every static page
    unified_header = render_to_string('partials/header.html', {'current_path': request.path}, request=request)
    html = re.sub(r'<header class="main-header">.*?</header>', unified_header, html, count=1, flags=re.DOTALL)
    html = inject_auth_script(html, request)
    # Ensure no surrogate code points (invalid in UTF-8) so encoding never fails
    html = _encode_utf8_safe(html)
    return HttpResponse(html, content_type='text/html; charset=utf-8')


class CustomLoginView(LoginView):
    """התחברות – עברית."""
    template_name = 'registration/login.html'
    form_class = LoginForm
    redirect_authenticated_user = True

    def get_success_url(self):
        next_url = self.request.GET.get('next', '/')
        return next_url or '/'


def register_view(request):
    """הרשמה."""
    if request.user.is_authenticated:
        return redirect('/')
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            avatar = form.cleaned_data.get('avatar') or 'churchill'
            UserProfile.objects.get_or_create(user=user, defaults={'avatar': avatar})
            login(request, user)
            messages.success(request, 'נרשמת בהצלחה!')
            return redirect('/')
        else:
            messages.error(request, 'תקן את השגיאות בטופס.')
    else:
        form = RegisterForm()
    return render(request, 'registration/register.html', {'form': form})


@login_required
def profile_view(request):
    """דף פרופיל – תוצאות חידונים של המשתמש."""
    results = QuizResult.objects.filter(user=request.user)[:50]
    profile = getattr(request.user, 'profile', None)
    avatar = (profile.avatar if profile else 'churchill')
    avatar_icon = AVATAR_ICONS.get(avatar, '👤')
    total_correct = sum(r.correct for r in QuizResult.objects.filter(user=request.user))
    total_quizzes = QuizResult.objects.filter(user=request.user).count()
    avg_score = 0
    if total_quizzes:
        avg_score = sum(r.score_percent for r in QuizResult.objects.filter(user=request.user)) / total_quizzes
    map_progress = MapProgress.objects.filter(user=request.user).first()
    map_completed = len(map_progress.completed_stations) if map_progress else 0
    map_points = map_progress.points if map_progress else 0
    map_correct = map_progress.correct_answers if map_progress else 0
    map_current_station = map_progress.current_station if map_progress else 1

    return render(request, 'main/profile.html', {
        'quiz_results': results,
        'avatar_icon': avatar_icon,
        'total_correct': total_correct,
        'total_quizzes': total_quizzes,
        'avg_score': round(avg_score, 1),
        'map_completed': map_completed,
        'map_points': map_points,
        'map_correct': map_correct,
        'map_current_station': map_current_station,
    })


def leaderboard_view(request):
    """דף מובילים – הטופ תלמידים לפי סכום תשובות נכונות."""
    from django.db.models import Sum, F, Value, IntegerField
    from django.db.models.functions import Coalesce
    leaderboard = (
        User.objects
        .annotate(
            quiz_correct=Coalesce(Sum('quiz_results__correct'), Value(0), output_field=IntegerField()),
            map_correct=Coalesce(F('map_progress__correct_answers'), Value(0), output_field=IntegerField()),
        )
        .annotate(total_correct=F('quiz_correct') + F('map_correct'))
        .filter(total_correct__isnull=False, total_correct__gt=0)
        .order_by('-total_correct')[:30]
    )
    return render(request, 'main/leaderboard.html', {'leaderboard': leaderboard})


@require_POST
@ensure_csrf_cookie
def api_save_quiz_result(request):
    """שמירת תוצאת חידון (רק למשתמש מחובר)."""
    if not request.user.is_authenticated:
        return JsonResponse({'ok': False, 'error': 'לא מחובר'}, status=401)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'error': 'נתונים לא תקינים'}, status=400)
    quiz_id = data.get('quiz_id') or ''
    quiz_title = data.get('quiz_title') or 'חידון'
    correct = int(data.get('correct', 0))
    total = int(data.get('total', 1))
    time_minutes = int(data.get('time_minutes', 0))
    if total <= 0:
        return JsonResponse({'ok': False, 'error': 'סך שאלות לא תקין'}, status=400)
    score_percent = round(100 * correct / total, 1)
    QuizResult.objects.create(
        user=request.user,
        quiz_id=quiz_id,
        quiz_title=quiz_title,
        correct=correct,
        total=total,
        score_percent=score_percent,
        time_minutes=time_minutes,
    )
    return JsonResponse({'ok': True})


@require_http_methods(["GET", "POST"])
def api_map_progress(request):
    """קריאה/שמירה של התקדמות מפת התחנות עבור משתמש מחובר."""
    if not request.user.is_authenticated:
        return JsonResponse({'ok': False, 'error': 'לא מחובר'}, status=401)

    progress, _ = MapProgress.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return JsonResponse({
            'ok': True,
            'progress': {
                'current_station': progress.current_station,
                'completed_stations': progress.completed_stations,
                'completed_super_stations': progress.completed_super_stations,
                'points': progress.points,
                'correct_answers': progress.correct_answers,
                'achievements': progress.achievements,
            }
        })

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'error': 'נתונים לא תקינים'}, status=400)

    progress.current_station = int(data.get('current_station', progress.current_station or 1))
    progress.completed_stations = data.get('completed_stations', progress.completed_stations) or []
    progress.completed_super_stations = data.get('completed_super_stations', progress.completed_super_stations) or []
    progress.points = int(data.get('points', progress.points or 0))
    progress.correct_answers = int(data.get('correct_answers', progress.correct_answers or 0))
    progress.achievements = data.get('achievements', progress.achievements) or []
    progress.save()
    return JsonResponse({'ok': True})


def home_view(request):
    """דף בית – מגיש את index.html עם הזרקת auth."""
    return serve_static_page(request, 'index.html')
