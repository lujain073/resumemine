import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = 'ai-across-the-pharmaceutical-industry'
for old in ['content/articles/where-ai-helps-in-pharmacy.json', 'content/ar/articles/where-ai-helps-in-pharmacy.json']:
    p = os.path.join(ROOT, old)
    if os.path.exists(p): os.remove(p)

REFS_EN = """## References

- [FDA (2025, draft guidance). Considerations for the Use of Artificial Intelligence to Support Regulatory Decision-Making for Drug and Biological Products](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/considerations-use-artificial-intelligence-support-regulatory-decision-making-drug-and-biological)
- [FDA CDER. Artificial Intelligence for Drug Development](https://www.fda.gov/about-fda/center-drug-evaluation-and-research-cder/artificial-intelligence-drug-development)
- [FDA CDER (2023). Artificial Intelligence in Drug Manufacturing — discussion paper](https://www.fda.gov/media/165743/download)
- [EMA (2024). Reflection paper on the use of artificial intelligence in the medicinal product lifecycle](https://www.ema.europa.eu/en/use-artificial-intelligence-ai-medicinal-product-lifecycle-scientific-guideline)
- [Jumper J. et al. (2021). Highly accurate protein structure prediction with AlphaFold. Nature 596, 583–589](https://www.nature.com/articles/s41586-021-03819-2)
- [ICH quality guidelines — Q9 quality risk management, Q10 pharmaceutical quality system](https://www.ich.org/page/quality-guidelines)
- [ICH efficacy guidelines — E6 Good Clinical Practice, E2B electronic safety reporting](https://www.ich.org/page/efficacy-guidelines)
- [EudraLex Volume 4 — EU GMP guidelines, including Annex 11 on computerised systems](https://health.ec.europa.eu/medicinal-products/eudralex/eudralex-volume-4_en)
- [21 CFR Part 11 — electronic records and electronic signatures](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-11)
- [WHO (2021). Ethics and governance of artificial intelligence for health](https://www.who.int/publications/i/item/9789240029200)
- [WHO. Medication Without Harm — Global Patient Safety Challenge](https://www.who.int/initiatives/medication-without-harm)
- [WHO (2022). The WHO AWaRe antibiotic book](https://www.who.int/publications/i/item/9789240062382)
- [WHO. Ethical criteria for medicinal drug promotion](https://www.who.int/publications/i/item/9241541239)"""

