import io
import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.LLM_API_KEY)
model = genai.GenerativeModel('gemini-3.6-flash')

with open("../dummy_worked.pdf", "rb") as f:
    pdf_bytes = f.read()

try:
    response = model.generate_content([
        "Extract text", 
        {"mime_type": "application/pdf", "data": pdf_bytes}
    ])
    print("Success:", response.text)
except Exception as e:
    print("Error:", e)
