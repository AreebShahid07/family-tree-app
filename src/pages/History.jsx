
import React, { useState } from 'react';

export default function HistoryPage() {
    const [lang, setLang] = useState('en'); // 'en' or 'ur'

    return (
        <div className="page-container content-page">
            <div className="content-wrapper">
                <div className="page-header">
                    <h2>Family History</h2>
                    <div className="lang-toggle">
                        <button
                            className={lang === 'en' ? 'active' : ''}
                            onClick={() => setLang('en')}
                        >
                            English
                        </button>
                        <button
                            className={lang === 'ur' ? 'active' : ''}
                            onClick={() => setLang('ur')}
                        >
                            اردو
                        </button>
                    </div>
                </div>

                <div className="history-text">
                    {lang === 'en' ? (
                        <>
                            <h3>Origins of the Massani Family</h3>
                            <p>
                                The Massani family (sub-caste Arain, Got Hansi) originally resided in the Massani village, Jalandhar district,
                                for generations before British rule. Due to the oppressive attitude of the Sikhs, our ancestors migrated
                                in 1845 to the village of Sondh, Tehsil Nawanshahr, Jalandhar, where a significant Muslim community existed.
                                Following the establishment of British rule in India, the security situation improved, and the government
                                recognized their ownership of the land in Punjab. This land remained in their lawful possession until 1947.
                            </p>

                            <h3>The First Generation</h3>
                            <p>
                                The family traces its roots to two brothers: Mr. Abadan and Mr. Karim Bakhsh (known as Kammu).
                                <br />
                                <strong>Mr. Abadan</strong> (Elder Brother): Married to Ms. Raiban. They had no children.
                                <br />
                                <strong>Mr. Karim Bakhsh</strong> (Younger Brother): Married to Ms. Ghulam Fatima. They had four sons and three daughters.
                            </p>
                            <p>
                                Since the elder brother had no issue, he adopted and raised Muhammad Abdullah, the third son of Karim Bakhsh.
                            </p>

                            <h3>The Great Migrations</h3>
                            <p>
                                <strong>1901 - Move to Sindh:</strong> When the British opened up Sindh for settlement with offers of free land
                                and transport, Akbar Din (the eldest son of Karim Bakhsh) seized the opportunity. He moved to Sindh
                                Digri (Chak No. 170), where his descendants still reside happily today.
                            </p>
                            <p>
                                <strong>1915 - Move to Sahiwal:</strong> The remaining three sons of Karim Bakhsh purchased 1.5 squares of land
                                in Tehsil Chichawatni (Chak No. 95/12-L). Although the village was dominated by Sikhs, they established
                                a separate settlement on their own land to maintain their religious values. This settlement became known
                                locally as the "Dera of the Good People" (Bhaly Mansoon ka Dera) or the "Dera of Maulvis." They farmed
                                here for ten years, though challenges like water scarcity (being at the tail of the canal) and distance
                                from the market (Mian Channu) persisted.
                            </p>
                            <p>
                                <strong>1925 - Settlement in Chishtian:</strong> When the Nawab of Bahawalpur auctioned land near the
                                Gajiani Canal, Ali Muhammad and Muhammad Abdullah consulted local elders. Prioritizing proximity to the
                                railway station and future access to schools and hospitals for their children's education, they purchased
                                about 5 squares of land in Chak No. 13 Gajiani. Despite the land initially being barren and the city of
                                Chishtian non-existent at the time, their hard work paid off, and it proved to be a wise decision for
                                future generations.
                            </p>

                            <h3>The Legacy of Karim Bakhsh</h3>
                            <p>
                                Karim Bakhsh had four sons and three daughters, whose lineages span from Sindh to Chishtian:
                            </p>
                            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '16px' }}>
                                <li><strong>Akbar Din:</strong> Settled in Sindh with his family.</li>
                                <li><strong>Ali Muhammad:</strong> Settled in Chishtian.</li>
                                <li><strong>Muhammad Abdullah:</strong> Became the Numberdar of Chak No. 13.</li>
                                <li><strong>Fateh Muhammad:</strong> Married twice and settled with his brothers.</li>
                                <li><strong>Daughters:</strong> Rabia Bibi, Aisha Bibi, and Umri Bibi were married in nearby areas (13-G, 4/1-R, 5/1-R).</li>
                            </ul>

                            <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)', marginTop: '24px', borderTop: '1px solid var(--card-border)', paddingTop: '12px' }}>
                                <em>Note: This historical account is curated from the rare manuscripts and documents of Haji Muhammad Hussain (son of Haji Muhammad Abdullah, Numberdar of Chak No. 13 Gajiani).</em>
                            </p>
                        </>
                    ) : (
                        <div style={{ direction: 'rtl', fontFamily: 'Noto Nastaliq Urdu, serif', textAlign: 'right' }}>
                            <h3>روئیداد خاندان مسانیاں (قوم آرائیں، گوت ہانسی)</h3>
                            <p>
                                خاندان مسانی حکومتِ برطانیہ سے قبل موضع مسانی ضلع جالندھر میں پشت در پشت آباد تھا۔ سکھوں کے رویہ اور طرزِ عمل سے تنگ آ کر ہمارے آباؤ اجداد نے ۱۸۴۵ء میں موضع مسانی سے سکونت ترک کر کے موضع سوندھ تحصیل نواں شہر ضلع جالندھر میں رہائش اختیار کر لی کیونکہ یہاں کافی مسلمان آباد تھے۔ حکومتِ برطانیہ کے ہندوستان پر تسلط کے بعد ملک میں امن و امان کی صورت بہتر ہو گئی اور حکومت نے علاقہ پنجاب میں قابض زمین پر ان کی ملکیت تسلیم کر لی۔ ۱۹۴۷ء تک یہ زمین ان کی ملکیت میں ہی رہی۔
                            </p>

                            <h3>خاندان کے اولین بزرگ</h3>
                            <p>
                                یہ دو بھائی تھے:
                                <br />
                                <strong>محترم آبادان (بڑے بھائی):</strong> ان کی زوجہ محترمہ رائیبان تھیں۔ ان کی کوئی اولاد نہ تھی۔
                                <br />
                                <strong>محترم کریم بخش عرف کموں (چھوٹے بھائی):</strong> ان کی زوجہ محترم غلام فاطمہ تھیں۔ ان کے چار بیٹے اور تین بیٹیاں تھیں۔
                                <br />
                                بڑے بھائی نے چھوٹے بھائی کریم بخش کے تیسرے بیٹے محمد عبداللہ کو متبنیٰ بنا کر پالا۔
                            </p>

                            <h3>نقل مکانی اور سفر</h3>
                            <p>
                                <strong>۱۹۰۱ء - سندھ کی طرف ہجرت:</strong> انگریزوں نے سندھ کو آباد کرنے کے لئے مفت زمین اور ذرائع آمدورفت کی پیشکش کی۔ کریم بخش کے بڑے بیٹے اکبر دین نے اس سے فائدہ اٹھایا اور سندھ ڈگری (چک نمبر ۱۷۰) منتقل ہو گئے۔ ان کی آل اولاد آج بھی وہیں شاد آباد ہے۔
                            </p>
                            <p>
                                <strong>۱۹۱۵ء - ساہیوال میں قیام:</strong> چھوٹے بھائی کے باقی تین بیٹوں نے تحصیل چیچہ وطنی (چک نمبر ۹۵۔۱۲ ایل) میں ڈیڑھ مربع زمین خریدی۔ سکھوں کی اکثریت کے باوجود انہوں نے بے دین سکھوں کے ساتھ رہنے کی بجائے اپنی زمین پر الگ رہائش اختیار کی۔ اس ڈیرہ کو لوگوں نے "بھلے مانسوں اور مولویوں کا ڈیرہ" کا نام دیا۔ تاہم، نہر کی ٹیل پر ہونے کی وجہ سے پانی کی کمی اور منڈی سے دوری (اقبال نگر ۶ میل، میاں چنوں ۱۴ میل) کی وجہ سے مشکلات رہیں۔
                            </p>
                            <p>
                                <strong>۱۹۲۵ء - چشتیاں میں سکونت:</strong> ریاست بہاول پور کے نواب صاحب نے نہر گجیانی کی زمین نیلام کی۔ محترم علی محمد اور محمد عبداللہ نے مستقبل میں بچوں کی تعلیم اور ہسپتال کی سہولت کو مدنظر رکھتے ہوئے چک نمبر ۱۳ گجیانی میں تقریباً ۵ مربع زمین خریدی۔ یہ زمین بنجر تھی اور اس وقت چشتیاں شہر کا نام و نشان نہ تھا، لیکن ان کی سخت محنت اور دور اندیشی کی بدولت یہ فیصلہ درست ثابت ہوا اور آئندہ نسلیں خوشحال ہوئیں۔
                            </p>

                            <h3>اولاد کریم بخش</h3>
                            <ul style={{ listStyleType: 'disc', paddingRight: '20px', marginBottom: '16px' }}>
                                <li><strong>اکبر دین:</strong> سندھ جا کر آباد ہوئے۔</li>
                                <li><strong>علی محمد:</strong> چشتیاں میں آباد ہوئے۔</li>
                                <li><strong>محمد عبداللہ:</strong> چک نمبر ۱۳ کے نمبردار مقرر ہوئے۔</li>
                                <li><strong>فتح محمد:</strong> انہوں نے بھی بھائیوں کے ساتھ سکونت اختیار کی۔</li>
                                <li><strong>بیٹیاں:</strong> رابعہ بی بی، عائشہ بی بی، اور عمری بی بی کی شادیاں قریبی چکوں (13-G, 4/1-R, 5/1-R) میں ہوئیں۔</li>
                            </ul>

                            <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)', marginTop: '24px', borderTop: '1px solid var(--card-border)', paddingTop: '12px' }}>
                                <em>یہ نادر معلومات محترم حاجی محمد حسین صاحب (ولد حاجی محمد عبداللہ صاحب نمبردار) کے نایاب مخطوطات سے لی گئی ہیں۔</em>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
