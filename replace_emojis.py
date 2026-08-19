#!/usr/bin/env python3
"""
Script to replace emojis with SVG icon components in Kayven
"""

import os
import re
from pathlib import Path

# Mapping of emojis to icon imports and JSX
EMOJI_REPLACEMENTS = {
    # Navigation/UI
    '👋': ('WaveIcon', '<WaveIcon size={24}/>'),
    '🤖': ('RobotIcon', '<RobotIcon size={20}/>'),
    '🔍': ('SearchIcon', '<SearchIcon size={20}/>'),
    '📷': ('CameraIcon', '<CameraIcon size={20}/>'),
    '🏷️': ('TagIcon', '<TagIcon size={20}/>'),
    '📦': ('PackageIcon', '<PackageIcon size={20}/>'),
    '✏️': ('PencilIcon', '<PencilIcon size={20}/>'),
    
    # Meal times
    '🌅': ('SunriseIcon', '<SunriseIcon size={24}/>'),
    '☀️': ('SunIcon', '<SunIcon size={24}/>'),
    '🌙': ('MoonIcon', '<MoonIcon size={24}/>'),
    '🍎': ('AppleIcon', '<AppleIcon size={24}/>'),
    '🍽️': ('FoodIcon', '<FoodIcon size={24}/>'),
    
    # Status/Health
    '💧': ('DropletIcon', '<DropletIcon size={20}/>'),
    '✅': ('CheckIcon', '<CheckIcon size={16}/>'),
    '⚠️': ('WarningIcon', '<WarningIcon size={20}/>'),
    '💪': ('MuscleIcon', '<MuscleIcon size={20}/>'),
    '⚡': ('BoltIcon', '<BoltIcon size={20}/>'),
    '🔥': ('FireIcon', '<FireIcon size={20}/>'),
    
    # Actions/Features
    '🎉': ('PartyIcon', '<PartyIcon size={20}/>'),
    '🏆': ('TrophyIcon', '<TrophyIcon size={20}/>'),
    '📊': ('ChartBarIcon', '<ChartBarIcon size={20}/>'),
    '📉': ('ChartDownIcon', '<ChartDownIcon size={20}/>'),
    '📈': ('ChartUpIcon', '<ChartUpIcon size={20}/>'),
    '🎯': ('TargetIcon', '<TargetIcon size={20}/>'),
    '⚖️': ('ScaleIcon', '<ScaleIcon size={20}/>'),
    
    # Objects
    '💊': ('PillIcon', '<PillIcon size={20}/>'),
    '🧴': ('BottleIcon', '<BottleIcon size={20}/>'),
    '💉': ('SyringeIcon', '<SyringeIcon size={20}/>'),
    '🌿': ('LeafIcon', '<LeafIcon size={20}/>'),
    '🔋': ('BatteryIcon', '<BatteryIcon size={20}/>'),
    '☕': ('CoffeeIcon', '<CoffeeIcon size={20}/>'),
    '🦴': ('BoneIcon', '<BoneIcon size={20}/>'),
    '🥛': ('GlassIcon', '<GlassIcon size={20}/>'),
    '🧪': ('BeakerIcon', '<BeakerIcon size={20}/>'),
    '🧬': ('DNAIcon', '<DNAIcon size={20}/>'),
    '🔩': ('NutBoltIcon', '<NutBoltIcon size={20}/>'),
    
    # Time/Calendar
    '🕐': ('TimerIcon', '<TimerIcon size={20}/>'),
    '⏱️': ('TimerIcon', '<TimerIcon size={20}/>'),
    '📅': ('CalendarIcon', '<CalendarIcon size={20}/>'),
    
    # Movement/Activity
    '🚶': ('WalkIcon', '<WalkIcon size={20}/>'),
    '🏃': ('PlayIcon', '<PlayIcon size={20}/>'),  # Approximation
    '🏋️': ('MuscleIcon', '<MuscleIcon size={20}/>'),
    '▶️': ('PlayIcon', '<PlayIcon size={20}/>'),
    
    # Locations/Views
    '📋': ('ClipboardIcon', '<ClipboardIcon size={20}/>'),
    '📬': ('SaveIcon', '<SaveIcon size={20}/>'),
    
    # Notifications
    '🔔': ('BellIcon', '<BellIcon size={20}/>'),
    
    # Icons for badges/buttons
    '🥗': ('SaladIcon', '<SaladIcon size={20}/>'),
    '🐟': ('FishIcon', '<FishIcon size={20}/>'),
    '💡': ('LightbulbIcon', '<LightbulbIcon size={20}/>'),
    '🛒': ('CartIcon', '<CartIcon size={20}/>'),
    '🛋️': ('CouchIcon', '<CouchIcon size={20}/>'),
    '🌱': ('SproutIcon', '<SproutIcon size={20}/>'),
    '🎨': ('GearIcon', '<GearIcon size={20}/>'),
    '⭐': ('AwardIcon', '<AwardIcon size={20}/>'),
    '🏅': ('MedalIcon', '<MedalIcon size={20}/>'),
    '✨': ('SparkleIcon', '<SparkleIcon size={20}/>'),
    '🔄': ('RefreshIcon', '<RefreshIcon size={20}/>'),
    '❤️': ('HeartIcon', '<HeartIcon size={20}/>'),
    '🥇': ('TrophyIcon', '<TrophyIcon size={20}/>'),
    '🫀': ('HeartBeatIcon', '<HeartBeatIcon size={20}/>'),
    '📏': ('RulerIcon', '<RulerIcon size={20}/>'),
    '🦵': ('LegIcon', '<LegIcon size={20}/>'),
    '📤': ('UploadIcon', '<UploadIcon size={20}/>'),
    '💾': ('SaveIcon', '<SaveIcon size={20}/>'),
    '📧': ('EmailIcon', '<EmailIcon size={20}/>'),
    '🔑': ('KeyIcon', '<KeyIcon size={20}/>'),
    '🔵': ('CircleIcon', '<CircleIcon size={20}/>'),
}

