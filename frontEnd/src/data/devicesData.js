// Sanitized device models database - containing only authentic, real-world existing models.

const generateAppleModels = () => {
  return {
    "iPhones (Latest)": [
      "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
      "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
      "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13 mini", "iPhone 13"
    ],
    "iPhones (Legacy)": [
      "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12 mini", "iPhone 12",
      "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
      "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
      "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7",
      "iPhone SE (3rd Gen)", "iPhone SE (2nd Gen)", "iPhone SE (1st Gen)",
      "iPhone 6s Plus", "iPhone 6s", "iPhone 6 Plus", "iPhone 6",
      "iPhone 5s", "iPhone 5c", "iPhone 5", "iPhone 4s", "iPhone 4"
    ],
    "iPads": [
      "iPad Pro 12.9 (6th Gen)", "iPad Pro 12.9 (5th Gen)", "iPad Pro 12.9 (4th Gen)",
      "iPad Pro 11 (4th Gen)", "iPad Pro 11 (3rd Gen)", "iPad Pro 10.5",
      "iPad Air (5th Gen)", "iPad Air (4th Gen)", "iPad Air (3rd Gen)",
      "iPad mini (6th Gen)", "iPad mini (5th Gen)", "iPad mini (4th Gen)",
      "iPad (10th Gen)", "iPad (9th Gen)", "iPad (8th Gen)"
    ],
    "Apple Watches": [
      "Apple Watch Ultra 2", "Apple Watch Ultra", "Apple Watch Series 9", "Apple Watch Series 8",
      "Apple Watch Series 7", "Apple Watch Series 6", "Apple Watch Series 5", "Apple Watch Series 4",
      "Apple Watch Series 3", "Apple Watch SE (2nd Gen)", "Apple Watch SE"
    ]
  };
};

const generateSamsungModels = () => {
  return {
    "Galaxy S Series": [
      "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S24 FE",
      "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S23 FE",
      "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22",
      "Galaxy S21 Ultra", "Galaxy S21+", "Galaxy S21", "Galaxy S21 FE",
      "Galaxy S20 Ultra", "Galaxy S20+", "Galaxy S20", "Galaxy S20 FE",
      "Galaxy S10+", "Galaxy S10", "Galaxy S10e", "Galaxy S10 Lite",
      "Galaxy S9+", "Galaxy S9", "Galaxy S8+", "Galaxy S8", "Galaxy S7 Edge", "Galaxy S7",
      "Galaxy S6 Edge+", "Galaxy S6 Edge", "Galaxy S6", "Galaxy S5", "Galaxy S4", "Galaxy S3"
    ],
    "Galaxy Note Series": [
      "Galaxy Note 20 Ultra", "Galaxy Note 20",
      "Galaxy Note 10+", "Galaxy Note 10", "Galaxy Note 10 Lite",
      "Galaxy Note 9", "Galaxy Note 8", "Galaxy Note 5", "Galaxy Note 4", "Galaxy Note 3"
    ],
    "Galaxy Z Series (Fold & Flip)": [
      "Galaxy Z Fold 5", "Galaxy Z Flip 5",
      "Galaxy Z Fold 4", "Galaxy Z Flip 4",
      "Galaxy Z Fold 3", "Galaxy Z Flip 3",
      "Galaxy Z Fold 2", "Galaxy Z Flip 5G", "Galaxy Z Flip", "Galaxy Fold"
    ],
    "Galaxy A Series": [
      "Galaxy A55", "Galaxy A54", "Galaxy A53", "Galaxy A52s", "Galaxy A52", "Galaxy A51", "Galaxy A50",
      "Galaxy A35", "Galaxy A34", "Galaxy A33", "Galaxy A32", "Galaxy A31", "Galaxy A30",
      "Galaxy A25", "Galaxy A24", "Galaxy A23", "Galaxy A22", "Galaxy A21s", "Galaxy A20",
      "Galaxy A15", "Galaxy A14", "Galaxy A13", "Galaxy A12", "Galaxy A11", "Galaxy A10s", "Galaxy A10",
      "Galaxy A05s", "Galaxy A05", "Galaxy A04s", "Galaxy A04", "Galaxy A03s", "Galaxy A03",
      "Galaxy A02s", "Galaxy A02", "Galaxy A01"
    ],
    "Galaxy J Series": [
      "Galaxy J8", "Galaxy J7 Pro", "Galaxy J7 Max", "Galaxy J7 Neo", "Galaxy J7 Duo",
      "Galaxy J6+", "Galaxy J6", "Galaxy J5 (2017)",
      "Galaxy J4+", "Galaxy J4", "Galaxy J3 Pro", "Galaxy J3 (2018)",
      "Galaxy J2 Pro", "Galaxy J2 Core", "Galaxy J1 Ace", "Galaxy J1 mini"
    ],
    "Galaxy M Series": [
      "Galaxy M55", "Galaxy M54", "Galaxy M53", "Galaxy M52", "Galaxy M51",
      "Galaxy M35", "Galaxy M34", "Galaxy M33", "Galaxy M32", "Galaxy M31s", "Galaxy M31",
      "Galaxy M23", "Galaxy M22", "Galaxy M21", "Galaxy M15", "Galaxy M14", "Galaxy M13",
      "Galaxy M12", "Galaxy M11", "Galaxy M04"
    ],
    "Galaxy Tab Series (Tablets)": [
      "Galaxy Tab S9 Ultra", "Galaxy Tab S9+", "Galaxy Tab S9", "Galaxy Tab S9 FE",
      "Galaxy Tab S8 Ultra", "Galaxy Tab S8+", "Galaxy Tab S8",
      "Galaxy Tab S7+", "Galaxy Tab S7", "Galaxy Tab S6 Lite",
      "Galaxy Tab A9+", "Galaxy Tab A9", "Galaxy Tab A8", "Galaxy Tab A7 Lite"
    ]
  };
};

