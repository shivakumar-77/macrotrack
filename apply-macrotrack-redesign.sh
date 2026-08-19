#!/usr/bin/env bash
# Applies the white/green/purple MacroTrack redesign to an existing
# local checkout. Run from your project ROOT (same folder as package.json).
#
# This OVERWRITES the 26 files below with the final redesigned versions.
# If you've already hand-edited any of them (e.g. personalized FOUNDER
# details in src/data/content.ts), back that up first — this script
# doesn't merge, it replaces.
set -e
echo "Applying MacroTrack redesign..."

mkdir -p "src/app"
cat > 'src/app/globals.css' << 'MTRACK_EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* MacroTrack brand palette — RGB channels so Tailwind's alpha
     modifiers (e.g. bg-card/40) work directly off these tokens. */
  --primary: 34 197 94; /* #22C55E — green */
  --secondary: 99 102 241; /* #6366F1 — purple/indigo */
  --accent: 34 197 94; /* same as primary: every "accent" usage in the app is this green */
  --background: 248 250 252; /* #F8FAFC */
  --card: 255 255 255; /* #FFFFFF */
  --foreground: 17 24 39; /* #111827 */
  --muted-foreground: 107 114 128; /* #6B7280 */
  --success: 34 197 94; /* same green — one accent color, used consistently */
  --border: 229 231 235; /* #E5E7EB — thin gray border */
}

* {
  border-color: rgb(var(--border));
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: rgb(var(--background));
  color: rgb(var(--foreground));
  font-family: var(--font-inter), system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

::selection {
  background: rgb(var(--primary) / 0.2);
  color: rgb(var(--foreground));
}

/* Slim, on-brand scrollbar */
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-track {
  background: rgb(var(--background));
}
::-webkit-scrollbar-thumb {
  background: rgb(var(--border));
  border-radius: 999px;
  border: 2px solid rgb(var(--background));
}
::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--primary) / 0.5);
}

@layer utilities {
  /* Floating white glass surface — the navbar, and any other
     "frosted" chrome that should sit above content. */
  .glass {
    background: rgb(var(--card) / 0.75);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgb(var(--border) / 0.8);
  }

  .glass-strong {
    background: rgb(var(--card) / 0.92);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    border: 1px solid rgb(var(--border));
  }

  .text-gradient {
    background: linear-gradient(
      100deg,
      rgb(var(--primary)) 0%,
      rgb(var(--secondary)) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .bg-radial-fade {
    background: radial-gradient(
      circle at 50% 0%,
      rgb(var(--primary) / 0.08),
      transparent 60%
    );
  }

  .focus-ring {
    outline: none;
  }
  .focus-ring:focus-visible {
    outline: 2px solid rgb(var(--primary));
    outline-offset: 3px;
    border-radius: 4px;
  }

  .shimmer-text {
    background: linear-gradient(
      90deg,
      rgb(var(--muted-foreground)) 0%,
      rgb(var(--foreground)) 50%,
      rgb(var(--muted-foreground)) 100%
    );
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: shimmer 3s linear infinite;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
MTRACK_EOF
echo "  updated src/app/globals.css"

mkdir -p "src/app"
cat > 'src/app/layout.tsx' << 'MTRACK_EOF'
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const SITE_URL = "https://macrotrack.app";
const SITE_DESCRIPTION =
  "MacroTrack is an AI-powered fitness platform for calorie tracking, workouts, water, macros, body progress, and personalized coaching — all in one app. Join the waitlist for early access.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MacroTrack — Transform Your Fitness with AI",
    template: "%s · MacroTrack",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "MacroTrack",
    "AI fitness app",
    "calorie tracker",
    "macro tracker",
    "workout tracker",
    "AI coach",
    "fitness waitlist",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "MacroTrack — Transform Your Fitness with AI",
    description: SITE_DESCRIPTION,
    siteName: "MacroTrack",
  },
  twitter: {
    card: "summary_large_image",
    title: "MacroTrack — Transform Your Fitness with AI",
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#F8FAFC",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Loaded via <link> rather than next/font so the build has no
            external network dependency — swap to next/font/google any
            time for automatic self-hosting and zero layout shift. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ ["--font-inter" as string]: "'Inter', system-ui, sans-serif" }}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
MTRACK_EOF
echo "  updated src/app/layout.tsx"


cat > 'tailwind.config.ts' << 'MTRACK_EOF'
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgb(17 24 39 / 0.10)",
        card: "0 4px 16px -4px rgb(17 24 39 / 0.06)",
        "glow-primary": "0 10px 24px -8px rgb(var(--primary) / 0.45)",
        "glow-success": "0 10px 24px -8px rgb(var(--success) / 0.4)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgb(var(--foreground) / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--foreground) / 0.04) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-18px) translateX(10px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        float: "float 8s ease-in-out infinite",
        "float-slow": "float 14s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 3s linear infinite",
        "accordion-down": "accordion-down 0.25s ease-out",
        "accordion-up": "accordion-up 0.25s ease-out",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
MTRACK_EOF
echo "  updated tailwind.config.ts"

mkdir -p "src/components/ui"
cat > 'src/components/ui/button.tsx' << 'MTRACK_EOF'
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-300 ease-premium disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-green-400 to-green-600 text-white shadow-glow-primary hover:scale-[1.04] hover:shadow-[0_14px_30px_-8px_rgb(var(--primary)/0.55)] active:scale-100",
        secondary:
          "border border-border bg-white text-foreground shadow-card hover:scale-[1.03] hover:bg-gray-50 active:scale-100",
        outline:
          "border border-border bg-transparent text-foreground hover:scale-[1.03] hover:bg-gray-50 active:scale-100",
        ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-gray-100",
        link: "bg-transparent text-primary underline-offset-4 hover:underline p-0",
      },
      size: {
        default: "h-12 px-6 text-sm",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
MTRACK_EOF
echo "  updated src/components/ui/button.tsx"

mkdir -p "src/components/ui"
cat > 'src/components/ui/card.tsx' << 'MTRACK_EOF'
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-2xl border border-border bg-white shadow-soft", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
MTRACK_EOF
echo "  updated src/components/ui/card.tsx"

mkdir -p "src/components/ui"
cat > 'src/components/ui/input.tsx' << 'MTRACK_EOF'
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-14 w-full rounded-xl border bg-white px-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-200",
          hasError
            ? "border-red-300 focus-visible:ring-2 focus-visible:ring-red-200"
            : "border-border focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
MTRACK_EOF
echo "  updated src/components/ui/input.tsx"

mkdir -p "src/components/ui"
cat > 'src/components/ui/form-field.tsx' << 'MTRACK_EOF'
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground", className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs text-red-600">
      {message}
    </p>
  );
}

