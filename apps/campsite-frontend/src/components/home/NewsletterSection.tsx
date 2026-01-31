'use client';

import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function NewsletterSection() {
  return (
    <section className="relative bg-brand-green">
      {/* Organic wave divider at top */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none -translate-y-[99%]">
        <svg
          className="relative block w-full h-[50px] md:h-[70px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,80 C360,20 720,100 1080,40 C1260,10 1380,50 1440,60 L1440,120 L0,120 Z"
            className="fill-brand-green"
          />
        </svg>
      </div>

      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              รับข่าวสารและโปรโมชั่นพิเศษ
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              สมัครรับจดหมายข่าวเพื่อไม่พลาดโปรโมชั่น แคมป์ไซต์ใหม่ และเคล็ดลับการท่องเที่ยว
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="กรอกอีเมลของคุณ"
                className="h-12 px-4 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white"
              />
              <Button
                size="lg"
                className="h-12 px-6 rounded-2xl bg-brand-coral hover:bg-brand-coral/85 text-white font-semibold whitespace-nowrap transition-all duration-300"
              >
                สมัครรับข่าวสาร
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <p className="text-white/50 text-sm mt-4">
              เราเคารพความเป็นส่วนตัวของคุณ สามารถยกเลิกการรับข่าวสารได้ทุกเมื่อ
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
