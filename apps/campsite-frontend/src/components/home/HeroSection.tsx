'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function HeroSection() {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1920')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          ค้นพบแคมป์ไซต์ในฝัน
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
          ค้นหาและจองที่พักแคมป์ปิ้ง แกลมปิ้ง รีสอร์ทเต็นท์ทั่วประเทศไทย
        </p>

        {/* Search Box */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="ค้นหาชื่อแคมป์ไซต์..."
                className="pl-10 h-12 text-base border-gray-200 focus:border-[#2D5A3D] focus:ring-[#2D5A3D]"
              />
            </div>
            <Button 
              size="lg"
              className="h-12 px-8 bg-[#2D5A3D] hover:bg-[#1e3d29] text-white font-semibold text-base"
            >
              <Search className="mr-2 h-5 w-5" />
              ค้นหา
            </Button>
          </div>

          {/* Quick Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['แคมป์ปิ้ง', 'แกลมปิ้ง', 'บังกะโล', 'รีสอร์ทเต็นท์', 'เชียงใหม่', 'กาญจนบุรี'].map((tag) => (
              <a
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="px-4 py-1.5 text-sm bg-gray-100 hover:bg-[#2D5A3D] hover:text-white text-gray-600 rounded-full transition-all duration-200"
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