export { Label, FieldError };
MTRACK_EOF
echo "  updated src/components/ui/form-field.tsx"

mkdir -p "src/components/ui"
cat > 'src/components/ui/checkbox.tsx' << 'MTRACK_EOF'
"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border bg-white transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
MTRACK_EOF
echo "  updated src/components/ui/checkbox.tsx"

mkdir -p "src/components/ui"
cat > 'src/components/ui/select.tsx' << 'MTRACK_EOF'
"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { hasError?: boolean }
>(({ className, children, hasError, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-14 w-full items-center justify-between rounded-xl border bg-white px-4 text-sm text-foreground outline-none transition-all duration-200 data-[placeholder]:text-muted-foreground/60",
      hasError
        ? "border-red-300 focus-visible:ring-2 focus-visible:ring-red-200"
        : "border-border focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={6}
      className={cn(
        "z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-white shadow-soft",
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "focus-ring relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-3 text-sm text-foreground outline-none data-[highlighted]:bg-primary/8",
      className
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-accent" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
MTRACK_EOF
echo "  updated src/components/ui/select.tsx"

mkdir -p "src/components/ui"
cat > 'src/components/ui/accordion.tsx' << 'MTRACK_EOF'
"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-shadow duration-300 ease-premium hover:shadow-card",
      className
    )}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "focus-ring group flex flex-1 items-center justify-between gap-4 px-6 py-5 text-left text-base font-medium text-foreground transition-colors hover:text-accent",
        className
      )}
      {...props}
    >
      {children}
      <Plus className="h-5 w-5 shrink-0 text-accent transition-transform duration-300 ease-premium group-data-[state=open]:rotate-45" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("px-6 pb-5 leading-relaxed", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
MTRACK_EOF
echo "  updated src/components/ui/accordion.tsx"

mkdir -p "src/components/shared"
cat > 'src/components/shared/gradient-blob.tsx' << 'MTRACK_EOF'
import { cn } from "@/lib/utils";

type GradientBlobProps = {
  className?: string;
  variant?: "primary" | "secondary" | "accent" | "success";
  animationClass?: string;
};

const VARIANT_GRADIENT: Record<NonNullable<GradientBlobProps["variant"]>, string> = {
  primary: "from-primary/30 to-transparent",
  secondary: "from-secondary/25 to-transparent",
  accent: "from-primary/30 to-transparent",
  success: "from-primary/25 to-transparent",
};

/**
 * A large, blurred radial gradient used to give sections depth without
 * introducing any new colors — every blob is built from the same brand
 * palette at low opacity.
 */
export function GradientBlob({
  className,
  variant = "primary",
  animationClass = "animate-float-slow",
}: GradientBlobProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-full bg-gradient-to-br blur-3xl",
        VARIANT_GRADIENT[variant],
        animationClass,
        className
      )}
    />
  );
}
MTRACK_EOF
echo "  updated src/components/shared/gradient-blob.tsx"

mkdir -p "src/components/shared"
cat > 'src/components/shared/phone-mockup.tsx' << 'MTRACK_EOF'
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A hand-built iPhone frame — bezel, Dynamic Island, side buttons — so
 * the hero and product preview never depend on a fake screenshot image.
 * Whatever is passed as children is the actual rendered "screen".
 */
export function PhoneMockup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto w-[280px] sm:w-[300px]", className)}>
      {/* Side buttons */}
      <div className="absolute -left-[3px] top-28 h-8 w-[3px] rounded-l-sm bg-gray-800" />
      <div className="absolute -left-[3px] top-40 h-14 w-[3px] rounded-l-sm bg-gray-800" />
      <div className="absolute -left-[3px] top-56 h-14 w-[3px] rounded-l-sm bg-gray-800" />
      <div className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r-sm bg-gray-800" />

      <div className="relative rounded-[2.75rem] border-[6px] border-gray-900 bg-gray-900 p-1.5 shadow-[0_30px_60px_-15px_rgb(17,24,39,0.35)]">
        <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.25rem] bg-background">
          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-2.5 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
          <div className="h-full w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
MTRACK_EOF
echo "  updated src/components/shared/phone-mockup.tsx"

