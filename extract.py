import fitz
import sys

pdf_path = r"C:\Users\Shorang\.gemini\antigravity\brain\e4681fce-8805-4dba-b665-2ea646df464e\.user_uploaded\media_1791048382767.pdf"
doc = fitz.open(pdf_path)

print("Page 4 images:")
for i, img in enumerate(doc[3].get_images()):
    print(f"Img {i}: {img}")

print("\nPage 6 images:")
for i, img in enumerate(doc[5].get_images()):
    print(f"Img {i}: {img}")
