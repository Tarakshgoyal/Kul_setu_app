# Family Tree Architecture - BALKANGraph-Inspired Implementation

## Overview
This React Native family tree implementation is inspired by **BALKANGraph FamilyTreeJS** but fully custom-built for mobile using react-native-svg and pan/zoom gestures.

## Key Features Inspired by BALKANGraph

### 1. **Multiple Visual Templates** 
Like BALKANGraph's `ana`, `olivia`, `mila` templates, we now have:
- **Compact**: Dense layout (140x110 cards, 200px vertical, 300px horizontal spacing)
- **Balanced**: Medium layout (180x140 cards, 250px vertical, 380px horizontal spacing)  
- **Spacious**: Generous layout (220x160 cards, 300px vertical, 450px horizontal spacing)

### 2. **Dual Rendering Modes**
- **Compact cards**: Small rectangular cards with circular avatars (like modern genealogy software)
- **Classic cards**: Larger detailed cards with full information

### 3. **Interactive Tree Operations**
- ✅ Pan & Zoom (pinch-to-zoom on mobile)
- ✅ Expand/Collapse branches
- ✅ Fit to screen (auto-fit)
- ✅ Scale min/max constraints (0.3x - 2x)
- ✅ Smooth animations

### 4. **Layout Architecture**

```typescript
// Template system inspired by BALKANGraph templates
const TEMPLATES = {
  compact: { 
    nodeWidth: 140, 
    nodeHeight: 110, 
    vSpacing: 200,  // levelSeparation
    hSpacing: 300   // siblingSeparation
  },
  balanced: { 
    nodeWidth: 180, 
    nodeHeight: 140, 
    vSpacing: 250, 
    hSpacing: 380 
  },
  spacious: { 
    nodeWidth: 220, 
    nodeHeight: 160, 
    vSpacing: 300, 
    hSpacing: 450 
  },
};
```

### 5. **Node Data Structure**
Similar to BALKANGraph's `mid`, `fid`, `pids`:

```typescript
interface FamilyMember {
  personId: string;      // id
  fatherId?: string;     // fid (father id)
  motherId?: string;     // mid (mother id)
  spouseId?: string;     // pids (partner ids)
  generation?: number;   // level
  firstName: string;
  // ... other fields
}
```

