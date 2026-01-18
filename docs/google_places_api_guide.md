# Google Places API (Official) - ฉบับสมบูรณ์ สำหรับดึงข้อมูล Camping ในประเทศไทย

## สารบัญ
1. [การเตรียมและ Setup](#การเตรียมและ-setup)
2. [API Key และ Authentication](#api-key-และ-authentication)
3. [API Endpoints](#api-endpoints)
4. [Request Format](#request-format)
5. [Response Structure](#response-structure)
6. [ตัวอย่าง Implementation](#ตัวอย่าง-implementation)
7. [Rate Limiting & Billing](#rate-limiting--billing)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

---

## การเตรียมและ Setup

### ขั้นตอน 1: สร้าง Google Cloud Project

1. **เข้าไปที่ Google Cloud Console**
   - URL: https://console.cloud.google.com
   - ล็อกอินด้วย Google Account

2. **สร้าง Project ใหม่**
   ```
   ไปที่ Dropdown "Select a Project" > "New Project"
   ตั้งชื่อ: "Thailand Camping Data Extraction"
   เลือก Organization (ถ้ามี) > Create
   ```

3. **รอให้ Project สร้างเสร็จ** (1-2 นาที)
   - หลังจากสร้างเสร็จ ให้ไปที่ Dashboard

### ขั้นตอน 2: เปิดใช้งาน APIs

1. **ไปที่ APIs & Services > Library**
   ```
   นำทาง: APIs & Services > Library
   ```

2. **ค้นหาและเปิดใช้งาน 4 APIs ต่อไปนี้:**

   **A. Maps JavaScript API**
   - ค้นหา "Maps JavaScript API"
   - คลิก > "Enable"
   
   **B. Places API (Legacy)**
   - ค้นหา "Places API"
   - คลิก > "Enable"
   
   **C. Geocoding API**
   - ค้นหา "Geocoding API"
   - คลิก > "Enable"
   
   **D. Place Photos API**
   - ค้นหา "Place Photos API"
   - คลิก > "Enable"

### ขั้นตอน 3: สร้าง API Key

1. **ไปที่ APIs & Services > Credentials**
   ```
   นำทาง: APIs & Services > Credentials
   ```

2. **คลิก "Create Credentials" > "API Key"**
   - Pop-up จะแสดง API Key ของคุณ
   - คัดลอกและเก็บให้ปลอดภัย

3. **ตั้งค่า API Key Restrictions**
   ```
   คลิก API Key ที่สร้าง
   โปรแกรมจะส่งไปยัง "Key restrictions" page
   
   Application restrictions:
   - เลือก "HTTP referrers (web sites)"
   - เพิ่ม domain ของคุณ (เช่น localhost, yourapp.com)
   
   API restrictions:
   - เลือก "Restrict key"
   - ติ๊กเลือก:
     ✓ Maps JavaScript API
     ✓ Places API
     ✓ Geocoding API
     ✓ Place Photos API
   
   Save
   ```

### ขั้นตอน 4: ตั้งค่า Billing

1. **ไปที่ Billing**
   ```
   นำทาง: APIs & Services > Billing
   ```

2. **เชื่อมต่อ Billing Account**
   - ถ้าไม่มี ให้สร้าง "Create Billing Account"
   - เพิ่มบัตรเครดิต (จำเป็นแม้ใช้ free tier)
   - ยอมรับเงื่อนไข

3. **ตั้งค่า Budget Alert (ไม่บังคับ)**
   ```
   ไปที่ Billing > Budgets & alerts
   ตั้งงบประมาณ เช่น $100/เดือน
   เพื่อป้องกันการใช้จ่ายเกินควร
   ```

---

## API Key และ Authentication

### ประเภท Authentication

#### 1. API Key (Simple & Quick)
- **ใช้สำหรับ:** Server-side requests (Backend)
- **ข้อดี:** ง่าย ตั้งค่าได้เร็ว
- **ข้อเสีย:** ต้องป้องกันการ leak
- **เหมาะสำหรับ:** Development, scripts, backend APIs

```
ตัวอย่าง:
https://maps.googleapis.com/maps/api/place/details/json
?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4
&key=YOUR_API_KEY
```

#### 2. OAuth 2.0 Token
- **ใช้สำหรับ:** User-authenticated requests
- **ข้อดี:** Secure, user-specific permissions
- **ข้อเสีย:** ซับซ้อน ต้องเก็บ refresh tokens
- **เหมาะสำหรับ:** Production apps with user accounts

```
Authorization: Bearer {access_token}
```

### การปรับปรุง API Key ในโปรแกรม

**ตัวอย่าง Python:**
```python
import os

API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')

# หรือตั้งค่าตรง (ในช่วง development เท่านั้น)
API_KEY = "YOUR_API_KEY_HERE"  # ❌ ห้ามใช้ในโปรแกรมจริง

# ✅ ใช้ environment variable ในโปรแกรมจริง
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
```

**ตัวอย่าง .env file:**
```
GOOGLE_PLACES_API_KEY=AIzaSyD...your_key...
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

---

## API Endpoints

### 3 Endpoints หลักสำหรับดึงข้อมูล Camping

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| **Text Search** | ค้นหาตามคำค้นหา | ค้นหา "camping Thailand" |
| **Nearby Search** | ค้นหาในรัศมีที่กำหนด | ค้นหา camping รอบพิกัด |
| **Place Details** | ดึงข้อมูลรายละเอียด | ดึงจอม place_id เฉพาะ |

---

### 1. Text Search Endpoint

**URL Pattern:**
```
https://maps.googleapis.com/maps/api/place/textsearch/[output]
```

**เอาต์พุต:** `json` (แนะนำ) หรือ `xml`

**Required Parameters:**
| Parameter | ค่า | ตัวอย่าง |
|-----------|-----|---------|
| `query` | คำค้นหา | camping Thailand |
| `key` | API Key | YOUR_API_KEY |

**Optional Parameters:**
| Parameter | ประเภท | ตัวอย่าง | คำอธิบาย |
|-----------|--------|---------|----------|
| `location` | lat,lng | 14.0695,100.7738 | จุดศูนย์กลางการค้นหา |
| `radius` | meters | 50000 | รัศมีการค้นหา (max 50 km) |
| `language` | code | th, en | ภาษาผลลัพธ์ |
| `pagetoken` | string | next_page_token | Pagination |

**ตัวอย่าง Request:**
```
https://maps.googleapis.com/maps/api/place/textsearch/json
?query=camping+Thailand
&language=en
&key=YOUR_API_KEY
```

---

### 2. Nearby Search Endpoint

**URL Pattern:**
```
https://maps.googleapis.com/maps/api/place/nearbysearch/[output]
```

**Required Parameters:**
| Parameter | ค่า | ตัวอย่าง |
|-----------|-----|---------|
| `location` | lat,lng | 14.0695,100.7738 |
| `radius` | meters | 50000 |
| `key` | API Key | YOUR_API_KEY |

**Optional Parameters:**
| Parameter | ประเภท | ตัวอย่าง | คำอธิบาย |
|-----------|--------|---------|----------|
| `keyword` | string | camping | คำค้นหา |
| `type` | enum | campground | ประเภท (camping, restaurant) |
| `minprice` | 0-4 | 0 | ราคาต่ำสุด |
| `maxprice` | 0-4 | 4 | ราคาสูงสุด |
| `opennow` | boolean | true | เปิดอยู่ตอนนี้ |
| `rankby` | string | prominence | ลำดับ (prominence, distance) |
| `pagetoken` | string | token | Pagination |

**ตัวอย่าง Request:**
```
https://maps.googleapis.com/maps/api/place/nearbysearch/json
?location=14.0695,100.7738
&radius=50000
&keyword=camping
&opennow=true
&key=YOUR_API_KEY
```

---

### 3. Place Details Endpoint

**URL Pattern:**
```
https://maps.googleapis.com/maps/api/place/details/[output]
```

**Required Parameters:**
| Parameter | ค่า | ตัวอย่าง |
|-----------|-----|---------|
| `place_id` | string | ChIJN1t_tDeuEmsRUsoyG83frY4 |
| `key` | API Key | YOUR_API_KEY |

**Optional Parameters:**
| Parameter | ประเภท | ตัวอย่าง | คำอธิบาย |
|-----------|--------|---------|----------|
| `fields` | string | name,rating,photos | ฟิลด์ที่ต้องการ |
| `language` | code | th | ภาษา |
| `reviews_sort` | string | most_relevant | เรียงลำดับรีวิว |

**ตัวอย่าง Request:**
```
https://maps.googleapis.com/maps/api/place/details/json
?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4
&fields=name,rating,formatted_phone_number,photos
&language=en
&key=YOUR_API_KEY
```

---

## Request Format

### HTTP Methods

| Method | Endpoint | ใช้เมื่อ |
|--------|----------|---------|
| **GET** | All endpoints | ส่วนใหญ่เป็น GET requests |
| **POST** | Text Search | สำหรับ requests ที่ซับซ้อน |

### ตัวอย่างการสร้าง Request ต่างๆ

#### Python - requests library

```python
import requests
import json

API_KEY = "YOUR_API_KEY"

# ===== 1. TEXT SEARCH =====
def text_search_camping(query, language="en"):
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    
    params = {
        "query": query,
        "language": language,
        "key": API_KEY
    }
    
    response = requests.get(url, params=params)
    return response.json()

# ใช้งาน
results = text_search_camping("camping Thailand")
print(json.dumps(results, indent=2))


# ===== 2. NEARBY SEARCH =====
def nearby_search(latitude, longitude, radius=50000, keyword="camping"):
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    
    params = {
        "location": f"{latitude},{longitude}",
        "radius": radius,
        "keyword": keyword,
        "key": API_KEY
    }
    
    response = requests.get(url, params=params)
    return response.json()

# ใช้งาน
results = nearby_search(14.0695, 100.7738)  # Bangkok coordinates
print(json.dumps(results, indent=2))


# ===== 3. PLACE DETAILS =====
def get_place_details(place_id, fields=None):
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    
    if fields is None:
        fields = ["name", "rating", "formatted_phone_number", 
                  "website", "photos", "reviews"]
    
    params = {
        "place_id": place_id,
        "fields": ",".join(fields),
        "key": API_KEY
    }
    
    response = requests.get(url, params=params)
    return response.json()

# ใช้งาน
place_details = get_place_details("ChIJN1t_tDeuEmsRUsoyG83frY4")
print(json.dumps(place_details, indent=2))
```

#### Python - urllib (ไม่ต้องติดตั้งแพ็กเกจ)

```python
import urllib.request
import json

API_KEY = "YOUR_API_KEY"

def text_search(query):
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = f"?query={query}&key={API_KEY}"
    
    full_url = url + params
    
    with urllib.request.urlopen(full_url) as response:
        data = json.loads(response.read())
    
    return data

results = text_search("camping%20Thailand")
print(results)
```

#### cURL (Command Line)

```bash
# Text Search
curl -s "https://maps.googleapis.com/maps/api/place/textsearch/json?query=camping+Thailand&key=YOUR_API_KEY" | jq

# Nearby Search
curl -s "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=14.0695,100.7738&radius=50000&keyword=camping&key=YOUR_API_KEY" | jq

# Place Details
curl -s "https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4&fields=name,rating,formatted_phone_number&key=YOUR_API_KEY" | jq
```

#### JavaScript/Node.js

```javascript
const fetch = require('node-fetch');

const API_KEY = "YOUR_API_KEY";

// Text Search
async function textSearch(query) {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', query);
    url.searchParams.append('key', API_KEY);
    
    const response = await fetch(url);
    return await response.json();
}

// Usage
textSearch("camping Thailand").then(data => {
    console.log(JSON.stringify(data, null, 2));
});


// Nearby Search
async function nearbySearch(lat, lng, radius = 50000) {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.append('location', `${lat},${lng}`);
    url.searchParams.append('radius', radius);
    url.searchParams.append('keyword', 'camping');
    url.searchParams.append('key', API_KEY);
    
    const response = await fetch(url);
    return await response.json();
}

nearbySearch(14.0695, 100.7738).then(data => {
    console.log(JSON.stringify(data, null, 2));
});
```

---

## Response Structure

### JSON Response Format

#### Text Search Response

```json
{
  "html_attributions": [
    "Attribution text for data sources"
  ],
  "results": [
    {
      "business_status": "OPERATIONAL",
      "formatted_address": "123 Camping Road, Bangkok 10100, Thailand",
      "geometry": {
        "location": {
          "lat": 14.0695,
          "lng": 100.7738
        },
        "viewport": {
          "northeast": {
            "lat": 14.0708,
            "lng": 100.7751
          },
          "southwest": {
            "lat": 14.0682,
            "lng": 100.7725
          }
        }
      },
      "icon": "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/campground-71.png",
      "icon_background_color": "#FF9E67",
      "name": "Camping Ground Name",
      "opening_hours": {
        "open_now": true,
        "weekday_text": [
          "Monday: 6:00 AM – 10:00 PM",
          "Tuesday: 6:00 AM – 10:00 PM",
          "Wednesday: 6:00 AM – 10:00 PM",
          "Thursday: 6:00 AM – 10:00 PM",
          "Friday: 6:00 AM – 10:00 PM",
          "Saturday: 6:00 AM – 10:00 PM",
          "Sunday: 6:00 AM – 10:00 PM"
        ]
      },
      "photos": [
        {
          "height": 3024,
          "html_attributions": [
            "<a href=\"https://maps.google.com/maps/contrib/...\">Contributor Name</a>"
          ],
          "photo_reference": "Aap_uECa...",
          "width": 4032
        }
      ],
      "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "plus_code": {
        "compound_code": "XXXX+XX Bangkok, Thailand",
        "global_code": "4R3HXXXX+XX"
      },
      "price_level": 2,
      "rating": 4.5,
      "types": [
        "campground",
        "lodging",
        "point_of_interest",
        "establishment"
      ],
      "user_ratings_total": 250
    }
  ],
  "status": "OK"
}
```

#### Place Details Response

```json
{
  "html_attributions": [],
  "result": {
    "address_components": [
      {
        "long_name": "123",
        "short_name": "123",
        "types": ["street_number"]
      },
      {
        "long_name": "Camping Road",
        "short_name": "Camping Rd",
        "types": ["route"]
      },
      {
        "long_name": "Bangkok",
        "short_name": "Bangkok",
        "types": ["locality", "political"]
      },
      {
        "long_name": "Thailand",
        "short_name": "TH",
        "types": ["country", "political"]
      }
    ],
    "adr_address": "<span class=\"street-address\">123 Camping Rd</span>, <span class=\"locality\">Bangkok</span>, <span class=\"country-name\">Thailand</span>",
    "business_status": "OPERATIONAL",
    "formatted_address": "123 Camping Rd, Bangkok 10100, Thailand",
    "formatted_phone_number": "+66 2 123 4567",
    "geometry": {
      "location": {
        "lat": 14.0695,
        "lng": 100.7738
      },
      "viewport": {
        "northeast": {
          "lat": 14.0708,
          "lng": 100.7751
        },
        "southwest": {
          "lat": 14.0682,
          "lng": 100.7725
        }
      }
    },
    "icon": "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/campground-71.png",
    "international_phone_number": "+66 2 123 4567",
    "name": "Beautiful Camping Ground",
    "opening_hours": {
      "open_now": true,
      "periods": [
        {
          "close": {
            "day": 6,
            "time": "2200"
          },
          "open": {
            "day": 0,
            "time": "0600"
          }
        }
      ],
      "weekday_text": [
        "Monday: 6:00 AM – 10:00 PM",
        "Tuesday: 6:00 AM – 10:00 PM",
        "Wednesday: 6:00 AM – 10:00 PM",
        "Thursday: 6:00 AM – 10:00 PM",
        "Friday: 6:00 AM – 10:00 PM",
        "Saturday: 6:00 AM – 10:00 PM",
        "Sunday: 6:00 AM – 10:00 PM"
      ]
    },
    "photos": [
      {
        "height": 3024,
        "html_attributions": [
          "<a href=\"...\">Photo Contributor</a>"
        ],
        "photo_reference": "Aap_uEC...",
        "width": 4032
      }
    ],
    "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "plus_code": {
      "compound_code": "XXXX+XX Bangkok, Thailand",
      "global_code": "4R3HXXXX+XX"
    },
    "price_level": 2,
    "rating": 4.5,
    "reviews": [
      {
        "author_name": "User Name",
        "author_url": "https://www.google.com/maps/contrib/...",
        "language": "en",
        "profile_photo_url": "https://lh3.googleusercontent.com/...",
        "rating": 5,
        "relative_time_description": "2 months ago",
        "text": "Great camping site! Very clean facilities and friendly staff.",
        "time": 1704067200
      }
    ],
    "types": [
      "campground",
      "lodging",
      "point_of_interest",
      "establishment"
    ],
    "url": "https://maps.google.com/?cid=...",
    "user_ratings_total": 250,
    "utc_offset": 420,
    "vicinity": "123 Camping Road, Bangkok",
    "website": "https://www.campingsite.com"
  },
  "status": "OK"
}
```

### Response Status Codes

| Status | ความหมาย | สาเหตุ |
|--------|---------|--------|
| `OK` | Request สำเร็จ | Data ส่งมาตามปกติ |
| `ZERO_RESULTS` | ไม่พบผลลัพธ์ | ไม่มี place ตรงกัน |
| `NOT_FOUND` | ไม่พบ place_id | Place_id ไม่ถูกต้อง |
| `INVALID_REQUEST` | Request มีปัญหา | ขาด parameters จำเป็น |
| `OVER_QUERY_LIMIT` | เกินลิมิต | QPS หรือ budget exceeded |
| `REQUEST_DENIED` | Request ถูกปฏิเสธ | API Key ไม่ถูกต้อง |
| `UNKNOWN_ERROR` | เกิดข้อผิดพลาด | Try again later |

---

## ตัวอย่าง Implementation

### Complete Example: Scraping Camping Sites ทั้งหมด

```python
#!/usr/bin/env python3
"""
Google Places API - Camping Sites Scraper
ดึงข้อมูลลานกางเต็นท์จากทั้งประเทศไทย
"""

import requests
import json
import time
import pandas as pd
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')

if not API_KEY:
    raise ValueError("GOOGLE_PLACES_API_KEY not found in .env file")

class CampingSitesScraper:
    """Google Places API wrapper สำหรับดึงข้อมูล camping"""
    
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url_text_search = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        self.base_url_nearby = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        self.base_url_details = "https://maps.googleapis.com/maps/api/place/details/json"
        self.base_url_photo = "https://maps.googleapis.com/maps/api/place/photo"
        
        self.camping_sites = []
        self.request_count = 0
        self.max_requests = 2500  # ประมาณงบ $50/เดือน
    
    def text_search(self, query, language="en"):
        """ค้นหา camping ตามคำค้นหา"""
        params = {
            "query": query,
            "language": language,
            "key": self.api_key
        }
        
        try:
            response = requests.get(self.base_url_text_search, params=params, timeout=10)
            response.raise_for_status()
            self.request_count += 1
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error in text search: {e}")
            return {"results": [], "status": "ERROR"}
    
    def nearby_search(self, latitude, longitude, radius=50000, keyword="camping"):
        """ค้นหา camping ในรัศมีที่กำหนด"""
        params = {
            "location": f"{latitude},{longitude}",
            "radius": radius,
            "keyword": keyword,
            "key": self.api_key
        }
        
        try:
            response = requests.get(self.base_url_nearby, params=params, timeout=10)
            response.raise_for_status()
            self.request_count += 1
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error in nearby search: {e}")
            return {"results": [], "status": "ERROR"}
    
    def get_place_details(self, place_id):
        """ดึงข้อมูลรายละเอียดของ place"""
        fields = [
            "name", "formatted_address", "formatted_phone_number",
            "international_phone_number", "website", "rating",
            "user_ratings_total", "opening_hours", "price_level",
            "photos", "reviews", "geometry", "business_status",
            "types", "plus_code"
        ]
        
        params = {
            "place_id": place_id,
            "fields": ",".join(fields),
            "key": self.api_key
        }
        
        try:
            response = requests.get(self.base_url_details, params=params, timeout=10)
            response.raise_for_status()
            self.request_count += 1
            return response.json().get("result", {})
        except requests.exceptions.RequestException as e:
            print(f"Error getting place details: {e}")
            return {}
    
    def get_photo_url(self, photo_reference, max_width=400):
        """สร้าง URL รูปภาพจาก photo_reference"""
        return f"{self.base_url_photo}?maxwidth={max_width}&photo_reference={photo_reference}&key={self.api_key}"
    
    def scrape_text_search(self, queries):
        """ดึงข้อมูลจาก text search"""
        all_place_ids = set()
        
        for query in queries:
            print(f"\n[*] Text searching: {query}")
            results = self.text_search(query)
            
            if results["status"] != "OK":
                print(f"    Status: {results.get('status', 'UNKNOWN')}")
                continue
            
            for place in results.get("results", []):
                all_place_ids.add(place["place_id"])
                print(f"    ✓ Found: {place['name']}")
            
            # Rate limiting
            time.sleep(0.1)
        
        return all_place_ids
    
    def scrape_by_regions(self, thai_provinces):
        """ดึงข้อมูลแยกตามจังหวัด"""
        all_place_ids = set()
        
        # Bangkok center coordinates
        bangkok_lat, bangkok_lng = 13.7563, 100.5018
        
        for province in thai_provinces:
            print(f"\n[*] Searching: {province}")
            
            # ใช้ nearby search ด้วยพิกัดกลางของจังหวัด (simplified)
            results = self.nearby_search(bangkok_lat, bangkok_lng, radius=50000)
            
            if results["status"] != "OK":
                continue
            
            for place in results.get("results", []):
                all_place_ids.add(place["place_id"])
            
            time.sleep(0.2)  # Rate limiting
        
        return all_place_ids
    
    def fetch_full_details(self, place_ids):
        """ดึงข้อมูลเต็มของทุก place"""
        print(f"\n[*] Fetching full details for {len(place_ids)} places...")
        
        for i, place_id in enumerate(place_ids, 1):
            print(f"    [{i}/{len(place_ids)}] Fetching {place_id}...", end=" ")
            
            details = self.get_place_details(place_id)
            
            if details:
                # Extract photo URLs
                photos = []
                if "photos" in details:
                    photos = [
                        self.get_photo_url(photo["photo_reference"])
                        for photo in details["photos"][:3]  # First 3 photos
                    ]
                
                # Extract reviews
                reviews_text = ""
                if "reviews" in details:
                    reviews_text = " | ".join([
                        f"{r['author_name']}: {r['text'][:100]}..."
                        for r in details["reviews"][:2]  # First 2 reviews
                    ])
                
                camping_site = {
                    "place_id": place_id,
                    "name": details.get("name", ""),
                    "address": details.get("formatted_address", ""),
                    "phone": details.get("formatted_phone_number", ""),
                    "website": details.get("website", ""),
                    "rating": details.get("rating", 0),
                    "total_reviews": details.get("user_ratings_total", 0),
                    "price_level": details.get("price_level", ""),
                    "latitude": details.get("geometry", {}).get("location", {}).get("lat", ""),
                    "longitude": details.get("geometry", {}).get("location", {}).get("lng", ""),
                    "open_now": details.get("opening_hours", {}).get("open_now", ""),
                    "business_status": details.get("business_status", ""),
                    "photos": photos,
                    "reviews": reviews_text,
                    "fetched_at": datetime.now().isoformat()
                }
                
                self.camping_sites.append(camping_site)
                print("✓")
            else:
                print("✗")
            
            # Rate limiting
            if self.request_count >= self.max_requests:
                print(f"\n[!] Reached request limit ({self.max_requests})")
                break
            
            time.sleep(0.1)
    
    def save_to_csv(self, filename="camping_sites.csv"):
        """บันทึกข้อมูลเป็น CSV"""
        df = pd.DataFrame(self.camping_sites)
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"\n[✓] Saved {len(self.camping_sites)} records to {filename}")
        return filename
    
    def save_to_json(self, filename="camping_sites.json"):
        """บันทึกข้อมูลเป็น JSON"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.camping_sites, f, ensure_ascii=False, indent=2)
        print(f"\n[✓] Saved {len(self.camping_sites)} records to {filename}")
        return filename
    
    def save_to_excel(self, filename="camping_sites.xlsx"):
        """บันทึกข้อมูลเป็น Excel"""
        df = pd.DataFrame(self.camping_sites)
        df.to_excel(filename, index=False)
        print(f"\n[✓] Saved {len(self.camping_sites)} records to {filename}")
        return filename
    
    def get_stats(self):
        """แสดงสถิติการสกราป"""
        print("\n" + "="*50)
        print("SCRAPING STATISTICS")
        print("="*50)
        print(f"Total places found: {len(self.camping_sites)}")
        print(f"Total API requests: {self.request_count}")
        print(f"Estimated cost: ${self.request_count * 0.02:.2f} (approx)")
        print(f"Average rating: {sum(s['rating'] for s in self.camping_sites if s['rating']) / len([s for s in self.camping_sites if s['rating']]):.2f}")
        print("="*50)


# ===== MAIN EXECUTION =====
def main():
    """Main function"""
    
    scraper = CampingSitesScraper(API_KEY)
    
    # ===== Step 1: Text Search (ค้นหาทั่วไป) =====
    queries = [
        "camping Thailand",
        "ลานกางเต็นท์ ไทย",
        "campground Thailand",
        "glamping Thailand",
        "tent camping Bangkok",
        "camping Khao Yai",
        "camping Chiang Mai",
    ]
    
    place_ids = scraper.scrape_text_search(queries)
    print(f"\n[✓] Found {len(place_ids)} unique places from text search")
    
    # ===== Step 2: Fetch Full Details =====
    scraper.fetch_full_details(place_ids)
    
    # ===== Step 3: Save Results =====
    scraper.save_to_csv("camping_sites.csv")
    scraper.save_to_json("camping_sites.json")
    scraper.save_to_excel("camping_sites.xlsx")
    
    # ===== Step 4: Display Stats =====
    scraper.get_stats()
    
    return scraper.camping_sites


if __name__ == "__main__":
    camping_data = main()
    print("\n[✓] Scraping complete!")
```

---

## Rate Limiting & Billing

### Request Limits (QPS)

| Type | Limit | Note |
|------|-------|------|
| **Requests per second** | 50 QPS | Per API Key |
| **Daily limit** | Depends on billing | Free tier: $200/month |
| **Concurrent requests** | 100 | Max simultaneous |

### Pricing Breakdown (2026 Estimate)

| Operation | Cost | Usage |
|-----------|------|-------|
| Text Search | $0.017 per request | ≈ $1.70 per 100 |
| Nearby Search | $0.017 per request | ≈ $1.70 per 100 |
| Place Details | $0.032 per request | ≈ $3.20 per 100 |
| Place Photos | $0.007 per request | ≈ $0.70 per 100 |

### Budget Planning

**ตัวอย่าง: ดึงข้อมูล 1,000 camping sites**

```
Text Search: 10 queries × $0.017 = $0.17
Nearby Search: 50 queries × $0.017 = $0.85
Place Details: 1,000 × $0.032 = $32.00
Place Photos: 1,000 × $0.007 = $7.00
─────────────────────────────────
TOTAL: ≈ $40.02
```

### Rate Limiting Strategy

```python
import time
import random

def make_request_with_backoff(url, params, max_retries=3):
    """Request with exponential backoff"""
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            
            elif response.status_code == 429:  # Too Many Requests
                wait_time = 2 ** attempt + random.uniform(0, 1)
                print(f"Rate limited. Waiting {wait_time:.1f}s...")
                time.sleep(wait_time)
                
            else:
                print(f"Error: {response.status_code}")
                return None
        
        except requests.exceptions.Timeout:
            print("Request timeout")
            time.sleep(2 ** attempt)
    
    return None


# ===== Best Practices =====

def make_efficient_requests(place_ids):
    """
    Efficient request batching
    - Batch requests where possible
    - Add delays between requests
    - Use session for connection pooling
    """
    
    session = requests.Session()
    
    for place_id in place_ids:
        # Prepare request
        params = {
            "place_id": place_id,
            "fields": "name,rating,photos",
            "key": API_KEY
        }
        
        # Make request
        response = session.get(url, params=params)
        
        # Process response
        data = response.json()
        
        # Rate limiting: 0.1-0.5 seconds between requests
        time.sleep(random.uniform(0.1, 0.5))
```

---

## Error Handling

### Common Errors & Solutions

```python
import requests
from requests.exceptions import RequestException, Timeout, ConnectionError

def handle_api_errors(func):
    """Decorator for error handling"""
    
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        
        except Timeout:
            print("[ERROR] Request timeout - increase timeout value")
            return None
        
        except ConnectionError:
            print("[ERROR] Connection error - check internet connection")
            return None
        
        except RequestException as e:
            print(f"[ERROR] Request error: {e}")
            return None
        
        except ValueError as e:
            print(f"[ERROR] Invalid response: {e}")
            return None
        
        except KeyError as e:
            print(f"[ERROR] Missing field in response: {e}")
            return None
    
    return wrapper


# ===== Status Code Handling =====

def check_response_status(response_json):
    """Check and handle API response status"""
    
    status = response_json.get("status")
    
    if status == "OK":
        return True
    
    elif status == "ZERO_RESULTS":
        print("[INFO] No results found for this query")
        return False
    
    elif status == "INVALID_REQUEST":
        print("[ERROR] Invalid request - check parameters")
        return False
    
    elif status == "OVER_QUERY_LIMIT":
        print("[ERROR] API limit exceeded - wait before retrying")
        return False
    
    elif status == "REQUEST_DENIED":
        print("[ERROR] Request denied - check API key and permissions")
        return False
    
    elif status == "UNKNOWN_ERROR":
        print("[ERROR] Unknown error - try again later")
        return False
    
    else:
        print(f"[ERROR] Unknown status: {status}")
        return False


# ===== Try-Except Usage =====

try:
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()  # Raise for HTTP errors
    
    data = response.json()
    
    if not check_response_status(data):
        raise ValueError(f"API error: {data.get('status')}")
    
    results = data.get("results", [])
    print(f"Found {len(results)} results")

except requests.exceptions.HTTPError as e:
    print(f"HTTP Error: {e}")

except requests.exceptions.ConnectionError:
    print("Connection Error - check network")

except json.JSONDecodeError:
    print("Invalid JSON response")

except Exception as e:
    print(f"Unexpected error: {e}")
```

---

## Best Practices

### 1. API Key Security

```python
# ❌ ไม่ควรทำ
API_KEY = "AIzaSyD..."  # Hardcoded

# ✅ ควรทำ
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')

# ✅ ใช้ environment variables
export GOOGLE_PLACES_API_KEY="AIzaSyD..."
```

### 2. Request Optimization

```python
# ✅ เลือก fields ที่จำเป็นเท่านั้น
fields = ["name", "rating", "photos"]  # ลดเซ่นต้นต้อง

# ❌ ไม่ใช้ field ที่ไม่จำเป็น
fields = "*"  # เสียเงินมากขึ้น
```

### 3. Caching Results

```python
import sqlite3

def cache_place_details(place_id, details):
    """Cache place details in local database"""
    
    conn = sqlite3.connect('camping_cache.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO places 
        (place_id, data, cached_at) 
        VALUES (?, ?, datetime('now'))
    ''', (place_id, json.dumps(details)))
    
    conn.commit()
    conn.close()

def get_cached_place(place_id):
    """Get place details from cache if exists"""
    
    conn = sqlite3.connect('camping_cache.db')
    cursor = conn.cursor()
    
    cursor.execute(
        'SELECT data FROM places WHERE place_id = ?',
        (place_id,)
    )
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return json.loads(result[0])
    return None
```

### 4. Logging & Monitoring

```python
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Usage
logger.info(f"Starting scrape of {len(queries)} queries")
logger.warning(f"Rate limited, retrying in 5 seconds")
logger.error(f"Failed to fetch place_id: {place_id}")
```

### 5. Data Validation

```python
def validate_place_data(place_data):
    """Validate scraped place data"""
    
    required_fields = ['name', 'place_id', 'address']
    
    for field in required_fields:
        if field not in place_data or not place_data[field]:
            return False
    
    # Validate coordinates
    if 'latitude' in place_data and 'longitude' in place_data:
        try:
            lat = float(place_data['latitude'])
            lng = float(place_data['longitude'])
            
            if not (5 <= lat <= 21 and 97 <= lng <= 106):
                return False  # Outside Thailand
        except ValueError:
            return False
    
    return True
```

---

## Tips & Tricks

### 1. Search by Thai Provinces

```python
THAI_PROVINCES = {
    'Bangkok': (13.7563, 100.5018),
    'Chiang Mai': (18.7883, 98.9853),
    'Phuket': (8.0863, 98.4038),
    'Nakhon Ratchasima': (14.9604, 102.0948),
    'Krabi': (8.3628, 98.9063),
}

for province, (lat, lng) in THAI_PROVINCES.items():
    results = nearby_search(lat, lng, keyword="camping")
    # Process results...
```

### 2. Get Photo URLs Efficiently

```python
def get_place_photos(place_id, max_photos=3):
    """Get high-quality photo URLs"""
    
    details = get_place_details(place_id)
    
    photos = []
    for photo in details.get('photos', [])[:max_photos]:
        photo_url = f"https://maps.googleapis.com/maps/api/place/photo" \
                    f"?maxwidth=800" \
                    f"&photo_reference={photo['photo_reference']}" \
                    f"&key={API_KEY}"
        photos.append(photo_url)
    
    return photos
```

### 3. Filter Quality Results

```python
def filter_quality_camping_sites(sites, min_rating=3.5, min_reviews=5):
    """Filter for quality camping sites"""
    
    return [
        site for site in sites
        if site['rating'] >= min_rating 
        and site['total_reviews'] >= min_reviews
    ]
```

---

## FAQ

**Q: เดือนละเท่าไหร่ถ้าดึงข้อมูล 10,000 camping sites?**
A: ประมาณ $320-400 ต่อเดือน (ขึ้นกับจำนวน requests)

**Q: ใช้ได้ free tier ไหม?**
A: ได้ แต่มี $200 credit ต่อเดือน เพียงพอสำหรับ 5,000-6,000 requests

**Q: API Key leak แล้ว ทำไง?**
A: ไปที่ Google Cloud Console > Credentials > ลบ key เก่า > สร้าง key ใหม่

**Q: ดึงข้อมูลช้า ทำไง?**
A: เพิ่ม rate limit, ใช้ multi-threading, ลด fields ที่ไม่จำเป็น

---

## References

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Places API Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Python Requests Library](https://requests.readthedocs.io/)
- [Pandas Documentation](https://pandas.pydata.org/)

