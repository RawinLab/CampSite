'use client';

import { Shield, Wallet, MessageCircle, Clock } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'จองง่าย มั่นใจได้',
    description: 'ระบบจองที่เชื่อถือได้ พร้อมการยืนยันทันที',
  },
  {
    icon: Wallet,
    title: 'ราคาดีที่สุด',
    description: 'รับประกันราคาดีที่สุด หรือคืนเงินส่วนต่าง',
  },
  {
    icon: MessageCircle,
    title: 'รีวิวจากผู้ใช้จริง',
    description: 'อ่านรีวิวจากนักท่องเที่ยวตัวจริงที่ไปมาแล้ว',
  },
  {
    icon: Clock,
    title: 'บริการ 24 ชั่วโมง',
    description: 'ทีมงานพร้อมช่วยเหลือตลอดเวลา',
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-16 bg-background-warm">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4 text-brand-text">
          ทำไมต้อง Camping Thailand?
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
          เรามุ่งมั่นให้บริการที่ดีที่สุดสำหรับนักท่องเที่ยวทุกคน
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="text-center group p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-brand-green/10 flex items-center justify-center group-hover:bg-brand-green transition-colors duration-300">
                  <Icon className="h-8 w-8 text-brand-green group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-brand-text">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