### 6. **SVG Connector System**
Straight orthogonal lines (like BALKANGraph's link rendering):
- Vertical drop from parent couple center
- Horizontal line connecting all children
- Vertical lines up to each child node

### 7. **Collapse/Expand State Management**
```typescript
const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
```
- Individual node collapse (chevron button)
- Collapse All / Expand All global controls
- Layout respects collapsed state during tree calculation

## Architecture Comparison

| Feature | BALKANGraph FamilyTreeJS | Our Mobile Implementation |
|---------|--------------------------|---------------------------|
| Platform | Web (DOM/SVG) | React Native (react-native-svg) |
| Templates | 12+ predefined (ana, olivia, etc.) | 3 spacing themes (compact, balanced, spacious) |
| Pan/Zoom | Mouse drag + wheel zoom | Touch gestures + pinch-to-zoom |
| Layout | Normal, mixed, tree, grid | Full tree & immediate family views |
| Connectors | SVG paths with curves | Straight orthogonal lines |
| Export | PDF, PNG, SVG, CSV | (Future: PDF export via react-native-pdf) |
| Lazy Loading | ✅ (progressive rendering) | ⏳ (can add viewport culling) |
| Edit Forms | Built-in edit UI | Custom detail panel |
| Search | Global search bar | ⏳ (can add fuzzy search) |
| Mini Map | Overview navigator | ⏳ (future enhancement) |

## Code Structure

### Tree Building Algorithm
```
buildFullTree() or buildImmediateFamily()
  ↓
calculateSubtreeWidth() - recursive width calculation
  ↓
buildNode() - recursive tree construction
  ↓
TreeNode with x, y coordinates, spouse, children[]
```

### Rendering Pipeline
```
renderTreeView()
  ↓
renderLines() - SVG connectors
  ↓
renderNode() - recursive node rendering
  ↓
Compact or Classic card components
```

### Gesture Handling
```
PanResponder
  ↓
onPanResponderGrant - detect pinch (2 touches)
  ↓
onPanResponderMove - update scale or position
  ↓
onPanResponderRelease - persist view state
```

## User Controls

1. **View Mode Toggle**: Tree view ↔ List view
2. **Family Line Filter**: Switch between family lines
3. **Root View Toggle**: Full tree ↔ My immediate family
4. **Template Theme Cycle**: C (compact) → B (balanced) → S (spacious)
5. **Style Toggle**: Compact cards ↔ Classic cards
6. **Zoom**: +/- buttons or pinch gestures
7. **Auto-fit**: Reset view to fit all visible nodes
8. **Collapse All / Expand All**: Global branch visibility

## Performance Optimizations

### From BALKANGraph Patterns:
1. **Lazy Rendering** (future): Only render visible nodes in viewport
2. **Memoized Calculations**: `useMemo` for canvas bounds, hasChildrenMap
3. **Ref-based Drag State**: Prevent re-renders during pan gestures
4. **Dynamic Canvas Sizing**: Large canvas with padding for smooth panning
5. **Throttled Layout Recalculation**: Only rebuild tree when data changes

### Mobile-Specific:
1. **Touch Debouncing**: 180ms delay to distinguish drag from tap
2. **Hit Slop**: Larger touch targets for collapse buttons
3. **Scale Constraints**: 0.3x min (overview) to 2x max (detail)
4. **Sticky Viewport**: Preserve user's last view across re-renders

## BALKANGraph Features We Can Add

### High Priority:
- [ ] **Search**: Fuzzy find with highlight and center-on-node
- [ ] **Keyboard Navigation**: Arrow keys for desktop/tablet
- [ ] **Mini Map**: Small overview with viewport indicator
- [ ] **Export**: PDF/PNG generation (react-native-view-shot)

### Medium Priority:
- [ ] **Undo/Redo**: State history for collapse/expand actions
- [ ] **Filters**: Show/hide by generation, gender, location
- [ ] **Node Context Menu**: Long-press menu (edit, add child, etc.)
- [ ] **Orientations**: Top-down, bottom-up, left-right layouts
- [ ] **Mixed Layout**: Automatic vertical/horizontal switching

### Low Priority:
- [ ] **Curved Connectors**: Bezier paths for aesthetic variation
- [ ] **Node Dragging**: Manual repositioning with snap-to-grid
- [ ] **Collaboration**: Real-time multi-user tree editing
- [ ] **AI Assistant**: Suggest missing connections, detect errors

## Data Flow

```
Backend API (/search)
  ↓
familyMembers: FamilyMember[]
  ↓
buildFullTree() or buildImmediateFamily()
  ↓
treeData: TreeNode[]
  ↓
renderTreeView() → SVG canvas with pan/zoom
  ↓
User interactions (tap, pinch, collapse)
  ↓
State updates (collapsedIds, scale, position)
  ↓
Re-render with new layout
```

## Testing Checklist

✅ Pan with one finger (smooth drag)
✅ Pinch-to-zoom with two fingers
✅ Tap node to open detail panel
✅ Toggle collapse/expand on individual nodes
✅ Collapse All / Expand All buttons
✅ Switch template themes (C/B/S)
✅ Switch view styles (compact/classic)
✅ Auto-fit after changing tree structure
✅ View mode persistence during pan/zoom

## Future Enhancements

### Inspired by BALKANGraph Roadmap:
1. **Advanced Search** with filters and highlighting
2. **Edit Forms** with inline field validation
3. **Export Module** for PDF/PNG/CSV generation
4. **Animation Presets** (fade, slide, elastic)
5. **Custom Node Templates** via user-defined components
6. **Mini Map Navigator** for large trees (1000+ nodes)
7. **Lazy Loading** for trees with 10,000+ members
8. **Keyboard Shortcuts** (F to find, arrows to navigate)

## References

- **BALKANGraph FamilyTreeJS**: https://balkan.app/FamilyTreeJS
- **GitHub Repo**: https://github.com/BALKANGraph/FamilyTreeJS
- **React Native SVG**: https://github.com/software-mansion/react-native-svg
- **PanResponder Docs**: https://reactnative.dev/docs/panresponder

---

**Built with ❤️ for Kul-Setu Family Tree App**
