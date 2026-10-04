import pymupdf
pdf_path = r"C:\Users\Shorang\.gemini\antigravity\brain\e4681fce-8805-4dba-b665-2ea646df464e\.user_uploaded\media_1791048382767.pdf"
doc = pymupdf.open(pdf_path)

print("Page 4:")
for img in doc[3].get_image_info(xrefs=True):
    print(img)
    
print("\nPage 6:")
for img in doc[5].get_image_info(xrefs=True):
    print(img)
