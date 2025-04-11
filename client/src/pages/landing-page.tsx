import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
      {/* Hero Section */}
      <header className="bg-primary-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center ml-2">
              <span className="text-white font-bold text-lg">إ</span>
            </div>
            <span className="text-xl font-bold text-gray-900">إصدار</span>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button variant="ghost" onClick={() => setLocation("/auth")}>تسجيل الدخول</Button>
            <Button onClick={() => setLocation("/auth")}>إنشاء حساب</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        {/* Hero Banner */}
        <section className="bg-gradient-to-r from-primary-900 to-primary-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  ابحث عن العقود الحكومية المثالية لشركتك
                </h1>
                <p className="text-lg md:text-xl mb-8 text-gray-100">
                  منصتنا المدعومة بالذكاء الاصطناعي تطابق ملف شركتك مع المناقصات الحكومية ذات الصلة، مما يزيد من معدل نجاحك.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-white text-primary-900 hover:bg-gray-100"
                    onClick={() => setLocation("/auth")}
                  >
                    ابدأ مجاناً
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    شاهد الأسعار
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative h-96 bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                  <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-br-md">
                    نسبة التطابق 98%
                  </div>
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold">تطوير البنية التحتية لتكنولوجيا المعلومات</h3>
                    <p className="text-sm opacity-80">وزارة الخدمات الرقمية</p>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/20 p-3 rounded-md">
                      <div className="text-sm font-medium">نطاق القيمة</div>
                      <div className="text-lg">250,000 - 500,000 دولار</div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-md">
                      <div className="text-sm font-medium">الموعد النهائي</div>
                      <div className="text-lg">متبقي 15 يوم</div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-md">
                      <div className="text-sm font-medium">الموقع</div>
                      <div className="text-lg">وطني</div>
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-6">
                    <Button className="bg-white text-primary-900 hover:bg-gray-100">
                      تقديم طلب
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">لماذا تختار منصتنا</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                منصتنا المدعومة بالذكاء الاصطناعي لمطابقة المناقصات تساعد الشركات من جميع الأحجام في العثور على المزيد من العقود الحكومية والفوز بها.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">مطابقة الذكاء الاصطناعي</h3>
                <p className="text-gray-600">
                  تقوم خوارزميتنا المتقدمة بمطابقة ملف شركتك مع مناقصات حكومية ذات صلة لتحقيق معدلات نجاح أعلى.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">توفير الوقت</h3>
                <p className="text-gray-600">
                  توقف عن قضاء ساعات في البحث عن المناقصات. احصل على توصيات فورية مخصصة لاحتياجاتك.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">تحليلات ورؤى</h3>
                <p className="text-gray-600">
                  تتبع الأداء، وتحليل الاتجاهات، والحصول على رؤى قابلة للتنفيذ لتحسين معدلات النجاح.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">تنبيهات في الوقت المناسب</h3>
                <p className="text-gray-600">
                  لا تفوت أي موعد نهائي مع إشعارات البريد الإلكتروني والتطبيق للفرص الجديدة.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">أدوات تعاونية</h3>
                <p className="text-gray-600">
                  اعمل مع فريقك لإنشاء ومراجعة وتقديم مقترحات عالية الجودة.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">قوالب العروض</h3>
                <p className="text-gray-600">
                  الوصول إلى قوالب وأمثلة خاصة بالصناعة لصياغة عروض فائزة.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">خطط أسعار مرنة</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                اختر الخطة التي تناسب احتياجات عملك. تتضمن جميع الخطط الوصول إلى تقنية مطابقة الذكاء الاصطناعي.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Basic Plan */}
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle>الباقة الأساسية</CardTitle>
                  <CardDescription>للشركات الصغيرة التي تبدأ للتو</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">29$</span>
                    <span className="text-gray-600 mr-2">/شهرياً</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>حتى 20 توصية مناقصة شهرياً</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>مطابقة ذكاء اصطناعي أساسية</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>3 مناقصات محفوظة</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>إشعارات البريد الإلكتروني</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => setLocation("/subscribe/basic")}
                  >
                    ابدأ الآن
                  </Button>
                </CardFooter>
              </Card>

              {/* Pro Plan - Highlighted as recommended */}
              <Card className="border-2 border-primary relative">
                <div className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                  موصى به
                </div>
                <CardHeader>
                  <CardTitle>الباقة الاحترافية</CardTitle>
                  <CardDescription>مثالية للشركات النامية</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">79$</span>
                    <span className="text-gray-600 mr-2">/شهرياً</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>توصيات مناقصات غير محدودة</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>مطابقة ذكاء اصطناعي متقدمة</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>20 مناقصة محفوظة</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>قوالب للعروض</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>تحليلات أساسية</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => setLocation("/subscribe/professional")}
                  >
                    ابدأ الآن
                  </Button>
                </CardFooter>
              </Card>

              {/* Enterprise Plan */}
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle>باقة المؤسسات</CardTitle>
                  <CardDescription>للمؤسسات الكبيرة ذات الاحتياجات المعقدة</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">199$</span>
                    <span className="text-gray-600 mr-2">/شهرياً</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>كل ما في الباقة الاحترافية</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>مطابقة ذكاء اصطناعي متميزة</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>مناقصات محفوظة غير محدودة</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>تحليلات وتقارير متقدمة</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>وصول API</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                      <span>مدير حساب مخصص</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => setLocation("/subscribe/enterprise")}
                  >
                    تواصل مع المبيعات
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">ماذا يقول عملاؤنا</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                لا تأخذ كلمتنا فقط - اسمع من الشركات التي حققت النجاح مع منصتنا.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                    AC
                  </div>
                  <div className="mr-3">
                    <h4 className="font-medium">ألفا للحوسبة</h4>
                    <p className="text-sm text-gray-600">خدمات تكنولوجيا المعلومات</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "منذ استخدام إصدار، زادت نسبة نجاحنا في المناقصات بنسبة 45٪. مطابقة الذكاء الاصطناعي دقيقة بشكل لا يصدق ووفرت لنا ساعات لا تعد ولا تحصى."
                </p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                    BC
                  </div>
                  <div className="mr-3">
                    <h4 className="font-medium">شركة بناء للإنشاءات</h4>
                    <p className="text-sm text-gray-600">البناء والإنشاءات</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "لقد حصلنا على أكثر من 2 مليون دولار في العقود الحكومية بفضل منصة إصدار. قوالب المقترحات وتذكيرات المواعيد النهائية هي التي غيرت قواعد اللعبة."
                </p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                    MC
                  </div>
                  <div className="mr-3">
                    <h4 className="font-medium">ميديكير للحلول الصحية</h4>
                    <p className="text-sm text-gray-600">الرعاية الصحية</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "كمزود رعاية صحية صغير، لم تكن لدينا الموارد للتنافس على العقود الحكومية حتى وجدنا إصدار. الآن نحن ننمو بسرعة بفضل الفرص الجديدة."
                </p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">هل أنت مستعد للعثور على المزيد من العقود الحكومية والفوز بها؟</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              انضم إلى آلاف الشركات التي تستخدم منصتنا للعثور على المناقصات ذات الصلة وزيادة معدل نجاحها.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary-900 hover:bg-gray-100"
                onClick={() => setLocation("/auth")}
              >
                ابدأ مجاناً
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                عرض خطط الأسعار
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center ml-2">
                  <span className="text-white font-bold text-lg">إ</span>
                </div>
                <span className="text-xl font-bold text-white">إصدار</span>
              </div>
              <p className="text-sm">
                منصة مطابقة المناقصات المدعومة بالذكاء الاصطناعي لمساعدة الشركات في العثور على العقود الحكومية والفوز بها.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">المنتج</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">المميزات</a></li>
                <li><a href="#" className="hover:text-white">الأسعار</a></li>
                <li><a href="#" className="hover:text-white">التوصيات</a></li>
                <li><a href="#" className="hover:text-white">الأسئلة الشائعة</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">الشركة</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">من نحن</a></li>
                <li><a href="#" className="hover:text-white">الوظائف</a></li>
                <li><a href="#" className="hover:text-white">المدونة</a></li>
                <li><a href="#" className="hover:text-white">تواصل معنا</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">القانونية</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">سياسة الخصوصية</a></li>
                <li><a href="#" className="hover:text-white">شروط الخدمة</a></li>
                <li><a href="#" className="hover:text-white">سياسة ملفات تعريف الارتباط</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">© 2025 إصدار. جميع الحقوق محفوظة.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}