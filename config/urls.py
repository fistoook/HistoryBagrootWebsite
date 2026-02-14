from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('main.urls')),
]

# Serve project root static assets (styles, scripts, images) so existing HTML links work
if settings.DEBUG or True:
    urlpatterns += [
        path('styles/<path:path>', serve, {'document_root': settings.BASE_DIR / 'styles'}),
        path('scripts/<path:path>', serve, {'document_root': settings.BASE_DIR / 'scripts'}),
        path('images/<path:path>', serve, {'document_root': settings.BASE_DIR / 'images'}),
        path('videos/<path:path>', serve, {'document_root': settings.BASE_DIR / 'videos'}),
    ]
