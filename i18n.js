
/* =========================================
   BARQ ONLINE STORE
   Shared Internationalization System
   Step 1: Language foundation
========================================= */

const BARQ_LANGUAGES = {
    ar: { name: "العربية", dir: "rtl" },
    en: { name: "English", dir: "ltr" },
    ur: { name: "اردو", dir: "rtl" },
    hi: { name: "हिन्दी", dir: "ltr" },
    bn: { name: "বাংলা", dir: "ltr" },
    fil: { name: "Filipino", dir: "ltr" },
    id: { name: "Bahasa Indonesia", dir: "ltr" },
    ml: { name: "മലയാളം", dir: "ltr" },
    ta: { name: "தமிழ்", dir: "ltr" },
    fr: { name: "Français", dir: "ltr" }
};

const BARQ_TRANSLATIONS = {
    en: {
        home: "Home",
        shop: "Shop",
        categories: "Categories",
        offers: "Offers",
        myOrders: "My Orders",
        cart: "Cart",
        login: "Login",
        logout: "Logout",
        search: "Search products, brands and categories...",
        searchResults: "Search Results",
        featuredProducts: "Featured Products",
        viewOptions: "View Options",
        addToCart: "Add To Cart",
        checkout: "Checkout",
        continueShopping: "Continue Shopping",
        loading: "Loading...",
        noProducts: "No products available right now.",
        customerReviews: "Customer Reviews",
        submitReview: "Submit Review",
        customerOrders: "Customer Orders",
        refreshOrders: "Refresh Orders",
        loadingOrders: "Loading orders...",
        noOrders: "No orders found.",
        customerInformation: "Customer Information",
        products: "Products",
        payment: "Payment",
        status: "Status",
        pending: "Pending",
        processing: "Processing",
        shipped: "Shipped",
        outForDelivery: "Out for Delivery",
        delivered: "Delivered",
        deliveryDelayed: "Delivery Delayed",
        replacementRequested: "Replacement Requested",
        replacementApproved: "Replacement Approved",
        cancelled: "Cancelled",
        language: "Language"
    },

    ar: {
        home: "الرئيسية",
        shop: "تسوق",
        categories: "الفئات",
        offers: "العروض",
        myOrders: "طلباتي",
        cart: "السلة",
        login: "تسجيل الدخول",
        logout: "تسجيل الخروج",
        search: "ابحث عن المنتجات والعلامات التجارية والفئات...",
        searchResults: "نتائج البحث",
        featuredProducts: "منتجات مميزة",
        viewOptions: "عرض الخيارات",
        addToCart: "أضف إلى السلة",
        checkout: "إتمام الطلب",
        continueShopping: "متابعة التسوق",
        loading: "جارٍ التحميل...",
        noProducts: "لا توجد منتجات متاحة حاليًا.",
        customerReviews: "تقييمات العملاء",
        submitReview: "إرسال التقييم",
        customerOrders: "طلبات العملاء",
        refreshOrders: "تحديث الطلبات",
        loadingOrders: "جارٍ تحميل الطلبات...",
        noOrders: "لم يتم العثور على طلبات.",
        customerInformation: "معلومات العميل",
        products: "المنتجات",
        payment: "الدفع",
        status: "الحالة",
        pending: "قيد الانتظار",
        processing: "قيد المعالجة",
        shipped: "تم الشحن",
        outForDelivery: "خرج للتوصيل",
        delivered: "تم التوصيل",
        deliveryDelayed: "تأخر التوصيل",
        replacementRequested: "تم طلب الاستبدال",
        replacementApproved: "تمت الموافقة على الاستبدال",
        cancelled: "ملغي",
        language: "اللغة"
    },

    ur: {
        home: "ہوم",
        shop: "خریداری",
        categories: "اقسام",
        offers: "آفرز",
        myOrders: "میرے آرڈرز",
        cart: "کارٹ",
        login: "لاگ اِن",
        logout: "لاگ آؤٹ",
        search: "مصنوعات، برانڈز اور اقسام تلاش کریں...",
        searchResults: "تلاش کے نتائج",
        featuredProducts: "نمایاں مصنوعات",
        viewOptions: "اختیارات دیکھیں",
        addToCart: "کارٹ میں شامل کریں",
        checkout: "چیک آؤٹ",
        continueShopping: "خریداری جاری رکھیں",
        loading: "لوڈ ہو رہا ہے...",
        noProducts: "فی الحال کوئی مصنوعات دستیاب نہیں۔",
        customerReviews: "صارفین کے جائزے",
        submitReview: "جائزہ جمع کریں",
        customerOrders: "صارفین کے آرڈرز",
        refreshOrders: "آرڈرز ریفریش کریں",
        loadingOrders: "آرڈرز لوڈ ہو رہے ہیں...",
        noOrders: "کوئی آرڈر نہیں ملا۔",
        customerInformation: "صارف کی معلومات",
        products: "مصنوعات",
        payment: "ادائیگی",
        status: "حیثیت",
        pending: "زیرِ انتظار",
        processing: "زیرِ کارروائی",
        shipped: "بھیج دیا گیا",
        outForDelivery: "ترسیل کے لیے روانہ",
        delivered: "ڈیلیور ہو گیا",
        deliveryDelayed: "ترسیل میں تاخیر",
        replacementRequested: "تبدیلی کی درخواست",
        replacementApproved: "تبدیلی منظور",
        cancelled: "منسوخ",
        language: "زبان"
    },

    hi: {
        home: "होम",
        shop: "खरीदारी",
        categories: "श्रेणियाँ",
        offers: "ऑफ़र",
        myOrders: "मेरे ऑर्डर",
        cart: "कार्ट",
        login: "लॉग इन",
        logout: "लॉग आउट",
        search: "उत्पाद, ब्रांड और श्रेणियाँ खोजें...",
        searchResults: "खोज परिणाम",
        featuredProducts: "विशेष उत्पाद",
        viewOptions: "विकल्प देखें",
        addToCart: "कार्ट में जोड़ें",
        checkout: "चेकआउट",
        continueShopping: "खरीदारी जारी रखें",
        loading: "लोड हो रहा है...",
        noProducts: "अभी कोई उत्पाद उपलब्ध नहीं है।",
        customerReviews: "ग्राहक समीक्षाएँ",
        submitReview: "समीक्षा भेजें",
        customerOrders: "ग्राहक ऑर्डर",
        refreshOrders: "ऑर्डर रीफ़्रेश करें",
        loadingOrders: "ऑर्डर लोड हो रहे हैं...",
        noOrders: "कोई ऑर्डर नहीं मिला।",
        customerInformation: "ग्राहक की जानकारी",
        products: "उत्पाद",
        payment: "भुगतान",
        status: "स्थिति",
        pending: "लंबित",
        processing: "प्रक्रिया में",
        shipped: "भेज दिया गया",
        outForDelivery: "डिलीवरी के लिए निकला",
        delivered: "डिलीवर हो गया",
        deliveryDelayed: "डिलीवरी में देरी",
        replacementRequested: "बदलने का अनुरोध",
        replacementApproved: "बदलने की मंज़ूरी",
        cancelled: "रद्द",
        language: "भाषा"
    },

    bn: {
        home: "হোম",
        shop: "কেনাকাটা",
        categories: "বিভাগ",
        offers: "অফার",
        myOrders: "আমার অর্ডার",
        cart: "কার্ট",
        login: "লগইন",
        logout: "লগআউট",
        search: "পণ্য, ব্র্যান্ড ও বিভাগ খুঁজুন...",
        searchResults: "অনুসন্ধানের ফলাফল",
        featuredProducts: "বিশেষ পণ্য",
        viewOptions: "বিকল্প দেখুন",
        addToCart: "কার্টে যোগ করুন",
        checkout: "চেকআউট",
        continueShopping: "কেনাকাটা চালিয়ে যান",
        loading: "লোড হচ্ছে...",
        noProducts: "এই মুহূর্তে কোনো পণ্য উপলব্ধ নেই।",
        customerReviews: "গ্রাহকের পর্যালোচনা",
        submitReview: "পর্যালোচনা জমা দিন",
        customerOrders: "গ্রাহকের অর্ডার",
        refreshOrders: "অর্ডার রিফ্রেশ করুন",
        loadingOrders: "অর্ডার লোড হচ্ছে...",
        noOrders: "কোনো অর্ডার পাওয়া যায়নি।",
        customerInformation: "গ্রাহকের তথ্য",
        products: "পণ্য",
        payment: "পেমেন্ট",
        status: "অবস্থা",
        pending: "অপেক্ষমাণ",
        processing: "প্রক্রিয়াধীন",
        shipped: "পাঠানো হয়েছে",
        outForDelivery: "ডেলিভারির পথে",
        delivered: "ডেলিভারি সম্পন্ন",
        deliveryDelayed: "ডেলিভারিতে দেরি",
        replacementRequested: "পরিবর্তনের অনুরোধ",
        replacementApproved: "পরিবর্তন অনুমোদিত",
        cancelled: "বাতিল",
        language: "ভাষা"
    },

    fil: {
        home: "Home",
        shop: "Mamili",
        categories: "Mga Kategorya",
        offers: "Mga Alok",
        myOrders: "Aking Mga Order",
        cart: "Cart",
        login: "Mag-log in",
        logout: "Mag-log out",
        search: "Maghanap ng mga produkto, brand at kategorya...",
        searchResults: "Mga Resulta ng Paghahanap",
        featuredProducts: "Mga Tampok na Produkto",
        viewOptions: "Tingnan ang Mga Opsyon",
        addToCart: "Idagdag sa Cart",
        checkout: "Mag-checkout",
        continueShopping: "Magpatuloy sa Pamimili",
        loading: "Naglo-load...",
        noProducts: "Walang produktong available sa ngayon.",
        customerReviews: "Mga Review ng Customer",
        submitReview: "Isumite ang Review",
        customerOrders: "Mga Order ng Customer",
        refreshOrders: "I-refresh ang Mga Order",
        loadingOrders: "Naglo-load ng mga order...",
        noOrders: "Walang nahanap na order.",
        customerInformation: "Impormasyon ng Customer",
        products: "Mga Produkto",
        payment: "Bayad",
        status: "Status",
        pending: "Nakabinbin",
        processing: "Pinoproseso",
        shipped: "Naipadala na",
        outForDelivery: "Nasa delivery",
        delivered: "Na-deliver na",
        deliveryDelayed: "Naantala ang delivery",
        replacementRequested: "Humiling ng kapalit",
        replacementApproved: "Aprubado ang kapalit",
        cancelled: "Kinansela",
        language: "Wika"
    },

    id: {
        home: "Beranda",
        shop: "Belanja",
        categories: "Kategori",
        offers: "Promo",
        myOrders: "Pesanan Saya",
        cart: "Keranjang",
        login: "Masuk",
        logout: "Keluar",
        search: "Cari produk, merek, dan kategori...",
        searchResults: "Hasil Pencarian",
        featuredProducts: "Produk Unggulan",
        viewOptions: "Lihat Pilihan",
        addToCart: "Tambah ke Keranjang",
        checkout: "Checkout",
        continueShopping: "Lanjut Belanja",
        loading: "Memuat...",
        noProducts: "Belum ada produk yang tersedia.",
        customerReviews: "Ulasan Pelanggan",
        submitReview: "Kirim Ulasan",
        customerOrders: "Pesanan Pelanggan",
        refreshOrders: "Segarkan Pesanan",
        loadingOrders: "Memuat pesanan...",
        noOrders: "Pesanan tidak ditemukan.",
        customerInformation: "Informasi Pelanggan",
        products: "Produk",
        payment: "Pembayaran",
        status: "Status",
        pending: "Menunggu",
        processing: "Diproses",
        shipped: "Dikirim",
        outForDelivery: "Dalam Pengantaran",
        delivered: "Terkirim",
        deliveryDelayed: "Pengiriman Terlambat",
        replacementRequested: "Penggantian Diminta",
        replacementApproved: "Penggantian Disetujui",
        cancelled: "Dibatalkan",
        language: "Bahasa"
    },

    ml: {
        home: "ഹോം",
        shop: "ഷോപ്പ്",
        categories: "വിഭാഗങ്ങൾ",
        offers: "ഓഫറുകൾ",
        myOrders: "എന്റെ ഓർഡറുകൾ",
        cart: "കാർട്ട്",
        login: "ലോഗിൻ",
        logout: "ലോഗ്ഔട്ട്",
        search: "ഉൽപ്പന്നങ്ങളും ബ്രാൻഡുകളും വിഭാഗങ്ങളും തിരയുക...",
        searchResults: "തിരയൽ ഫലങ്ങൾ",
        featuredProducts: "തിരഞ്ഞെടുത്ത ഉൽപ്പന്നങ്ങൾ",
        viewOptions: "ഓപ്ഷനുകൾ കാണുക",
        addToCart: "കാർട്ടിലേക്ക് ചേർക്കുക",
        checkout: "ചെക്ക്ഔട്ട്",
        continueShopping: "ഷോപ്പിംഗ് തുടരുക",
        loading: "ലോഡ് ചെയ്യുന്നു...",
        noProducts: "ഇപ്പോൾ ഉൽപ്പന്നങ്ങളൊന്നും ലഭ്യമല്ല.",
        customerReviews: "ഉപഭോക്തൃ അവലോകനങ്ങൾ",
        submitReview: "അവലോകനം സമർപ്പിക്കുക",
        customerOrders: "ഉപഭോക്തൃ ഓർഡറുകൾ",
        refreshOrders: "ഓർഡറുകൾ പുതുക്കുക",
        loadingOrders: "ഓർഡറുകൾ ലോഡ് ചെയ്യുന്നു...",
        noOrders: "ഓർഡറുകളൊന്നും കണ്ടെത്തിയില്ല.",
        customerInformation: "ഉപഭോക്തൃ വിവരങ്ങൾ",
        products: "ഉൽപ്പന്നങ്ങൾ",
        payment: "പേയ്മെന്റ്",
        status: "നില",
        pending: "തീർപ്പുകാത്തിരിക്കുന്നു",
        processing: "പ്രോസസ്സ് ചെയ്യുന്നു",
        shipped: "അയച്ചു",
        outForDelivery: "വിതരണത്തിനായി പുറപ്പെട്ടു",
        delivered: "വിതരണം പൂർത്തിയായി",
        deliveryDelayed: "വിതരണം വൈകി",
        replacementRequested: "മാറ്റിസ്ഥാപിക്കൽ അഭ്യർത്ഥിച്ചു",
        replacementApproved: "മാറ്റിസ്ഥാപിക്കൽ അംഗീകരിച്ചു",
        cancelled: "റദ്ദാക്കി",
        language: "ഭാഷ"
    },

    ta: {
        home: "முகப்பு",
        shop: "கடை",
        categories: "வகைகள்",
        offers: "சலுகைகள்",
        myOrders: "எனது ஆர்டர்கள்",
        cart: "கூடை",
        login: "உள்நுழை",
        logout: "வெளியேறு",
        search: "பொருட்கள், பிராண்டுகள் மற்றும் வகைகளைத் தேடுங்கள்...",
        searchResults: "தேடல் முடிவுகள்",
        featuredProducts: "சிறப்பு தயாரிப்புகள்",
        viewOptions: "விருப்பங்களைக் காண்க",
        addToCart: "கூடையில் சேர்",
        checkout: "செக்அவுட்",
        continueShopping: "ஷாப்பிங்கைத் தொடரவும்",
        loading: "ஏற்றப்படுகிறது...",
        noProducts: "தற்போது தயாரிப்புகள் எதுவும் இல்லை.",
        customerReviews: "வாடிக்கையாளர் மதிப்புரைகள்",
        submitReview: "மதிப்புரையைச் சமர்ப்பிக்கவும்",
        customerOrders: "வாடிக்கையாளர் ஆர்டர்கள்",
        refreshOrders: "ஆர்டர்களைப் புதுப்பிக்கவும்",
        loadingOrders: "ஆர்டர்கள் ஏற்றப்படுகின்றன...",
        noOrders: "ஆர்டர்கள் எதுவும் கிடைக்கவில்லை.",
        customerInformation: "வாடிக்கையாளர் தகவல்",
        products: "தயாரிப்புகள்",
        payment: "கட்டணம்",
        status: "நிலை",
        pending: "நிலுவையில்",
        processing: "செயலாக்கத்தில்",
        shipped: "அனுப்பப்பட்டது",
        outForDelivery: "விநியோகத்தில் உள்ளது",
        delivered: "வழங்கப்பட்டது",
        deliveryDelayed: "விநியோகம் தாமதமானது",
        replacementRequested: "மாற்றம் கோரப்பட்டது",
        replacementApproved: "மாற்றம் அங்கீகரிக்கப்பட்டது",
        cancelled: "ரத்து செய்யப்பட்டது",
        language: "மொழி"
    },

    fr: {
        home: "Accueil",
        shop: "Boutique",
        categories: "Catégories",
        offers: "Offres",
        myOrders: "Mes commandes",
        cart: "Panier",
        login: "Connexion",
        logout: "Déconnexion",
        search: "Rechercher des produits, marques et catégories...",
        searchResults: "Résultats de recherche",
        featuredProducts: "Produits à la une",
        viewOptions: "Voir les options",
        addToCart: "Ajouter au panier",
        checkout: "Paiement",
        continueShopping: "Continuer les achats",
        loading: "Chargement...",
        noProducts: "Aucun produit disponible pour le moment.",
        customerReviews: "Avis clients",
        submitReview: "Envoyer l’avis",
        customerOrders: "Commandes clients",
        refreshOrders: "Actualiser les commandes",
        loadingOrders: "Chargement des commandes...",
        noOrders: "Aucune commande trouvée.",
        customerInformation: "Informations client",
        products: "Produits",
        payment: "Paiement",
        status: "Statut",
        pending: "En attente",
        processing: "En cours de traitement",
        shipped: "Expédiée",
        outForDelivery: "En cours de livraison",
        delivered: "Livrée",
        deliveryDelayed: "Livraison retardée",
        replacementRequested: "Remplacement demandé",
        replacementApproved: "Remplacement approuvé",
        cancelled: "Annulée",
        language: "Langue"
    }
};

