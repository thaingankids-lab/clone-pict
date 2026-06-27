# Clone anh rep 1:1

Ung dung React + Express de clone artwork tu anh goc thanh file PNG san sang in.

## Chuc nang chinh

- Tai anh PNG/JPEG/WebP.
- Clone artwork rep 1:1: giu mau sac, bo cuc, ty le, chu va chi tiet goc.
- Lam phang artwork bi chup nghieng, meo, cong, nhan.
- Loai bo nen chup, bong do, chat lieu vai/giay, seam, tag, nhieu va mo.
- Xuat PNG nen trong suot hoac nen mau de tach thu cong.
- Chon do phan giai `1K`, `2K`, `4K`.
- Chon muc rep/lam sach tu `1` den `10`.

## Nen de tach thu cong

Neu nen trong suot chua sach, hay chon nen mau tuong phan cao roi tach trong Photoshop:

- Chroma xanh la `#00FF00`
- Magenta `#FF00FF`
- Xanh duong `#0000FF`
- Cyan `#00FFFF`
- Vang `#FFFF00`
- Trang `#FFFFFF`
- Den `#000000`

Chon mau nen khong trung voi mau artwork de tach sach hon.

## API key

- API key duoc nhap truc tiep tren giao dien moi khi su dung.
- Backend chi dung API key trong request hien tai.
- App khong doc API key tu `.env`, khong ghi vao `localStorage`, va khong luu vao file.
- Khi dong tab/app, API key trong bo nho phien se mat.
- Nut `Test API` dung de kiem tra key truoc khi clone anh.

## Lenh chay

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
npm start
```

## Tiet kiem chi phi

- Dung `1K` de test bo cuc va chat luong tach.
- Chuyen sang `2K` hoac `4K` chi khi can file cuoi.
- Doi nen chroma truoc khi render lai neu transparent khong sach.
