import pymupdf
from PIL import Image
import io

pdf_path = r"C:\Users\Shorang\.gemini\antigravity\brain\e4681fce-8805-4dba-b665-2ea646df464e\.user_uploaded\media_1791048382767.pdf"
doc = pymupdf.open(pdf_path)

def save_image(page_num, name):
    img_list = doc[page_num].get_images()
    if img_list:
        xref = img_list[0][0]
        pix = pymupdf.Pixmap(doc, xref)
        if pix.n >= 4:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        img = Image.open(io.BytesIO(pix.tobytes()))
        img.save(name)
        print(f"Saved {name}, size: {img.size}")

save_image(3, "board1.png")
save_image(5, "board2.png")