BODY_EN = """Most conversations about AI in pharmacy start with the technology. I prefer to start with the work: who is doing a task, how often, what happens when it goes wrong, and which written knowledge it depends on. Seen this way, AI is not one thing for the pharmaceutical industry. It is a different tool at every stage of a medicine’s life — and in some places it is the wrong tool.

Regulators now describe the same lifecycle view. The European Medicines Agency’s 2024 reflection paper considers AI at every step from drug discovery to the post-authorisation setting, and the FDA’s 2025 draft guidance proposes a risk-based framework for judging whether an AI model is credible for its specific context of use.

## Three questions I ask about any task

- **Is it repetitive?** Work done the same way many times a day or week is a good candidate for automation.
- **What does a mistake cost?** Where the cost is high — a patient, a batch, a submission — AI should prepare, check and explain, never decide alone.
- **Is the knowledge written down?** AI is most reliable when it can be grounded in an approved source: a label, a specification, a guideline, a validated dataset.

## 1. Drug discovery and R&D

**The workflow problem:** discovery teams must choose a few promising compounds from very large chemical and biological spaces, and scientists cannot read everything published about a target or excipient.

**Where AI helps:** structure prediction (AlphaFold is the best-known example), property and ADMET prediction to prioritise screening hits, and literature assistants that extract findings with links to the source.

**Limits:** predictions are hypotheses that must be tested in the lab; models trained on public data may not fit novel chemistry.

## 2. Clinical research

**The workflow problem:** eligibility criteria are written as free text, recruitment is slow, and data-quality issues often surface close to database lock.

**Where AI helps:** turning criteria into structured checks for pre-screening, and central statistical monitoring that shows monitors which sites and variables need attention — in the risk-based spirit of ICH E6.

**Limits:** eligibility and data decisions remain with investigators and monitors; patient data must be handled under ethics approval and data-protection rules.

## 3. Manufacturing and engineering

**The workflow problem:** planners schedule around equipment, cleaning, changeovers and materials in spreadsheets; equipment fails unexpectedly; packaging errors cause recalls.

**Where AI helps:** schedule optimisation, predictive maintenance from sensor data, computer-vision inspection of packs and codes, and material-requirement forecasting. The FDA’s 2023 discussion paper on AI in drug manufacturing explores process monitoring and control as key opportunities, while raising questions about data management and continuously learning systems.

**Limits:** anything that affects a validated process or qualified equipment goes through change control.

## 4. Quality assurance and quality control

**The workflow problem:** deviations are investigated one at a time, batch-record review takes days, and slow drifts in stability data are noticed only when a result fails.

**Where AI helps:** finding recurring root causes across deviation reports, pre-reviewing documents for good documentation practice gaps, and statistical out-of-trend detection.

**Limits:** quality decisions belong to the pharmaceutical quality system (ICH Q10), and computerised systems must meet data-integrity and validation expectations such as EU GMP Annex 11 and 21 CFR Part 11.

## 5. Regulatory affairs

**The workflow problem:** large CTD dossiers assembled by many people, frequent deficiency letters, and requirements that change across many authorities.

**Where AI helps:** completeness and consistency checks against the CTD structure, and regulatory-intelligence summaries that always link to the official source.

**Limits:** a summary is never a substitute for the official text; regulatory judgment and sign-off remain human.

## 6. Supply chain, procurement and distribution

**The workflow problem:** shortages discovered only when orders fail, single-source suppliers, quotations compared by hand, cold-chain excursions found after delivery.

**Where AI helps:** demand forecasting, shortage and supplier-risk scoring, quotation normalisation, warehouse and route optimisation, and excursion-risk prediction.

**Limits:** forecasts break when unprecedented events occur; storage conditions, segregation rules and good distribution practice always take priority over efficiency.

## 7. Medical affairs

**The workflow problem:** medical information teams answer similar questions repeatedly, and promotional materials go through many review rounds.

**Where AI helps:** drafting answers only from approved documents, with citations; checking each promotional claim against the approved product information.

**Limits:** answers must stay balanced and on-label, any adverse event in an inquiry must reach pharmacovigilance, and a medical reviewer approves everything — consistent with WHO’s ethical criteria for medicinal drug promotion.

## 8. Pharmaceutical sales and marketing

**The workflow problem:** forecasts built as “last year plus a percentage”, scattered market information, and field teams evaluated on raw sales regardless of territory potential.

**Where AI helps:** forecasts with ranges and explained drivers, market-intelligence briefings with sources, territory-adjusted coaching insight, and organised evidence for market access and pricing.

**Limits:** employee data must be used transparently and lawfully, never for automated disciplinary decisions; competitor information must be obtained legitimately.

## 9. Pharmacovigilance

**The workflow problem:** adverse event reports arrive as free text, timelines are strict, and potential signals hide in large case volumes.

**Where AI helps:** extracting case data and suggesting MedDRA codes for ICH E2B reporting, duplicate detection, and disproportionality screening with drafted case-series summaries.

**Limits:** statistical signals are hypotheses, not proof of causality; validity, seriousness and causality are confirmed by the safety team.

## 10. Hospital pharmacy

**The workflow problem:** prescription review under time pressure, interaction alerts that are ignored, and stewardship teams that cannot review every antibiotic order daily.

**Where AI helps:** ranked, sourced prescription checks, explained interaction alerts, and prioritised antimicrobial-stewardship review lists aligned with local guidelines and the WHO AWaRe framework.

**Limits:** alert fatigue is a real risk; every intervention is decided by the pharmacist and prescriber.

## 11. Community pharmacy

**The workflow problem:** stock-outs next to expired stock, short counseling time, and patients who stop taking their medicines.

**Where AI helps:** inventory agents that calculate stock cover and expiry risk, and personalised education and follow-up in the patient’s language.

**Limits:** patient messaging needs consent; recommendations never replace the pharmacist’s judgment.

## Implementation considerations across the industry

- **Start with the context of use.** Define exactly what decision the AI output supports and what happens if it is wrong; the FDA draft guidance builds its credibility assessment on this idea.
- **Data integrity first.** In GMP and GCP environments, data must be attributable, complete and protected; AI does not relax those expectations.
- **Validate for the intended use**, and monitor performance after deployment — models drift when processes, products or populations change.
- **Keep a human in the loop** wherever patient safety, product quality or regulatory compliance is at stake, and make the human decision visible in the record.
- **Protect privacy and act ethically.** WHO’s guidance on AI for health emphasises human autonomy, transparency, accountability and inclusiveness.
- **Measure honestly.** A prototype tested on fictional data is a prototype; claims of impact need real-world evaluation.

## What stays human

Clinical and scientific judgment, accountability, and empathy. The goal is not a pharmaceutical industry without pharmacists; it is pharmacists, scientists and engineers with more time and better information.

""" + REFS_EN

