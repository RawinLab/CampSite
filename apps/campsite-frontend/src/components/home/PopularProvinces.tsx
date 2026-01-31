'use client';

import Link from 'next/link';

const provinces = [
  {
    id: 'chiang-mai',
    name: 'เชียงใหม่',
    campsiteCount: 45,
    image: 'https://images.unsplash.com/photo-1598935898639-53bfe41da900?w=600',
  },
  {
    id: 'kanchanaburi',
    name: 'กาญจนบุรี',
    campsiteCount: 32,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
  },
  {
    id: 'phetchaburi',
    name: 'เพชรบุรี',
    campsiteCount: 28,
    image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=600',
  },
  {
    id: 'nakhon-nayok',
    name: 'นครนายก',
    campsiteCount: 24,
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600',
  },
  {
    id: 'rayong',
    name: 'ระยอง',
    campsiteCount: 19,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  },
  {
    id: 'mae-hong-son',
    name: 'แม่ฮ่องสอน',
    campsiteCount: 15,
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600',
  },
];

export function PopularProvinces() {
  return (
    <section className="py-16 bg-[#F7F5F0]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4 text-[#2B2D42]">
          จังหวัดยอดนิยม
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
          สำรวจแคมป์ไซต์ในจังหวัดยอดนิยมทั่วประเทศไทย
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {provinces.map((province) => (
            <Link
              key={province.id}
              href={`/search?province=${province.id}`}
              className="group relative overflow-hidden rounded-2xl aspect-[16/9]"
            >
              <img
                src={province.image}
                alt={province.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <h3 className="text-2xl font-bold text-white mb-1">{province.name}</h3>
                <p className="text-white/80 text-sm">{province.campsiteCount} แคมป์ไซต์</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