const generateGoogleModels = () => {
  return {
    "Pixel Phones (Latest)": [
      "Pixel 9 Pro XL", "Pixel 9 Pro", "Pixel 9", "Pixel 9 Pro Fold",
      "Pixel 8 Pro", "Pixel 8", "Pixel 8a", "Pixel Fold",
      "Pixel 7 Pro", "Pixel 7", "Pixel 7a",
      "Pixel 6 Pro", "Pixel 6", "Pixel 6a"
    ],
    "Pixel Phones (Legacy)": [
      "Pixel 5a", "Pixel 5", "Pixel 4a (5G)", "Pixel 4a", "Pixel 4 XL", "Pixel 4",
      "Pixel 3a XL", "Pixel 3a", "Pixel 3 XL", "Pixel 3", "Pixel 2 XL", "Pixel 2",
      "Pixel XL", "Pixel"
    ],
    "Pixel Wearables & Tablets": [
      "Pixel Watch 3", "Pixel Watch 2", "Pixel Watch", "Pixel Tablet"
    ],
    "Nexus Devices": [
      "Nexus 6P", "Nexus 5X", "Nexus 6", "Nexus 5", "Nexus 4", "Nexus 7", "Nexus 9"
    ]
  };
};

const generateXiaomiModels = () => {
  return {
    "Xiaomi Mi & T Series": [
      "Xiaomi 14 Ultra", "Xiaomi 14",
      "Xiaomi 13 Ultra", "Xiaomi 13 Pro", "Xiaomi 13", "Xiaomi 13 Lite",
      "Xiaomi 12T Pro", "Xiaomi 12T", "Xiaomi 12 Pro", "Xiaomi 12", "Xiaomi 12 Lite",
      "Xiaomi 11T Pro", "Xiaomi 11T", "Xiaomi 11 Lite 5G NE",
      "Xiaomi Mi 11 Ultra", "Xiaomi Mi 11 Pro", "Xiaomi Mi 11",
      "Xiaomi Mi 10T Pro", "Xiaomi Mi 10T", "Xiaomi Mi 10 Pro", "Xiaomi Mi 10",
      "Xiaomi Mi 9T Pro", "Xiaomi Mi 9T", "Xiaomi Mi 9"
    ],
    "Redmi Note Series": [
      "Redmi Note 13 Pro+ 5G", "Redmi Note 13 Pro 5G", "Redmi Note 13 Pro 4G", "Redmi Note 13 5G", "Redmi Note 13 4G",
      "Redmi Note 12 Pro+ 5G", "Redmi Note 12 Pro 5G", "Redmi Note 12S", "Redmi Note 12 5G", "Redmi Note 12 4G",
      "Redmi Note 11 Pro+ 5G", "Redmi Note 11 Pro 5G", "Redmi Note 11 Pro 4G", "Redmi Note 11S", "Redmi Note 11",
      "Redmi Note 10 Pro", "Redmi Note 10S", "Redmi Note 10 5G", "Redmi Note 10",
      "Redmi Note 9 Pro", "Redmi Note 9S", "Redmi Note 9",
      "Redmi Note 8 Pro", "Redmi Note 8T", "Redmi Note 8", "Redmi Note 7"
    ],
    "Redmi Numeric & Go Series": [
      "Redmi 13C", "Redmi 13", "Redmi 12C", "Redmi 12", "Redmi 10C", "Redmi 10",
      "Redmi 9C", "Redmi 9A", "Redmi 9", "Redmi 8A", "Redmi 8", "Redmi A3", "Redmi A2", "Redmi A1"
    ],
    "Poco Series (F, X, M)": [
      "Poco F6 Pro", "Poco F6", "Poco X6 Pro", "Poco X6", "Poco M6 Pro", "Poco M6",
      "Poco F5 Pro", "Poco F5", "Poco X5 Pro", "Poco X5", "Poco M5s", "Poco M5",
      "Poco F4 GT", "Poco F4", "Poco X4 GT", "Poco X4 Pro 5G", "Poco M4 Pro",
      "Poco F3", "Poco X3 Pro", "Poco X3 NFC", "Poco M3 Pro 5G"
    ]
  };
};