REFS_AR = REFS_EN.replace('## References', '## المراجع')

BODY_AR = """تبدأ معظم النقاشات عن الذكاء الاصطناعي في الصيدلة بالتقنية. أما أنا فأفضّل أن أبدأ بالعمل نفسه: من يؤدي المهمة، وكم مرة، وماذا يحدث عندما تسوء، وعلى أي معرفة مكتوبة تعتمد. بهذه النظرة، لا يكون الذكاء الاصطناعي شيئاً واحداً في الصناعة الدوائية، بل أداة مختلفة في كل مرحلة من حياة الدواء، وفي بعض المواضع يكون الأداة الخطأ.

وتتبنى الجهات الرقابية اليوم النظرة نفسها لدورة الحياة: فورقة التأمل الصادرة عن وكالة الأدوية الأوروبية عام 2024 تتناول الذكاء الاصطناعي في كل خطوة من اكتشاف الدواء حتى ما بعد الترخيص، ويقترح مشروع إرشادات FDA لعام 2025 إطاراً قائماً على المخاطر لتقييم مصداقية نموذج الذكاء الاصطناعي في سياق استخدامه المحدد.

## ثلاثة أسئلة أطرحها على أي مهمة

- **هل هي متكررة؟** العمل الذي يُنجز بالطريقة نفسها مرات كثيرة يومياً أو أسبوعياً مرشّح جيد للأتمتة.
- **ما كلفة الخطأ؟** حين تكون الكلفة عالية (مريض، أو تشغيلة، أو تقديم رقابي) يجب أن يجهّز الذكاء الاصطناعي ويتحقق ويشرح، لا أن يقرر وحده.
- **هل المعرفة مكتوبة؟** يكون الذكاء الاصطناعي أكثر موثوقية حين يستند إلى مصدر معتمد: نشرة، أو مواصفة، أو إرشاد، أو مجموعة بيانات مُتحقق منها.

## 1. اكتشاف الأدوية والبحث والتطوير

**مشكلة سير العمل:** على فرق الاكتشاف اختيار عدد قليل من المركّبات الواعدة من فضاءات كيميائية وبيولوجية واسعة جداً، ولا يستطيع العلماء قراءة كل ما يُنشر عن هدف أو سواغ.

**أين يساعد الذكاء الاصطناعي:** توقع البنى البروتينية (و AlphaFold أشهر مثال)، وتوقع الخصائص و ADMET لترتيب نتائج الفحص، ومساعدات أبحاث تستخرج النتائج مع روابط مصادرها.

**الحدود:** التوقعات فرضيات يجب اختبارها مخبرياً، والنماذج المدرّبة على بيانات عامة قد لا تناسب كيمياء جديدة.

## 2. الأبحاث السريرية

**مشكلة سير العمل:** معايير الأهلية مكتوبة كنص حر، والتجنيد بطيء، ومشكلات جودة البيانات تظهر غالباً قرب إغلاق قاعدة البيانات.

**أين يساعد:** تحويل المعايير إلى فحوص منظّمة للفرز الأولي، والمراقبة الإحصائية المركزية التي تُري المراقبين أي المواقع والمتغيرات تحتاج اهتماماً، بروح المراقبة القائمة على المخاطر في ICH E6.

**الحدود:** قرارات الأهلية والبيانات تبقى للباحثين والمراقبين، وتُعالج بيانات المرضى وفق موافقات الأخلاقيات وقواعد حماية البيانات.

## 3. التصنيع والهندسة

**مشكلة سير العمل:** يجدول المخطّطون حول المعدات والتنظيف والتبديلات والمواد في جداول Excel، وتتعطل المعدات فجأة، وتسبب أخطاء التغليف سحب المنتجات.

**أين يساعد:** تحسين الجدولة، والصيانة التنبؤية من بيانات الحساسات، والفحص البصري للعبوات والرموز، وتوقع الاحتياجات من المواد. وتتناول ورقة النقاش الصادرة عن FDA عام 2023 حول الذكاء الاصطناعي في التصنيع الدوائي مراقبة العمليات وضبطها كفرص رئيسية، مع طرح أسئلة حول إدارة البيانات والأنظمة التي تتعلم باستمرار.

**الحدود:** أي شيء يمس عملية مُصادَق عليها أو معدات مؤهلة يمر عبر ضبط التغيير.

## 4. ضمان الجودة وضبط الجودة

**مشكلة سير العمل:** يُحقَّق في الانحرافات واحداً تلو الآخر، وتستغرق مراجعة سجلات التشغيلات أياماً، ولا يُلاحظ الانحراف البطيء في بيانات الثبات إلا عند فشل نتيجة.

**أين يساعد:** إيجاد الأسباب الجذرية المتكررة بين تقارير الانحرافات، والمراجعة المسبقة للوثائق بحثاً عن نواقص ممارسات التوثيق الجيد، والكشف الإحصائي عن الانحراف عن الاتجاه.

**الحدود:** قرارات الجودة تعود لنظام الجودة الدوائي (ICH Q10)، ويجب أن تلبي الأنظمة الحاسوبية متطلبات سلامة البيانات والتحقق مثل الملحق 11 من GMP الأوروبي و 21 CFR Part 11.

## 5. الشؤون التنظيمية

**مشكلة سير العمل:** ملفات CTD ضخمة يجمعها أشخاص كثيرون، ورسائل نواقص متكررة، ومتطلبات تتغير بين جهات رقابية عديدة.

**أين يساعد:** فحص الاكتمال والاتساق مقابل بنية CTD، وملخصات الاستخبارات التنظيمية المرتبطة دائماً بالمصدر الرسمي.

**الحدود:** الملخص لا يغني عن النص الرسمي أبداً، والحكم التنظيمي والاعتماد يبقيان بشريين.

## 6. سلسلة التوريد والمشتريات والتوزيع

**مشكلة سير العمل:** نقص يُكتشف عند فشل الطلبيات، وموردون بمصدر وحيد، وعروض أسعار تُقارن يدوياً، وانحرافات حرارة تُكتشف بعد التسليم.

**أين يساعد:** توقع الطلب، وتقييم مخاطر النقص والموردين، وتوحيد عروض الأسعار، وتحسين المستودعات والمسارات، وتوقع خطر انحرافات السلسلة الباردة.

**الحدود:** التوقعات تنكسر أمام الأحداث غير المسبوقة، وظروف التخزين وقواعد الفصل وممارسات التوزيع الجيد لها الأولوية دائماً على الكفاءة.

## 7. الشؤون الطبية

**مشكلة سير العمل:** تجيب فرق المعلومات الطبية عن أسئلة متشابهة مراراً، وتمر المواد الترويجية بجولات مراجعة كثيرة.

**أين يساعد:** صياغة إجابات من الوثائق المعتمدة فقط مع المراجع، ومطابقة كل ادعاء ترويجي مع معلومات المنتج المعتمدة.

**الحدود:** يجب أن تبقى الإجابات متوازنة وضمن الاستطباب المعتمد، وأن يصل أي عرض جانبي مذكور في الاستفسار إلى اليقظة الدوائية، وأن يعتمد مراجع طبي كل شيء، بما ينسجم مع المعايير الأخلاقية لمنظمة الصحة العالمية للترويج للأدوية.

## 8. المبيعات والتسويق الدوائي

**مشكلة سير العمل:** توقعات تُبنى على «مبيعات العام الماضي مضافاً إليها نسبة»، ومعلومات سوق مبعثرة، وفرق ميدانية تُقيَّم بالمبيعات الخام بغض النظر عن إمكانات المنطقة.

**أين يساعد:** توقعات بنطاقات وعوامل مفسَّرة، وملخصات استخبارات سوق مع المصادر، ورؤى توجيهية معدّلة حسب المنطقة، وأدلة منظّمة للوصول إلى السوق والتسعير.

**الحدود:** يجب استخدام بيانات الموظفين بشفافية وبشكل قانوني، ولا تُستخدم لقرارات تأديبية آلية، ويجب الحصول على معلومات المنافسين بطرق مشروعة.

## 9. اليقظة الدوائية

**مشكلة سير العمل:** تصل بلاغات الأعراض الجانبية كنص حر، والمواعيد صارمة، والإشارات المحتملة تختبئ بين أعداد كبيرة من الحالات.

**أين يساعد:** استخراج بيانات الحالة واقتراح ترميز MedDRA للإبلاغ وفق ICH E2B، وكشف الحالات المكررة، وفحص عدم التناسب مع تجهيز ملخصات سلاسل الحالات.

**الحدود:** الإشارات الإحصائية فرضيات لا دليل على السببية، ويؤكد فريق السلامة الصلاحية والخطورة والسببية.

## 10. صيدلة المستشفيات

**مشكلة سير العمل:** مراجعة الوصفات تحت ضغط الوقت، وتنبيهات تداخل يتجاهلها الجميع، وفرق إشراف لا تستطيع مراجعة كل طلب مضاد حيوي يومياً.

**أين يساعد:** فحوص وصفات مرتّبة وموثّقة المصادر، وتنبيهات تداخل مشروحة، وقوائم مراجعة مرتّبة للإشراف على المضادات الحيوية متوافقة مع الإرشادات المحلية وإطار AWaRe لمنظمة الصحة العالمية.

**الحدود:** إرهاق التنبيهات خطر حقيقي، وكل تدخل يقرره الصيدلاني والطبيب.

## 11. صيدلية المجتمع

**مشكلة سير العمل:** نفاد أدوية بجانب مخزون منتهي، ووقت إرشاد قصير، ومرضى يتوقفون عن تناول أدويتهم.

**أين يساعد:** وكلاء مخزون يحسبون أيام التغطية وخطر الصلاحية، وتثقيف ومتابعة شخصية بلغة المريض.

**الحدود:** مراسلة المرضى تحتاج موافقتهم، والتوصيات لا تحل محل حكم الصيدلاني أبداً.

## اعتبارات التطبيق عبر الصناعة

- **ابدأ بسياق الاستخدام.** حدّد بدقة القرار الذي يدعمه مخرج الذكاء الاصطناعي وما يحدث إن كان خاطئاً، وعلى هذه الفكرة يبني مشروع إرشادات FDA تقييم المصداقية.
- **سلامة البيانات أولاً.** في بيئات GMP و GCP يجب أن تكون البيانات منسوبة وكاملة ومحمية، والذكاء الاصطناعي لا يخفف هذه المتطلبات.
- **تحقّق من الأداة لغرضها المحدد**، وراقب أداءها بعد التطبيق، فالنماذج تنحرف حين تتغير العمليات أو المنتجات أو الفئات.
- **أبقِ الإنسان في الحلقة** حيثما كانت سلامة المريض أو جودة المنتج أو الامتثال التنظيمي على المحك، واجعل القرار البشري ظاهراً في السجل.
- **احمِ الخصوصية والتزم بالأخلاقيات.** تؤكد إرشادات منظمة الصحة العالمية حول الذكاء الاصطناعي في الصحة على الاستقلالية البشرية والشفافية والمساءلة والشمول.
- **قِس بصدق.** النموذج المختبر على بيانات وهمية نموذج أولي، وادعاءات الأثر تحتاج تقييماً في الواقع.

## ما يبقى إنسانياً

الحكم السريري والعلمي، والمسؤولية، والتعاطف. الهدف ليس صناعة دوائية بلا صيادلة، بل صيادلة وعلماء ومهندسون بوقت أكثر ومعلومات أفضل.

""" + REFS_AR

