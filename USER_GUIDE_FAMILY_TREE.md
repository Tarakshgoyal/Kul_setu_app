# 🌳 Family Tree User Guide

## Overview
Your family tree now features **BALKANGraph-inspired** professional visualization with multiple templates, smooth interactions, and powerful navigation controls.

---

## 🎨 Visual Themes

### Template Spacing (Tap "C/B/S" button to cycle)

**Compact** 📦
- Best for: Large families, overview mode
- Node size: 140×110px
- Spacing: Tight (200px vertical, 300px horizontal)
- Use when: You want to see as many generations as possible

**Balanced** ⚖️
- Best for: Medium families, balanced view
- Node size: 180×140px
- Spacing: Medium (250px vertical, 380px horizontal)
- Use when: You want comfortable reading with good overview

**Spacious** 🌌
- Best for: Small families, detailed exploration
- Node size: 220×160px
- Spacing: Generous (300px vertical, 450px horizontal)
- Use when: You want to focus on details and relationships

### Card Styles (Tap circle/square button to toggle)

**Compact Cards** 🎴
```
┌─────────────┐
│   Avatar    │  ← Circular photo
│   Name      │
│ YYYY - YYYY │
│     ▼       │  ← Collapse chevron (if has children)
└─────────────┘
```

**Classic Cards** 📋
```
┌─────────────────┐
│    Avatar       │  ← Larger circular avatar
│    Full Name    │
│   Gen: X        │
│   Male/Female   │
└─────────────────┘
```

---

## 🎮 Controls Guide

### Top Control Bar

```
┌────────────────────────────────────────────────┐
│ [Full Tree] │ C/B/S │ ○/□ │ + │ - │ ↻ │ ⌄ │ ⌃ │
└────────────────────────────────────────────────┘
     ①          ②      ③    ④  ⑤  ⑥  ⑦  ⑧
```

1. **Full Tree / My Family**: Toggle between complete tree and your immediate family
2. **C/B/S**: Cycle template themes (Compact → Balanced → Spacious)
3. **○/□**: Toggle card style (Compact cards ↔ Classic cards)
4. **+**: Zoom in (up to 2× magnification)
5. **-**: Zoom out (down to 0.3× for overview)
6. **↻**: Auto-fit entire tree to screen
7. **⌄**: Collapse all branches (show only roots)
8. **⌃**: Expand all branches (show entire tree)

### Family Line Chips
```
┌──────────────────────────────────┐
│ [Family 1] [Family 2] [Family 3] │ ← Tap to switch family lines
└──────────────────────────────────┘
```

---

## 📱 Gesture Controls

### Pan (Move Around)
- **Single finger drag**: Move the tree in any direction
- Drag starts after 4px movement (prevents accidental drags)
- Your view position is remembered when you zoom or collapse nodes

### Zoom
- **Pinch with 2 fingers**: Zoom in/out smoothly
- **Tap + button**: Zoom in by 10% increments
- **Tap - button**: Zoom out by 10% increments
- Zoom range: 0.3× (30%) to 2× (200%)

### Select Node
- **Tap a card**: Open detail panel on the right
- Detail panel shows full information, relations, traits, etc.
- **Tap close button or backdrop**: Close detail panel

### Collapse/Expand Branches
- **Tap chevron (▼/▲) on compact cards**: Toggle that person's children
- Children are hidden both visually AND in layout calculations (tree reflows)
- **Tap ⌄ (collapse all)**: Collapse entire tree to just root nodes
- **Tap ⌃ (expand all)**: Show all branches

---

## 🔄 View Modes

### Tree View (Default) 🌳
- Interactive canvas with pan/zoom
- SVG connectors showing relationships
- Couples shown side-by-side with ❤️
- Children arranged horizontally below parents

### List View 📋
- Scrollable list of all family members
- Legacy card design with gradients
- Tap to select and view details
- No tree structure visualization

---

## 🎯 Common Workflows

### Exploring a Large Family
1. Start in **Compact** template + **Compact cards**
2. Use **Auto-fit** (↻) to see entire tree
3. Identify interesting branches
4. **Tap Collapse All** (⌄) to reset view
5. **Expand specific branches** by tapping chevrons
6. Switch to **Spacious** template for detailed reading

### Focusing on Your Family
1. Tap **Full Tree** button to switch to **My Family**
2. Shows only you, spouse, and children
3. Use **Spacious** template for best detail
4. **Classic cards** for full information

### Comparing Generations
1. Use **Balanced** template for good overview
2. **Expand All** (⌃) to see all branches
3. Pan vertically to move between generations
4. Connectors show parent-child relationships clearly

### Presenting to Family Members
1. Use **Spacious** template
2. **Classic cards** for maximum detail
3. **Auto-fit** to center before showing
4. Pan smoothly to navigate between branches
5. Tap individual members to show details

---

## 💡 Pro Tips

### Performance
- Collapse large branches you're not viewing to improve rendering
- Use **Compact** template for families with 100+ members
- **Auto-fit** resets to optimal view if tree looks odd

### Navigation
- Your last view (position + zoom) is preserved when you collapse/expand
- Double-check you're on the right family line chip (top bar)
- Use detail panel to verify relationships before editing

### Visual Clarity
- **Compact cards** are inspired by modern genealogy apps
- **Classic cards** show generation numbers for easy reference
- Circular avatars show initials if no photo uploaded
- Heart (❤️) icon appears between married couples

### Troubleshooting
- **Tree looks tiny?** Tap Auto-fit (↻) button
- **Can't find someone?** Switch to List view and scroll
- **Tree feels cramped?** Change to **Spacious** template
- **Too much white space?** Use **Compact** template
- **Nodes overlapping?** Try collapsing some branches first

---

## 🚀 Future Features (Coming Soon)

Based on BALKANGraph FamilyTreeJS:

- [ ] **Search Bar**: Find anyone by name instantly
- [ ] **Mini Map**: Small overview navigator in corner
- [ ] **Export**: Save tree as PDF or image
- [ ] **Edit Mode**: Add/remove members directly
- [ ] **Filters**: Show only certain generations, genders, locations
- [ ] **Orientations**: Flip tree (ancestors on bottom, descendants on top)
- [ ] **Animations**: Smooth transitions when collapsing/expanding
- [ ] **Keyboard Shortcuts**: Desktop support (F to find, arrows to navigate)

---

## 🎨 Template Comparison Chart

| Template | Node Size | V-Spacing | H-Spacing | Best For |
|----------|-----------|-----------|-----------|----------|
| **Compact** | 140×110 | 200px | 300px | 50-200 members, overview |
| **Balanced** | 180×140 | 250px | 380px | 20-100 members, balanced |
| **Spacious** | 220×160 | 300px | 450px | 5-50 members, detail focus |

---

## 📐 Layout Architecture

```
Generation 1 (Grandparents)
         👴────❤️────👵
              │
    ┌─────────┴─────────┐
    │                   │
   👨────❤️────👩      👨────❤️────👩
Generation 2            │
(Parents)      ┌────────┼────────┐
               │        │        │
              👦      👧      👶
Generation 3 (Children)
```

- **Straight connectors**: Vertical drop → Horizontal bus → Vertical up to children
- **Couple nodes**: Side-by-side with heart between them
- **Collapse state**: Entire subtree disappears when collapsed (not just hidden)

---

**Happy exploring your family history! 👨‍👩‍👧‍👦**

For questions or feature requests, contact the Kul-Setu development team.
