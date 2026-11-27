# v5: refocus the site on AI-powered marketing for the pharmaceutical sector.
import json, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
def load(p): return json.load(open(R / p, encoding='utf-8'))
def save(p, d): json.dump(d, open(R / p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

# ---------------- English profile ----------------
en = load('content/site.json')
en['publish'] = {'fields': False}
en['role'] = 'Pharmacist & AI Marketing Specialist for the Pharmaceutical Sector'
en['positioning'] = 'Pharmacist · CPD-certified in AI for Business · AI marketing for pharma'
en['brandConcept'] = 'Where pharmaceutical knowledge meets AI-powered marketing.'
en['tagline'] = 'AI-powered marketing for the pharmaceutical sector — made by a pharmacist, compliant by design.'
en['hero'].update({
  'headline': 'Pharmaceutical marketing, made with AI — and checked by a pharmacist.',
  'subheadline': 'I help pharmaceutical companies, pharmacies, drug warehouses and pharmacists market their products and services with AI: campaigns, videos, websites, content and interactive experiences — fast to produce and built to respect medicine-advertising rules.',
  'intro': 'Pharmacist by training, marketer by experience. Three years in pharmaceutical sales and business development showed me how medicines are really sold — to doctors, to pharmacies and to patients — and how easily a campaign can cross a regulatory line. I combine that with AI production to make marketing that is faster, more creative and safe to publish.',
  'primaryCta': 'Build a campaign'})
en['about']['lead'] = 'I am a pharmacist and AI marketing specialist for the pharmaceutical sector, certified in AI for Business (CPD). I use AI to create marketing for pharmaceutical companies, pharmacies, distributors and healthcare professionals — and I check every claim the way a pharmacist would.'
en['about']['body'] = ('My background spans community pharmacy, laboratory work, a COVID-19 vaccination center and three years in pharmaceutical sales and business development, with training in regulation and the drug lifecycle. That mix taught me how medicines move: from registration, to the brand, the warehouse, the pharmacy shelf and the patient.\n\n'
  'I don’t approach marketing like an agency that has never read a leaflet. I approach it as a pharmacist who knows what a product is approved for, what may be said to the public and what only to healthcare professionals, and where a claim needs evidence. AI lets me produce campaigns, videos and websites quickly; pharmaceutical knowledge keeps them accurate and compliant.')
en['about']['interests'] = ['AI-powered marketing for pharmaceutical products and services', 'Compliant promotion and medicine-advertising rules'] + [i for i in en['about']['interests'] if 'promotion' not in i.lower()][:5]
if 'Pharmaceutical marketing, campaigns and brand content' not in en['about']['expertise']:
  en['about']['expertise'].insert(0, 'Pharmaceutical marketing, campaigns and brand content')
en['contact']['intro'] = 'The best way to reach me is by email. I work with pharmaceutical companies, pharmacies, drug warehouses and healthcare professionals on AI-powered marketing — and I’m open to pharmaceutical marketing and AI roles.'
en['contact']['roles'] = ['AI Marketing Specialist — Pharmaceutical Sector', 'Pharmaceutical Digital Marketing', 'Medical & Promotional Content Creation', 'Marketing Consultant for Pharmacies & Distributors', 'Pharmaceutical AI Specialist', 'AI-Powered Content & Digital Product Creation']
mk_en = {'category': 'Pharmaceutical Marketing', 'items': [
  {'name': 'Pharmaceutical sales & B2B relationships', 'level': 3},
  {'name': 'Campaign planning & content calendars', 'level': 3},
  {'name': 'Social media content for pharma & pharmacy brands', 'level': 3},
  {'name': 'Medicine-advertising compliance (Jordan)', 'level': 2},
  {'name': 'Marketing analytics & KPIs', 'level': 2}]}
en['skills'] = [g for g in en['skills'] if g['category'] != mk_en['category']]
en['skills'].insert(0, mk_en)
en['seo']['home'] = {'title': 'Lujain Abu Ghanemeh | AI Marketing for the Pharmaceutical Sector',
  'description': 'Pharmacist and AI marketing specialist in Amman: AI-made campaigns, videos, websites and content for pharma companies, pharmacies, drug warehouses and pharmacists.'}
en['seo']['about'] = {'title': 'About Lujain Abu Ghanemeh — Pharmacist & AI Marketing Specialist',
  'description': 'Pharmacist (B.Sc. Pharmacy, University of Petra, GPA 3.8/4.0) with three years in pharma sales and business development, now creating AI-powered pharmaceutical marketing.'}
en['seo']['marketing'] = {'title': 'AI Marketing for Pharma Companies, Pharmacies & Warehouses | Lujain',
  'description': 'Compliance-first AI marketing for the pharmaceutical sector: product launches, pharmacy promotions, distributor catalogs, HCP content and pharmacist personal brands.'}
en['seo']['contact'] = {'title': 'Contact Lujain Abu Ghanemeh — AI Marketing for Pharma',
  'description': 'Email lujainahmad073@gmail.com about AI-powered marketing for pharmaceutical companies, pharmacies, drug warehouses and pharmacists, or about roles and collaborations.'}
save('content/site.json', en)

# ---------------- Arabic profile ----------------
ar = load('content/ar/site.json')
ar['role'] = 'صيدلانية وأخصائية تسويق بالذكاء الاصطناعي للقطاع الدوائي'
ar['positioning'] = 'صيدلانية · حاصلة على شهادة CPD في الذكاء الاصطناعي للأعمال · تسويق دوائي بالذكاء الاصطناعي'
ar['brandConcept'] = 'حيث تلتقي المعرفة الصيدلانية بالتسويق الذكي.'
ar['tagline'] = 'تسويق بالذكاء الاصطناعي للقطاع الدوائي، تصنعه صيدلانية ويحترم القوانين من أول خطوة.'
ar['hero'].update({
  'headline': 'تسويق دوائي يُصنع بالذكاء الاصطناعي، وتراجعه صيدلانية.',
  'subheadline': 'أساعد شركات الأدوية والصيدليات ومستودعات الأدوية والصيادلة على تسويق منتجاتهم وخدماتهم بالذكاء الاصطناعي: حملات وفيديوهات ومواقع ومحتوى وتجارب تفاعلية، سريعة الإنتاج ومبنية لتحترم قوانين الإعلان عن الأدوية.',
  'intro': 'صيدلانية بالدراسة، ومسوّقة بالخبرة. ثلاث سنوات في المبيعات الدوائية وتطوير الأعمال علّمتني كيف يُباع الدواء فعلاً: للطبيب، وللصيدلية، وللمريض، وكم من السهل أن تتجاوز حملة ما الخط التنظيمي. أجمع هذه الخبرة مع الإنتاج بالذكاء الاصطناعي لأصنع تسويقاً أسرع وأكثر إبداعاً وآمناً للنشر.',
  'primaryCta': 'صمّم حملة'})
ar['about']['lead'] = 'أنا صيدلانية وأخصائية تسويق بالذكاء الاصطناعي للقطاع الدوائي، حاصلة على شهادة معتمدة (CPD) في الذكاء الاصطناعي للأعمال. أستخدم الذكاء الاصطناعي لصناعة التسويق لشركات الأدوية والصيدليات والموزعين والكوادر الصحية، وأراجع كل ادعاء بعين صيدلانية.'
ar['about']['body'] = ('تمتد خبرتي بين صيدلية المجتمع، والعمل المخبري، ومركز تطعيم كوفيد-19، وثلاث سنوات في المبيعات الدوائية وتطوير الأعمال، مع تدريب في التشريعات ودورة حياة الدواء. هذا المزيج علّمني رحلة الدواء كاملة: من التسجيل، إلى العلامة التجارية، فالمستودع، فرف الصيدلية، فالمريض.\n\n'
  'لا أتعامل مع التسويق كوكالة لم تقرأ نشرة دواء يوماً، بل كصيدلانية تعرف لماذا سُجّل المنتج، وما الذي يجوز قوله للجمهور وما الذي يُقال للكوادر الصحية فقط، ومتى يحتاج الادعاء إلى دليل. الذكاء الاصطناعي يجعلني أنتج الحملات والفيديوهات والمواقع بسرعة، والمعرفة الصيدلانية تبقيها دقيقة ومنضبطة.')
ar['about']['interests'] = ['التسويق بالذكاء الاصطناعي للمنتجات والخدمات الدوائية', 'الترويج المنضبط وقوانين الإعلان عن الأدوية'] + [i for i in ar['about']['interests'] if 'الترويج' not in i][:5]
if 'التسويق الدوائي والحملات ومحتوى العلامات التجارية' not in ar['about']['expertise']:
  ar['about']['expertise'].insert(0, 'التسويق الدوائي والحملات ومحتوى العلامات التجارية')
ar['contact']['intro'] = 'أفضل طريقة للتواصل معي هي البريد الإلكتروني. أعمل مع شركات الأدوية والصيدليات ومستودعات الأدوية والكوادر الصحية على التسويق بالذكاء الاصطناعي، وأنا منفتحة على وظائف التسويق الدوائي والذكاء الاصطناعي.'
ar['contact']['roles'] = ['أخصائية تسويق بالذكاء الاصطناعي للقطاع الدوائي', 'التسويق الرقمي الدوائي', 'إعداد المحتوى الطبي والترويجي', 'مستشارة تسويق للصيدليات والموزعين', 'أخصائية ذكاء اصطناعي دوائي', 'إنتاج المحتوى والمنتجات الرقمية بالذكاء الاصطناعي']
mk_ar = {'category': 'التسويق الدوائي', 'items': [
  {'name': 'المبيعات الدوائية والعلاقات مع العملاء B2B', 'level': 3},
  {'name': 'تخطيط الحملات وخطط المحتوى', 'level': 3},
  {'name': 'محتوى التواصل الاجتماعي لعلامات الأدوية والصيدليات', 'level': 3},
  {'name': 'الامتثال لقوانين الإعلان عن الأدوية (الأردن)', 'level': 2},
  {'name': 'تحليلات التسويق ومؤشرات الأداء', 'level': 2}]}
ar['skills'] = [g for g in ar['skills'] if g['category'] != mk_ar['category']]
ar['skills'].insert(0, mk_ar)
ar['seo']['home'] = {'title': 'لجين أبو غنيمة | التسويق بالذكاء الاصطناعي للقطاع الدوائي',
  'description': 'صيدلانية وأخصائية تسويق بالذكاء الاصطناعي في عمّان: حملات وفيديوهات ومواقع ومحتوى لشركات الأدوية والصيدليات ومستودعات الأدوية والصيادلة.'}
ar['seo']['about'] = {'title': 'عن لجين أبو غنيمة — صيدلانية وأخصائية تسويق بالذكاء الاصطناعي',
  'description': 'صيدلانية (بكالوريوس صيدلة، جامعة البترا، معدل 3.8 من 4.0) بخبرة ثلاث سنوات في المبيعات الدوائية وتطوير الأعمال، تصنع اليوم تسويقاً دوائياً بالذكاء الاصطناعي.'}
ar['seo']['marketing'] = {'title': 'التسويق بالذكاء الاصطناعي لشركات الأدوية والصيدليات والمستودعات | لجين',
  'description': 'تسويق دوائي بالذكاء الاصطناعي يبدأ بالامتثال: إطلاق المنتجات، عروض الصيدليات، كتالوجات الموزعين، محتوى الكوادر الصحية، والهوية الشخصية للصيادلة.'}
ar['seo']['contact'] = {'title': 'تواصل مع لجين أبو غنيمة — التسويق الدوائي بالذكاء الاصطناعي',
  'description': 'راسل lujainahmad073@gmail.com بخصوص التسويق بالذكاء الاصطناعي لشركات الأدوية والصيدليات ومستودعات الأدوية والصيادلة، أو بخصوص الوظائف والتعاون.'}
save('content/ar/site.json', ar)

# ---------------- Marketing page content ----------------
REFS = [
  {'title': 'JFDA framework on medicine advertising (Arab News, 12 Aug 2024)', 'url': 'https://www.arabnews.com/node/2567136/middle-east'},
  {'title': 'Jordan Media Commission: health-claim ads need JFDA approval (Petra, 24 Jun 2026)', 'url': 'https://www.petra.gov.jo/en/news/media-outlets-told-to-verify-health-claims-in-advertisements'},
  {'title': 'JFDA refers 30 websites and platforms for illegally selling medicines (Petra, 12 May 2026)', 'url': 'https://petra.gov.jo/cgi-bin/index.php/en/news/jfda-30-websites-digital-platforms-referred-to-authorities-for-illegally-selling-medicines'},
  {'title': 'WHO — Ethical criteria for medicinal drug promotion (1988)', 'url': 'https://www.who.int/publications/i/item/9241541239'}]
mk = {
 'audiences': [
  {'k': 'companies', 't': 'Pharmaceutical companies', 'who': 'Manufacturers, scientific offices and agents',
   'pain': 'Launching and growing brands in a crowded market — with every claim tied to the registration file and every channel watched by the regulator.',
   'make': ['Product launch campaigns', 'Detailing aids and e-detailing for healthcare professionals', 'Product and explainer videos', 'Medical-rep training content and quizzes', 'Conference and booth material', 'Brand websites and landing pages'],
   'channels': ['Medical reps', 'Scientific events', 'Email to healthcare professionals', 'LinkedIn', 'Brand website'],
   'compliance': 'Prescription medicines are promoted to healthcare professionals only, and every claim must match the registered product information.'},
  {'k': 'pharmacies', 't': 'Pharmacies', 'who': 'Independent pharmacies and chains',
   'pain': 'Competing with chains and online sellers on trust, service and footfall — without advertising prescription medicines or making unapproved health claims.',
   'make': ['Seasonal offer campaigns for OTC, skincare and baby care', 'Social posts and short videos', 'Health-awareness content', 'Loyalty and refill-reminder messages', 'Google Business profile and local search', 'In-store screens and posters'],
   'channels': ['Instagram & Facebook', 'WhatsApp Business', 'Google Maps', 'In-store'],
   'compliance': 'Promote the pharmacy’s services, categories and permitted products — never prescription medicines. OTC advertising in the media needs prior JFDA approval.'},
  {'k': 'warehouses', 't': 'Drug warehouses & distributors', 'who': 'Wholesalers and distribution companies',
   'pain': 'Selling B2B to hundreds of pharmacies: keeping them up to date on the portfolio, offers and new agencies, and standing out from other distributors.',
   'make': ['Digital product catalogs', 'B2B offer bulletins for pharmacies', 'New-agency and new-product announcements', 'Sales-team pitch decks', 'Short product-training videos', 'Company profile and website'],
   'channels': ['WhatsApp broadcasts to pharmacies', 'Sales reps', 'Email', 'LinkedIn'],
   'compliance': 'Trade communication goes to licensed pharmacies, and product information stays within the registered label.'},
  {'k': 'individuals', 't': 'Pharmacists & healthcare professionals', 'who': 'Practitioners, consultants and trainers',
   'pain': 'Building a trusted professional presence — for a career move, a consultancy or a training business — without the time to produce content every week.',
   'make': ['Personal brand, bio and positioning', 'Portfolio websites like this one', 'Educational posts and carousels', 'Short educational videos', 'CV and professional profiles', 'Course and workshop promotion'],
   'channels': ['LinkedIn', 'Instagram', 'Personal website', 'YouTube'],
   'compliance': 'Educational, evidence-based content — no endorsement of specific prescription brands to the public.'},
  {'k': 'products', 't': 'Products', 'who': 'OTC medicines, supplements, cosmetics, baby care and medical devices',
   'pain': 'A product needs a clear story that sells — but health and cosmetic claims are tightly controlled, and AI will invent claims if nobody checks it.',
   'make': ['Product naming and positioning', 'Pack shots and AI visuals', 'Product videos and reels', 'E-commerce and listing copy', 'Plain-language summaries of the leaflet', 'Influencer and sampling briefs'],
   'channels': ['Social media', 'Pharmacy shelf & point of sale', 'E-commerce', 'Influencers'],
   'compliance': 'Only approved claims; a product is advertised only after registration, with JFDA approval for media advertising where required.'}],
 'goals': [
  {'k': 'launch', 't': 'Launch', 'angle': 'Introduce something new with one clear, approved message.', 'kpi': 'Reach in the target audience · listings in pharmacies · first-month sell-in'},
  {'k': 'awareness', 't': 'Awareness & education', 'angle': 'Educate first, sell second — trust is the product.', 'kpi': 'Engagement rate · saves and shares · questions received'},
  {'k': 'sales', 't': 'Sales & offers', 'angle': 'A specific, time-limited reason to act now.', 'kpi': 'Footfall or orders · offer redemptions · basket size'},
  {'k': 'loyalty', 't': 'Loyalty & retention', 'angle': 'Stay useful between purchases with reminders and care.', 'kpi': 'Repeat purchases · refill rate · WhatsApp opt-ins'}],
 'process': [
  {'t': 'Brief', 'd': 'Audience, product, goal and budget — agreed on one page.'},
  {'t': 'Claim check', 'd': 'Every claim is checked against the registered product information, the leaflet and the evidence.'},
  {'t': 'AI production', 'd': 'Copy, visuals, video, web pages and interactive content, produced with AI in Arabic and English.'},
  {'t': 'Pharmacist review', 'd': 'I review every piece for accuracy, audience and tone before you see it.'},
  {'t': 'Approval', 'd': 'Your medical or regulatory sign-off, plus JFDA approval wherever the law requires it.'},
  {'t': 'Launch & learn', 'd': 'Publish, measure and improve — and pass any side-effect reports in the comments to pharmacovigilance.'}],
 'rules': [
  {'t': 'Prescription medicines stay with professionals', 'd': 'In Jordan, direct promotion of medicines to patients is prohibited; approved promotional material targets healthcare providers only.'},
  {'t': 'Registered products, registered claims', 'd': 'No medicine is advertised before it is registered, and no ad says anything that is not in its registration file.'},
  {'t': 'Approval before the media', 'd': 'Advertising non-prescription medicines in any media — including social platforms — needs prior JFDA approval.'},
  {'t': 'No unapproved health claims', 'd': 'Since June 2026, Jordanian media may not publish ads with health or nutrition claims, such as “under pharmaceutical supervision” or “fat-burning”, without JFDA approval.'},
  {'t': 'Selling stays in the pharmacy', 'd': 'Campaigns never push the online sale of medicines, which the JFDA actively pursues.'},
  {'t': 'Honest AI', 'd': 'No fake doctors, patients or testimonials, no patient data in prompts, and every claim traceable to a source.'}],
 'references': REFS,
 'note': 'Rules summarised from public reports for orientation only; always confirm the current requirements with the JFDA before publishing.'
}
save('content/marketing.json', mk)

mk_ar = {
 'audiences': [
  {'k': 'companies', 't': 'شركات الأدوية', 'who': 'المصانع والمكاتب العلمية والوكلاء',
   'pain': 'إطلاق العلامات التجارية وتنميتها في سوق مزدحم، مع ربط كل ادعاء بملف التسجيل، وكل قناة تحت نظر الجهة الرقابية.',
   'make': ['حملات إطلاق المنتجات', 'مواد ترويجية وعروض رقمية للكوادر الصحية', 'فيديوهات تعريفية للمنتجات', 'محتوى تدريب المندوبين واختبارات تفاعلية', 'مواد المؤتمرات والمعارض', 'مواقع العلامات التجارية وصفحات الهبوط'],
   'channels': ['المندوبون العلميون', 'الفعاليات العلمية', 'البريد للكوادر الصحية', 'LinkedIn', 'موقع العلامة'],
   'compliance': 'أدوية الوصفة تُروَّج للكوادر الصحية فقط، وكل ادعاء يجب أن يطابق معلومات المنتج المسجلة.'},
  {'k': 'pharmacies', 't': 'الصيدليات', 'who': 'الصيدليات المستقلة والسلاسل',
   'pain': 'المنافسة مع السلاسل والبيع الإلكتروني على الثقة والخدمة وعدد الزوار، دون الإعلان عن أدوية الوصفة أو نشر ادعاءات صحية غير معتمدة.',
   'make': ['حملات عروض موسمية للمنتجات غير الوصفية والعناية بالبشرة والأطفال', 'منشورات وفيديوهات قصيرة', 'محتوى توعوي صحي', 'رسائل الولاء وتذكير إعادة الصرف', 'ملف Google التجاري والظهور المحلي', 'شاشات وملصقات داخل الصيدلية'],
   'channels': ['Instagram و Facebook', 'WhatsApp Business', 'خرائط Google', 'داخل الصيدلية'],
   'compliance': 'نروّج لخدمات الصيدلية وفئاتها والمنتجات المسموح بها، وليس لأدوية الوصفة أبداً. والإعلان عن الأدوية غير الوصفية في وسائل الإعلام يحتاج موافقة مسبقة من المؤسسة العامة للغذاء والدواء.'},
  {'k': 'warehouses', 't': 'مستودعات الأدوية والموزعون', 'who': 'مستودعات الجملة وشركات التوزيع',
   'pain': 'البيع لمئات الصيدليات: إطلاعها على المنتجات والعروض والوكالات الجديدة باستمرار، والتميّز عن باقي الموزعين.',
   'make': ['كتالوجات منتجات رقمية', 'نشرات عروض للصيدليات', 'إعلانات الوكالات والمنتجات الجديدة', 'عروض تقديمية لفريق المبيعات', 'فيديوهات قصيرة لتدريب المنتجات', 'ملف تعريفي وموقع للشركة'],
   'channels': ['رسائل WhatsApp للصيدليات', 'مندوبو المبيعات', 'البريد الإلكتروني', 'LinkedIn'],
   'compliance': 'التواصل التجاري موجّه للصيدليات المرخّصة، ومعلومات المنتج لا تتجاوز النشرة المسجلة.'},
  {'k': 'individuals', 't': 'الصيادلة والكوادر الصحية', 'who': 'الممارسون والمستشارون والمدرّبون',
   'pain': 'بناء حضور مهني موثوق، لانتقال وظيفي أو استشارات أو تدريب، دون وقت لإنتاج محتوى كل أسبوع.',
   'make': ['الهوية الشخصية والنبذة والتموضع', 'مواقع شخصية مثل هذا الموقع', 'منشورات وكاروسيل تعليمي', 'فيديوهات تعليمية قصيرة', 'السيرة الذاتية والملفات المهنية', 'الترويج للدورات وورش العمل'],
   'channels': ['LinkedIn', 'Instagram', 'موقع شخصي', 'YouTube'],
   'compliance': 'محتوى تعليمي مبني على الدليل، دون الترويج لأسماء تجارية لأدوية وصفية أمام الجمهور.'},
  {'k': 'products', 't': 'المنتجات', 'who': 'الأدوية غير الوصفية، والمكملات، ومستحضرات التجميل، ومنتجات الأطفال، والأجهزة الطبية',
   'pain': 'المنتج يحتاج قصة واضحة تبيع، لكن الادعاءات الصحية والتجميلية مضبوطة بشدة، والذكاء الاصطناعي يخترع ادعاءات إذا لم يراجعه أحد.',
   'make': ['تسمية المنتج وتموضعه', 'صور منتجات ومرئيات بالذكاء الاصطناعي', 'فيديوهات وريلز للمنتج', 'نصوص المتاجر الإلكترونية', 'تبسيط النشرة الدوائية بلغة واضحة', 'مواصفات حملات المؤثرين والعينات'],
   'channels': ['التواصل الاجتماعي', 'رف الصيدلية ونقطة البيع', 'المتاجر الإلكترونية', 'المؤثرون'],
   'compliance': 'ادعاءات معتمدة فقط؛ لا إعلان عن منتج قبل تسجيله، ومع موافقة المؤسسة العامة للغذاء والدواء على الإعلان الإعلامي حيث يلزم.'}],
 'goals': [
  {'k': 'launch', 't': 'إطلاق', 'angle': 'تقديم شيء جديد برسالة واحدة واضحة ومعتمدة.', 'kpi': 'الوصول للجمهور المستهدف · الإدراج في الصيدليات · مبيعات الشهر الأول'},
  {'k': 'awareness', 't': 'توعية وتثقيف', 'angle': 'ثقّف أولاً وبِع ثانياً؛ الثقة هي المنتج.', 'kpi': 'نسبة التفاعل · الحفظ والمشاركة · الأسئلة الواردة'},
  {'k': 'sales', 't': 'مبيعات وعروض', 'angle': 'سبب محدد ومؤقت للتحرك الآن.', 'kpi': 'الزوار أو الطلبات · استخدام العرض · قيمة السلة'},
  {'k': 'loyalty', 't': 'ولاء واحتفاظ', 'angle': 'ابقَ مفيداً بين عملية شراء وأخرى بالتذكير والاهتمام.', 'kpi': 'الشراء المتكرر · نسبة إعادة الصرف · الاشتراك في WhatsApp'}],
 'process': [
  {'t': 'الموجز', 'd': 'الجمهور والمنتج والهدف والميزانية، متفق عليها في صفحة واحدة.'},
  {'t': 'فحص الادعاءات', 'd': 'كل ادعاء يُقارن بمعلومات المنتج المسجلة والنشرة والدليل العلمي.'},
  {'t': 'الإنتاج بالذكاء الاصطناعي', 'd': 'نصوص ومرئيات وفيديو وصفحات ومحتوى تفاعلي، بالعربية والإنجليزية.'},
  {'t': 'مراجعة الصيدلانية', 'd': 'أراجع كل قطعة من ناحية الدقة والجمهور والأسلوب قبل أن تصلك.'},
  {'t': 'الموافقة', 'd': 'موافقتك الطبية أو التنظيمية، وموافقة المؤسسة العامة للغذاء والدواء حيث يفرضها القانون.'},
  {'t': 'الإطلاق والتعلّم', 'd': 'ننشر ونقيس ونحسّن، ونحوّل أي بلاغ عن أعراض جانبية في التعليقات إلى اليقظة الدوائية.'}],
 'rules': [
  {'t': 'أدوية الوصفة للكوادر الصحية', 'd': 'في الأردن، الترويج المباشر للأدوية للمرضى ممنوع، والمواد الترويجية المعتمدة موجّهة لمقدمي الرعاية الصحية فقط.'},
  {'t': 'منتج مسجّل وادعاء مسجّل', 'd': 'لا إعلان عن دواء قبل تسجيله، ولا يتضمن الإعلان أي معلومة غير موجودة في ملف التسجيل.'},
  {'t': 'الموافقة قبل النشر', 'd': 'الإعلان عن الأدوية غير الوصفية في أي وسيلة، بما فيها منصات التواصل، يحتاج موافقة مسبقة من المؤسسة العامة للغذاء والدواء.'},
  {'t': 'لا ادعاءات صحية غير معتمدة', 'd': 'منذ حزيران 2026، يُمنع على وسائل الإعلام الأردنية نشر إعلانات فيها ادعاءات صحية أو غذائية، مثل «بإشراف صيدلاني» أو «حرق الدهون»، دون موافقة المؤسسة.'},
  {'t': 'البيع يبقى في الصيدلية', 'd': 'الحملات لا تدفع نحو بيع الأدوية إلكترونياً، وهو ما تلاحقه المؤسسة العامة للغذاء والدواء.'},
  {'t': 'ذكاء اصطناعي صادق', 'd': 'لا أطباء أو مرضى أو شهادات مزيفة، ولا بيانات مرضى في الأوامر، وكل ادعاء له مصدر.'}],
 'references': REFS,
 'note': 'القواعد ملخّصة من تقارير منشورة للاسترشاد فقط؛ تأكد دائماً من المتطلبات الحالية لدى المؤسسة العامة للغذاء والدواء قبل النشر.'
}
save('content/ar/marketing.json', mk_ar)

# ---------------- FAQ ----------------
fe = load('content/faq.json')['items']
fa = load('content/ar/faq.json')['items']
fe[1] = {'q': 'What does an AI marketing specialist for the pharmaceutical sector do?',
  'a': 'Plans and produces marketing for pharmaceutical companies, pharmacies, drug warehouses, pharmacists and their products — campaigns, videos, websites, content and interactive experiences — using AI for speed and creativity, and pharmaceutical knowledge to keep every claim accurate and compliant.'}
fa[1] = {'q': 'ماذا تفعل أخصائية التسويق بالذكاء الاصطناعي للقطاع الدوائي؟',
  'a': 'تخطط وتنتج التسويق لشركات الأدوية والصيدليات ومستودعات الأدوية والصيادلة ومنتجاتهم: حملات وفيديوهات ومواقع ومحتوى وتجارب تفاعلية، مستخدمةً الذكاء الاصطناعي للسرعة والإبداع، والمعرفة الصيدلانية لتبقى كل الادعاءات دقيقة ومنضبطة.'}
fe[4] = {'q': 'Who do you work with?',
  'a': 'Five groups: pharmaceutical companies (manufacturers, scientific offices and agents), pharmacies, drug warehouses and distributors, individual pharmacists and healthcare professionals, and products such as OTC medicines, supplements, cosmetics, baby care and medical devices.'}
fa[4] = {'q': 'مع من تعملين؟',
  'a': 'خمس فئات: شركات الأدوية (المصانع والمكاتب العلمية والوكلاء)، والصيدليات، ومستودعات الأدوية والموزعون، والصيادلة والكوادر الصحية كأفراد، والمنتجات مثل الأدوية غير الوصفية والمكملات ومستحضرات التجميل ومنتجات الأطفال والأجهزة الطبية.'}
new_en = [
 {'q': 'Can you advertise prescription medicines on social media?',
  'a': 'No. In Jordan, direct promotion of medicines to patients is prohibited and promotional material for prescription medicines goes to healthcare professionals only. For the public, I market pharmacy services, permitted products and health education — and OTC media ads go to the JFDA for prior approval.'},
 {'q': 'How do you keep AI-made marketing accurate?',
  'a': 'AI drafts; I check. Every claim is compared with the registered product information and the leaflet, nothing is published without your sign-off, and I never use fake doctors, patients or testimonials.'},
 {'q': 'What does a typical campaign include?',
  'a': 'A one-page brief, a claim check, the AI-produced pieces (posts, short videos, visuals, landing page or catalog), my pharmacist review, your approval, then launch with simple KPIs agreed at the start.'}]
new_ar = [
 {'q': 'هل يمكنك الإعلان عن أدوية الوصفة على مواقع التواصل؟',
  'a': 'لا. في الأردن يُمنع الترويج المباشر للأدوية للمرضى، والمواد الترويجية لأدوية الوصفة موجّهة للكوادر الصحية فقط. للجمهور أسوّق لخدمات الصيدلية والمنتجات المسموح بها والتثقيف الصحي، وإعلانات الأدوية غير الوصفية تُرسل للمؤسسة العامة للغذاء والدواء للموافقة المسبقة.'},
 {'q': 'كيف تضمنين دقة التسويق المصنوع بالذكاء الاصطناعي؟',
  'a': 'الذكاء الاصطناعي يكتب المسودة، وأنا أراجع. أقارن كل ادعاء بمعلومات المنتج المسجلة والنشرة، ولا يُنشر شيء دون موافقتك، ولا أستخدم أبداً أطباء أو مرضى أو شهادات مزيفة.'},
 {'q': 'ماذا تتضمن الحملة عادةً؟',
  'a': 'موجز في صفحة واحدة، وفحص للادعاءات، والقطع المنتجة بالذكاء الاصطناعي (منشورات وفيديوهات قصيرة ومرئيات وصفحة هبوط أو كتالوج)، ثم مراجعتي كصيدلانية، وموافقتك، والإطلاق بمؤشرات أداء بسيطة نتفق عليها من البداية.'}]
qs = {x['q'] for x in fe}
fe = fe[:2] + [x for x in new_en if x['q'] not in qs] + fe[2:]
qs = {x['q'] for x in fa}
fa = fa[:2] + [x for x in new_ar if x['q'] not in qs] + fa[2:]
for items in (fe, fa):
  for x in items:
    if 'lujainahmad' in x['a'] or x['q'].startswith(('What opportunities', 'ما الفرص')):
      pass
fe = [x if not x['q'].startswith('What opportunities') else {'q': x['q'], 'a': 'Marketing work with pharmaceutical companies, pharmacies, drug warehouses and healthcare professionals, and roles such as AI Marketing Specialist for the pharmaceutical sector, pharmaceutical digital marketing, medical and promotional content creation, and pharmaceutical AI.'} for x in fe]
fa = [x if not x['q'].startswith('ما الفرص') else {'q': x['q'], 'a': 'العمل التسويقي مع شركات الأدوية والصيدليات ومستودعات الأدوية والكوادر الصحية، ووظائف مثل أخصائية تسويق بالذكاء الاصطناعي للقطاع الدوائي، والتسويق الرقمي الدوائي، وإعداد المحتوى الطبي والترويجي، والذكاء الاصطناعي الدوائي.'} for x in fa]
save('content/faq.json', {'items': fe})
save('content/ar/faq.json', {'items': fa})
print('ok', len(fe), len(fa))