const generateHuaweiModels = () => {
  return {
    "Mate Series": [
      "Huawei Mate 60 Pro+", "Huawei Mate 60 Pro", "Huawei Mate 60", "Huawei Mate X5",
      "Huawei Mate 50 Pro", "Huawei Mate 50", "Huawei Mate Xs 2",
      "Huawei Mate 40 Pro+", "Huawei Mate 40 Pro", "Huawei Mate 40",
      "Huawei Mate 30 Pro", "Huawei Mate 30",
      "Huawei Mate 20 Pro", "Huawei Mate 20", "Huawei Mate 20 Lite",
      "Huawei Mate 10 Pro", "Huawei Mate 10"
    ],
    "P & Pura Series": [
      "Huawei Pura 70 Ultra", "Huawei Pura 70 Pro", "Huawei Pura 70",
      "Huawei P60 Pro", "Huawei P60", "Huawei P50 Pocket", "Huawei P50 Pro", "Huawei P50",
      "Huawei P40 Pro+", "Huawei P40 Pro", "Huawei P40", "Huawei P40 Lite",
      "Huawei P30 Pro", "Huawei P30", "Huawei P30 Lite",
      "Huawei P20 Pro", "Huawei P20", "Huawei P20 Lite"
    ],
    "Nova Series": [
      "Huawei Nova 12 Ultra", "Huawei Nova 12s", "Huawei Nova 11 Pro", "Huawei Nova 11", "Huawei Nova 11i",
      "Huawei Nova 10 Pro", "Huawei Nova 10", "Huawei Nova 10 SE",
      "Huawei Nova 9", "Huawei Nova 9 SE", "Huawei Nova 8", "Huawei Nova 8i", "Huawei Nova 7", "Huawei Nova 7i", "Huawei Nova 5T"
    ],
    "Y & Enjoy Series": [
      "Huawei Y9a", "Huawei Y9 Prime", "Huawei Y9", "Huawei Y8p", "Huawei Y8s", "Huawei Y7a", "Huawei Y7p", "Huawei Y7", "Huawei Y6p", "Huawei Y6s", "Huawei Y6", "Huawei Y5p"
    ]
  };
};

const generateOnePlusModels = () => {
  return {
    "OnePlus Premium Series": [
      "OnePlus 12", "OnePlus 12R", "OnePlus 11", "OnePlus 11R", "OnePlus 10 Pro", "OnePlus 10T", "OnePlus 10R",
      "OnePlus 9 Pro", "OnePlus 9", "OnePlus 9R", "OnePlus 9RT",
      "OnePlus 8 Pro", "OnePlus 8T", "OnePlus 8",
      "OnePlus 7 Pro", "OnePlus 7T Pro", "OnePlus 7T", "OnePlus 7",
      "OnePlus 6T", "OnePlus 6", "OnePlus 5T", "OnePlus 5", "OnePlus 3T", "OnePlus 3", "OnePlus 2", "OnePlus One"
    ],
    "OnePlus Nord Series": [
      "OnePlus Nord 4", "OnePlus Nord 3", "OnePlus Nord CE 4", "OnePlus Nord CE 3 Lite",
      "OnePlus Nord 2T", "OnePlus Nord CE 2 Lite", "OnePlus Nord N30", "OnePlus Nord N20",
      "OnePlus Nord N200", "OnePlus Nord N100", "OnePlus Nord N10"
    ],
    "OnePlus Foldables": [
      "OnePlus Open"
    ]
  };
};

