"""
Cache-First Data Reuse Engine for EduMechanic 3D
Stores and retrieves community 3D Exploration Cards to serve existing results instantly with zero LLM token cost.
"""
import hashlib
from typing import Optional, Dict
from app.schemas.spec import VLMParsingResult

class DataReuseCacheEngine:
    def __init__(self):
        # In-memory & DB storage cache mapping image_hash -> VLMParsingResult
        self._cache: Dict[str, VLMParsingResult] = {}
        self._hit_count: int = 0
        self._miss_count: int = 0

    def compute_hash(self, data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()

    def get_cached_result(self, data: bytes) -> Optional[VLMParsingResult]:
        h = self.compute_hash(data)
        if h in self._cache:
            self._hit_count += 1
            print(f"🎯 [Data Reuse Cache Hit!] Zero LLM token cost achieved for hash: {h[:8]}")
            return self._cache[h]
        self._miss_count += 1
        return None

    def store_result(self, data: bytes, result: VLMParsingResult) -> None:
        h = self.compute_hash(data)
        self._cache[h] = result
        print(f"💾 [Data Reuse Store] 3D Exploration Card cached for hash: {h[:8]}")

    def get_stats(self) -> Dict[str, int]:
        return {
            "cache_size": len(self._cache),
            "hits": self._hit_count,
            "misses": self._miss_count,
            "saved_token_cost_ratio": round(self._hit_count / max(1, self._hit_count + self._miss_count), 2)
        }

# Global singleton cache instance
global_cache_engine = DataReuseCacheEngine()
