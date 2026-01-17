-- Migration: Seed data
-- Description: Initial data for provinces, campsite types, and amenities
-- Date: 2026-01-17

-- ============================================
-- PROVINCES (All 77 Thai Provinces)
-- ============================================

INSERT INTO provinces (name_th, name_en, slug, latitude, longitude, region) VALUES
-- Bangkok
('กรุงเทพมหานคร', 'Bangkok', 'bangkok', 13.7563, 100.5018, 'central'),
-- Central Region
('กำแพงเพชร', 'Kamphaeng Phet', 'kamphaeng-phet', 16.4827, 99.5226, 'central'),
('ชัยนาท', 'Chai Nat', 'chai-nat', 15.1851, 100.1251, 'central'),
('นครนายก', 'Nakhon Nayok', 'nakhon-nayok', 14.2069, 101.2131, 'central'),
('นครปฐม', 'Nakhon Pathom', 'nakhon-pathom', 13.8196, 100.0443, 'central'),
('นครสวรรค์', 'Nakhon Sawan', 'nakhon-sawan', 15.7030, 100.1371, 'central'),
('นนทบุรี', 'Nonthaburi', 'nonthaburi', 13.8621, 100.5144, 'central'),
('ปทุมธานี', 'Pathum Thani', 'pathum-thani', 14.0208, 100.5250, 'central'),
('พระนครศรีอยุธยา', 'Phra Nakhon Si Ayutthaya', 'ayutthaya', 14.3532, 100.5684, 'central'),
('พิจิตร', 'Phichit', 'phichit', 16.4380, 100.3480, 'central'),
('พิษณุโลก', 'Phitsanulok', 'phitsanulok', 16.8211, 100.2659, 'central'),
('เพชรบูรณ์', 'Phetchabun', 'phetchabun', 16.4189, 101.1591, 'central'),
('ลพบุรี', 'Lop Buri', 'lop-buri', 14.7995, 100.6534, 'central'),
('สมุทรปราการ', 'Samut Prakan', 'samut-prakan', 13.5990, 100.5998, 'central'),
('สมุทรสงคราม', 'Samut Songkhram', 'samut-songkhram', 13.4098, 100.0021, 'central'),
('สมุทรสาคร', 'Samut Sakhon', 'samut-sakhon', 13.5475, 100.2747, 'central'),
('สระบุรี', 'Saraburi', 'saraburi', 14.5289, 100.9102, 'central'),
('สิงห์บุรี', 'Sing Buri', 'sing-buri', 14.8936, 100.4024, 'central'),
('สุโขทัย', 'Sukhothai', 'sukhothai', 17.0156, 99.8230, 'central'),
('สุพรรณบุรี', 'Suphan Buri', 'suphan-buri', 14.4744, 100.1177, 'central'),
('อ่างทอง', 'Ang Thong', 'ang-thong', 14.5896, 100.4549, 'central'),
('อุทัยธานี', 'Uthai Thani', 'uthai-thani', 15.3835, 100.0245, 'central'),
-- North Region
('เชียงราย', 'Chiang Rai', 'chiang-rai', 19.9105, 99.8406, 'north'),
('เชียงใหม่', 'Chiang Mai', 'chiang-mai', 18.7883, 98.9853, 'north'),
('น่าน', 'Nan', 'nan', 18.7756, 100.7730, 'north'),
('พะเยา', 'Phayao', 'phayao', 19.1664, 99.9019, 'north'),
('แพร่', 'Phrae', 'phrae', 18.1445, 100.1403, 'north'),
('แม่ฮ่องสอน', 'Mae Hong Son', 'mae-hong-son', 19.3020, 97.9654, 'north'),
('ลำปาง', 'Lampang', 'lampang', 18.2888, 99.4908, 'north'),
('ลำพูน', 'Lamphun', 'lamphun', 18.5744, 99.0087, 'north'),
('อุตรดิตถ์', 'Uttaradit', 'uttaradit', 17.6200, 100.0993, 'north'),
-- Northeast Region (Isan)
('กาฬสินธุ์', 'Kalasin', 'kalasin', 16.4314, 103.5059, 'northeast'),
('ขอนแก่น', 'Khon Kaen', 'khon-kaen', 16.4419, 102.8360, 'northeast'),
('ชัยภูมิ', 'Chaiyaphum', 'chaiyaphum', 15.8068, 102.0316, 'northeast'),
('นครพนม', 'Nakhon Phanom', 'nakhon-phanom', 17.4048, 104.7859, 'northeast'),
('นครราชสีมา', 'Nakhon Ratchasima', 'nakhon-ratchasima', 14.9799, 102.0978, 'northeast'),
('บึงกาฬ', 'Bueng Kan', 'bueng-kan', 18.3609, 103.6466, 'northeast'),
('บุรีรัมย์', 'Buri Ram', 'buri-ram', 14.9930, 103.1029, 'northeast'),
('มหาสารคาม', 'Maha Sarakham', 'maha-sarakham', 16.1851, 103.3029, 'northeast'),
('มุกดาหาร', 'Mukdahan', 'mukdahan', 16.5424, 104.7233, 'northeast'),
('ยโสธร', 'Yasothon', 'yasothon', 15.7944, 104.1450, 'northeast'),
('ร้อยเอ็ด', 'Roi Et', 'roi-et', 16.0567, 103.6520, 'northeast'),
('เลย', 'Loei', 'loei', 17.4860, 101.7223, 'northeast'),
('ศรีสะเกษ', 'Si Sa Ket', 'si-sa-ket', 15.1186, 104.3220, 'northeast'),
('สกลนคร', 'Sakon Nakhon', 'sakon-nakhon', 17.1545, 104.1348, 'northeast'),
('สุรินทร์', 'Surin', 'surin', 14.8818, 103.4936, 'northeast'),
('หนองคาย', 'Nong Khai', 'nong-khai', 17.8783, 102.7420, 'northeast'),
('หนองบัวลำภู', 'Nong Bua Lam Phu', 'nong-bua-lam-phu', 17.2218, 102.4260, 'northeast'),
('อำนาจเจริญ', 'Amnat Charoen', 'amnat-charoen', 15.8656, 104.6258, 'northeast'),
('อุดรธานี', 'Udon Thani', 'udon-thani', 17.4156, 102.7872, 'northeast'),
('อุบลราชธานี', 'Ubon Ratchathani', 'ubon-ratchathani', 15.2287, 104.8564, 'northeast'),
-- East Region
('จันทบุรี', 'Chanthaburi', 'chanthaburi', 12.6114, 102.1039, 'east'),
('ฉะเชิงเทรา', 'Chachoengsao', 'chachoengsao', 13.6904, 101.0780, 'east'),
('ชลบุรี', 'Chon Buri', 'chon-buri', 13.3611, 100.9847, 'east'),
('ตราด', 'Trat', 'trat', 12.2427, 102.5158, 'east'),
('ปราจีนบุรี', 'Prachin Buri', 'prachin-buri', 14.0509, 101.3717, 'east'),
('ระยอง', 'Rayong', 'rayong', 12.6814, 101.2816, 'east'),
('สระแก้ว', 'Sa Kaeo', 'sa-kaeo', 13.8240, 102.0645, 'east'),
-- West Region
('กาญจนบุรี', 'Kanchanaburi', 'kanchanaburi', 14.0227, 99.5328, 'west'),
('ตาก', 'Tak', 'tak', 16.8840, 99.1259, 'west'),
('ประจวบคีรีขันธ์', 'Prachuap Khiri Khan', 'prachuap-khiri-khan', 11.8126, 99.7957, 'west'),
('เพชรบุรี', 'Phetchaburi', 'phetchaburi', 13.1119, 99.9398, 'west'),
('ราชบุรี', 'Ratchaburi', 'ratchaburi', 13.5283, 99.8134, 'west'),
-- South Region
('กระบี่', 'Krabi', 'krabi', 8.0863, 98.9063, 'south'),
('ชุมพร', 'Chumphon', 'chumphon', 10.4930, 99.1800, 'south'),
('ตรัง', 'Trang', 'trang', 7.5563, 99.6114, 'south'),
('นครศรีธรรมราช', 'Nakhon Si Thammarat', 'nakhon-si-thammarat', 8.4322, 99.9631, 'south'),
('นราธิวาส', 'Narathiwat', 'narathiwat', 6.4318, 101.8231, 'south'),
('ปัตตานี', 'Pattani', 'pattani', 6.8664, 101.2508, 'south'),
('พังงา', 'Phang Nga', 'phang-nga', 8.4500, 98.5256, 'south'),
('พัทลุง', 'Phatthalung', 'phatthalung', 7.6167, 100.0740, 'south'),
('ภูเก็ต', 'Phuket', 'phuket', 7.8804, 98.3923, 'south'),
('ยะลา', 'Yala', 'yala', 6.5410, 101.2803, 'south'),
('ระนอง', 'Ranong', 'ranong', 9.9528, 98.6085, 'south'),
('สงขลา', 'Songkhla', 'songkhla', 7.1897, 100.5954, 'south'),
('สตูล', 'Satun', 'satun', 6.6238, 100.0673, 'south'),
('สุราษฎร์ธานี', 'Surat Thani', 'surat-thani', 9.1382, 99.3217, 'south')
ON CONFLICT (slug) DO UPDATE SET
    name_th = EXCLUDED.name_th,
    name_en = EXCLUDED.name_en,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    region = EXCLUDED.region;

