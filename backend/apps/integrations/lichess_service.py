import requests

class LichessService:
    @staticmethod
    def get_user_profile(username: str):
        """
        Fetches public profile and rating data from Lichess API.
        URL: https://lichess.org/api/user/{username}
        """
        import urllib.parse
        if not username:
            return None
            
        safe_username = urllib.parse.quote(username)
        url = f"https://lichess.org/api/user/{safe_username}"
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                perfs = data.get('perfs', {})
                return {
                    'username': data.get('username'),
                    'blitz': perfs.get('blitz', {}).get('rating'),
                    'rapid': perfs.get('rapid', {}).get('rating'),
                    'classical': perfs.get('classical', {}).get('rating'),
                    'puzzle': perfs.get('puzzle', {}).get('rating'),
                }
            return None
        except Exception as e:
            print(f"Error fetching Lichess profile for {username}: {e}")
            return None

    @staticmethod
    def get_recent_games(username: str, max_games: int = 5):
        """
        Imports recent games played by user in PGN format.
        URL: https://lichess.org/api/games/user/{username}
        """
        import urllib.parse
        safe_username = urllib.parse.quote(username)
        url = f"https://lichess.org/api/games/user/{safe_username}"
        params = {
            'max': max_games,
            'moves': 'true',
            'pgnInJson': 'true',
            'clocks': 'false',
            'evals': 'true'
        }
        headers = {'Accept': 'application/x-ndjson'}

        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
            if response.status_code == 200:
                games = []
                # Lichess NDJSON format: line-separated JSON objects
                for line in response.text.strip().split('\n'):
                    if not line:
                        continue
                    try:
                        import json
                        game_data = json.loads(line)
                        
                        # Determine if user is white or black to extract their specific analysis
                        players_data = game_data.get('players', {})
                        user_color = 'white'
                        white_name = players_data.get('white', {}).get('user', {}).get('name', '')
                        if white_name.lower() != username.lower():
                            user_color = 'black'
                        
                        analysis = players_data.get(user_color, {}).get('analysis', {})
                        if not analysis and 'analysis' in game_data:
                            analysis = game_data.get('analysis') # fallback

                        games.append({
                            'id': game_data.get('id'),
                            'speed': game_data.get('speed'),
                            'perf': game_data.get('perf'),
                            'rated': game_data.get('rated'),
                            'players': {
                                'white': players_data.get('white', {}).get('user', {}).get('name', 'White'),
                                'black': players_data.get('black', {}).get('user', {}).get('name', 'Black'),
                            },
                            'winner': game_data.get('winner'),
                            'status': game_data.get('status'),
                            'pgn': game_data.get('pgn', ''),
                            'opening': game_data.get('opening', {}).get('name', '') if 'opening' in game_data else '',
                            'analysis': analysis,
                        })
                    except Exception:
                        pass
                return games
            return []
        except Exception as e:
            print(f"Error fetching Lichess games for {username}: {e}")
            return []