const generateMotorolaModels = () => {
  return {
    "Moto Edge Series": [
      "Moto Edge 50 Ultra", "Moto Edge 50 Pro", "Moto Edge 50 Fusion",
      "Moto Edge 40 Pro", "Moto Edge 40", "Moto Edge 40 Neo",
      "Moto Edge 30 Ultra", "Moto Edge 30 Pro", "Moto Edge 30 Fusion", "Moto Edge 30 Neo",
      "Moto Edge (2023)", "Moto Edge (2022)"
    ],
    "Moto G Series": [
      "Moto G84", "Moto G73", "Moto G54", "Moto G24", "Moto G14",
      "Moto G Power (2024)", "Moto G Stylus 5G (2024)", "Moto G Play (2024)",
      "Moto G82", "Moto G72", "Moto G62", "Moto G52", "Moto G42", "Moto G32", "Moto G22",
      "Moto G Power (2023)", "Moto G Stylus (2023)", "Moto G Play (2023)"
    ],
    "Moto Razr Foldables": [
      "Moto Razr 50 Ultra", "Moto Razr 50", "Moto Razr 40 Ultra", "Moto Razr 40",
      "Moto Razr (2022)", "Moto Razr 5G", "Moto Razr (2019)"
    ],
    "Moto E Series": [
      "Moto E13", "Moto E22", "Moto E32", "Moto E40", "Moto E30", "Moto E20", "Moto E7i Power", "Moto E7 Power", "Moto E7", "Moto E6s"
    ]
  };
};

const generateNokiaModels = () => {
  return {
    "Classic & Retro Feature Phones": [
      "Nokia 3310", "Nokia 8110 4G", "Nokia 2720 Flip", "Nokia 800 Tough", "Nokia 6300 4G", "Nokia 5310", "Nokia 225 4G", "Nokia 215 4G", "Nokia 150", "Nokia 130", "Nokia 110", "Nokia 105"
    ],
    "Lumia Windows Phones": [
      "Lumia 1520", "Lumia 1020", "Lumia 930", "Lumia 925", "Lumia 920", "Lumia 830", "Lumia 735", "Lumia 635", "Lumia 530", "Lumia 520"
    ],
    "Nokia Android Smartphones": [
      "Nokia XR21", "Nokia XR20", "Nokia X30", "Nokia G60", "Nokia G50", "Nokia G22", "Nokia G21", "Nokia G11",
      "Nokia C32", "Nokia C22", "Nokia C12", "Nokia C30", "Nokia C20",
      "Nokia 9 PureView", "Nokia 8.3 5G", "Nokia 8 Sirocco", "Nokia 8", "Nokia 7.2", "Nokia 6.2", "Nokia 6.1", "Nokia 5.4", "Nokia 3.4"
    ]
  };
};

const generateInfinixModels = () => {
  return {
    "Note Series": [
      "Infinix Note 40 Pro+ 5G", "Infinix Note 40 Pro", "Infinix Note 40 5G", "Infinix Note 40",
      "Infinix Note 30 VIP", "Infinix Note 30 Pro", "Infinix Note 30 5G", "Infinix Note 30",
      "Infinix Note 12 VIP", "Infinix Note 12 Pro 5G", "Infinix Note 12 Pro", "Infinix Note 12", "Infinix Note 11 Pro", "Infinix Note 11", "Infinix Note 10 Pro", "Infinix Note 10"
    ],
    "Hot Series": [
      "Infinix Hot 40 Pro", "Infinix Hot 40", "Infinix Hot 40i",
      "Infinix Hot 30 5G", "Infinix Hot 30", "Infinix Hot 30i",
      "Infinix Hot 20 5G", "Infinix Hot 20", "Infinix Hot 20i",
      "Infinix Hot 12 Play", "Infinix Hot 12", "Infinix Hot 12i",
      "Infinix Hot 11S", "Infinix Hot 11", "Infinix Hot 10 Play", "Infinix Hot 10"
    ],
    "Zero Series": [
      "Infinix Zero 30 5G", "Infinix Zero 30 4G", "Infinix Zero Ultra", "Infinix Zero 20", "Infinix Zero 5G 2023", "Infinix Zero 5G", "Infinix Zero X Pro"
    ],
    "Smart Series": [
      "Infinix Smart 8 Pro", "Infinix Smart 8 HD", "Infinix Smart 8", "Infinix Smart 7 HD", "Infinix Smart 7", "Infinix Smart 6 Plus", "Infinix Smart 6", "Infinix Smart 5"
    ],
    "GT Gaming Series": [
      "Infinix GT 20 Pro", "Infinix GT 10 Pro"
    ]
  };
};

