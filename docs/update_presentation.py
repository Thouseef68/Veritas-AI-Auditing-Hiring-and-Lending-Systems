"""
Veritas AI Presentation Generator
Executes the clean, professional 7-slide presentation generation script.
"""
import os
import sys

# Ensure docs directory is in python path
docs_dir = os.path.dirname(os.path.abspath(__file__))
if docs_dir not in sys.path:
    sys.path.insert(0, docs_dir)

from generate_perfect_7_slide_ppt import build_deck

if __name__ == '__main__':
    build_deck()
