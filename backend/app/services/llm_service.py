import google.generativeai as genai
from app.config import settings
import os

class LLMService:
    def __init__(self):
        # Prefer LLM_API_KEY from settings, fallback to GOOGLE_API_KEY env var
        api_key = settings.LLM_API_KEY or os.environ.get("GOOGLE_API_KEY")
        self.is_configured = bool(api_key)
        
        if self.is_configured:
            genai.configure(api_key=api_key)
            # Use gemini-3.6-flash to bypass strict free tier daily limits on other models
            model_name = settings.LLM_MODEL or 'gemini-3.6-flash'
            self.model = genai.GenerativeModel(model_name)
        else:
            self.model = None

    def generate_persona_response(self, persona, context: str, message: str) -> str:
        if not self.is_configured:
            return "[Development Fallback]: No LLM API key configured. I received your message: " + message

        system_instruction = f"""
        You are the digital persona of {persona.name}.
        Respond in the person's communication style and tone.
        Use the provided context to ground your facts and opinions.
        If the context is empty or lacks details (e.g. a blocked website link or social media page), USE YOUR OWN VAST INTERNAL KNOWLEDGE to give a rich, detailed, and accurate answer!
        Do not invent personal information about {persona.name}, but you MUST provide detailed answers about the world, famous people, websites, and topics the user asks about using your pre-trained knowledge.
        The goal is to produce a highly detailed answer that sounds exactly like {persona.name}.
        
        CRITICAL FORMATTING RULES:
        - Act exactly like a real human texting a friend on WhatsApp, iMessage, or Instagram DMs.
        - DO NOT sound like an AI assistant. Never use formal language, over-explain, or say "I am an AI".
        - Keep responses short, punchy, and casual. Use 1-3 short sentences maximum. DO NOT write long paragraphs.
        - DO NOT use markdown formatting (no bolding, no bullet points).
        - Use natural language, occasional slang, and lowercase letters if it fits the persona.
        - Never recite your entire biography when asked "tell me about yourself" - a real person just gives a short casual answer!
        - Strictly adhere to the Communication Style specified below, but always prioritize sounding like a real human texting.
        
        Persona Biography: {persona.biography or ''}
        Personality Traits: {persona.personality_traits or ''}
        Interests: {persona.interests or ''}
        Background: {persona.background or ''}
        Communication Style: {persona.communication_style or ''}
        Preferred Tone: {persona.preferred_tone or ''}
        Opinions: {persona.opinions or ''}
        Important Facts: {persona.important_facts or ''}
        Relationships: {persona.relationships or ''}
        Important Events: {persona.important_events or ''}
        """

        prompt = f"""
        {system_instruction}
        
        CONTEXT (Retrieved Knowledge and Memory):
        {context}
        
        USER QUESTION:
        {message}
        """

        import time
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(prompt)
                return response.text
            except Exception as e:
                error_str = str(e)
                if ("429" in error_str or "quota" in error_str.lower()) and attempt < max_retries - 1:
                    print(f"Rate limit hit. Retrying in {2 ** attempt} seconds...")
                    time.sleep(2 ** attempt)
                    continue
                print(f"LLM Error: {e}")
                if "429" in error_str or "quota" in error_str.lower():
                    return "I'm receiving too many messages right now! (API Rate Limit Exceeded). Please wait a moment and try again."
                return f"Error occurred: {error_str}"

    def extract_persona_fields(self, text: str, url: str = "") -> dict:
        if not self.is_configured:
            return {}

        prompt = f"""
        You are tasked with creating a Persona profile based on a URL and its scraped text.
        
        CRITICAL INSTRUCTION: Social media sites (like Instagram, Twitter, LinkedIn) often block scrapers and return generic login pages or just the word "Instagram".
        If the 'Scraped Text' below looks like a generic login page, an empty page, an access denied message, or just gives a generic title like "Instagram", DO NOT use it!
        Instead, look at the URL ({url}) to figure out who the person is (e.g. from the username /therock), and USE YOUR OWN INTERNAL KNOWLEDGE to generate a highly detailed and accurate persona for them from memory!
        
        If the scraped text IS valid and detailed, use it to fill out the attributes.
        If you cannot determine an attribute, leave it as an empty string.
        Output ONLY valid JSON and nothing else. Do not use markdown wrappers.
        
        Fields to extract/generate:
        - name: The name of the person or entity (Do NOT just put "Instagram").
        - gender: "Male", "Female", or "Neutral" based on their name/bio.
        - biography: A short description of who they are.
        - personality_traits: Comma-separated list of traits (e.g. "Curious, friendly, practical").
        - interests: Comma-separated list of interests.
        - communication_style: Their style of communicating (e.g. "Simple, direct and conversational").
        - preferred_tone: Their tone (e.g. "Friendly and helpful").
        - opinions: Key opinions or beliefs they hold.
        - background: Relevant background information.
        
        URL: {url}
        Scraped Text:
        {text}
        """
        
        import time
        import json
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(prompt)
                resp_text = response.text.strip()
                if resp_text.startswith("```json"):
                    resp_text = resp_text[7:]
                elif resp_text.startswith("```"):
                    resp_text = resp_text[3:]
                if resp_text.endswith("```"):
                    resp_text = resp_text[:-3]
                
                return json.loads(resp_text.strip())
            except Exception as e:
                error_str = str(e)
                if ("429" in error_str or "quota" in error_str.lower()) and attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                print(f"LLM Persona Extraction Error: {e}")
                return {}
        return {}

llm_service = LLMService()