const generateRealmeModels = () => {
  return {
    "Realme Number Series": [
      "Realme 13 Pro+", "Realme 13 Pro", "Realme 13",
      "Realme 12 Pro+", "Realme 12 Pro", "Realme 12+", "Realme 12", "Realme 12x",
      "Realme 11 Pro+", "Realme 11 Pro", "Realme 11x 5G", "Realme 11 5G", "Realme 11 4G",
      "Realme 10 Pro+", "Realme 10 Pro", "Realme 10 5G", "Realme 10",
      "Realme 9 Pro+", "Realme 9 Pro", "Realme 9i 5G", "Realme 9i", "Realme 9 5G", "Realme 9",
      "Realme 8 Pro", "Realme 8 5G", "Realme 8", "Realme 8i", "Realme 7 Pro", "Realme 7"
    ],
    "Realme C Series": [
      "Realme C67 5G", "Realme C67 4G", "Realme C65 5G", "Realme C65", "Realme C63", "Realme C55", "Realme C53", "Realme C51",
      "Realme C35", "Realme C33", "Realme C31", "Realme C30s", "Realme C30",
      "Realme C25s", "Realme C25", "Realme C21Y", "Realme C21", "Realme C11 (2021)", "Realme C11"
    ],
    "Realme GT Series": [
      "Realme GT 6", "Realme GT 6T", "Realme GT 5 Pro", "Realme GT 5 240W", "Realme GT 5",
      "Realme GT Neo 5 SE", "Realme GT Neo 5", "Realme GT3",
      "Realme GT2 Pro", "Realme GT2", "Realme GT Neo 3", "Realme GT Neo 2", "Realme GT Master Edition", "Realme GT 5G"
    ],
    "Realme Narzo Series": [
      "Realme Narzo 70 Pro 5G", "Realme Narzo 70x 5G", "Realme Narzo 60 Pro", "Realme Narzo 60x", "Realme Narzo 50 Pro 5G", "Realme Narzo 50", "Realme Narzo 30"
    ]
  };
};

const generateWiseTechModels = () => {
  return {
    "Note Series": [
      "Wise-Tech P50", "Wise-Tech Note 30", "Wise-Tech Note 20", "Wise-Tech Note 10", "Wise-Tech Note 9", "Wise-Tech Note 8", "Wise-Tech Note 7", "Wise-Tech Note 6", "Wise-Tech Note 5"
    ],
    "Wise-Tech Feature Phones": [
      "Wise-Tech Senior Power 2G", "Wise-Tech Big Button T9", "Wise-Tech Flip 4G", "Wise-Tech Rugged 2G", "Wise-Tech Compact 100"
    ],
    "Wise-Tech Smartphones & Tablets": [
      "Wise-Tech Smart 5", "Wise-Tech Smart 4", "Wise-Tech Tab 10", "Wise-Tech Tab 7"
    ]
  };
};

