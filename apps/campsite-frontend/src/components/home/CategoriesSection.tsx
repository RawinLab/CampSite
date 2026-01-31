'use client';

import { Tent, Hotel, Home, TreePine } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const categories = [
  {
    id: 'camping',
    name: 'แคมป์ปิ้ง',
    description: 'กางเต็นท์ริมธาร',
    icon: Tent,
    color: 'bg-green-100 text-green-700',
    image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400',
  },
  {
    id: 'glamping',
    name: 'แกลมปิ้ง',
    description: 'ความหรูในธรรมชาติ',
    icon: Hotel,
    color: 'bg-amber-100 text-amber-700',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400',
  },
  {
    id: 'bungalow',
    name: 'บังกะโล',
    description: 'พักผ่อนสไตล์รีสอร์ท',
    icon: Home,
    color: 'bg-blue-100 text-blue-700',
    image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=400',
  },
  {
    id: 'tented-resort',
    name: 'รีสอร์ทเต็นท์',
    description: 'เต็นท์สุดหรู',
    icon: TreePine,
    color: 'bg-rose-100 text-rose-700',
    image: 'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=400',
  },
];

export function CategoriesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4 text-brand-text">
          ประเภทที่พัก
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
          เลือกประเภทที่พักที่ตรงกับสไตล์การท่องเที่ยวของคุณ
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                href={`/search?type=${category.id}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-3xl aspect-[4/5] hover:shadow-xl transition-all duration-300">
                  {/* Background Image */}
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
                    <p className="text-white/80 text-sm">{category.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
