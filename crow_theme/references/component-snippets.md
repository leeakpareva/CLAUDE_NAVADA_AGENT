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
7. Section Divider
8. Detail List (Bulleted)
9. Stat Block Row
10. Pipeline Flow
11. Tab Navigation
12. Line Chart
13. Area Chart
14. Bar Chart
15. Donut Chart
16. Sparkline (KPI Card Inline)
17. Footer

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

## 12. Line Chart

```jsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

<div className="border border-[#222] p-6" style={{ background: "#0a0a0a" }}>
  <div className="mb-4">
    <p className="font-mono text-[9px] uppercase"
       style={{ color: "#555", letterSpacing: "0.25em" }}>
      ◈ Metric
    </p>
    <h3 className="font-serif text-2xl font-light" style={{ color: "#e0e0e0" }}>
      Chart Title
    </h3>
  </div>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid stroke="#1a1a1a" vertical={false} />
      <XAxis dataKey="name" stroke="#222"
             tick={{ fill: "#555", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}
             tickLine={{ stroke: "#222" }} axisLine={{ stroke: "#222" }} />
      <YAxis stroke="#222"
             tick={{ fill: "#555", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}
             tickLine={{ stroke: "#222" }} axisLine={{ stroke: "#222" }} />
      <Tooltip
        contentStyle={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 0,
                        fontFamily: "IBM Plex Mono, monospace", fontSize: "11px" }}
        labelStyle={{ color: "#888", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em" }}
        itemStyle={{ color: "#e0e0e0" }}
        cursor={{ stroke: "#333" }} />
      <Line type="monotone" dataKey="value" stroke="#e0e0e0" strokeWidth={1.5}
            dot={false} activeDot={{ r: 3, fill: "#050505", stroke: "#e0e0e0", strokeWidth: 1.5 }} />
    </LineChart>
  </ResponsiveContainer>
</div>
```

## 13. Area Chart

```jsx
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

<div className="border border-[#222] p-6" style={{ background: "#0a0a0a" }}>
  <div className="mb-4">
    <p className="font-mono text-[9px] uppercase"
       style={{ color: "#555", letterSpacing: "0.25em" }}>◈ Trend</p>
    <h3 className="font-serif text-2xl font-light" style={{ color: "#e0e0e0" }}>Area Title</h3>
  </div>
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="fadeGray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0e0e0" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#e0e0e0" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke="#1a1a1a" vertical={false} />
      <XAxis dataKey="name" stroke="#222"
             tick={{ fill: "#555", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}
             tickLine={{ stroke: "#222" }} axisLine={{ stroke: "#222" }} />
      <YAxis stroke="#222"
             tick={{ fill: "#555", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}
             tickLine={{ stroke: "#222" }} axisLine={{ stroke: "#222" }} />
      <Tooltip
        contentStyle={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 0,
                        fontFamily: "IBM Plex Mono, monospace", fontSize: "11px" }}
        labelStyle={{ color: "#888", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em" }}
        itemStyle={{ color: "#e0e0e0" }}
        cursor={{ stroke: "#333" }} />
      <Area type="monotone" dataKey="value" stroke="#e0e0e0" fill="url(#fadeGray)"
            strokeWidth={1.5} dot={false} />
    </AreaChart>
  </ResponsiveContainer>
</div>
```

## 14. Bar Chart

```jsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

<div className="border border-[#222] p-6" style={{ background: "#0a0a0a" }}>
  <div className="mb-4">
    <p className="font-mono text-[9px] uppercase"
       style={{ color: "#555", letterSpacing: "0.25em" }}>◈ Comparison</p>
    <h3 className="font-serif text-2xl font-light" style={{ color: "#e0e0e0" }}>Bar Title</h3>
  </div>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} barCategoryGap="20%" barGap={2}>
      <CartesianGrid stroke="#1a1a1a" vertical={false} />
      <XAxis dataKey="name" stroke="#222"
             tick={{ fill: "#555", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}
             tickLine={{ stroke: "#222" }} axisLine={{ stroke: "#222" }} />
      <YAxis stroke="#222"
             tick={{ fill: "#555", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}
             tickLine={{ stroke: "#222" }} axisLine={{ stroke: "#222" }} />
      <Tooltip
        contentStyle={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 0,
                        fontFamily: "IBM Plex Mono, monospace", fontSize: "11px" }}
        labelStyle={{ color: "#888", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em" }}
        itemStyle={{ color: "#e0e0e0" }}
        cursor={{ fill: "#0a0a0a" }} />
      <Bar dataKey="value" fill="#e0e0e0" radius={[0, 0, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>
```

## 15. Donut Chart

```jsx
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const CROW_PALETTE = ["#ffffff", "#e0e0e0", "#888888", "#555555", "#333333", "#1a1a1a"];

<div className="border border-[#222] p-6" style={{ background: "#0a0a0a" }}>
  <div className="mb-4">
    <p className="font-mono text-[9px] uppercase"
       style={{ color: "#555", letterSpacing: "0.25em" }}>◈ Distribution</p>
    <h3 className="font-serif text-2xl font-light" style={{ color: "#e0e0e0" }}>Donut Title</h3>
  </div>
  <div className="relative">
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius="60%" outerRadius="80%"
             stroke="#050505" strokeWidth={2} paddingAngle={0}>
          {data.map((_, i) => (
            <Cell key={i} fill={CROW_PALETTE[i % CROW_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 0,
                          fontFamily: "IBM Plex Mono, monospace", fontSize: "11px" }}
          itemStyle={{ color: "#e0e0e0" }} />
      </PieChart>
    </ResponsiveContainer>
    {/* Center label */}
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <span className="font-serif text-[32px] font-light" style={{ color: "#fff" }}>
        {total}
      </span>
      <span className="font-mono text-[9px] uppercase"
            style={{ color: "#555", letterSpacing: "0.25em" }}>Total</span>
    </div>
  </div>
</div>
```

## 16. Sparkline (KPI Card Inline)

```jsx
import { ResponsiveContainer, AreaChart, Area } from "recharts";

<div className="border border-[#222] p-5" style={{ background: "#050505" }}>
  <span className="font-mono text-[9px] uppercase"
        style={{ color: "#555", letterSpacing: "0.25em" }}>Metric</span>
  <div className="mt-1 flex items-end justify-between">
    <span className="font-serif text-xl font-light" style={{ color: "#e0e0e0" }}>
      1,234
    </span>
    <span className="font-mono text-[9px]" style={{ color: "#555" }}>+12%</span>
  </div>
  <div className="mt-3">
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={sparkData}>
        <defs>
          <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#888" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#888" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke="#888" fill="url(#spark)"
              strokeWidth={1} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</div>
```

## 17. Footer

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