const BARQ_LANGUAGE_STORAGE_KEY = "barqLanguage";

function barqGetLanguage() {
    try {
        const saved = localStorage.getItem(BARQ_LANGUAGE_STORAGE_KEY);
        return Object.hasOwn(BARQ_LANGUAGES, saved) ? saved : "en";
    } catch (error) {
        return "en";
    }
}

function barqTranslate(key, language = barqGetLanguage()) {
    return BARQ_TRANSLATIONS[language]?.[key]
        ?? BARQ_TRANSLATIONS.en[key]
        ?? key;
}

function barqApplyLanguage(language = barqGetLanguage()) {
    if (!Object.hasOwn(BARQ_LANGUAGES, language)) {
        language = "en";
    }

    const languageInfo = BARQ_LANGUAGES[language];

    document.documentElement.lang = language;
    document.documentElement.dir = languageInfo.dir;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.dataset.i18n;
        element.textContent = barqTranslate(key, language);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
        const key = element.dataset.i18nPlaceholder;
        element.placeholder = barqTranslate(key, language);
    });

    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
        const key = element.dataset.i18nTitle;
        element.title = barqTranslate(key, language);
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
        const key = element.dataset.i18nAriaLabel;
        element.setAttribute("aria-label", barqTranslate(key, language));
    });

    document.querySelectorAll("[data-barq-language-selector]").forEach((selector) => {
        if (selector.value !== language) {
            selector.value = language;
        }
    });

    document.dispatchEvent(
        new CustomEvent("barq:languageChanged", {
            detail: { language, direction: languageInfo.dir }
        })
    );
}

