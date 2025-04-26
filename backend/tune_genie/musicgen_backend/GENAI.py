import os
import uuid
import logging
from datetime import datetime
import torch
import numpy as np
import soundfile as sf
from pymongo import MongoClient
from dotenv import load_dotenv
import google.generativeai as genai
from audiocraft.models import MusicGen

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SceneToTune:
    def __init__(self):
        if not GEMINI_API_KEY or not MONGO_URI:
            raise ValueError("Missing environment variables")

        # Gemini setup
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
                "response_mime_type": "text/plain",
            },
            system_instruction=self.get_instruction(),
        )

        # MongoDB
        self.client = MongoClient(MONGO_URI)
        self.db = self.client['SceneToTuneDB']
        self.sessions = self.db['sessions']

        # MusicGen
        

    @staticmethod
    def get_instruction():
        return """You are a music assistant that specializes in traditional Indian classical compositions and ambient scene-based scoring.

When a user describes a scene, follow these steps:

1. Understand the emotional, environmental, and cultural elements of the scene.
2. Choose a suitable raga or mood (e.g., Bhairavi for sorrow, Bhairav for devotion, Yaman for romance).
3. Select appropriate Indian instruments (e.g., sitar, tabla, bansuri, harmonium, tanpura, veena, sarangi, violin).
4. Structure the music prompt with:
   - Make tabla or bansuri or mridangam the main instrument.
   - The tune should not drag, it should be lively and engaging.
   - Use a mix of traditional and modern elements.
   - Starting instrument and time
   - Additional instruments and their timing (layered)
   - Tempo description (slow/medium/fast)
   - Mood (joyful, meditative, celebratory, etc.)
   - Ending notes (fade-out, energetic climax, sustained note)
5. Prompt should be understandable by a music generation model like MusicGen.
6. Limit total length to 10 seconds.
7. Complete 10 seconds of music should not have any silence or gaps.
8. Use the following format for the response:

Format the response like this:
---
🎵 Music Prompt:
A 10-second romantic melody in Raag Yaman. Start with bansuri at a slow tempo. Add tabla at 2s to introduce rhythm. At 5s, sitar enters with the main melody. Harmonium fills the background from 7s. The piece ends with all instruments harmonizing and fading softly.

🧠 Explanation:
The scene evokes tranquility and romance. Raag Yaman enhances the serene atmosphere. Bansuri represents the natural calm, while sitar conveys deep emotion. Tabla adds gentle rhythm, and harmonium gives warmth. The slow tempo reflects peaceful surroundings.
---
If the query is a general question about music and you well being just answer it without any music generation.
"""

    def init_musicgen(self, model_name="facebook/musicgen-small"):
        try:
            logger.info("Loading MusicGen model...")
            model = MusicGen.get_pretrained(model_name, device="cpu")
            model.set_generation_params(duration=10, temperature=0.7, top_k=250, top_p=0.95, use_sampling=True)
            return model
        except Exception as e:
            logger.error(f"Error loading MusicGen: {e}")
            raise

    def generate_audio(self, music_prompt, session_id, num_variations=3):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        audio_dir = os.path.join('media', 'audio', session_id)
        os.makedirs(audio_dir, exist_ok=True)

        wav_outputs = self.musicgen_model.generate(
            descriptions=[music_prompt] * num_variations,
            progress=True
        )

        audio_urls = []
        for idx, audio in enumerate(wav_outputs):
            audio_np = audio.cpu().numpy()
            if audio_np.ndim > 1:
                audio_np = audio_np[0]

            filename = f"{timestamp}_{idx+1}.wav"
            filepath = os.path.join(audio_dir, filename)
            sf.write(filepath, audio_np, self.musicgen_model.sample_rate, format='WAV', subtype='PCM_16')

            audio_url = f"/media/audio/{session_id}/{filename}"
            audio_urls.append(audio_url)
            logger.info(f"Saved audio to {filepath}")

        return audio_urls

    def parse_gemini(self, text):
        try:
            start = text.index("🎵 Music Prompt:") + len("🎵 Music Prompt:")
            mid = text.index("🧠 Explanation:")
            prompt = text[start:mid].strip()
            explanation = text[mid + len("🧠 Explanation:"):].strip()
            return prompt, explanation
        except ValueError:
            return None, text

    def handle_query(self, user_input, session_id=None):
        session_id = session_id or str(uuid.uuid4())
        session = self.sessions.find_one({"_id": session_id})
        history = session["history"] if session else []

        chat = self.model.start_chat(history=history)
        response = chat.send_message(user_input)
        model_response = response.text.strip()

        music_prompt, explanation = self.parse_gemini(model_response)

        if music_prompt:
            self.musicgen_model = self.init_musicgen()
            audio_urls = self.generate_audio(music_prompt, session_id)
            response_data = {
                "session_id": session_id,
                "explanation": explanation,
                "audio_urls": audio_urls
            }
        else:
            response_data = {
                "session_id": session_id,
                "explanation": None,
                "audio_urls": [],
                "raw_response": model_response
            }

        # Save chat history
        self.sessions.update_one(
            {"_id": session_id},
            {"$set": {"history": history + [
                {"role": "user", "parts": [{"text": user_input}]},
                {"role": "model", "parts": [{"text": model_response}]}
            ]}},
            upsert=True
        )

        return response_data

    def __del__(self):
        try:
            if hasattr(self, 'client'):
                self.client.close()
            if hasattr(self, 'musicgen_model'):
                del self.musicgen_model
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception:
            pass
