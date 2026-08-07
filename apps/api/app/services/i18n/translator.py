"""
Multilingual i18n Translation Service for EduMechanic 3D Backend
Provides localized attributes (KO, EN, JA) for mechanical components, parameters, and STEM principles.
"""
from typing import Dict, Any

class SpecI18nTranslator:
    def __init__(self):
        self._dictionaries = {
            "part_housing": {
                "en": {"name": "Transparent Outer Housing", "stem_principle": "Internal mechanism visibility through clear housing"},
                "ja": {"name": "透明アクリルハウジング", "stem_principle": "透明ハウジングによる内部構造の視認"}
            },
            "part_bevel_gear": {
                "en": {"name": "Center Bevel Gear", "stem_principle": "90-degree motion redirection (Bevel Gear Principle)"},
                "ja": {"name": "中央ベベルギア", "stem_principle": "90度直角回転変換（ベベルギアの原理）"}
            }
        }

    def localize_component(self, part_id: str, lang: str = "ko") -> Dict[str, str]:
        if lang in ["en", "ja"] and part_id in self._dictionaries:
            return self._dictionaries[part_id][lang]
        return {}

translator_service = SpecI18nTranslator()
