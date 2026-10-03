import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from blitz_backend.wsgi import application