-- ============================================
-- CAMPSITE TYPES
-- ============================================

INSERT INTO campsite_types (name_th, name_en, slug, color_hex, icon, description_th, description_en, sort_order) VALUES
('แคมป์ปิ้ง', 'Camping', 'camping', '#22C55E', 'tent', 'พื้นที่ตั้งเต็นท์แบบดั้งเดิม ใกล้ชิดธรรมชาติ', 'Traditional tent camping, close to nature', 1),
('แกลมปิ้ง', 'Glamping', 'glamping', '#8B5CF6', 'star', 'แคมป์ปิ้งหรูหรา พร้อมสิ่งอำนวยความสะดวก', 'Luxury camping with amenities', 2),
('รีสอร์ทเต็นท์', 'Tented Resort', 'tented-resort', '#F59E0B', 'home', 'รีสอร์ทสไตล์เต็นท์ บริการครบครัน', 'Resort-style tents with full service', 3),
('บังกะโล', 'Bungalow', 'bungalow', '#3B82F6', 'house', 'บ้านพักขนาดเล็ก เหมาะสำหรับครอบครัว', 'Small houses, perfect for families', 4),
('กระท่อม', 'Cabin', 'cabin', '#EF4444', 'cabin', 'กระท่อมไม้ท่ามกลางธรรมชาติ', 'Wooden cabins in nature', 5),
('RV/คาราวาน', 'RV/Caravan', 'rv-caravan', '#EC4899', 'caravan', 'พื้นที่สำหรับจอดรถบ้าน', 'Spaces for RVs and caravans', 6)
ON CONFLICT (slug) DO UPDATE SET
    name_th = EXCLUDED.name_th,
    name_en = EXCLUDED.name_en,
    color_hex = EXCLUDED.color_hex,
    icon = EXCLUDED.icon,
    description_th = EXCLUDED.description_th,
    description_en = EXCLUDED.description_en,
    sort_order = EXCLUDED.sort_order;

