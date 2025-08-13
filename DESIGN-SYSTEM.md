# TOF Platform Design System

## 1. Core Design Principles

### Visual Hierarchy
- **Clean, spacious layouts** with generous white space for breathing room
- **Clear focal points** using size, color, and positioning
- **Progressive disclosure** - showing information as needed rather than all at once
- **Consistent sectioning** with clear boundaries between content areas

### User Experience Philosophy
- **Guidance-first approach** - Help users understand features before they use them
- **Contextual education** - Teach users about features at the moment of need
- **Delightful interactions** - Smooth transitions and micro-animations
- **Smart defaults** - Pre-select the most common options

## 2. Color System

### Primary Palette
```css
--color-primary: #16a34a;        /* Emerald green - primary actions */
--color-primary-hover: #15803d;  /* Darker green for hover states */
--color-primary-light: #bbf7d0;  /* Light green for backgrounds */
--color-primary-soft: #dcfce7;   /* Very light green for subtle backgrounds */
```

### Secondary Palette
```css
--color-secondary: #0ea5e9;      /* Sky blue for secondary actions */
--color-secondary-hover: #0284c7;
--color-secondary-light: #bae6fd;
--color-secondary-soft: #e0f2fe;
```

### Semantic Colors
```css
--color-success: #16a34a;        /* Green for success states */
--color-warning: #f59e0b;        /* Amber for warnings */
--color-error: #dc2626;          /* Red for errors */
--color-info: #3b82f6;           /* Blue for information */
```

### Neutral Palette
```css
--color-neutral-950: #020617;    /* Almost black - primary text */
--color-neutral-900: #0f172a;    /* Dark gray - headings */
--color-neutral-700: #334155;    /* Medium dark - secondary text */
--color-neutral-500: #64748b;    /* Medium - muted text */
--color-neutral-400: #94a3b8;    /* Light gray - placeholders */
--color-neutral-200: #e2e8f0;    /* Very light - borders */
--color-neutral-100: #f1f5f9;    /* Off-white - subtle backgrounds */
--color-neutral-50: #f8fafc;     /* Nearly white - backgrounds */
```

### Background Colors
```css
--bg-primary: #ffffff;           /* Main background */
--bg-secondary: #f8fafc;         /* Secondary sections */
--bg-sidebar: #064e3b;           /* Dark green sidebar */
--bg-overlay: rgba(0, 0, 0, 0.5); /* Modal overlays */
--bg-gradient: linear-gradient(135deg, #fecaca 0%, #bfdbfe 50%, #bbf7d0 100%);
```

### Tag/Category Colors
```css
/* Color coding system for categories */
--tag-purple: #a855f7;
--tag-green: #22c55e;
--tag-blue: #3b82f6;
--tag-red: #ef4444;
--tag-yellow: #eab308;
--tag-orange: #f97316;
--tag-teal: #14b8a6;
--tag-pink: #ec4899;
--tag-gray: #6b7280;
```

## 3. Typography System

### Font Families
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

### Font Sizes
```css
--text-xs: 0.75rem;     /* 12px - badges, labels */
--text-sm: 0.875rem;    /* 14px - secondary text, captions */
--text-base: 1rem;      /* 16px - body text */
--text-lg: 1.125rem;    /* 18px - emphasized body */
--text-xl: 1.25rem;     /* 20px - section headings */
--text-2xl: 1.5rem;     /* 24px - page headings */
--text-3xl: 1.875rem;   /* 30px - major headings */
--text-4xl: 2.25rem;    /* 36px - hero text */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

## 4. Spacing System

### Base Scale
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

## 5. Component Design

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: white;
  color: var(--color-neutral-700);
  border: 1px solid var(--color-neutral-200);
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--color-neutral-50);
  border-color: var(--color-neutral-300);
}
```

#### Icon Button
```css
.btn-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
```

### Cards

#### Base Card
```css
.card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--color-neutral-200);
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
```

#### Interactive Card
```css
.card-interactive {
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.card-interactive::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-primary);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.card-interactive:hover::after {
  transform: scaleX(1);
}
```

### Form Elements

#### Input Field
```css
.input {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid var(--color-neutral-200);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.input::placeholder {
  color: var(--color-neutral-400);
}
```

#### Select Dropdown
```css
.select {
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* Chevron down */
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  padding-right: 2.5rem;
}
```

#### Checkbox/Toggle
```css
.toggle {
  width: 3rem;
  height: 1.5rem;
  border-radius: 9999px;
  background: var(--color-neutral-200);
  position: relative;
  transition: background 0.2s ease;
  cursor: pointer;
}

.toggle.active {
  background: var(--color-primary);
}

.toggle-indicator {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle.active .toggle-indicator {
  transform: translateX(1.5rem);
}
```

### Modals & Overlays

#### Modal Container
```css
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 32rem;
  width: 90%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, -40%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
```

#### Tooltip
```css
.tooltip {
  background: var(--color-neutral-900);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.2s ease;
}
```

### Navigation

#### Sidebar
```css
.sidebar {
  width: 4rem;
  background: var(--bg-sidebar);
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar.expanded {
  width: 16rem;
}

.sidebar-item {
  padding: 1rem;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  position: relative;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.sidebar-item.active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: white;
}
```

