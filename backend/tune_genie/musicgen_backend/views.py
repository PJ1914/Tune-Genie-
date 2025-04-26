from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
from .GENAI import SceneToTune

logger = logging.getLogger(__name__)

class GenerateMusicView(APIView):
    def post(self, request):
        logger.info("Received request: %s %s", request.method, request.path)
        logger.info("Request data: %s", request.data)
        try:
            scene_text = request.data.get("scene", "")
            session_id = request.data.get("session_id")
            if not scene_text:
                logger.error("Scene description is missing")
                return Response({"error": "Scene description is required"}, status=status.HTTP_400_BAD_REQUEST)
            engine = SceneToTune()
            result = engine.handle_query(scene_text, session_id)
            logger.info("Generated result: %s", result)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error processing request: %s", str(e))
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)