-- ============================================
-- AMENITIES
-- ============================================

INSERT INTO amenities (name_th, name_en, slug, icon, category, sort_order) VALUES
-- Basic
('WiFi', 'WiFi', 'wifi', 'wifi', 'basic', 1),
('ไฟฟ้า', 'Electricity', 'electricity', 'zap', 'basic', 2),
('น้ำประปา', 'Running Water', 'running-water', 'droplet', 'basic', 3),
('ที่จอดรถ', 'Parking', 'parking', 'car', 'basic', 4),
('ห้องน้ำ', 'Restroom', 'restroom', 'door-closed', 'basic', 5),
('ห้องอาบน้ำ', 'Shower', 'shower', 'shower-head', 'basic', 6),

-- Comfort
('แอร์', 'Air Conditioning', 'ac', 'snowflake', 'comfort', 10),
('พัดลม', 'Fan', 'fan', 'fan', 'comfort', 11),
('น้ำอุ่น', 'Hot Water', 'hot-water', 'flame', 'comfort', 12),
('ห้องน้ำส่วนตัว', 'Private Bathroom', 'private-bathroom', 'bath', 'comfort', 13),
('เครื่องซักผ้า', 'Washing Machine', 'washing-machine', 'shirt', 'comfort', 14),
('เครื่องทำน้ำแข็ง', 'Ice Machine', 'ice-machine', 'cube', 'comfort', 15),