const generateOppoModels = () => {
  return {
    "Reno Series": [
      "Oppo Reno 12 Pro", "Oppo Reno 12", "Oppo Reno 11 Pro", "Oppo Reno 11", "Oppo Reno 11F",
      "Oppo Reno 10 Pro+", "Oppo Reno 10 Pro", "Oppo Reno 10",
      "Oppo Reno 8 Pro", "Oppo Reno 8", "Oppo Reno 8T 5G", "Oppo Reno 8T",
      "Oppo Reno 7 Pro", "Oppo Reno 7 5G", "Oppo Reno 7", "Oppo Reno 6 Pro", "Oppo Reno 6", "Oppo Reno 5 Pro", "Oppo Reno 5"
    ],
    "Find Series (Premium & Fold)": [
      "Oppo Find X7 Ultra", "Oppo Find X7", "Oppo Find N3", "Oppo Find N3 Flip",
      "Oppo Find X6 Pro", "Oppo Find X6", "Oppo Find N2 Flip", "Oppo Find N2",
      "Oppo Find X5 Pro", "Oppo Find X5", "Oppo Find X3 Pro", "Oppo Find X3 Neo", "Oppo Find X2 Pro"
    ],
    "A Series": [
      "Oppo A98 5G", "Oppo A79 5G", "Oppo A78 5G", "Oppo A78 4G", "Oppo A58 4G", "Oppo A38", "Oppo A18",
      "Oppo A96", "Oppo A77s", "Oppo A77 5G", "Oppo A57 4G", "Oppo A55", "Oppo A54", "Oppo A53",
      "Oppo A17k", "Oppo A17", "Oppo A16s", "Oppo A16", "Oppo A15s", "Oppo A15", "Oppo A12"
    ],
    "F & K Series": [
      "Oppo F25 Pro", "Oppo F23", "Oppo F21 Pro 5G", "Oppo F21 Pro", "Oppo F19 Pro+", "Oppo F19 Pro", "Oppo F19", "Oppo K11", "Oppo K10"
    ]
  };
};

const generateTecnoModels = () => {
  return {
    "Camon Series": [
      "Tecno Camon 30 Pro 5G", "Tecno Camon 30 Premier", "Tecno Camon 30 5G", "Tecno Camon 30",
      "Tecno Camon 20 Pro 5G", "Tecno Camon 20 Pro", "Tecno Camon 20 Premier", "Tecno Camon 20",
      "Tecno Camon 19 Pro 5G", "Tecno Camon 19 Pro", "Tecno Camon 19 Neo", "Tecno Camon 19", "Tecno Camon 18 Premier", "Tecno Camon 18T", "Tecno Camon 18"
    ],
    "Spark Series": [
      "Tecno Spark 20 Pro+", "Tecno Spark 20 Pro", "Tecno Spark 20 4G", "Tecno Spark 20C", "Tecno Spark 20",
      "Tecno Spark 10 Pro", "Tecno Spark 10 5G", "Tecno Spark 10", "Tecno Spark 10C",
      "Tecno Spark 9 Pro", "Tecno Spark 9T", "Tecno Spark 9", "Tecno Spark 8 Pro", "Tecno Spark 8C", "Tecno Spark 8T", "Tecno Spark 7 Pro", "Tecno Spark 7"
    ],
    "Pova Gaming Series": [
      "Tecno Pova 6 Pro 5G", "Tecno Pova 6", "Tecno Pova 5 Pro 5G", "Tecno Pova 5", "Tecno Pova 4 Pro", "Tecno Pova 4",
      "Tecno Pova 3", "Tecno Pova Neo 3", "Tecno Pova Neo 2", "Tecno Pova Neo", "Tecno Pova 2"
    ],
    "Phantom Flagship Series": [
      "Tecno Phantom V Fold", "Tecno Phantom V Flip", "Tecno Phantom X2 Pro", "Tecno Phantom X2", "Tecno Phantom X"
    ],
    "Pop Series": [
      "Tecno Pop 8", "Tecno Pop 7 Pro", "Tecno Pop 7", "Tecno Pop 6 Pro", "Tecno Pop 6", "Tecno Pop 5 Pro", "Tecno Pop 5"
    ]
  };
};

const generateHonorModels = () => {
  return {
    "Magic Series (Flagships & Foldables)": [
      "Honor Magic 6 Pro", "Honor Magic 6", "Honor Magic V2", "Honor Magic Vs2", "Honor Magic V Flip",
      "Honor Magic 5 Pro", "Honor Magic 5", "Honor Magic 5 Lite",
      "Honor Magic 4 Pro", "Honor Magic 4", "Honor Magic 4 Lite"
    ],
    "Honor Number Series": [
      "Honor 200 Pro", "Honor 200", "Honor 200 Lite", "Honor 100 Pro", "Honor 100",
      "Honor 90 Pro", "Honor 90", "Honor 90 Lite", "Honor 80 Pro", "Honor 80",
      "Honor 70 Pro+", "Honor 70 Pro", "Honor 70", "Honor 50 Pro", "Honor 50", "Honor 50 Lite"
    ],
    "Honor X Series": [
      "Honor X9b 5G", "Honor X9a 5G", "Honor X9", "Honor X8b", "Honor X8a", "Honor X8 5G", "Honor X8",
      "Honor X7b 5G", "Honor X7b", "Honor X7a", "Honor X7", "Honor X6a", "Honor X6", "Honor X5 Plus", "Honor X5"
    ],
    "Honor Pad Series (Tablets)": [
      "Honor Pad 9", "Honor Pad 8", "Honor Pad X9", "Honor Pad X8"
    ]
  };
};

