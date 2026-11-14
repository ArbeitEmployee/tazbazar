require("dotenv").config();
const mongoose = require("mongoose");

const Category = require("../src/models/Category");
const Brand = require("../src/models/Brand");
const Product = require("../src/models/Product");
const Banner = require("../src/models/Banner");
const Coupon = require("../src/models/Coupon");
const Campaign = require("../src/models/Campaign");
const User = require("../src/models/User");

// High-resolution curated Unsplash fashion images
const FASHION_IMAGES = {
  // Women Categories & Products
  saree: [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
  ],
  salwar: [
    "https://images.unsplash.com/photo-1583391733975-00c737d97607?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
  ],
  kurti: [
    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
  ],
  lehenga: [
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
  ],
  abaya: [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80",
  ],
  womenWestern: [
    "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
  ],
  // Men Categories & Products
  panjabi: [
    "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
  ],
  menShirt: [
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1620012253295-c15c429fbfb8?auto=format&fit=crop&w=800&q=80",
  ],
  menTshirt: [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80",
  ],
  menPants: [
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80",
  ],
  winterWear: [
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
  ],
  accessories: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
  ],
  banners: {
    hero1: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85",
    hero2: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=85",
    hero3: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=85",
    promoOffer: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",
    campaign: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=85",
  },
};

