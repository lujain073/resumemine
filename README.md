# موقع لجين — Pharmaceutical AI Portfolio

موقع سريع جداً بدون أي مكتبات: صفحات HTML جاهزة (ممتازة لـ SEO) + لوحة تحكم لتعديل المحتوى.

## محتويات المشروع
| المجلد | ماذا فيه |
|---|---|
| `content/site.json` | الاسم، النصوص، التعليم، المهارات، التواصل، الألوان، و Meta لكل صفحة |
| `content/projects/` | ملف لكل مشروع (المشكلة، الحل، المرحلة، المراجع، الصور…) |
| `content/articles/` | مقالات قسم Research |
| `static/` | التصميم (CSS)، الحركة (JS)، الصور |
| `admin/` | لوحة التحكم (Decap CMS) |
| `build.js` | يحوّل المحتوى إلى صفحات الموقع داخل `dist/` |

## النشر على Netlify (مجاناً) — مرة واحدة
1. أنشئي حساب على github.com ثم مستودع جديد (Repository) باسم `lujain-portfolio`، وارفعي كل ملفات المجلد (زر *Add file → Upload files*).
2. ادخلي netlify.com ← **Add new site → Import from GitHub** ← اختاري المستودع. الإعدادات تُقرأ تلقائياً من `netlify.toml` (الأمر `node build.js` والمجلد `dist`). اضغطي **Deploy**.
3. فعّلي لوحة التحكم: في Netlify ← **Project configuration → Identity → Enable**، ثم **Registration: Invite only**، ثم **Services → Git Gateway → Enable**.
4. من Identity اضغطي **Invite users** وأدخلي إيميلك، افتحي رابط الدعوة وأنشئي كلمة السر.
5. لوحة التحكم الآن على: `https://اسم-موقعك/admin/`

## بعد النشر — أول تعديلات مهمة (من لوحة التحكم)
- **Website address**: ضعي رابط موقعك الحقيقي (مهم للـ SEO والـ sitemap).
- **Full name**: اسمك الكامل كما تريدينه في Google.
- **Professional email** و **LinkedIn URL**.
- **Education → University**: اسم جامعتك.
- كل حفظ ← Netlify يعيد بناء الموقع خلال دقيقة تقريباً.

## الدومين الخاص
Netlify ← **Domain management → Add a domain** (مثلاً lujain.ai أو lujainpharma.com) ثم اتبعي تعليمات DNS. شهادة HTTPS مجانية وتلقائية.

## رسائل نموذج التواصل
تصل إلى Netlify ← **Forms**. فعّلي إشعار الإيميل من **Forms → Form notifications** لتصلك كل رسالة على بريدك.

## SEO بعد النشر
1. سجلي الموقع في Google Search Console وأضيفي `https://موقعك/sitemap.xml`.
2. كل صفحة فيها Title و Description خاصين (قابلين للتعديل من Site settings → SEO)، وكل مشروع يمكن تخصيص SEO له.
3. الموقع يحتوي Schema (Person / Article / ItemList) و Open Graph لمشاركة الروابط على LinkedIn.

## التعديل على جهازك (اختياري)
```
npx decap-server      # في نافذة
node build.js         # يبني الموقع في dist/
```
ثم افتحي `admin/index.html` عبر خادم محلي.

## تغيير الألوان
من لوحة التحكم ← Brand colours (navy / teal / sand) — يتغير الموقع كله.

## النسخة العربية
- الموقع الإنجليزي على `/` والعربي على `/ar/`، وزر التبديل بين اللغتين موجود في المنيو وفي الفوتر.
- المحتوى العربي في `content/ar/` ويُعدَّل من لوحة التحكم من الأقسام: **إعدادات الموقع (عربي)**، **المشاريع (عربي)**، **المقالات (عربي)**.
- أي مشروع جديد تضيفينه بالإنجليزي يظهر بالعربي تلقائياً (بالنص الإنجليزي) لحين إضافة ترجمته: من «المشاريع (عربي)» ← ترجمة جديدة، وضعي في أول خانة نفس الـ URL name للمشروع الإنجليزي.
- كل صفحة مربوطة بنسختها الأخرى (hreflang)، والـ sitemap يشمل اللغتين، فيظهر الموقع في نتائج Google بالعربي والإنجليزي.
- نصوص الواجهة الثابتة (أزرار، عناوين أقسام) في ملف `ui.js`.