mkdir -p "src/components/shared"
cat > 'src/components/shared/dashboard-preview.tsx' << 'MTRACK_EOF'
import { Bot, Check, Dumbbell, Flame, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScreenId = "dashboard" | "nutrition" | "workout" | "coach";

export const SCREEN_LABELS: Record<ScreenId, string> = {
  dashboard: "Today",
  nutrition: "Nutrition",
  workout: "Workout",
  coach: "AI Coach",
};

function CalorieRing({ percent }: { percent: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
      <circle cx="50" cy="50" r={radius} strokeWidth="8" className="fill-none stroke-border" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        strokeWidth="8"
        strokeLinecap="round"
        className="fill-none stroke-accent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function MacroBar({ label, value, percent, tone }: { label: string; value: string; percent: number; tone: "accent" | "muted" | "dim" }) {
  const toneClass =
    tone === "accent" ? "bg-accent" : tone === "muted" ? "bg-secondary/70" : "bg-muted-foreground/40";
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <div className={cn("h-full rounded-full", toneClass)} style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 text-right text-[10px] text-muted-foreground">{value}</span>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="flex h-full flex-col gap-4 px-4 pb-6 pt-11">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tuesday, Jun 24</p>
        <p className="text-sm font-semibold text-foreground">Good morning, Alex</p>
      </div>

      <div className="glass flex items-center gap-4 rounded-2xl p-3">
        <CalorieRing percent={73} />
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Calories</p>
          <p className="text-lg font-bold text-foreground">
            1,540 <span className="text-xs font-normal text-muted-foreground">/ 2,100</span>
          </p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-accent">
            <Flame className="h-3 w-3" /> On track
          </div>
        </div>
      </div>

      <div className="glass space-y-2 rounded-2xl p-3">
        <MacroBar label="Protein" value="150g" percent={83} tone="accent" />
        <MacroBar label="Carbs" value="165g" percent={75} tone="muted" />
        <MacroBar label="Fat" value="48g" percent={68} tone="dim" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Water</p>
          <p className="mt-1 text-sm font-semibold text-foreground">5 / 8 glasses</p>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-3 w-2 rounded-b-full rounded-t-sm",
                  i < 5 ? "bg-accent" : "bg-border"
                )}
              />
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Workout</p>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-foreground">
            <Check className="h-3.5 w-3.5 text-success" /> Push day
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground">Creatine · Vitamin D taken</p>
        </div>
      </div>
    </div>
  );
}