#### Tab Navigation
```css
.tabs {
  display: flex;
  gap: 2rem;
  border-bottom: 1px solid var(--color-neutral-200);
}

.tab {
  padding: 1rem 0;
  position: relative;
  color: var(--color-neutral-500);
  font-weight: 500;
  transition: color 0.2s ease;
  cursor: pointer;
}

.tab:hover {
  color: var(--color-neutral-700);
}

.tab.active {
  color: var(--color-primary);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
}
```

## 6. Micro-interactions

### Hover Effects
- **Lift effect**: Cards and buttons rise slightly with shadow
- **Color transitions**: Smooth color changes over 200ms
- **Border highlights**: Focus states with colored borders
- **Underline animations**: Links and tabs with animated underlines

### Loading States
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-neutral-100) 0%,
    var(--color-neutral-200) 50%,
    var(--color-neutral-100) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Progress Indicators
```css
.progress-bar {
  height: 0.5rem;
  background: var(--color-neutral-100);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 9999px;
  transition: width 0.5s ease;
}
```

## 7. Layout Patterns

### Grid System
```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 768px) {
  .md\:grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
}
```

### Flex Utilities
```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: 0.5rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
```

## 8. Notification System

### Toast Notifications
```css
.toast {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideInRight 0.3s ease;
  max-width: 24rem;
}

.toast-success {
  border-left: 4px solid var(--color-success);
}

.toast-error {
  border-left: 4px solid var(--color-error);
}

.toast-warning {
  border-left: 4px solid var(--color-warning);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### Inline Alerts
```css
.alert {
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.alert-info {
  background: var(--color-secondary-soft);
  color: var(--color-secondary-hover);
  border: 1px solid var(--color-secondary-light);
}

.alert-success {
  background: var(--color-primary-soft);
  color: var(--color-primary-hover);
  border: 1px solid var(--color-primary-light);
}
```

## 9. Educational Components

### Onboarding Cards
```css
.onboarding-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.onboarding-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, 
    var(--color-primary) 0%, 
    var(--color-secondary) 100%
  );
}

.onboarding-illustration {
  width: 100%;
  height: 12rem;
  background: var(--bg-gradient);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Feature Tips
```css
.feature-tip {
  position: absolute;
  background: var(--color-neutral-900);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.feature-tip::before {
  content: '';
  position: absolute;
  top: -0.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 0.5rem solid transparent;
  border-right: 0.5rem solid transparent;
  border-bottom: 0.5rem solid var(--color-neutral-900);
}

.feature-tip-pulse {
  position: absolute;
  width: 0.75rem;
  height: 0.75rem;
  background: var(--color-primary);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(22, 163, 74, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0);
  }
}
```

### Video Embeds
```css
.video-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  border-radius: 0.5rem;
  background: var(--color-neutral-100);
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.video-play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4rem;
  height: 4rem;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.video-play-button:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: translate(-50%, -50%) scale(1.1);
}
```

## 10. Accessibility Features

### Focus States
```css
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

button:focus-visible {
  outline-offset: 4px;
}
```

### Screen Reader Support
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  :root {
    --color-primary: #0d7a2e;
    --color-neutral-200: #000;
    --color-neutral-100: #fff;
  }
}
```

## 11. Animation Guidelines

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Duration Scale
```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### Page Transitions
```css
.page-enter {
  animation: fadeIn 0.3s ease;
}

.page-exit {
  animation: fadeOut 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

## 12. Responsive Design

### Breakpoints
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Mobile-First Approach
```css
/* Base styles for mobile */
.component {
  padding: 1rem;
  font-size: 0.875rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: 1.5rem;
    font-size: 1rem;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: 2rem;
  }
}
```

## 13. Dark Mode Support

### Dark Theme Variables
```css
[data-theme="dark"] {
  --color-neutral-950: #f8fafc;
  --color-neutral-900: #f1f5f9;
  --color-neutral-700: #cbd5e1;
  --color-neutral-500: #94a3b8;
  --color-neutral-400: #64748b;
  --color-neutral-200: #334155;
  --color-neutral-100: #1e293b;
  --color-neutral-50: #0f172a;
  
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-sidebar: #020617;
}
```

## 14. Implementation Guidelines

### Component Structure
1. Use semantic HTML elements
2. Follow BEM naming convention for CSS classes
3. Implement ARIA labels for accessibility
4. Use CSS variables for theming
5. Keep components modular and reusable

### Performance Considerations
1. Use CSS transforms for animations (GPU-accelerated)
2. Implement lazy loading for images and heavy components
3. Minimize repaints and reflows
4. Use will-change sparingly for optimized animations
5. Implement virtual scrolling for long lists

### Best Practices
1. Maintain consistent spacing using the spacing scale
2. Use the color system for all color values
3. Follow the typography scale for all text
4. Implement proper loading and error states
5. Ensure all interactive elements have hover/focus states
6. Test on multiple screen sizes and devices
7. Validate accessibility with screen readers
8. Use progressive enhancement approach

## 15. Component States

### Interactive States
- **Default**: Normal resting state
- **Hover**: Mouse over state with subtle elevation
- **Active**: Currently pressed/clicked state
- **Focus**: Keyboard navigation state with clear outline
- **Disabled**: Grayed out with reduced opacity (0.5)
- **Loading**: Skeleton or spinner animation
- **Error**: Red border with error message
- **Success**: Green accent with success indicator

This design system provides a comprehensive foundation for building a consistent, accessible, and delightful user experience across the TOF platform.