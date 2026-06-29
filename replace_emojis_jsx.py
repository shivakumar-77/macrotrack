#!/usr/bin/env python3
"""
Replace emojis in JSX contexts with actual icon component rendering
"""

import os
import re
from pathlib import Path

# Emoji to JSX icon component mapping
EMOJI_TO_JSX = {
    '👋': 'WaveIcon',
    '🤖': 'RobotIcon',
    '🔍': 'SearchIcon',
    '📷': 'CameraIcon',
    '🏷️': 'TagIcon',
    '📦': 'PackageIcon',
    '✏️': 'PencilIcon',
    '🌅': 'SunriseIcon',
    '☀️': 'SunIcon',
    '🌙': 'MoonIcon',
    '🍎': 'AppleIcon',
    '🍽️': 'FoodIcon',
    '💧': 'DropletIcon',
    '✅': 'CheckIcon',
    '⚠️': 'WarningIcon',
    '💪': 'MuscleIcon',
    '⚡': 'BoltIcon',
    '🔥': 'FireIcon',
    '🎉': 'PartyIcon',
    '🏆': 'TrophyIcon',
    '📊': 'ChartBarIcon',
    '📉': 'ChartDownIcon',
    '📈': 'ChartUpIcon',
    '🎯': 'TargetIcon',
    '⚖️': 'ScaleIcon',
    '💊': 'PillIcon',
    '🧴': 'BottleIcon',
    '💉': 'SyringeIcon',
    '🌿': 'LeafIcon',
    '🔋': 'BatteryIcon',
    '☕': 'CoffeeIcon',
    '🦴': 'BoneIcon',
    '🥛': 'GlassIcon',
    '🧪': 'BeakerIcon',
    '🧬': 'DNAIcon',
    '🔩': 'NutBoltIcon',
    '🕐': 'TimerIcon',
    '⏱️': 'TimerIcon',
    '📅': 'CalendarIcon',
    '🚶': 'WalkIcon',
    '🏃': 'PlayIcon',
    '🏋️': 'MuscleIcon',
    '▶️': 'PlayIcon',
    '📋': 'ClipboardIcon',
    '📬': 'SaveIcon',
    '🔔': 'BellIcon',
    '🥗': 'SaladIcon',
    '🐟': 'FishIcon',
    '💡': 'LightbulbIcon',
    '🛒': 'CartIcon',
    '🛋️': 'CouchIcon',
    '🌱': 'SproutIcon',
    '🎨': 'GearIcon',
    '⭐': 'AwardIcon',
    '🏅': 'MedalIcon',
    '✨': 'SparkleIcon',
    '🔄': 'RefreshIcon',
    '❤️': 'HeartIcon',
    '🥇': 'TrophyIcon',
    '🫀': 'HeartBeatIcon',
    '📏': 'RulerIcon',
    '🦵': 'LegIcon',
    '📤': 'UploadIcon',
    '💾': 'SaveIcon',
    '📧': 'EmailIcon',
    '🔑': 'KeyIcon',
    '🔵': 'CircleIcon',
}

def replace_jsx_emojis(content):
    """Replace emojis in JSX with icon component rendering"""
    
    # Pattern 1: <span style={{...}}>emoji</span> → <IconName size={...}/>
    for emoji, icon_name in EMOJI_TO_JSX.items():
        # Common patterns for emoji display
        # Pattern: <span ...>emoji</span>
        pattern = f'<span(.*?)>{re.escape(emoji)}</span>'
        replacement = f'<{icon_name} size={{20}}/>'
        content = re.sub(pattern, replacement, content)
        
        # Pattern: <div ...>emoji</div>  
        pattern = f'<div(.*?)>{re.escape(emoji)}</div>'
        replacement = f'<{icon_name} size={{20}}/>'
        content = re.sub(pattern, replacement, content)
        
        # Pattern: {{emoji}} in JSX expressions (fontSize style)
        # Keep the emoji but it will be rendered as SVG - need manual check
        
        # Pattern: style={{fontSize:X}}>{emoji}</div>
        # Skip this - needs manual review
    
    return content

def process_file(filepath):
    """Process a single TSX file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Simple emoji detection
        has_emojis = any(emoji in content for emoji in EMOJI_TO_JSX.keys())
        
        if has_emojis:
            # Log which emojis are present
            found_emojis = [emoji for emoji in EMOJI_TO_JSX.keys() if emoji in content]
            print(f"  Found emojis in {Path(filepath).name}: {found_emojis}")
        
        return has_emojis
        
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Main function"""
    src_dir = Path('/workspaces/macrotrack/src/app')
    
    files_with_emojis = []
    for tsx_file in src_dir.rglob('*.tsx'):
        if 'node_modules' not in str(tsx_file):
            if process_file(str(tsx_file)):
                files_with_emojis.append(str(tsx_file))
    
    print(f"\n{len(files_with_emojis)} files still have emojis that need manual JSX replacement")
    print("\nFiles needing JSX updates:")
    for f in files_with_emojis:
        print(f"  - {Path(f).relative_to(src_dir)}")

if __name__ == '__main__':
    main()
