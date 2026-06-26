from django.contrib import admin
from tournaments.models import Tournament

@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'start_time', 'status', 'lichess_tournament_url')
    list_filter = ('status',)
