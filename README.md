# HR Assessment (Demo)

แบบประเมินสมรรถนะตนเองตาม Non-Life Insurance Competency Matrix
ครบ 13 ฝ่าย ฝ่ายละ 5 คน (L5–L1) · ข้อคำถามต่างกันตามฝ่าย Level และ Track ตาม Master Matrix

```bash
npm install
npm run dev        # http://localhost:5173
npm test
npm run build
npm run framework  # แปลง source/*.xlsx → src/data/framework.json (รันใหม่เมื่อ HR แก้ Excel)
```

- ข้อมูลพนักงานและคะแนนทั้งหมดเป็นข้อมูลสมมติ (`src/data/mock.ts`)
- Demo เก็บข้อมูลใน localStorage ของ browser เท่านั้น ตอนต่อระบบจริงให้แก้แค่ `src/store.ts`
- คำแปลไทย (`src/data/th.ts`) เป็นร่าง ต้องให้ HR และหัวหน้าฝ่ายตรวจก่อนใช้จริง

สถานะ: Demo ครบ 3 ส่วน — ประเมินตนเอง · หัวหน้าทบทวน · HR Dashboard + Export Excel (ฟอร์แมต Assessment Template)
