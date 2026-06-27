import os
import redis
from django.http import JsonResponse
from django.db import connections

def health_check(request):
    health_status = {
        "status": "healthy",
        "database": "unknown",
        "redis": "unknown"
    }
    
    # Check Database
    try:
        db_conn = connections['default']
        db_conn.cursor()
        health_status["database"] = "connected"
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["database"] = f"failed: {str(e)}"

    # Check Redis
    try:
        redis_url = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1')
        r = redis.Redis.from_url(redis_url, socket_timeout=2)
        r.ping()
        health_status["redis"] = "connected"
    except Exception as e:
        # We don't fail the whole health check if Redis is down unless critical,
        # but for channels it's important. So set to unhealthy.
        health_status["status"] = "unhealthy"
        health_status["redis"] = f"failed: {str(e)}"

    status_code = 200 if health_status["status"] == "healthy" else 503
    return JsonResponse(health_status, status=status_code)