en = dict(slug=SLUG, title='Where AI Can Genuinely Transform the Pharmaceutical Industry: From Drug Discovery to Patient Care',
          category='Pharmaceutical AI research', date='2026-11-26', sample=False,
          excerpt='A field-by-field look at real workflow problems across the pharmaceutical value chain — where AI genuinely helps, where it does not, and what it takes to implement it responsibly.',
          body=BODY_EN)
ar = dict(slug=SLUG, title='أين يمكن للذكاء الاصطناعي أن يُحدث تحولاً حقيقياً في الصناعة الدوائية: من اكتشاف الدواء إلى رعاية المريض',
          category='أبحاث الذكاء الاصطناعي الدوائي', date='2026-11-26', sample=False,
          excerpt='نظرة مجالاً بمجال على مشكلات العمل الحقيقية عبر سلسلة القيمة الدوائية: أين يساعد الذكاء الاصطناعي فعلاً، وأين لا يساعد، وما الذي يتطلبه تطبيقه بمسؤولية.',
          body=BODY_AR)
json.dump(en, open(os.path.join(ROOT, 'content/articles', SLUG + '.json'), 'w'), indent=2, ensure_ascii=False)
json.dump(ar, open(os.path.join(ROOT, 'content/ar/articles', SLUG + '.json'), 'w'), indent=2, ensure_ascii=False)
print('article ok', len(BODY_EN.split()), 'words EN')
