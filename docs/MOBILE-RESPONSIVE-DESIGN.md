# Mobile-Responsive Design System

## Overview

This product template uses a **mobile-first responsive design** approach, built with Tailwind CSS and custom utilities for optimal mobile experiences across all devices.

## Table of Contents

- [Breakpoints](#breakpoints)
- [Touch Targets](#touch-targets)
- [Typography](#typography)
- [Layout Patterns](#layout-patterns)
- [Components](#components)
- [Best Practices](#best-practices)
- [Testing](#testing)

---

## Breakpoints

### Standard Breakpoints

```css
xs:  480px  /* Extra small devices (large phones) */
sm:  640px  /* Small devices (tablets) */
md:  768px  /* Medium devices (tablets landscape) */
lg:  1024px /* Large devices (desktops) */
xl:  1280px /* Extra large devices */
2xl: 1536px /* Ultra wide screens */
```

### Special Breakpoints

```css
landscape: (orientation: landscape) /* Landscape mode detection */
retina: (-webkit-min-device-pixel-ratio: 2) /* High-DPI screens */
```

### Usage Example

```jsx
<div className="text-sm sm:text-base lg:text-lg">
  Responsive text that scales with screen size
</div>
```

---

## Touch Targets

All interactive elements follow **WCAG 2.5.5** guidelines with minimum **44x44px** touch targets on mobile.

### Utilities

```css
.touch-target      /* 44x44px (standard) */
.touch-target-sm   /* 36x36px (compact) */
.touch-target-lg   /* 48x48px (large) */
```

### Implementation

```jsx
// Buttons automatically include touch-friendly sizing
<Button size="lg" className="w-full sm:w-auto">
  Submit
</Button>

// Custom interactive elements
<div className="min-h-touch min-w-touch inline-flex items-center justify-center">
  <Icon />
</div>
```

---

## Typography

### Fluid Typography

Responsive font sizes that scale smoothly between breakpoints using `clamp()`:

```css
.text-fluid-xs   /* 0.75rem → 0.875rem */
.text-fluid-sm   /* 0.875rem → 1rem */
.text-fluid-base /* 1rem → 1.125rem */
.text-fluid-lg   /* 1.125rem → 1.25rem */
.text-fluid-xl   /* 1.25rem → 1.5rem */
.text-fluid-2xl  /* 1.5rem → 1.875rem */
.text-fluid-3xl  /* 1.875rem → 2.25rem */
.text-fluid-4xl  /* 2.25rem → 3rem */
```

### Mobile-Optimized Line Height

```jsx
<p className="text-base leading-relaxed sm:text-lg">
  Improved readability with relaxed line height
</p>
```

### Heading Scales

```jsx
<h1 className="text-3xl font-bold sm:text-5xl lg:text-7xl">
  Hero Headline
</h1>

<h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
  Section Heading
</h2>
```

---

## Layout Patterns

### 1. Mobile Stack (Vertical → Horizontal)

```jsx
<div className="mobile-stack">
  {/* Stacks vertically on mobile, horizontal on desktop */}
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### 2. Responsive Grids

```jsx
// Auto-fit cards (responsive without breakpoints)
<div className="grid-auto-fit-cards">
  <Card />
  <Card />
  <Card />
</div>

// Manual breakpoints
<div className="mobile-card-grid-2">
  {/* 1 col mobile, 2 cols xs+ */}
</div>

<div className="mobile-card-grid-3">
  {/* 1 col mobile, 2 cols sm, 3 cols lg */}
</div>

<div className="mobile-card-grid-4">
  {/* 1 col mobile, 2 cols xs, 3 cols lg, 4 cols xl */}
</div>
```

### 3. Full-Bleed on Mobile

```jsx
<div className="mobile-full-bleed">
  {/* Breaks out of padding on mobile, contained on desktop */}
</div>
```

### 4. Horizontal Scroll

```jsx
<div className="mobile-scroll-x">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### 5. Container Padding

```jsx
<div className="mobile-container">
  {/* Responsive padding: 1rem → 1.5rem → 2rem */}
</div>
```

---

## Components

### Buttons

```jsx
// Mobile: full width, Desktop: auto width
<div className="mobile-button-group">
  <Button>Primary</Button>
  <Button variant="outline">Secondary</Button>
</div>
```

### Cards

```jsx
<Card>
  <CardHeader>
    {/* Responsive padding: 1rem mobile → 1.5rem desktop */}
    <CardTitle>
      {/* Responsive text: xl mobile → 2xl desktop */}
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Auto-responsive padding */}
  </CardContent>
</Card>
```

### Tables

```jsx
<DataTable
  columns={columns}
  data={data}
  // Horizontal scroll on mobile, full width on desktop
/>

// For mobile-optimized tables
<MobileTable data={data} />
```

### Forms

```jsx
<form className="mobile-form-layout">
  {/* Vertical stack with proper spacing */}
  <div className="mobile-form-row">
    {/* Stack on mobile, side-by-side on desktop */}
    <Input />
    <Input />
  </div>
</form>
```

### Navigation

```jsx
<DashboardLayout>
  {/* Desktop: persistent sidebar */}
  {/* Mobile: hamburger menu + drawer */}
</DashboardLayout>
```

### Modals

```jsx
<div className="mobile-modal">
  <div className="mobile-modal-content">
    {/* Full screen on mobile, modal on desktop */}
  </div>
</div>
```

---

## Best Practices

### 1. Mobile-First Approach

Always style mobile first, then add responsive variants:

```jsx
// ❌ Bad: Desktop-first
<div className="flex-row md:flex-col">

// ✅ Good: Mobile-first
<div className="flex-col md:flex-row">
```

### 2. Touch Interactions

```jsx
// Add active states for better feedback
<button className="tap-highlight">
  Click Me
</button>

// Prevent text selection on interactive elements
<div className="mobile-interactive">
  Interactive content
</div>
```

### 3. Safe Areas (iPhone X+)

```jsx
<div className="safe-padding-all">
  {/* Respects notch/home indicator */}
</div>

<div className="safe-padding-bottom">
  {/* Bottom padding for home indicator */}
</div>
```

### 4. Prevent iOS Input Zoom

Inputs use `font-size: 16px` minimum to prevent automatic zoom on focus.

```jsx
<Input /> {/* Already includes 16px font size */}
```

### 5. Landscape Mode

```jsx
<div className="landscape-compact">
  {/* Reduced padding in landscape mode */}
</div>

<div className="landscape-hide">
  {/* Hidden in landscape mode */}
</div>
```

### 6. Performance

```jsx
// Lazy load images
<img
  loading="lazy"
  className="mobile-img-optimize"
/>

// Horizontal scroll with snap
<div className="mobile-scroll-x">
  {/* Items snap to position */}
</div>
```

---

## Testing

### Device Testing Checklist

- [ ] iPhone SE (375px)
- [ ] iPhone 12/13/14 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] Samsung Galaxy S20 (360px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)

### Viewport Testing

```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test all breakpoints
4. Test landscape/portrait
5. Test touch interactions
```

### Accessibility

- [ ] Minimum 44x44px touch targets
- [ ] Color contrast (WCAG AA)
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Reduced motion support

### Performance

- [ ] Lighthouse mobile score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1

---

## Quick Reference

### Most Common Patterns

```jsx
// Responsive container
<div className="mobile-container section-padding-mobile">
  <Content />
</div>

// Responsive heading
<h1 className="text-3xl font-bold sm:text-5xl lg:text-7xl">
  Headline
</h1>

// Responsive grid
<div className="grid-auto-fit-cards">
  <Card />
  <Card />
  <Card />
</div>

// Responsive buttons
<div className="mobile-button-group">
  <Button>Primary</Button>
  <Button variant="outline">Secondary</Button>
</div>

// Responsive spacing
<div className="mobile-spacing">
  <Section />
  <Section />
</div>
```

---

## Additional Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Mobile Web Best Practices](https://web.dev/mobile/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Material Design Mobile Guidelines](https://m3.material.io/)

---

## Support

For questions or issues related to mobile responsiveness:

1. Check component documentation in `/client/src/app/components/@system/`
2. Review Tailwind configuration in `/client/tailwind.config.js`
3. Inspect CSS utilities in `/client/src/index.css`

