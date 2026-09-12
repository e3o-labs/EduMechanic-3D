import sys
from pathlib import Path

# Add apps/api to Python sys.path
api_path = Path(__file__).resolve().parents[1] / "apps" / "api"
if str(api_path) not in sys.path:
    sys.path.insert(0, str(api_path))