def extract_icons_needed(text):
    """Extract unique icon names needed from text"""
    icons = set()
    for emoji, (icon_name, jsx) in EMOJI_REPLACEMENTS.items():
        if emoji in text:
            icons.add(icon_name)
    return icons

def update_file_imports(filepath, icons_needed):
    """Update imports in a file to include needed icons"""
    if not icons_needed:
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if there's already an icon import line
    if "from '@/lib/icons'" in content or 'from "@/lib/icons"' in content:
        # Update existing import
        import_pattern = r"import\s*{([^}]*)}\s*from\s*['\"]@/lib/icons['\"]"
        match = re.search(import_pattern, content)
        if match:
            existing_icons = match.group(1)
            existing_set = set(i.strip() for i in existing_icons.split(',') if i.strip())
            new_set = existing_set | icons_needed
            new_imports = ', '.join(sorted(new_set))
            content = re.sub(import_pattern, f"import {{ {new_imports} }} from '@/lib/icons'", content)
    else:
        # Add new import after other imports
        lines = content.split('\n')
        insert_idx = 0
        for i, line in enumerate(lines):
            if line.startswith("import "):
                insert_idx = i + 1
        new_import = f"import {{ {', '.join(sorted(icons_needed))} }} from '@/lib/icons'"
        lines.insert(insert_idx, new_import)
        content = '\n'.join(lines)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def replace_emojis_in_file(filepath):
    """Replace emojis with icon components in a file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    icons_needed = extract_icons_needed(content)
    
    # Replace emojis in string literals and JSX
    for emoji, (icon_name, jsx) in EMOJI_REPLACEMENTS.items():
        if emoji in content:
            # Simple replacement - emojis will become JSX icon expressions
            # This is a basic approach - complex cases may need manual review
            content = content.replace(f"'{emoji}'", f"'{icon_name}'")  # For status/type fields
            content = content.replace(f'"{emoji}"', f'"{icon_name}"')  # For string fields
    
    if content != original_content:
        update_file_imports(filepath, icons_needed)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    """Main function to process all TSX files"""
    src_dir = Path('/workspaces/Kayven/src/app')
    
    updated_files = []
    for tsx_file in src_dir.rglob('*.tsx'):
        if 'node_modules' not in str(tsx_file):
            if replace_emojis_in_file(str(tsx_file)):
                updated_files.append(str(tsx_file))
                print(f"✓ Updated: {tsx_file.relative_to(src_dir)}")
    
    print(f"\n{len(updated_files)} files updated")

if __name__ == '__main__':
    main()
