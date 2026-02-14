from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User


class RegisterForm(UserCreationForm):
    """טופס הרשמה בעברית."""
    username = forms.CharField(
        label='שם משתמש',
        max_length=150,
        widget=forms.TextInput(attrs={'placeholder': 'בחר שם משתמש', 'class': 'form-control'})
    )
    email = forms.EmailField(
        label='דוא"ל',
        widget=forms.EmailInput(attrs={'placeholder': 'הכנס את הדוא"ל שלך', 'class': 'form-control'})
    )
    password1 = forms.CharField(
        label='סיסמה',
        widget=forms.PasswordInput(attrs={'placeholder': 'לפחות 8 תווים', 'class': 'form-control'})
    )
    password2 = forms.CharField(
        label='אימות סיסמה',
        widget=forms.PasswordInput(attrs={'placeholder': 'חזור על הסיסמה', 'class': 'form-control'})
    )
    avatar = forms.CharField(
        label='דמות היסטורית',
        required=False,
        widget=forms.HiddenInput()
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2', 'avatar')


class LoginForm(AuthenticationForm):
    """טופס התחברות בעברית."""
    username = forms.CharField(
        label='שם משתמש או דוא"ל',
        widget=forms.TextInput(attrs={'placeholder': 'שם משתמש או דוא"ל', 'class': 'form-control'})
    )
    password = forms.CharField(
        label='סיסמה',
        widget=forms.PasswordInput(attrs={'placeholder': 'סיסמה', 'class': 'form-control'})
    )