-- Food & Dining
('ร้านอาหาร', 'Restaurant', 'restaurant', 'utensils', 'food', 20),
('ห้องครัว', 'Kitchen', 'kitchen', 'chef-hat', 'food', 21),
('พื้นที่ BBQ', 'BBQ Area', 'bbq', 'flame', 'food', 22),
('ร้านกาแฟ', 'Coffee Shop', 'coffee-shop', 'coffee', 'food', 23),
('มินิมาร์ท', 'Mini Mart', 'minimart', 'shopping-cart', 'food', 24),

-- Recreation
('สระว่ายน้ำ', 'Swimming Pool', 'swimming-pool', 'waves', 'recreation', 30),
('จุดชมวิว', 'Viewpoint', 'viewpoint', 'eye', 'recreation', 31),
('เส้นทางเดินป่า', 'Hiking Trail', 'hiking-trail', 'mountain', 'recreation', 32),
('ตกปลา', 'Fishing', 'fishing', 'fish', 'recreation', 33),
('ปั่นจักรยาน', 'Cycling', 'cycling', 'bike', 'recreation', 34),
('สนามเด็กเล่น', 'Playground', 'playground', 'gamepad', 'recreation', 35),
('กิจกรรมผจญภัย', 'Adventure Activities', 'adventure', 'compass', 'recreation', 36),

-- Services
('บริการรับส่ง', 'Shuttle Service', 'shuttle', 'bus', 'services', 40),
('ทัวร์ท้องถิ่น', 'Local Tours', 'tours', 'map', 'services', 41),
('เช่าอุปกรณ์แคมป์', 'Camping Gear Rental', 'gear-rental', 'backpack', 'services', 42),
('ไกด์นำเที่ยว', 'Guide Service', 'guide', 'user', 'services', 43),
('First Aid', 'First Aid', 'first-aid', 'heart-pulse', 'services', 44),

-- Safety
('รปภ. 24 ชม.', '24hr Security', 'security', 'shield', 'safety', 50),
('กล้องวงจรปิด', 'CCTV', 'cctv', 'video', 'safety', 51),
('ถังดับเพลิง', 'Fire Extinguisher', 'fire-extinguisher', 'flame-kindling', 'safety', 52),
('ไฟฉุกเฉิน', 'Emergency Lights', 'emergency-lights', 'lightbulb', 'safety', 53),

-- Pet-friendly
('อนุญาตสัตว์เลี้ยง', 'Pet Friendly', 'pet-friendly', 'paw-print', 'pets', 60),
('พื้นที่สำหรับสัตว์เลี้ยง', 'Pet Area', 'pet-area', 'dog', 'pets', 61)
ON CONFLICT (slug) DO UPDATE SET
    name_th = EXCLUDED.name_th,
    name_en = EXCLUDED.name_en,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    sort_order = EXCLUDED.sort_order;

-- Comment: Seed data loaded - 77 provinces, 6 campsite types, 34 amenities