function NutritionScreen() {
  const meals = [
    { name: "Breakfast", items: "Oats, whey, banana", kcal: 420 },
    { name: "Lunch", items: "Chicken, rice, greens", kcal: 610 },
    { name: "Snack", items: "Greek yogurt, almonds", kcal: 260 },
    { name: "Dinner", items: "Paneer, roti, dal", kcal: 250 },
  ];
  return (
    <div className="flex h-full flex-col gap-3 px-4 pb-6 pt-11">
      <p className="text-sm font-semibold text-foreground">Nutrition Log</p>
      <div className="glass space-y-2 rounded-2xl p-3">
        <MacroBar label="Protein" value="150g" percent={83} tone="accent" />
        <MacroBar label="Carbs" value="165g" percent={75} tone="muted" />
        <MacroBar label="Fat" value="48g" percent={68} tone="dim" />
      </div>
      <div className="space-y-2">
        {meals.map((meal) => (
          <div key={meal.name} className="glass flex items-center justify-between rounded-2xl p-3">
            <div>
              <p className="text-xs font-semibold text-foreground">{meal.name}</p>
              <p className="text-[10px] text-muted-foreground">{meal.items}</p>
            </div>
            <span className="text-xs font-medium text-accent">{meal.kcal} kcal</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkoutScreen() {
  const exercises = [
    { name: "Bench Press", sets: "4 × 8 @ 80kg", done: true },
    { name: "Incline DB Press", sets: "3 × 10 @ 26kg", done: true },
    { name: "Shoulder Press", sets: "3 × 10 @ 40kg", done: true },
    { name: "Tricep Pushdown", sets: "3 × 12 @ 32kg", done: false },
  ];
  return (
    <div className="flex h-full flex-col gap-3 px-4 pb-6 pt-11">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Push Day</p>
        <span className="flex items-center gap-1 text-[10px] text-accent">
          <Dumbbell className="h-3 w-3" /> 45 min
        </span>
      </div>
      <div className="space-y-2">
        {exercises.map((ex) => (
          <div key={ex.name} className="glass flex items-center justify-between rounded-2xl p-3">
            <div>
              <p className="text-xs font-semibold text-foreground">{ex.name}</p>
              <p className="text-[10px] text-muted-foreground">{ex.sets}</p>
            </div>
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full",
                ex.done ? "bg-success text-white" : "border border-border text-transparent"
              )}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoachScreen() {
  return (
    <div className="flex h-full flex-col gap-3 px-4 pb-6 pt-11">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Bot className="h-4 w-4 text-accent" /> AI Coach
      </p>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        <div className="glass max-w-[85%] rounded-2xl rounded-tl-sm p-2.5 text-[11px] leading-relaxed text-foreground">
          Your protein’s been under target 4 days straight — add ~25g at dinner and you’ll hit it.
        </div>
        <div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-primary to-secondary p-2.5 text-[11px] text-white">
          What should I add?
        </div>
        <div className="glass max-w-[85%] rounded-2xl rounded-tl-sm p-2.5 text-[11px] leading-relaxed text-foreground">
          Greek yogurt or a scoop of whey both work with tonight’s dal and roti.
        </div>
        <div className="glass mt-auto flex items-center gap-2 rounded-full px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="flex-1 text-[10px] text-muted-foreground">Ask your coach…</span>
          <Send className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export function DashboardPreview({ screen }: { screen: ScreenId }) {
  switch (screen) {
    case "nutrition":
      return <NutritionScreen />;
    case "workout":
      return <WorkoutScreen />;
    case "coach":
      return <CoachScreen />;
    case "dashboard":
    default:
      return <DashboardScreen />;
  }
}
MTRACK_EOF
echo "  updated src/components/shared/dashboard-preview.tsx"

mkdir -p "src/components/shared"
cat > 'src/components/shared/particle-field.tsx' << 'MTRACK_EOF'
"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  opacity: number;
  color: string;
};

/**
 * A quiet field of drifting dots behind the hero. Pure canvas — no
 * dependency needed for something this simple, and it stays out of the
 * way of Framer Motion / GSAP, which handle every other animation.
 */
export function ParticleField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let animationFrame = 0;

    const PARTICLE_COUNT = 46;
    const COLORS = ["34, 197, 94", "99, 102, 241"]; // primary green, secondary purple

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas!.width = width * window.devicePixelRatio;
      canvas!.height = height * window.devicePixelRatio;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function seed() {
      particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.4,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.3 + 0.08,
        color: COLORS[i % COLORS.length],
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx!.fill();
      }
      animationFrame = requestAnimationFrame(draw);
    }

    resize();
    seed();

    if (prefersReducedMotion) {
      draw();
      cancelAnimationFrame(animationFrame);
    } else {
      draw();
    }

    const handleResize = () => {
      resize();
      seed();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
    />
  );
}
MTRACK_EOF
echo "  updated src/components/shared/particle-field.tsx"

mkdir -p "src/components/layout"
cat > 'src/components/layout/navbar.tsx' << 'MTRACK_EOF'
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4 sm:top-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <nav
          className={`glass flex h-16 items-center justify-between rounded-full px-5 transition-shadow duration-300 ease-premium sm:px-6 ${
            scrolled ? "shadow-soft" : ""
          }`}
        >
          <a href="#top" className="focus-ring rounded-lg">
            <Logo />
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="focus-ring rounded text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:block">
            <Button asChild size="sm">
              <a href="#waitlist">Join Waitlist</a>
            </Button>
          </div>

          <button
            type="button"
            className="focus-ring rounded-lg p-2 text-foreground md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong mt-2 overflow-hidden rounded-3xl shadow-soft md:hidden"
            >
              <div className="flex flex-col gap-1 px-5 pb-5 pt-3">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="focus-ring rounded-lg px-2 py-3 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
                <Button asChild className="mt-2 w-full" onClick={() => setMenuOpen(false)}>
                  <a href="#waitlist">Join Waitlist</a>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
MTRACK_EOF
echo "  updated src/components/layout/navbar.tsx"

mkdir -p "src/components/layout"
cat > 'src/components/layout/footer.tsx' << 'MTRACK_EOF'
import { Instagram, Linkedin, Mail } from "lucide-react";
import { Logo } from "@/components/shared/logo";

const SOCIALS = [
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "LinkedIn", href: "#", icon: Linkedin },
  { label: "Email", href: "mailto:hello@macrotrack.app", icon: Mail },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
        <Logo />

        <div className="flex items-center gap-4">
          {SOCIALS.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <a href="/privacy" className="focus-ring rounded hover:text-foreground">
            Privacy Policy
          </a>
          <a href="/terms" className="focus-ring rounded hover:text-foreground">
            Terms
          </a>
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-7xl text-center text-xs text-muted-foreground/70 md:text-left">
        © {year} MacroTrack. All rights reserved.
      </p>
    </footer>
  );
}
MTRACK_EOF
echo "  updated src/components/layout/footer.tsx"

mkdir -p "src/components/sections"
cat > 'src/components/sections/hero-section.tsx' << 'MTRACK_EOF'
"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientBlob } from "@/components/shared/gradient-blob";
import { ParticleField } from "@/components/shared/particle-field";
import { PhoneMockup } from "@/components/shared/phone-mockup";
import { DashboardPreview } from "@/components/shared/dashboard-preview";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateY, { stiffness: 150, damping: 20 });
  const springY = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const transform = useMotionTemplate`perspective(1000px) rotateX(${springY}deg) rotateY(${springX}deg)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(py * -10);
    rotateY.set(px * 10);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <section
      id="top"
      className="relative overflow-hidden pb-28 pt-40 sm:pb-36 sm:pt-52"
    >
      <div className="bg-radial-fade pointer-events-none absolute inset-0" aria-hidden="true" />
      <GradientBlob variant="primary" className="left-[-10%] top-10 h-80 w-80" />
      <GradientBlob
        variant="secondary"
        className="right-[-8%] top-32 h-96 w-96"
        animationClass="animate-float"
      />
      <ParticleField className="pointer-events-none absolute inset-0 -z-0 opacity-70" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 px-5 sm:px-8 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-4 py-1.5 text-xs font-medium text-green-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Fitness Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-7 text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Transform Your Fitness <br className="hidden sm:block" />
            with <span className="text-gradient">AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-7 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
          >
            Track calories, workouts, nutrition, and progress — all powered
            by intelligent AI that actually pays attention to your data.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Button asChild size="lg">
              <a href="#waitlist">Join the Waitlist</a>
            </Button>
            <Button variant="secondary" size="lg" disabled className="gap-2">
              <PlayCircle className="h-5 w-5" />
              Watch Demo
              <span className="text-muted-foreground">(Coming Soon)</span>
            </Button>
          </motion.div>
        </div>

        <div className="relative mx-auto flex justify-center animate-float-slow">
          <motion.div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div style={{ transform }}>
              <PhoneMockup>
                <DashboardPreview screen="dashboard" />
              </PhoneMockup>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
MTRACK_EOF
echo "  updated src/components/sections/hero-section.tsx"

mkdir -p "src/components/sections"
cat > 'src/components/sections/waitlist-section.tsx' << 'MTRACK_EOF'
"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Smartphone } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { GradientBlob } from "@/components/shared/gradient-blob";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FITNESS_GOALS, PLATFORMS, waitlistSchema, type WaitlistFormValues } from "@/lib/validations";
import { addWaitlistEntry, FirebaseNotConfiguredError, isFirebaseConfigured } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export function WaitlistSection() {
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { platform: "iphone" },
  });

  async function onSubmit(values: WaitlistFormValues) {
    setErrorMessage(null);
    try {
      await addWaitlistEntry(values);
      setSubmitState("success");
    } catch (err) {
      if (err instanceof FirebaseNotConfiguredError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Something went wrong. Please try again in a moment.");
        console.error("Waitlist submission failed:", err);
      }
      setSubmitState("error");
    }
  }

  return (
    <section id="waitlist" className="relative overflow-hidden py-24 sm:py-32">
      <GradientBlob variant="primary" className="left-[-10%] bottom-0 h-96 w-96" />
      <GradientBlob variant="secondary" className="right-[-10%] top-0 h-80 w-80" animationClass="animate-float" />

      <div className="relative mx-auto max-w-xl px-5 sm:px-8">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Be Among the First
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Join the waitlist for early access, founder pricing, and a say in what we build next.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <Card className="overflow-hidden p-8 sm:p-10">
            {!isFirebaseConfigured() && (
              <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                Firebase isn’t configured yet — add your project credentials to{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5">.env.local</code> to enable real
                submissions. See <code className="rounded bg-amber-100 px-1 py-0.5">.env.local.example</code>.
              </p>
            )}

            <AnimatePresence mode="wait">
              {submitState === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center py-8 text-center"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-primary"
                  >
                    <Check className="h-8 w-8" strokeWidth={2.5} />
                  </motion.span>
                  <h3 className="mt-5 text-xl font-semibold text-foreground">You’re on the list!</h3>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    We’ll email you the moment early access opens. Thanks for being here first.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                  className="space-y-5"
                >
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Jordan Rivera"
                      hasError={!!errors.name}
                      {...register("name")}
                    />
                    <FieldError message={errors.name?.message} />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@email.com"
                      hasError={!!errors.email}
                      {...register("email")}
                    />
                    <FieldError message={errors.email?.message} />
                  </div>

                  <div>
                    <Label htmlFor="goal">Fitness Goal</Label>
                    <Controller
                      control={control}
                      name="goal"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="goal" hasError={!!errors.goal}>
                            <SelectValue placeholder="Choose a goal" />
                          </SelectTrigger>
                          <SelectContent>
                            {FITNESS_GOALS.map((goal) => (
                              <SelectItem key={goal.value} value={goal.value}>
                                {goal.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError message={errors.goal?.message} />
                  </div>

                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Controller
                      control={control}
                      name="platform"
                      render={({ field }) => (
                        <div id="platform" className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Platform">
                          {PLATFORMS.map((platform) => (
                            <button
                              key={platform.value}
                              type="button"
                              role="radio"
                              aria-checked={field.value === platform.value}
                              onClick={() => field.onChange(platform.value)}
                              className={cn(
                                "focus-ring flex h-14 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all duration-200",
                                field.value === platform.value
                                  ? "border-primary/40 bg-green-50 text-primary"
                                  : "border-border bg-white text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                              )}
                            >
                              <Smartphone className="h-4 w-4" />
                              {platform.label}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                    <FieldError message={errors.platform?.message} />
                  </div>

                  <div>
                    <Controller
                      control={control}
                      name="updates"
                      render={({ field }) => (
                        <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                          />
                          I agree to receive updates about MacroTrack.
                        </label>
                      )}
                    />
                    <FieldError message={errors.updates?.message} />
                  </div>

                  {submitState === "error" && errorMessage && (
                    <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                      {errorMessage}
                    </p>
                  )}

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Joining…
                      </>
                    ) : (
                      "Join Waitlist"
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
MTRACK_EOF
echo "  updated src/components/sections/waitlist-section.tsx"

mkdir -p "src/components/sections"
cat > 'src/components/sections/why-macrotrack-section.tsx' << 'MTRACK_EOF'
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Layers, LayoutDashboard, Repeat, ShieldCheck, Sparkles } from "lucide-react";
import { WHY_MACROTRACK } from "@/data/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal";
import { Card } from "@/components/ui/card";
import { GradientBlob } from "@/components/shared/gradient-blob";

const ICONS = { Layers, Sparkles, LayoutDashboard, Repeat, ShieldCheck };

// Alternate the accent color per card so green and purple both show up,
// per the brief ("Green icons, Purple accents").
const TONES = [
  { chip: "bg-green-50 text-primary" },
  { chip: "bg-indigo-50 text-secondary" },
  { chip: "bg-green-50 text-primary" },
  { chip: "bg-indigo-50 text-secondary" },
  { chip: "bg-green-50 text-primary" },
];

export function WhyMacroTrackSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !blobRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    // GSAP handles this section's background parallax — a different job
    // from Framer Motion's viewport-triggered card reveals below, and a
    // better fit for something continuously tied to scroll position.
    const ctx = gsap.context(() => {
      gsap.fromTo(
        blobRef.current,
        { yPercent: -20 },
        {
          yPercent: 20,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="why" ref={sectionRef} className="relative overflow-hidden py-24 sm:py-32">
      <div ref={blobRef} className="pointer-events-none absolute inset-0">
        <GradientBlob variant="secondary" className="left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2" animationClass="" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why MacroTrack
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Not just another tracker — the parts that make people actually stick with it.
          </p>
        </Reveal>

        <RevealGroup
          className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.08}
        >
          {WHY_MACROTRACK.map((item, index) => {
            const Icon = ICONS[item.icon];
            const tone = TONES[index % TONES.length];
            return (
              <RevealItem key={item.title} className={index === 3 ? "sm:col-span-2 lg:col-span-1" : ""}>
                <Card className="h-full p-7 transition-all duration-300 ease-premium hover:-translate-y-1.5 hover:shadow-card">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone.chip}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </Card>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
MTRACK_EOF
echo "  updated src/components/sections/why-macrotrack-section.tsx"

mkdir -p "src/components/sections"
cat > 'src/components/sections/features-section.tsx' << 'MTRACK_EOF'
import { BarChart3, BrainCircuit, CalendarDays, Droplets, Dumbbell, Flame, TrendingUp, UtensilsCrossed } from "lucide-react";
import { FEATURES } from "@/data/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal";
import { Card } from "@/components/ui/card";

const ICONS = {
  Flame,
  Dumbbell,
  Droplets,
  BrainCircuit,
  TrendingUp,
  UtensilsCrossed,
  CalendarDays,
  BarChart3,
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One app, every part of the picture
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Everything you’d normally track across four different apps, built to work together instead of against each other.
          </p>
        </Reveal>

        <RevealGroup
          className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          staggerDelay={0.08}
        >
          {FEATURES.map((feature) => {
            const Icon = ICONS[feature.icon];
            return (
              <RevealItem key={feature.title}>
                <Card className="group relative h-full overflow-hidden p-6 transition-all duration-300 ease-premium hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-18px_rgb(var(--primary)/0.35)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-primary transition-transform duration-300 ease-premium group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
MTRACK_EOF
echo "  updated src/components/sections/features-section.tsx"

mkdir -p "src/components/sections"
cat > 'src/components/sections/product-preview-section.tsx' << 'MTRACK_EOF'
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PhoneMockup } from "@/components/shared/phone-mockup";
import { DashboardPreview, SCREEN_LABELS, type ScreenId } from "@/components/shared/dashboard-preview";
import { GradientBlob } from "@/components/shared/gradient-blob";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

const SCREENS: ScreenId[] = ["dashboard", "nutrition", "workout", "coach"];
const INTERVAL_MS = 5000;

export function ProductPreviewSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || reducedMotion) return;

    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % SCREENS.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  const current = SCREENS[index];

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <GradientBlob variant="secondary" className="left-1/2 top-0 h-96 w-96 -translate-x-1/2" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A dashboard built to be opened daily
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Nutrition, training, and coaching — all rendered live, cycling automatically below.
          </p>
        </Reveal>

        <div
          className="relative mx-auto mt-16 flex justify-center"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <PhoneMockup className="w-[300px] sm:w-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full"
              >
                <DashboardPreview screen={current} />
              </motion.div>
            </AnimatePresence>
          </PhoneMockup>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {SCREENS.map((screen, i) => (
            <button
              key={screen}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${SCREEN_LABELS[screen]} screen`}
              aria-current={i === index}
              className="focus-ring group flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 ease-premium",
                  i === index ? "w-6 bg-accent" : "w-1.5 bg-border group-hover:bg-gray-300"
                )}
              />
              <span
                className={cn(
                  "hidden text-xs sm:inline",
                  i === index ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {SCREEN_LABELS[screen]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
MTRACK_EOF
echo "  updated src/components/sections/product-preview-section.tsx"

mkdir -p "src/components/sections"
cat > 'src/components/sections/founder-section.tsx' << 'MTRACK_EOF'
import { Instagram, Linkedin } from "lucide-react";
import { FOUNDER } from "@/data/content";
import { Reveal } from "@/components/shared/reveal";
import { Card } from "@/components/ui/card";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function FounderSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-xl px-5 sm:px-8">
        <Reveal>
          <Card className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xl font-bold text-white shadow-[0_12px_28px_-10px_rgb(var(--primary)/0.5)]">
              {getInitials(FOUNDER.name)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{FOUNDER.name}</h3>
              <p className="text-sm text-primary">{FOUNDER.role}</p>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{FOUNDER.bio}</p>
            <div className="mt-2 flex items-center gap-3">
              <a
                href={FOUNDER.linkedinUrl}
                aria-label="LinkedIn"
                className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href={FOUNDER.instagramUrl}
                aria-label="Instagram"
                className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
MTRACK_EOF
echo "  updated src/components/sections/founder-section.tsx"

mkdir -p "src/components/sections"
cat > 'src/components/sections/trusted-platforms-section.tsx' << 'MTRACK_EOF'
import { Apple, Globe, Smartphone, Watch } from "lucide-react";
import { PLATFORMS_COMING_SOON } from "@/data/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal";

const ICONS = { Apple, Smartphone, Globe, Watch };

export function TrustedPlatformsSection() {
  return (
    <section id="roadmap" className="border-y border-border py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Coming Soon
          </p>
        </Reveal>

        <RevealGroup className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PLATFORMS_COMING_SOON.map((platform) => {
            const Icon = ICONS[platform.icon];
            return (
              <RevealItem key={platform.name}>
                <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-white px-4 py-6 text-center shadow-soft transition-transform duration-300 ease-premium hover:-translate-y-1">
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium text-foreground">{platform.name}</span>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
MTRACK_EOF
echo "  updated src/components/sections/trusted-platforms-section.tsx"

mkdir -p "src/components/sections"
cat > 'src/components/sections/live-counter-section.tsx' << 'MTRACK_EOF'
"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { getWaitlistCount, isFirebaseConfigured } from "@/lib/firebase";

export function LiveCounterSection() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    getWaitlistCount()
      .then(setCount)
      .catch((err) => console.error("Couldn't load waitlist count:", err));
  }, []);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-5 text-center sm:px-8">
        <Reveal>
          <div className="mx-auto inline-flex flex-col items-center gap-3 rounded-3xl border border-border bg-white px-10 py-8 shadow-soft sm:flex-row sm:gap-6 sm:px-14">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-primary">
              <Users className="h-6 w-6" />
            </span>
            <div>
              {count !== null ? (
                <p className="text-3xl font-bold text-foreground sm:text-4xl">
                  <AnimatedCounter value={count} suffix="+" />
                </p>
              ) : (
                <p className="text-3xl font-bold text-foreground sm:text-4xl">Be the first</p>
              )}
              <p className="text-sm text-muted-foreground">People Joined</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
MTRACK_EOF
echo "  updated src/components/sections/live-counter-section.tsx"

mkdir -p "src/data"
cat > 'src/data/content.ts' << 'MTRACK_EOF'
export type Feature = {
  icon: "Flame" | "Dumbbell" | "Droplets" | "BrainCircuit" | "TrendingUp" | "UtensilsCrossed" | "CalendarDays" | "BarChart3";
  title: string;
  description: string;
};

export const FEATURES: Feature[] = [
  {
    icon: "Flame",
    title: "AI Calorie Tracking",
    description: "Log a meal in seconds and let AI estimate calories and macros from what you type or photograph.",
  },
  {
    icon: "Dumbbell",
    title: "Workout Tracking",
    description: "Log sets, reps, and weight, and watch your lifts trend up over weeks instead of relying on memory.",
  },
  {
    icon: "Droplets",
    title: "Water Tracking",
    description: "Tap to log a glass and see your daily intake fill up against a target built around your body.",
  },
  {
    icon: "BrainCircuit",
    title: "AI Coach",
    description: "A coach that actually reads your logs and tells you what to adjust this week, not generic advice.",
  },
  {
    icon: "TrendingUp",
    title: "Body Progress",
    description: "Weight, measurements, and progress photos, lined up on one timeline so trends are impossible to miss.",
  },
  {
    icon: "UtensilsCrossed",
    title: "Meal Planning",
    description: "Personalized meal plans built around your goal, your macros, and the food you actually like eating.",
  },
  {
    icon: "CalendarDays",
    title: "Workout Plans",
    description: "Structured training plans that adapt as you get stronger, so you're never guessing what's next.",
  },
  {
    icon: "BarChart3",
    title: "Smart Analytics",
    description: "Clear charts on adherence, trends, and consistency — the numbers that actually predict progress.",
  },
];

export type TimelineItem = {
  icon: "Layers" | "Sparkles" | "LayoutDashboard" | "Repeat" | "ShieldCheck";
  title: string;
  description: string;
};

export const WHY_MACROTRACK: TimelineItem[] = [
  {
    icon: "Layers",
    title: "Everything in one app",
    description: "Calories, workouts, water, supplements, and progress photos — no more switching between five different trackers.",
  },
  {
    icon: "Sparkles",
    title: "AI insights that matter",
    description: "Your AI Coach reads your actual logs and flags what's working and what's quietly stalling your progress.",
  },
  {
    icon: "LayoutDashboard",
    title: "A dashboard you'll enjoy opening",
    description: "Clean, fast, and designed to make checking in feel good instead of feeling like a chore.",
  },
  {
    icon: "Repeat",
    title: "Built for consistency",
    description: "Small nudges and streaks that keep you logging on the days you don't feel like it — no guilt, just momentum.",
  },
  {
    icon: "ShieldCheck",
    title: "Privacy focused",
    description: "Your data trains your own insights, not a public feed. Nothing is shared unless you choose to share it.",
  },
];

export type Platform = {
  name: string;
  icon: "Apple" | "Smartphone" | "Globe" | "Watch";
};

export const PLATFORMS_COMING_SOON: Platform[] = [
  { name: "iOS", icon: "Apple" },
  { name: "Android", icon: "Smartphone" },
  { name: "Web", icon: "Globe" },
  { name: "Wearables", icon: "Watch" },
];

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ: FaqItem[] = [
  {
    question: "When will MacroTrack launch?",
    answer:
      "We're finishing the core app now. Waitlist members get first access when the beta opens, with a public launch date announced closer to release — join the list and you'll hear about both before anyone else.",
  },
  {
    question: "Will it be free?",
    answer:
      "Yes. MacroTrack has a free tier that covers calorie, macro, workout, and water tracking. A Pro plan will unlock the AI Coach, advanced analytics, and personalized meal and workout plans.",
  },
  {
    question: "Android or iPhone?",
    answer:
      "Both. MacroTrack is being built for iOS and Android from day one, alongside a web dashboard, so switching phones won't mean losing your history.",
  },
  {
    question: "How does the AI actually work?",
    answer:
      "The AI Coach looks at what you actually log — meals, workouts, water, and trends over time — and turns that into specific, plain-language suggestions instead of generic tips that ignore your data.",
  },
];

/**
 * Placeholder founder details. Replace with the real name, bio, and
 * profile links before shipping — intentionally left generic rather
 * than inventing a fake identity or fake social URLs.
 */
export const FOUNDER = {
  name: "Your Name Here",
  role: "Founder & CEO",
  bio: "Building the future of AI-powered fitness, one log at a time.",
  linkedinUrl: "#",
  instagramUrl: "#",
};
MTRACK_EOF
echo "  updated src/data/content.ts"


cat > 'README.md' << 'MTRACK_EOF'
# MacroTrack — Waitlist Landing Page

A production-ready waitlist landing page for MacroTrack, an AI-powered fitness
platform. Built with Next.js 15 (App Router), TypeScript, Tailwind CSS,
shadcn/ui-style components on Radix primitives, Framer Motion, GSAP
(ScrollTrigger), Firebase Firestore, React Hook Form, and Zod.

## Design system

The UI was redesigned to a light theme matching the MacroTrack mobile app.
All colors live as CSS variables in `src/app/globals.css` and are mapped
into Tailwind in `tailwind.config.ts`, so every component pulls from the
same source of truth:

| Token | Value | Used for |
|---|---|---|
| `background` | `#F8FAFC` | Page background |
| `card` | `#FFFFFF` | Cards, inputs, the floating navbar's glass base |
| `primary` / `accent` / `success` | `#22C55E` | Buttons, icons, focus rings, checkmarks — one green used consistently |
| `secondary` | `#6366F1` | Purple accents in "Why MacroTrack" and background glows |
| `foreground` | `#111827` | Body text |
| `muted-foreground` | `#6B7280` | Secondary text |
| `border` | `#E5E7EB` | Card borders, dividers |

## Stack & how it's used

| Tool | What it's doing here |
|---|---|
| **Next.js 15 / TypeScript** | App Router, static generation for every route |
| **Tailwind CSS** | Styling, using CSS variables for the brand color system |
| **Radix UI + CVA** | Accessible primitives (Accordion, Select, Checkbox, Label) styled shadcn-style |
| **Framer Motion** | Scroll reveals, hero entrance, mouse-parallax phone, form success animation |
| **GSAP + ScrollTrigger** | The scroll-scrubbed connecting line in the "Why MacroTrack" timeline |
| **Firebase Firestore** | Waitlist submissions (`waitlist` collection) + live signup count |
| **React Hook Form + Zod** | Waitlist form state and validation |
| **Lucide Icons** | All iconography |

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your Firebase config
npm run dev
```

Open http://localhost:3000.

### Connecting Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Add a **Web app** to the project and copy the config values into `.env.local`.
3. In **Firestore Database**, create a database (production mode is fine).
4. Add security rules that allow public *writes* to `waitlist` but not reads,
   so visitors can join the list without being able to read everyone else's
   emails:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /waitlist/{docId} {
         allow create: if request.resource.data.keys().hasAll(['name', 'email', 'goal', 'platform', 'updates', 'createdAt'])
                        && request.resource.data.email is string;
         allow read, update, delete: if false;
       }
     }
   }
   ```

   The live counter reads via `getCountFromServer`, which Firestore's count
   aggregation allows without needing document-level read access.

Until `.env.local` is filled in, the page still renders and animates fully —
the waitlist form will show an inline notice instead of submitting, and the
live counter shows "Be the first" instead of a number.

### Build & deploy

```bash
npm run build
npm run start   # or deploy the `.next` output to Vercel, which needs zero config
```

This repo was built and verified with `npm run build` (TypeScript strict
mode + ESLint both pass with zero errors) before being handed off.

## Project structure

```
src/
├── app/                  # Routes: /, /privacy, /terms, root layout
├── components/
│   ├── ui/                # Reusable primitives (Button, Card, Select, Accordion, …)
│   ├── layout/             # Navbar, Footer
│   ├── shared/             # Cross-section pieces: PhoneMockup, GradientBlob,
│   │                       # ParticleField, AnimatedCounter, Reveal, DashboardPreview
│   └── sections/           # One file per landing-page section
├── data/content.ts        # All copy: features, FAQ, timeline, platforms, founder
├── lib/                   # firebase.ts, validations.ts (Zod), utils.ts
└── types/                 # (shared types live alongside their data/schema files)
```

## Things to personalize before launch

- **`src/data/content.ts` → `FOUNDER`** — placeholder name, bio, and social
  links. Intentionally generic rather than a fabricated identity — swap in
  the real details.
- **Founder avatar** — currently renders initials rather than a photo. Swap
  `FounderSection` to an `<Image>` once you have a real photo.
- **Social links in `Footer`** — Instagram/LinkedIn currently point to `#`.
- **`src/app/privacy` and `/terms`** — honest placeholder pages; replace with
  real policies before accepting real signups.
- **Fonts** — Inter is loaded via a `<link>` tag (works everywhere, no build
  dependency on Google's servers). Swap to `next/font/google` for automatic
  self-hosting and zero layout shift once you're building somewhere with
  unrestricted internet access.

## Notes on scope

- The hero and product-preview "screenshots" are real coded UI (an actual
  React component rendering inside a CSS-drawn phone frame), not fake
  screenshot images — per the brief.
- `npm run build` bundles Framer Motion, GSAP, and the Firebase SDK; total
  first-load JS is ~336 kB. Reasonable for this feature set, but if
  Lighthouse performance matters, dynamic-`import()`-ing GSAP and the
  Firebase Firestore module (loading them only after first interaction) is
  the next optimization to reach for.
MTRACK_EOF
echo "  updated README.md"

echo "Done. Run: npm run build   (then commit + push to deploy on Vercel)"