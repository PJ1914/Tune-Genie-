from django.urls import path
from .views import GenerateMusicView
from django.conf import settings

urlpatterns = [
    path('generate/', GenerateMusicView.as_view(), name='generate_music'),
]