const generateLenovoModels = () => {
  return {
    "Tab & Yoga Series (Tablets)": [
      "Lenovo Tab P12 Pro", "Lenovo Tab P12", "Lenovo Tab P11 Pro (2nd Gen)", "Lenovo Tab P11 (2nd Gen)", "Lenovo Tab P11 Plus", "Lenovo Tab P11",
      "Lenovo Tab M11", "Lenovo Tab M10 Plus (3rd Gen)", "Lenovo Tab M10 (3rd Gen)", "Lenovo Tab M9", "Lenovo Tab M8 (4th Gen)",
      "Lenovo Yoga Tab 13", "Lenovo Yoga Tab 11"
    ],
    "Legion Gaming Phones": [
      "Lenovo Legion Y70", "Lenovo Legion Y90", "Lenovo Legion Phone Duel 2", "Lenovo Legion Phone Duel", "Lenovo Legion Pro"
    ],
    "K Series & Smartphones": [
      "Lenovo K14 Note", "Lenovo K14 Plus", "Lenovo K13 Note", "Lenovo K13 Pro", "Lenovo K12 Note", "Lenovo K12 Pro", "Lenovo K10 Note", "Lenovo K9"
    ]
  };
};

export const cleanModelName = (model) => {
  if (!model) return '';
  return model
    .replace(/\s*\(?\s*\b\d+\s*(?:GB|TB|gb|tb|Gb|Tb)\b\s*\)?/gi, '')
    .replace(/\s*\(?\s*\b(?:unlocked|verizon|at&t|t-mobile|sprint|carrier)\b\s*\)?/gi, '')
    .replace(/\s*-\s*$/, '')
    .replace(/\s*\(\s*\)\s*/g, '')
    .trim();
};

const cleanAndDeduplicate = (categories) => {
  const cleaned = {};
  for (const [category, models] of Object.entries(categories)) {
    cleaned[category] = [
      ...new Set(models.map(m => cleanModelName(m)))
    ].filter(Boolean);
  }
  return cleaned;
};

export const brandModels = {
  Apple: cleanAndDeduplicate(generateAppleModels()),
  Samsung: cleanAndDeduplicate(generateSamsungModels()),
  Google: cleanAndDeduplicate(generateGoogleModels()),
  Nokia: cleanAndDeduplicate(generateNokiaModels()),
  Xiaomi: cleanAndDeduplicate(generateXiaomiModels()),
  Huawei: cleanAndDeduplicate(generateHuaweiModels()),
  OnePlus: cleanAndDeduplicate(generateOnePlusModels()),
  Motorola: cleanAndDeduplicate(generateMotorolaModels()),
  Infinix: cleanAndDeduplicate(generateInfinixModels()),
  Realme: cleanAndDeduplicate(generateRealmeModels()),
  Oppo: cleanAndDeduplicate(generateOppoModels()),
  Tecno: cleanAndDeduplicate(generateTecnoModels()),
  Honor: cleanAndDeduplicate(generateHonorModels()),
  Lenovo: cleanAndDeduplicate(generateLenovoModels()),
  "Wise-Tech": cleanAndDeduplicate(generateWiseTechModels()),
  Other: cleanAndDeduplicate({
    "Generic Categories": [
      "Other Phone",
      "Other Tablet",
      "Other Feature Phone",
      "Other Apple Device",
      "Other Samsung Device",
      "Other Google Device",
      "Other Nokia Device",
      "Other Infinix Device",
      "Other Realme Device",
      "Other Oppo Device",
      "Other Tecno Device",
      "Other Honor Device",
      "Other Lenovo Device",
      "Other Wise-Tech Device"
    ]
  })
};