function barqSetLanguage(language) {
    if (!Object.hasOwn(BARQ_LANGUAGES, language)) {
        return;
    }

    try {
        localStorage.setItem(BARQ_LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
        console.warn("BARQ could not save the language preference.", error);
    }

    barqApplyLanguage(language);
}

function barqCreateLanguageSelector() {
    const wrapper = document.createElement("label");
    wrapper.className = "barq-language-control";
    wrapper.setAttribute("data-barq-language-control", "");

    const label = document.createElement("span");
    label.textContent = barqTranslate("language");
    label.className = "barq-language-label";

    const select = document.createElement("select");
    select.setAttribute("data-barq-language-selector", "");
    select.setAttribute("aria-label", barqTranslate("language"));

    Object.entries(BARQ_LANGUAGES).forEach(([code, info]) => {
        const option = document.createElement("option");
        option.value = code;
        option.textContent = info.name;
        select.appendChild(option);
    });

    select.value = barqGetLanguage();
    select.addEventListener("change", () => barqSetLanguage(select.value));

    wrapper.append(label, select);
    return wrapper;
}

/*
  This function adds the selector only when called by a page.
  The next step will connect it to the storefront header.
*/
function barqMountLanguageSelector(container) {
    if (!container) {
        console.warn("BARQ language selector container was not found.");
        return;
    }

    if (container.querySelector("[data-barq-language-control]")) {
        return;
    }

    container.appendChild(barqCreateLanguageSelector());
    barqApplyLanguage();
}

window.BARQ_LANGUAGES = BARQ_LANGUAGES;
window.barqTranslate = barqTranslate;
window.barqApplyLanguage = barqApplyLanguage;
window.barqSetLanguage = barqSetLanguage;
window.barqMountLanguageSelector = barqMountLanguageSelector;

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        () => barqApplyLanguage(),
        { once: true }
    );
} else {
    barqApplyLanguage();
}