async function seedFashionData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    const admin =
      (await User.findOne({ email: "mehekmart1@gmail.com" })) ||
      (await User.findOne({ email: "admin@gmail.com" })) ||
      (await User.findOne({ userType: "admin" }));

    if (!admin) {
      throw new Error("No admin found. Run seed:admin first.");
    }
    console.log(`Using admin: ${admin.email}`);

    // Clean existing catalog data
    console.log("Purging old catalog items (products, categories, brands, banners)...");
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    await Banner.deleteMany({});
    await Coupon.deleteMany({});
    await Campaign.deleteMany({});
    console.log("Old catalog purged.");

    // ==========================================
    // 1. FASHION CATEGORIES (Men & Women Only)
    // ==========================================
    const categoriesData = [
      {
        name: "Saree Collection",
        type: "Popular",
        description: "Jamdani, Katan, Silk, Cotton & Georgette sarees for all occasions.",
        image: FASHION_IMAGES.saree[0],
      },
      {
        name: "Three-Piece & Salwar",
        type: "Popular",
        description: "Premium lawn, embroidered and cotton three-piece suits for women.",
        image: FASHION_IMAGES.salwar[0],
      },
      {
        name: "Women's Kurti & Tops",
        type: "Best Selling",
        description: "Trendy everyday and party wear kurtis, tunics and tops.",
        image: FASHION_IMAGES.kurti[0],
      },
      {
        name: "Abaya & Borka Collection",
        type: "Best Selling",
        description: "Elegant abayas, cherry hijabs and modest Islamic fashion wear.",
        image: FASHION_IMAGES.abaya[0],
      },
      {
        name: "Lehenga & Party Gowns",
        type: "Hot deals",
        description: "Exclusive bridal lehengas, evening party gowns and festive wear.",
        image: FASHION_IMAGES.lehenga[0],
      },
      {
        name: "Men's Panjabi & Ethnic",
        type: "Popular",
        description: "Kabli sets, semi-fitted and premium embroidered panjabis for men.",
        image: FASHION_IMAGES.panjabi[0],
      },
      {
        name: "Men's Casual & Formal Shirts",
        type: "General",
        description: "Executive formal shirts, cotton prints and casual linen shirts.",
        image: FASHION_IMAGES.menShirt[0],
      },
      {
        name: "Men's T-Shirts & Polos",
        type: "General",
        description: "Premium combed cotton t-shirts, drop shoulder & pique polo shirts.",
        image: FASHION_IMAGES.menTshirt[0],
      },
      {
        name: "Men's Denim & Trousers",
        type: "General",
        description: "Stretch denim jeans, chinos, twill pants and formal trousers.",
        image: FASHION_IMAGES.menPants[0],
      },
      {
        name: "Winter Fashion & Hoodies",
        type: "Latest",
        description: "Heavyweight hoodies, denim jackets, blazers and winter cardigans.",
        image: FASHION_IMAGES.winterWear[0],
      },
      {
        name: "Footwear & Fashion Accessories",
        type: "Latest",
        description: "Pure leather loafers, ladies handbags, heels and lifestyle items.",
        image: FASHION_IMAGES.accessories[0],
      },
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const createdCat = await Category.create(cat);
      categoryMap[cat.name] = createdCat;
      console.log(`Created Category: ${cat.name}`);
    }

    // ==========================================
    // 2. FASHION BRANDS
    // ==========================================
    const brandsData = [
      { name: "Mehek Signature", slug: "mehek-signature", logo: FASHION_IMAGES.saree[1] },
      { name: "Deshi Rang", slug: "deshi-rang", logo: FASHION_IMAGES.salwar[1] },
      { name: "Urban Attire", slug: "urban-attire", logo: FASHION_IMAGES.panjabi[1] },
      { name: "Aura Hijab", slug: "aura-hijab", logo: FASHION_IMAGES.abaya[1] },
      { name: "Vogue Men", slug: "vogue-men", logo: FASHION_IMAGES.menShirt[1] },
    ];

    const brandMap = {};
    for (const b of brandsData) {
      const createdBrand = await Brand.create({
        name: b.name,
        slug: b.slug,
        description: `Premium authentic fashion collection by ${b.name}`,
        logoUrl: b.logo,
        createdBy: admin._id,
      });
      brandMap[b.name] = createdBrand;
      console.log(`Created Brand: ${b.name}`);
    }

    // ==========================================
    // 3. 100% FASHION PRODUCTS (Men & Women)
    // ==========================================
    const productsData = [
      // Saree
      {
        title: "Dhakai Jamdani Saree - Royal Crimson Red",
        category: "Saree Collection",
        brand: "Mehek Signature",
        price: 4800,
        salePrice: 3850,
        productType: "Best Selling",
        stock: 30,
        image: FASHION_IMAGES.saree[0],
        description: "Authentic hand-woven Dhakai Jamdani saree crafted with high-count cotton thread. Intricate floral golden zari motifs across the body and heavy aanchol. Perfect for weddings and grand festive celebrations.",
      },
      {
        title: "Pure Silk Katan Saree - Midnight Blue & Zari",
        category: "Saree Collection",
        brand: "Deshi Rang",
        price: 6500,
        salePrice: 5200,
        productType: "Popular",
        stock: 20,
        image: FASHION_IMAGES.saree[1],
        description: "Luxurious soft silk katan saree with heavy traditional zari work. Vibrant midnight blue paired with golden border. Includes unstitched matching blouse piece.",
      },
      {
        title: "Hand Block Printed Cotton Saree",
        category: "Saree Collection",
        brand: "Deshi Rang",
        price: 1850,
        salePrice: 1450,
        productType: "General",
        stock: 45,
        image: FASHION_IMAGES.saree[2],
        description: "100% breathable organic cotton saree featuring handcrafted block prints. Soft on skin, easy to drape and ideal for comfortable everyday and office wear.",
      },
      {
        title: "Designer Georgette Party Saree with Embroidery",
        category: "Saree Collection",
        brand: "Mehek Signature",
        price: 3800,
        salePrice: 2990,
        productType: "Hot deals",
        stock: 25,
        image: FASHION_IMAGES.saree[3],
        description: "Lightweight premium georgette fabric adorned with delicate cutwork and pearl embellishments. Beautiful flowing drape.",
      },

      // Three-Piece & Salwar
      {
        title: "Premium Embroidered Lawn Three-Piece - Pastel Mint",
        category: "Three-Piece & Salwar",
        brand: "Deshi Rang",
        price: 2650,
        salePrice: 2190,
        productType: "Best Selling",
        stock: 50,
        image: FASHION_IMAGES.salwar[0],
        description: "Pure cotton lawn shirt with exquisite neckline thread embroidery. Paired with digital printed chiffon dupatta and comfortable dyed cotton trousers.",
      },
      {
        title: "Luxury Georgette Party Three-Piece Suit",
        category: "Three-Piece & Salwar",
        brand: "Mehek Signature",
        price: 3950,
        salePrice: 3200,
        productType: "Popular",
        stock: 35,
        image: FASHION_IMAGES.salwar[1],
        description: "Heavy sequence and thread embroidered georgette kameez with inner lining, paired with santoon trouser and heavy work dupatta.",
      },
      {
        title: "Daily Comfort Block Print Cotton Three-Piece",
        category: "Three-Piece & Salwar",
        brand: "Deshi Rang",
        price: 1650,
        salePrice: 1290,
        productType: "General",
        stock: 60,
        image: FASHION_IMAGES.salwar[2],
        description: "100% pure cotton voile fabric with colorfast natural dyes. Soft, breathable, and designed for summer comfort.",
      },

      // Kurti & Tops
      {
        title: "Floral Printed Long A-Line Kurti",
        category: "Women's Kurti & Tops",
        brand: "Deshi Rang",
        price: 1250,
        salePrice: 950,
        productType: "Best Selling",
        stock: 75,
        image: FASHION_IMAGES.kurti[0],
        description: "Elegant A-line floral print kurti in rayon cotton fabric. Mandarin collar with stylish button detailing on the front placket.",
      },
      {
        title: "Modern Fusion Peplum Top for Women",
        category: "Women's Kurti & Tops",
        brand: "Mehek Signature",
        price: 1100,
        salePrice: 850,
        productType: "Latest",
        stock: 40,
        image: FASHION_IMAGES.kurti[1],
        description: "Trendy peplum silhouette with flared hemline. Looks effortlessly chic with jeans or palazzos for smart casual outings.",
      },
      {
        title: "Embroidered Straight Cut Silk Kurti",
        category: "Women's Kurti & Tops",
        brand: "Mehek Signature",
        price: 1850,
        salePrice: 1490,
        productType: "Popular",
        stock: 35,
        image: FASHION_IMAGES.kurti[2],
        description: "Soft art silk kurti with delicate gold zari accents around the cuffs and neck. Perfect for semi-formal dinner parties.",
      },

      // Abaya & Hijab
      {
        title: "Premium Dubai Cherry Fabric Black Abaya",
        category: "Abaya & Borka Collection",
        brand: "Aura Hijab",
        price: 2950,
        salePrice: 2350,
        productType: "Best Selling",
        stock: 40,
        image: FASHION_IMAGES.abaya[0],
        description: "Crafted from original Dubai cherry georgette. Front open zipper style with modest flared cut, comfortable elastic sleeves, and included matching hijab.",
      },
      {
        title: "Georgette Chiffon Hijab (3pcs Multi-Color Combo)",
        category: "Abaya & Borka Collection",
        brand: "Aura Hijab",
        price: 850,
        salePrice: 650,
        productType: "Popular",
        stock: 120,
        image: FASHION_IMAGES.abaya[1],
        description: "Set of 3 breathable premium georgette hijabs in versatile neutral pastel tones. Non-slip texture, standard large coverage (72x30 inches).",
      },

      // Lehenga & Gown
      {
        title: "Royal Crimson Bridal Velvet Lehenga Choli",
        category: "Lehenga & Party Gowns",
        brand: "Mehek Signature",
        price: 12500,
        salePrice: 9800,
        productType: "Hot deals",
        stock: 10,
        image: FASHION_IMAGES.lehenga[0],
        description: "Exquisite micro velvet lehenga with heavy antique gold dori, sequence and zardozi craftsmanship. Features voluminous can-can flare.",
      },
      {
        title: "Flared Net Party Gown with Stone Work",
        category: "Lehenga & Party Gowns",
        brand: "Mehek Signature",
        price: 5800,
        salePrice: 4600,
        productType: "Latest",
        stock: 15,
        image: FASHION_IMAGES.lehenga[1],
        description: "Full flare designer evening gown in soft net fabric. Embellished with shimmering stones and mirror work.",
      },

      // Men's Panjabi
      {
        title: "Men's Premium Cotton Embroidered Panjabi - White",
        category: "Men's Panjabi & Ethnic",
        brand: "Urban Attire",
        price: 2450,
        salePrice: 1890,
        productType: "Best Selling",
        stock: 65,
        image: FASHION_IMAGES.panjabi[0],
        description: "Tailored from 100% fine Egyptian combed cotton. Features minimal tonal embroidery on the mandarin collar and cuffs. Ideal for Eid and Juma prayers.",
      },
      {
        title: "Semi-Fitted Jacquard Silk Panjabi - Royal Navy",
        category: "Men's Panjabi & Ethnic",
        brand: "Urban Attire",
        price: 2850,
        salePrice: 2250,
        productType: "Popular",
        stock: 50,
        image: FASHION_IMAGES.panjabi[1],
        description: "Woven in luxury self-jacquard silk fabric. Deep navy blue with custom metallic buttons and a modern slim-fit silhouette.",
      },
      {
        title: "Men's Kabli Suit Set (Panjabi & Payjama) - Olive Green",
        category: "Men's Panjabi & Ethnic",
        brand: "Urban Attire",
        price: 3200,
        salePrice: 2600,
        productType: "Latest",
        stock: 40,
        image: FASHION_IMAGES.panjabi[2],
        description: "Classic Afghan style kabli suit featuring double flap chest pockets, epaulettes, and matching salwar payjama in rich olive cotton.",
      },

      // Men's Shirts
      {
        title: "Executive Formal Cotton Shirt - Crisp Sky Blue",
        category: "Men's Casual & Formal Shirts",
        brand: "Vogue Men",
        price: 1650,
        salePrice: 1290,
        productType: "Best Selling",
        stock: 80,
        image: FASHION_IMAGES.menShirt[0],
        description: "100% wrinkle-resistant twill cotton with a refined spread collar. Perfect fit for professional office and business meetings.",
      },
      {
        title: "Men's Casual Checkered Cotton Shirt",
        category: "Men's Casual & Formal Shirts",
        brand: "Vogue Men",
        price: 1350,
        salePrice: 990,
        productType: "General",
        stock: 70,
        image: FASHION_IMAGES.menShirt[1],
        description: "Breathable pure cotton flannel check shirt with dual button cuffs. Classic casual style for weekends and hangouts.",
      },
      {
        title: "Men's Plain Oxford Casual Shirt - White",
        category: "Men's Casual & Formal Shirts",
        brand: "Vogue Men",
        price: 1450,
        salePrice: 1150,
        productType: "Popular",
        stock: 90,
        image: FASHION_IMAGES.menShirt[2],
        description: "Timeless Oxford weave cotton shirt with button-down collar and chest pocket. Highly versatile wardrobe essential.",
      },

      // Men's T-Shirts
      {
        title: "Men's Drop Shoulder Heavyweight T-Shirt (220 GSM)",
        category: "Men's T-Shirts & Polos",
        brand: "Urban Attire",
        price: 750,
        salePrice: 590,
        productType: "Best Selling",
        stock: 150,
        image: FASHION_IMAGES.menTshirt[0],
        description: "Ultra-comfortable 100% compact combed cotton in 220 GSM. Relaxed oversized drop shoulder streetwear fit.",
      },
      {
        title: "Men's Solid Pique Cotton Polo Shirt - Forest Green",
        category: "Men's T-Shirts & Polos",
        brand: "Vogue Men",
        price: 890,
        salePrice: 690,
        productType: "Popular",
        stock: 110,
        image: FASHION_IMAGES.menTshirt[1],
        description: "Classic pique weave polo with ribbed collar and double-button placket. Durable, breathable, and colorfast.",
      },
      {
        title: "Men's Graphic Printed Tee - Urban Aesthetic",
        category: "Men's T-Shirts & Polos",
        brand: "Urban Attire",
        price: 650,
        salePrice: 480,
        productType: "Hot deals",
        stock: 130,
        image: FASHION_IMAGES.menTshirt[2],
        description: "High-density screen print on soft 180 GSM cotton fabric. Vibrant graphic detailing that resists fading.",
      },

      // Men's Pants
      {
        title: "Men's Stretch Slim Fit Denim Jeans - Dark Indigo",
        category: "Men's Denim & Trousers",
        brand: "Urban Attire",
        price: 1850,
        salePrice: 1450,
        productType: "Best Selling",
        stock: 85,
        image: FASHION_IMAGES.menPants[0],
        description: "Premium ring-spun cotton blended with 2% elastane for flexible comfort. Durable YKK zipper with branded rivets.",
      },
      {
        title: "Men's Flat Front Cotton Chino Pants - Khaki",
        category: "Men's Denim & Trousers",
        brand: "Vogue Men",
        price: 1550,
        salePrice: 1250,
        productType: "Popular",
        stock: 60,
        image: FASHION_IMAGES.menPants[1],
        description: "Super-combed cotton twill chinos with deep side pockets. Clean tailored look that transitions from work to evening dinner.",
      },
      {
        title: "Men's Relaxed Fit Cargo Trousers - Olive",
        category: "Men's Denim & Trousers",
        brand: "Urban Attire",
        price: 1650,
        salePrice: 1350,
        productType: "Latest",
        stock: 45,
        image: FASHION_IMAGES.menPants[2],
        description: "Durable ripstop cotton fabric with 6 functional utility cargo pockets and elasticated drawcord hem.",
      },

      // Winter Fashion
      {
        title: "Unisex Heavy Fleece Pullover Hoodie - Charcoal",
        category: "Winter Fashion & Hoodies",
        brand: "Urban Attire",
        price: 1650,
        salePrice: 1290,
        productType: "Popular",
        stock: 70,
        image: FASHION_IMAGES.winterWear[0],
        description: "320 GSM premium brushed fleece inside for superior warmth. Double-lined hood with metal eyelets and front kangaroo pocket.",
      },
      {
        title: "Men's Classic Denim Jacket with Warm Sherpa Lining",
        category: "Winter Fashion & Hoodies",
        brand: "Vogue Men",
        price: 2850,
        salePrice: 2290,
        productType: "Hot deals",
        stock: 35,
        image: FASHION_IMAGES.winterWear[1],
        description: "Sturdy stone-washed denim exterior with plush cozy sherpa lining on collar and body. Timeless vintage silhouette.",
      },

      // Accessories
      {
        title: "Men's Handcrafted Genuine Leather Loafers",
        category: "Footwear & Fashion Accessories",
        brand: "Vogue Men",
        price: 3200,
        salePrice: 2550,
        productType: "Best Selling",
        stock: 40,
        image: FASHION_IMAGES.accessories[2],
        description: "100% genuine calf leather upper with cushioned memory foam insole and anti-slip rubber outsole.",
      },
      {
        title: "Women's Elegant Leatherette Handbag with Shoulder Strap",
        category: "Footwear & Fashion Accessories",
        brand: "Mehek Signature",
        price: 2100,
        salePrice: 1650,
        productType: "Popular",
        stock: 55,
        image: FASHION_IMAGES.accessories[0],
        description: "Structured ladies tote bag with gold-tone hardware, multiple zipper compartments, and detachable shoulder strap.",
      },
    ];

    let prodIndex = 1;
    for (const p of productsData) {
      const catObj = categoryMap[p.category];
      const brandObj = brandMap[p.brand];

      await Product.create({
        title: p.title,
        description: p.description,
        price: p.price,
        salePrice: p.salePrice || null,
        priceType: p.salePrice ? "best" : "single",
        category: catObj?._id,
        productType: p.productType,
        brand: p.brand,
        stock: p.stock,
        sku: `MHK-FSH-${String(prodIndex).padStart(4, "0")}`,
        features: [
          "100% Authentic Quality",
          "Fast Home Delivery Across Bangladesh",
          "Cash On Delivery (COD) Available",
          "7 Days Easy Return & Exchange",
        ],
        images: [
          {
            url: p.image,
            publicId: "",
            mimeType: "image/jpeg",
          },
        ],
        isActive: true,
        publicationStatus: "published",
        approvalStatus: "approved",
        ratingAverage: Number((4.5 + (prodIndex % 5) * 0.1).toFixed(1)),
        ratingCount: 15 + prodIndex * 3,
        viewCount: 120 + prodIndex * 28,
      });
      console.log(`Created Product [${prodIndex}]: ${p.title}`);
      prodIndex++;
    }

    // ==========================================
    // 4. FASHION BANNERS (Hero & Promotional)
    // ==========================================
    const heroBanners = [
      {
        title: "Exclusive Eid & Festive Fashion 2026",
        description: "Discover handcrafted Jamdani sarees, premium Panjabis & designer Three-Piece collections.",
        buttonLabel: "Shop Collection",
        buttonLink: "/shop",
        type: "hero",
        page: "home",
        image: FASHION_IMAGES.banners.hero1,
        isActive: true,
      },
      {
        title: "Royal Silk & Saree Fest - Flat 30% Off",
        description: "Traditional heritage sarees woven with pure zari for the grandest wedding look.",
        buttonLabel: "Explore Sarees",
        buttonLink: "/shop",
        type: "hero",
        page: "home",
        image: FASHION_IMAGES.banners.hero2,
        isActive: true,
      },
      {
        title: "Men's Luxury Panjabi & Ethnic Wear",
        description: "Elevate your Eid celebration with handcrafted embroidered panjabis and kabli sets.",
        buttonLabel: "Shop Men's Ethnic",
        buttonLink: "/shop",
        type: "hero",
        page: "home",
        image: FASHION_IMAGES.banners.hero3,
        isActive: true,
      },
    ];

    for (const b of heroBanners) {
      await Banner.create(b);
      console.log(`Created Hero Banner: ${b.title}`);
    }

    // Single Full-Height Offer Banner
    const promoBanner = {
      title: "Trending Men & Women Casuals",
      description: "Trendy Denim, Shirts, Kurtis & Hoodies with up to 40% discount!",
      buttonLabel: "Grab Offer",
      buttonLink: "/shop",
      type: "promotional",
      page: "home",
      image: FASHION_IMAGES.banners.promoOffer,
      isActive: true,
    };
    await Banner.create(promoBanner);
    console.log(`Created Promotional Offer Banner: ${promoBanner.title}`);

    // ==========================================
    // 5. COUPONS & CAMPAIGN
    // ==========================================
    const coupons = [
      {
        code: "FASHION20",
        discountType: "percentage",
        discountValue: 20,
        maxDiscount: 500,
        minPurchase: 1000,
        validUntil: new Date(Date.now() + 180 * 24 * 3600 * 1000),
        usageLimit: 5000,
        createdBy: admin._id,
      },
      {
        code: "EID300",
        discountType: "fixed",
        discountValue: 300,
        minPurchase: 2500,
        validUntil: new Date(Date.now() + 180 * 24 * 3600 * 1000),
        usageLimit: 3000,
        createdBy: admin._id,
      },
      {
        code: "FREESHIP",
        discountType: "fixed",
        offerType: "free_shipping",
        discountValue: 80,
        minPurchase: 1200,
        validUntil: new Date(Date.now() + 180 * 24 * 3600 * 1000),
        usageLimit: 10000,
        createdBy: admin._id,
      },
    ];

    for (const c of coupons) {
      await Coupon.create(c);
      console.log(`Created Coupon: ${c.code}`);
    }

    await Campaign.create({
      title: "Eid Mega Fashion Festival 2026",
      slug: "eid-fashion-festival",
      description: "Biggest fashion festival with flat discounts on Saree, Panjabi, Salwar, and Men's Wear.",
      bannerImage: FASHION_IMAGES.banners.campaign,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 3600 * 1000),
      discountPercentage: 25,
      isActive: true,
      createdBy: admin._id,
    });
    console.log("Created Campaign: Eid Mega Fashion Festival 2026");

    console.log("\n==========================================");
    console.log("✅ 100% PURE FASHION DEMO SEED COMPLETED!");
    console.log(`- Categories: ${categoriesData.length}`);
    console.log(`- Brands    : ${brandsData.length}`);
    console.log(`- Products  : ${productsData.length}`);
    console.log(`- Banners   : ${heroBanners.length + 1}`);
    console.log(`- Coupons   : ${coupons.length}`);
    console.log("==========================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding fashion demo data:", error);
    process.exit(1);
  }
}

seedFashionData();
