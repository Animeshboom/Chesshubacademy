from rest_framework import viewsets, permissions
from tournaments.models import Tournament
from tournaments.serializers import TournamentSerializer
from authentication.permissions import IsAcademyManager, IsCoach, IsManagerOrCoach

class TournamentViewSet(viewsets.ModelViewSet):
    queryset = Tournament.objects.all().order_by('-start_time')
    serializer_class = TournamentSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsManagerOrCoach()]

