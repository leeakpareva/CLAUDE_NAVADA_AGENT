# Crow Theme — CSS Variables Reference

Copy-paste ready CSS variable block for any web project using the Crow Theme.

## Root Variables (Tailwind / shadcn compatible)

```css
:root {
  --background: 0 0% 2%;
  --foreground: 0 0% 100%;
  --card: 0 0% 3%;
  --card-foreground: 0 0% 100%;
  --popover: 0 0% 3%;
  --popover-foreground: 0 0% 100%;
  --primary: 0 0% 100%;
  --primary-foreground: 0 0% 2%;
  --secondary: 0 0% 8%;
  --secondary-foreground: 0 0% 88%;
  --muted: 0 0% 8%;
  --muted-foreground: 0 0% 53%;
  --accent: 0 0% 10%;
  --accent-foreground: 0 0% 88%;
  --destructive: 0 0% 30%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 10%;
  --input: 0 0% 10%;
  --ring: 0 0% 100%;
  --radius: 0rem;
  --sidebar-background: 0 0% 2%;
  --sidebar-foreground: 0 0% 88%;
  --sidebar-primary: 0 0% 100%;
  --sidebar-primary-foreground: 0 0% 2%;
  --sidebar-accent: 0 0% 8%;
  --sidebar-accent-foreground: 0 0% 88%;
  --sidebar-border: 0 0% 10%;
  --sidebar-ring: 0 0% 100%;
}
```

## Tailwind Config Extension

```ts
theme: {
  extend: {
    fontFamily: {
      serif: ['var(--font-newsreader)', 'Georgia', 'serif'],
      mono: ['var(--font-ibm-plex-mono)', 'Consolas', 'monospace'],
    },
    borderRadius: {
      lg: '0rem',
      md: '0rem',
      sm: '0rem',
    },
  },
},
```

## Global Styles

```css
::selection {
  background: #ffffff;
  color: #000000;
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #050505; }
::-webkit-scrollbar-thumb { background: #222; }
::-webkit-scrollbar-thumb:hover { background: #333; }
```

## Animations

```css
@keyframes pulse-text {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@keyframes line-expand {
  from { width: 0; }
  to { width: 120px; }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-pulse-text { animation: pulse-text 2s ease-in-out infinite; }
.animate-line-expand { animation: line-expand 1.5s ease-out 0.5s forwards; }
.animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
```

## Google Fonts Import (for non-Next.js projects)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Newsreader:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet">
```

```css
body {
  font-family: 'Newsreader', Georgia, serif;
  background: #050505;
  color: #fff;
  -webkit-font-smoothing: antialiased;
}
```
