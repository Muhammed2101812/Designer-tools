# 🎯 DESIGN KIT - Detaylı Geliştirme Planı

## 📦 **Proje Kurulum & Teknoloji Stack**

### **Core Technologies**
```json
{
  "framework": "Next.js 14.2+ (App Router)",
  "language": "TypeScript",
  "styling": "TailwindCSS v3.4+",
  "ui": "shadcn/ui",
  "state": "Zustand v4",
  "database": "Supabase (PostgreSQL)",
  "auth": "Supabase Auth",
  "payments": "Stripe",
  "analytics": "Plausible Analytics",
  "file-handling": "browser-native APIs",
  "icons": "Lucide React"
}
```

### **Package.json Dependencies**
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "@supabase/supabase-js": "^2.43.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "zustand": "^4.5.0",
    "stripe": "^15.0.0",
    "@stripe/stripe-js": "^3.0.0",
    "qrcode": "^1.5.3",
    "react-cropper": "^2.3.3",
    "cropperjs": "^1.6.2",
    "browser-image-compression": "^2.0.2",
    "framer-motion": "^11.0.0",
    "react-hot-toast": "^2.4.1",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "lucide-react": "^0.378.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0"
  }
}
```

---

## 🏗️ **Proje Dosya Yapısı**

```
design-kit/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx (usage stats, plan info)
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (tools)/
│   │   ├── color-picker/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── ColorCanvas.tsx
│   │   │       ├── ColorDisplay.tsx
│   │   │       └── ColorHistory.tsx
│   │   │
│   │   ├── image-cropper/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── CropCanvas.tsx
│   │   │       ├── AspectRatioSelector.tsx
│   │   │       └── CropPreview.tsx
│   │   │
│   │   ├── image-resizer/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── ResizeControls.tsx
│   │   │       └── ImagePreview.tsx
│   │   │
│   │   ├── format-converter/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── FormatSelector.tsx
│   │   │       └── QualitySlider.tsx
│   │   │
│   │   ├── qr-generator/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── QRCanvas.tsx
│   │   │       ├── QRCustomizer.tsx
│   │   │       └── QRPreview.tsx
│   │   │
│   │   ├── gradient-generator/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── GradientCanvas.tsx
│   │   │       ├── ColorStopEditor.tsx
│   │   │       └── CSSOutput.tsx
│   │   │
│   │   ├── image-compressor/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── CompressionSlider.tsx
│   │   │       └── BeforeAfter.tsx
│   │   │
│   │   ├── background-remover/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── RemovalCanvas.tsx
│   │   │       └── UsageWarning.tsx
│   │   │
│   │   ├── image-upscaler/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── UpscaleOptions.tsx
│   │   │       └── ComparisonView.tsx
│   │   │
│   │   ├── mockup-generator/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── MockupSelector.tsx
│   │   │       ├── DesignPlacer.tsx
│   │   │       └── MockupCanvas.tsx
│   │   │
│   │   └── layout.tsx (shared tool layout)
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── route.ts
│   │   │   └── signout/
│   │   │       └── route.ts
│   │   │
│   │   ├── tools/
│   │   │   ├── background-remover/
│   │   │   │   └── route.ts
│   │   │   ├── upscaler/
│   │   │   │   └── route.ts
│   │   │   └── usage/
│   │   │       ├── check/
│   │   │       │   └── route.ts
│   │   │       └── increment/
│   │   │           └── route.ts
│   │   │
│   │   ├── stripe/
│   │   │   ├── create-checkout/
│   │   │   │   └── route.ts
│   │   │   ├── webhook/
│   │   │   │   └── route.ts
│   │   │   └── portal/
│   │   │       └── route.ts
│   │   │
│   │   └── user/
│   │       ├── stats/
│   │       │   └── route.ts
│   │       └── plan/
│   │           └── route.ts
│   │
│   ├── pricing/
│   │   └── page.tsx
│   │
│   ├── globals.css
│   ├── layout.tsx (root layout)
│   └── page.tsx (landing page)
│
├── components/
│   ├── ui/ (shadcn components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── slider.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── tooltip.tsx
│   │   └── progress.tsx
│   │
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   │
│   ├── shared/
│   │   ├── ToolWrapper.tsx (common wrapper for all tools)
│   │   ├── FileUploader.tsx
│   │   ├── DownloadButton.tsx
│   │   ├── UsageIndicator.tsx
│   │   ├── PremiumBadge.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── marketing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── ToolsGrid.tsx
│   │   ├── Testimonials.tsx
│   │   ├── Pricing.tsx
│   │   └── CTA.tsx
│   │
│   └── dashboard/
│       ├── UsageChart.tsx
│       ├── PlanCard.tsx
│       └── ActivityLog.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── middleware.ts
│   │   └── types.ts
│   │
│   ├── stripe/
│   │   ├── client.ts
│   │   └── server.ts
│   │
│   ├── api-clients/
│   │   ├── removebg.ts
│   │   └── replicate.ts
│   │
│   ├── utils/
│   │   ├── cn.ts (className merger)
│   │   ├── image-processing.ts
│   │   ├── file-validation.ts
│   │   ├── usage-limiter.ts
│   │   └── format-helpers.ts
│   │
│   └── hooks/
│       ├── useAuth.ts
│       ├── useUsage.ts
│       ├── useSubscription.ts
│       ├── useFileUpload.ts
│       └── useImageProcessing.ts
│
├── store/
│   ├── authStore.ts
│   ├── toolStore.ts
│   └── uiStore.ts
│
├── types/
│   ├── index.ts
│   ├── tools.ts
│   ├── user.ts
│   └── subscription.ts
│
├── config/
│   ├── site.ts (site metadata)
│   ├── tools.ts (tool configs)
│   └── pricing.ts (pricing plans)
│
├── public/
│   ├── images/
│   │   ├── logo.svg (sizin vereceğiniz)
│   │   └── tool-icons/
│   └── mockup-templates/
│
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── components.json (shadcn config)
└── README.md
```

---

## 🎨 **Tasarım Sistemi Konfigürasyonu**

### **Tailwind Config (tailwind.config.ts)**
```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
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
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

### **Global CSS Variables (app/globals.css)**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 📊 **Database Schema (Supabase)**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth handles this)
-- We'll extend it with profiles

-- User Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'pro')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  plan TEXT CHECK (plan IN ('premium', 'pro')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Tool Usage Tracking
CREATE TABLE tool_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  is_api_tool BOOLEAN DEFAULT FALSE,
  file_size_mb DECIMAL(10, 2),
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tool_usage_user_date ON tool_usage(user_id, created_at);
CREATE INDEX idx_tool_usage_tool ON tool_usage(tool_name);

ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON tool_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage"
  ON tool_usage FOR INSERT
  WITH CHECK (true);

-- Daily Usage Limits
CREATE TABLE daily_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  api_tools_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_limits_user_date ON daily_limits(user_id, date);

ALTER TABLE daily_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own limits"
  ON daily_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Function to get or create daily limit
CREATE OR REPLACE FUNCTION get_or_create_daily_limit(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  date DATE,
  api_tools_count INTEGER
) AS $$
BEGIN
  INSERT INTO daily_limits (user_id, date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, date) DO NOTHING;
  
  RETURN QUERY
  SELECT dl.id, dl.user_id, dl.date, dl.api_tools_count
  FROM daily_limits dl
  WHERE dl.user_id = p_user_id AND dl.date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment API usage
CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO daily_limits (user_id, date, api_tools_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    api_tools_count = daily_limits.api_tools_count + 1,
    updated_at = NOW()
  RETURNING api_tools_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use API tool
CREATE OR REPLACE FUNCTION can_use_api_tool(p_user_id UUID)
RETURNS TABLE (
  can_use BOOLEAN,
  current_usage INTEGER,
  limit_amount INTEGER,
  plan TEXT
) AS $$
DECLARE
  user_plan TEXT;
  usage_count INTEGER;
  limit_val INTEGER;
BEGIN
  -- Get user's plan
  SELECT p.plan INTO user_plan
  FROM profiles p
  WHERE p.id = p_user_id;
  
  -- Get today's usage
  SELECT COALESCE(dl.api_tools_count, 0) INTO usage_count
  FROM daily_limits dl
  WHERE dl.user_id = p_user_id AND dl.date = CURRENT_DATE;
  
  IF usage_count IS NULL THEN
    usage_count := 0;
  END IF;
  
  -- Set limit based on plan
  IF user_plan = 'free' THEN
    limit_val := 10;
  ELSIF user_plan = 'premium' THEN
    limit_val := 500;
  ELSIF user_plan = 'pro' THEN
    limit_val := 2000;
  ELSE
    limit_val := 10; -- default to free
  END IF;
  
  RETURN QUERY SELECT 
    usage_count < limit_val,
    usage_count,
    limit_val,
    user_plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API Keys for external services (encrypted)
CREATE TABLE api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service_name TEXT UNIQUE NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_limits_updated_at
  BEFORE UPDATE ON daily_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔧 **Environment Variables (.env.example)**

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Design Kit

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs
STRIPE_PREMIUM_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx

# API Services
REMOVE_BG_API_KEY=your_removebg_key
REPLICATE_API_KEY=your_replicate_key

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=designkit.com
```

---

## 🚀 **FAZ 1: Renk Seçici (Color Picker) - Detaylı Plan**

### **Özellikler**
- ✅ Görsel yükleme (drag & drop veya browse)
- ✅ Canvas üzerinde herhangi bir noktaya tıklayıp renk alma
- ✅ HEX, RGB, HSL, HSV formatlarında gösterim
- ✅ Renk geçmişi (son 10 renk)
- ✅ Kopyalama butonu (clipboard)
- ✅ Renk paletini export (JSON/CSS)
- ✅ Responsive tasarım

### **Teknik Detaylar**

#### **Dosya: app/(tools)/color-picker/page.tsx**
```typescript
'use client'

import { useState, useRef, useCallback } from 'react'
import { Canvas } from './components/ColorCanvas'
import { ColorDisplay } from './components/ColorDisplay'
import { ColorHistory } from './components/ColorHistory'
import { FileUploader } from '@/components/shared/FileUploader'
import { ToolWrapper } from '@/components/shared/ToolWrapper'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'react-hot-toast'

interface Color {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  timestamp: number
}

export default function ColorPickerPage() {
  const [image, setImage] = useState<string | null>(null)
  const [currentColor, setCurrentColor] = useState<Color | null>(null)
  const [colorHistory, setColorHistory] = useState<Color[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleColorPick = useCallback((color: Color) => {
    setCurrentColor(color)
    setColorHistory(prev => {
      const newHistory = [color, ...prev.filter(c => c.hex !== color.hex)]
      return newHistory.slice(0, 10) // Keep last 10
    })
  }, [])

  const handleCopyColor = useCallback((format: 'hex' | 'rgb' | 'hsl') => {
    if (!currentColor) return
    
    let text = ''
    switch (format) {
      case 'hex':
        text = currentColor.hex
        break
      case 'rgb':
        text = `rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b})`
        break
      case 'hsl':
        text = `hsl(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%)`
        break
    }
    
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${format.toUpperCase()}!`)
  }, [currentColor])

  const handleExportPalette = useCallback(() => {
    if (colorHistory.length === 0) {
      toast.error('No colors to export')
      return
    }

    const palette = {
      colors: colorHistory.map(c => ({
        hex: c.hex,
        rgb: c.rgb,
        hsl: c.hsl
      })),
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(palette, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `color-palette-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Palette exported!')
  }, [colorHistory])

  return (
    <ToolWrapper
      title="Color Picker"
      description="Extract colors from any image with precision"
      icon="Pipette"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Canvas Area */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            {!image ? (
              <FileUploader
                onFileSelect={handleImageUpload}
                accept="image/*"
                maxSize={10} // 10MB
                description="Upload an image to start picking colors"
              />
            ) : (
              <Canvas
                ref={canvasRef}
                imageSrc={image}
                onColorPick={handleColorPick}
                onImageReset={() => setImage(null)}
              />
            )}
          </Card>
        </div>

        {/* Right: Color Info & History */}
        <div className="space-y-6">
          <ColorDisplay
            color={currentColor}
            onCopy={handleCopyColor}
          />
          
          <ColorHistory
            colors={colorHistory}
            onColorSelect={setCurrentColor}
            onExport={handleExportPalette}
            onClear={() => setColorHistory([])}
          />
        </div>
      </div>
    </ToolWrapper>
  )
}
```

#### **Dosya: app/(tools)/color-picker/components/ColorCanvas.tsx**
```typescript
'use client'

import { useEffect, useRef, forwardRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCw, X } from 'lucide-react'

interface Color {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  timestamp: number
}

interface ColorCanvasProps {
  imageSrc: string
  onColorPick: (color: Color) => void
  onImageReset: () => void
}

export const Canvas = forwardRef<HTMLCanvasElement, ColorCanvasProps>(
  ({ imageSrc, onColorPick, onImageReset }, ref) => {
    const internalRef = useRef<HTMLCanvasElement>(null)
    const canvasRef = (ref as any) || internalRef
    const [zoom, setZoom] = useState(1)
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [showMagnifier, setShowMagnifier] = useState(false)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      const img = new Image()
      img.onload = () => {
        // Set canvas size to match image (with max width)
        const maxWidth = 800
        const scale = img.width > maxWidth ? maxWidth / img.width : 1
        
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = imageSrc
    }, [imageSrc, canvasRef])

    const rgbToHsl = (r: number, g: number, b: number) => {
      r /= 255
      g /= 255
      b /= 255

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h = 0, s = 0, l = (max + min) / 2

      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6
            break
          case g:
            h = ((b - r) / d + 2) / 6
            break
          case b:
            h = ((r - g) / d + 4) / 6
            break
        }
      }

      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      }
    }

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (canvas.width / rect.width)
      const y = (e.clientY - rect.top) * (canvas.height / rect.height)

      const imageData = ctx.getImageData(x, y, 1, 1)
      const [r, g, b] = imageData.data

      const hex = '#' + [r, g, b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('')

      const hsl = rgbToHsl(r, g, b)

      onColorPick({
        hex,
        rgb: { r, g, b },
        hsl,
        timestamp: Date.now()
      })
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (canvas.width / rect.width)
      const y = (e.clientY - rect.top) * (canvas.height / rect.height)

      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(1)}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={onImageReset}
          >
            <X className="w-4 h-4 mr-2" />
            Reset Image
          </Button>
        </div>

        {/* Canvas */}
        <div className="overflow-auto border rounded-lg bg-gray-50 dark:bg-gray-900">
          <div 
            className="inline-block p-4"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setShowMagnifier(true)}
              onMouseLeave={() => setShowMagnifier(false)}
              className="cursor-crosshair shadow-lg"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>

        {/* Instructions */}
        <p className="text-sm text-muted-foreground text-center">
          Click anywhere on the image to pick a color
        </p>
      </div>
    )
  }
)

