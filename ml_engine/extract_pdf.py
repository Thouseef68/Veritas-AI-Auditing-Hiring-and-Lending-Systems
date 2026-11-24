import sys
import io

def extract_text_from_pdf():
    try:
        import pypdf
        data = None
        if len(sys.argv) > 1 and sys.argv[1]:
            with open(sys.argv[1], 'rb') as f:
                data = f.read()
        else:
            data = sys.stdin.buffer.read()

        if not data or len(data) < 10:
            print("")
            return

        reader = pypdf.PdfReader(io.BytesIO(data))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        print(text.strip())
    except Exception as e:
        sys.stderr.write(f"Extraction error: {e}\n")
        print("")

if __name__ == "__main__":
    extract_text_from_pdf()
