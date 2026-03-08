# Crow Theme — Component Snippets

Ready-to-use HTML/React code snippets for common Crow Theme patterns.
Read this file when building web UIs to ensure pixel-perfect compliance.

## Table of Contents

1. Section Header
2. Data Grid (1px-Gap Pattern)
3. Tag / Badge
4. Status Badge
5. Expandable Card
6. Code Block
7. Sidebar Navigation
8. Cover Page
9. Status Strip
10. Pipeline Flow
11. Table
12. Stat Block Row
13. Form Input
14. Button

---

## 1. Section Header

```jsx
<div className="mb-12">
  <p className="mb-3 font-mono text-[10px] uppercase"
     style={{ color: "#555", letterSpacing: "0.3em" }}>
    {"◈"} Section Name
  </p>
  <h2 className="font-serif text-[40px] font-light"
      style={{ color: "#fff", letterSpacing: "-0.02em" }}>
    Section Title
  </h2>
  <div className="mt-4 h-px w-16" style={{ background: "#222" }} />
</div>
```

## 2. Data Grid (1px-Gap Pattern)

```jsx
<div className="grid grid-cols-3 gap-px border border-[#222]"
     style={{ background: "#222" }}>
  {items.map((item) => (
    <div key={item.label} className="flex flex-col gap-2 p-6"
         style={{ background: "#050505" }}>
      <span className="font-mono text-[9px] uppercase"
            style={{ color: "#555", letterSpacing: "0.25em" }}>
        {item.label}
      </span>
      <span className="font-serif text-lg font-light"
            style={{ color: "#e0e0e0" }}>
        {item.value}
      </span>
      <span className="font-mono text-[10px]" style={{ color: "#444" }}>
        {item.detail}
      </span>
    </div>
  ))}
</div>
```

## 3. Tag / Badge

```jsx
<span className="border border-[#222] px-2 py-0.5 font-mono text-[9px] uppercase"
      style={{ color: "#555", letterSpacing: "0.1em" }}>
  TAG NAME
</span>
```

## 4. Status Badge

```jsx
<span className="border border-[#222] px-2 py-0.5 font-mono text-[8px] uppercase"
      style={{
        color: status === "HIGH" ? "#e0e0e0" : status === "MED" ? "#888" : "#555",
        letterSpacing: "0.15em",
      }}>
  {status}
</span>
```

## 5. Expandable Card

```jsx
<div className="border border-[#222]">
  <button type="button" onClick={toggle}
          className="flex w-full items-center justify-between px-6 py-5 text-left">
    <div className="flex items-center gap-4">
      <span className="text-lg" style={{ color: "#444" }}>◈</span>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="font-serif text-xl font-light"
                style={{ color: "#e0e0e0" }}>
            Item Name
          </span>
          {/* Status badge here */}
        </div>
        <span className="font-mono text-[10px]" style={{ color: "#555" }}>
          Tagline text
        </span>
      </div>
    </div>
    <span className="font-mono text-sm transition-transform duration-200"
          style={{
            color: "#555",
            transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)",
          }}>
      +
    </span>
  </button>

  {isExpanded && (
    <div className="border-t border-[#1a1a1a] px-6 py-6">
      {/* Expanded content */}
    </div>
  )}
</div>
```

## 6. Code Block

```jsx
<div className="border border-[#222]">
  <div className="flex items-center justify-between border-b border-[#222] px-4 py-2">
    <span className="font-mono text-[9px] uppercase"
          style={{ color: "#555", letterSpacing: "0.2em" }}>
      {label}
    </span>
    <button className="font-mono text-[9px] uppercase transition-colors hover:text-[#888]"
            style={{ color: "#444", letterSpacing: "0.15em" }}>
      COPY
    </button>
  </div>
  <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed"
       style={{ background: "#0a0a0a", color: "#888" }}>
    <code>{code}</code>
  </pre>
</div>
```

## 7. Section Divider

```jsx
<div className="h-px w-full" style={{ background: "#1a1a1a" }} />
```

## 8. Detail List (Bulleted)

```jsx
<div className="flex flex-col gap-1.5">
  {items.map((item) => (
    <div key={item} className="flex items-start gap-2">
      <span className="mt-1 font-mono text-[8px]" style={{ color: "#444" }}>
        {"▸"}
      </span>
      <span className="font-mono text-[11px]" style={{ color: "#888" }}>
        {item}
      </span>
    </div>
  ))}
</div>
```

## 9. Stat Block Row

```jsx
<div className="flex gap-10">
  {stats.map((stat) => (
    <div key={stat.label} className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase"
            style={{ color: "#555", letterSpacing: "0.25em" }}>
        {stat.label}
      </span>
      <span className="font-serif text-xl font-light"
            style={{ color: "#e0e0e0" }}>
        {stat.value}
      </span>
    </div>
  ))}
</div>
```

## 10. Pipeline Flow

```jsx
<div className="flex flex-wrap items-center gap-2">
  {steps.map((step, i) => (
    <div key={step} className="flex items-center gap-2">
      <div className="border border-[#222] px-4 py-3">
        <span className="font-mono text-[10px] uppercase"
              style={{ color: "#e0e0e0", letterSpacing: "0.1em" }}>
          {step}
        </span>
      </div>
      {i < steps.length - 1 && (
        <span className="font-mono text-[10px]" style={{ color: "#444" }}>
          {"▸"}
        </span>
      )}
    </div>
  ))}
</div>
```

## 11. Tab Navigation

```jsx
<div className="flex border-b border-[#1a1a1a]">
  {tabs.map((tab) => (
    <button key={tab.id} onClick={() => setActive(tab.id)}
            className="relative px-5 py-3 font-mono text-[10px] uppercase"
            style={{
              color: active === tab.id ? "#e0e0e0" : "#555",
              letterSpacing: "0.15em",
            }}>
      {tab.label}
      {active === tab.id && (
        <span className="absolute bottom-0 left-0 h-px w-full"
              style={{ background: "#fff" }} />
      )}
    </button>
  ))}
</div>
```

## 12. Footer

```jsx
<div className="border-t border-[#1a1a1a] pt-8">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="flex h-6 w-6 items-center justify-center border border-[#444]">
        <span className="font-mono text-[10px] font-light" style={{ color: "#fff" }}>
          N
        </span>
      </div>
      <span className="font-mono text-[10px] uppercase"
            style={{ color: "#555", letterSpacing: "0.2em" }}>
        NAVADA Lab
      </span>
    </div>
    <span className="font-mono text-[9px]" style={{ color: "#444" }}>
      Additional info
    </span>
  </div>
</div>
```