Canvas.displayName = 'ColorCanvas'
```

#### **Dosya: app/(tools)/color-picker/components/ColorDisplay.tsx**
```typescript
'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface Color {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  timestamp: number
}

interface ColorDisplayProps {
  color: Color | null
  onCopy: (format: 'hex' | 'rgb' | 'hsl') => void
}

export function ColorDisplay({ color, onCopy }: ColorDisplayProps) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)

  const handleCopy = (format: 'hex' | 'rgb' | 'hsl') => {
    onCopy(format)
    setCopiedFormat(format)
    setTimeout(() => setCopiedFormat(null), 2000)
  }

  if (!color) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Click on the image to pick a color</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-4">
      {/* Color Preview */}
      <div
        className="w-full h-32 rounded-lg border shadow-sm"
        style={{ backgroundColor: color.hex }}
      />

      {/* Color Values */}
      <div className="space-y-2">
        {/* HEX */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">HEX</p>
            <p className="font-mono font-semibold">{color.hex}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy('hex')}
          >
            {copiedFormat === 'hex' ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* RGB */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">RGB</p>
            <p className="font-mono font-semibold">
              {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy('rgb')}
          >
            {copiedFormat === 'rgb' ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* HSL */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">HSL</p>
            <p className="font-mono font-semibold">
              {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy('hsl')}
          >
            {copiedFormat === 'hsl' ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
```

### **Süre Tahmini: 2-3 gün**
- Gün 1: Temel canvas ve renk seçme mantığı
- Gün 2: UI bileşenleri ve kopyalama özellikleri
- Gün 3: Polish, testing, responsive düzenleme

---

## 📅 **Genel Timeline (10 Araç)**

### **Faz 1: Client-Side Araçlar (14-21 gün)**
```
Hafta 1:
├─ Gün 1-3: Renk Seçici ✅
├─ Gün 4-7: Görsel Kırpma

Hafta 2:
├─ Gün 8-9: Görsel Boyutlandırma
├─ Gün 10-12: Format Dönüştürücü
└─ Gün 13-14: Buffer/Polish

Hafta 3:
├─ Gün 15-18: QR Kod Oluşturucu
├─ Gün 19-21: Gradyan Oluşturucu
```

### **Faz 1.5: İlk Deploy & Testing (2-3 gün)**
```
├─ Landing page hazırlığı
├─ SEO optimizasyonu
├─ Performance testing
└─ Cloudflare Pages deploy
```

### **Faz 2: Backend Setup (4-5 gün)**
```
Hafta 4:
├─ Gün 22-24: Supabase kurulumu
│   ├─ Database migrations
│   ├─ Auth setup
│   └─ RLS policies
├─ Gün 25-26: Stripe entegrasyonu
│   ├─ Products & prices
│   ├─ Checkout flow
│   └─ Webhook handler
```

### **Faz 3: Görsel Sıkıştırma (3 gün)**
```
Hafta 5:
├─ Gün 27-29: Görsel Sıkıştırma
    ├─ Browser-based compression
    ├─ Önce/sonra görünümü
    └─ Kalite kontrolü
```

### **Faz 4: API Araçları (10-12 gün)**
```
Hafta 5-6:
├─ Gün 30-33: Arkaplan Kaldırma
│   ├─ Remove.bg entegrasyonu
│   ├─ Usage tracking
│   └─ Premium gate
├─ Gün 34-37: Çözünürlük Artırma
│   ├─ API seçimi (Replicate vs diğer)
│   ├─ Batch processing
│   └─ Karşılaştırma görünümü
├─ Gün 38-42: Mockup Oluşturucu
    ├─ Template sistemi
    ├─ Drag & drop
    └─ Export options
```

### **Faz 5: Dashboard & Polish (3-4 gün)**
```
Hafta 7:
├─ Gün 43-45: Dashboard
│   ├─ Usage statistics
│   ├─ Activity log
│   └─ Settings page
└─ Gün 46: Final polish & bug fixes
```

### **TOPLAM SÜRE: 6-7 Hafta (42-46 gün)**

---

## 🧪 **Testing Stratejisi**

### **Her Araç İçin Test Checklist**
```typescript
// test-checklist.md

## Functionality Tests
- [ ] File upload works (drag & drop + browse)
- [ ] Tool performs its main function correctly
- [ ] Download/export works
- [ ] Error handling works (invalid files, too large, etc.)
- [ ] Loading states are visible

## UI/UX Tests
- [ ] Responsive on mobile (320px+)
- [ ] Responsive on tablet (768px+)
- [ ] Responsive on desktop (1024px+)
- [ ] Dark mode works
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (basic ARIA)

## Performance Tests
- [ ] Loads in < 2s (LCP)
- [ ] Interactive in < 3.5s (TTI)
- [ ] No layout shifts (CLS < 0.1)
- [ ] Handles large files (up to max size)

## Browser Tests
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Premium Feature Tests (if applicable)
- [ ] Free tier limits work
- [ ] Premium features are gated
- [ ] Usage tracking is accurate
```

---

## 🚀 **Deploy Stratejisi**

### **1. İlk Deploy (Faz 1 Sonrası)**
```bash
# Cloudflare Pages Setup
1. GitHub'a push
2. Cloudflare Pages dashboard
3. Connect repository
4. Build settings:
   - Framework: Next.js
   - Build command: npm run build
   - Output directory: .next
5. Environment variables ekle
6. Deploy!
```

### **2. Domain Setup (İleride)**
```bash
1. Domain satın al (Namecheap, Google Domains, etc.)
2. Cloudflare'e nameserver'ları değiştir
3. SSL otomatik aktif olur
4. DNS ayarları:
   - A record: Cloudflare Pages IP
   - CNAME: www -> ana domain
```

### **3. Analytics Setup**
```javascript
// Plausible Analytics
// app/layout.tsx içine ekle:

<script 
  defer 
  data-domain="designkit.com"
  src="https://plausible.io/js/script.js"
/>

// Tracking goals:
- Tool Usage: tools_used
- Signup: user_signup
- Premium: premium_checkout
- Download: file_download
```

---

## 📝 **Shared Components (Tüm Araçlar İçin)**

### **ToolWrapper Component**
```typescript
// components/shared/ToolWrapper.tsx

'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'

interface ToolWrapperProps {
  title: string
  description: string
  icon?: string
  children: ReactNode
  showBackButton?: boolean
  infoContent?: ReactNode
}

export function ToolWrapper({
  title,
  description,
  children,
  showBackButton = true,
  infoContent
}: ToolWrapperProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        {showBackButton && (
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Button>
          </Link>
        )}
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{title}</h1>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>
          
          {infoContent && (
            <Button variant="outline" size="sm">
              <Info className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tool Content */}
      <div>{children}</div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>All processing happens in your browser. Your files never leave your device.</p>
      </div>
    </div>
  )
}
```

### **FileUploader Component**
```typescript
// components/shared/FileUploader.tsx

'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number // in MB
  description?: string
  multiple?: boolean
}

export function FileUploader({
  onFileSelect,
  accept = 'image/*',
  maxSize = 10,
  description,
  multiple = false
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`)
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }, [maxSize, onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    multiple,
    maxSize: maxSize * 1024 * 1024
  })

  const handleClear = () => {
    setSelectedFile(null)
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12
          transition-colors cursor-pointer
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          
          <div>
            <p className="text-lg font-semibold mb-1">
              {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              or click to browse
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Max file size: {maxSize}MB
            </p>
          </div>
        </div>
      </div>

      {selectedFile && (
        <div className="mt-4 flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <File className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
```

---

## 🎯 **Gelecek Adımlar (Başlamak İçin)**

### **1. İlk Setup (1 gün)**
```bash
# Proje oluştur
npx create-next-app@latest design-kit --typescript --tailwind --app

cd design-kit

# shadcn/ui kurulumu
npx shadcn-ui@latest init

# Gerekli shadcn componentleri ekle
npx shadcn-ui@latest add button card input label select slider toast dialog

# Dependencies yükle
npm install zustand qrcode react-hot-toast framer-motion date-fns

# Dev server başlat
npm run dev
```

### **2. Dosya Yapısını Kur**
- Yukarıdaki klasör yapısını oluştur
- Shared componentleri yaz
- Layout'ları hazırla

### **3. İlk Araç: Renk Seçici**
- Yukarıdaki detaylı plana göre başla
- Her component'i tek tek test et
- UI/UX'i polish et

---

## 🎨 **Landing Page (app/page.tsx)**

```typescript
// app/page.tsx

import { Hero } from '@/components/marketing/Hero'
import { Features } from '@/components/marketing/Features'
import { ToolsGrid } from '@/components/marketing/ToolsGrid'
import { Pricing } from '@/components/marketing/Pricing'
import { CTA } from '@/components/marketing/CTA'

export default function HomePage() {
  return (
    <main className="flex flex-col">
      <Hero />
      <ToolsGrid />
      <Features />
      <Pricing />
      <CTA />
    </main>
  )
}
```

---

## 📊 **Performans Hedefleri**

```yaml
Lighthouse Scores:
  Performance: 95+
  Accessibility: 95+
  Best Practices: 95+
  SEO: 100

Core Web Vitals:
  LCP: < 2.5s
  FID: < 100ms
  CLS: < 0.1

Bundle Size:
  First Load JS: < 200KB
  Image Optimization: WebP + lazy loading
```

---

## 🔒 **Security Checklist**

```markdown
- [ ] Environment variables güvenli
- [ ] API keys server-side
- [ ] CORS ayarları doğru
- [ ] Rate limiting aktif
- [ ] SQL injection koruması (Supabase RLS)
- [ ] XSS koruması (Next.js default)
- [ ] CSRF token'ları (Stripe webhook)
- [ ] File upload validation
- [ ] Max file size limits
```

---

## ✅ **Son Kontrol Listesi**

### **Proje Başlamadan Önce:**
- [x] Teknoloji stack belirlendi
- [x] Dosya yapısı planlandı
- [x] Database şeması hazır
- [x] Her araç için detaylı plan var
- [x] Timeline belirlendi
- [ ] Logo hazır (sizden bekliyor)
- [ ] .env.example hazırlandı

### **İlk Gün Yapılacaklar:**
1. ✅ Next.js projesi oluştur
2. ✅ shadcn/ui kur ve configure et
3. ✅ Dosya yapısını kur
4. ✅ Shared componentleri yaz
5. ✅ Renk Seçici'ye başla
