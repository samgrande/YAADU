/**
 * Premium Device Detector Module
 * Parses Android model numbers (e.g. SM-S918B, Pixel 7a, CPH2447)
 * and resolves them to clean brand names and human-friendly marketing names.
 */

interface ModelMapping {
  regex: RegExp;
  name: string;
}

const BRAND_MAPPINGS: Record<string, ModelMapping[]> = {
  google: [
    { regex: /Pixel Fold/i, name: "Pixel Fold" },
    { regex: /Pixel 8 Pro/i, name: "Pixel 8 Pro" },
    { regex: /Pixel 8a/i, name: "Pixel 8a" },
    { regex: /Pixel 8/i, name: "Pixel 8" },
    { regex: /Pixel 7a/i, name: "Pixel 7a" },
    { regex: /Pixel 7 Pro/i, name: "Pixel 7 Pro" },
    { regex: /Pixel 7/i, name: "Pixel 7" },
    { regex: /Pixel 6a/i, name: "Pixel 6a" },
    { regex: /Pixel 6 Pro/i, name: "Pixel 6 Pro" },
    { regex: /Pixel 6/i, name: "Pixel 6" },
    { regex: /Pixel 5a/i, name: "Pixel 5a" },
    { regex: /Pixel 5/i, name: "Pixel 5" },
    { regex: /Pixel 4a/i, name: "Pixel 4a" },
    { regex: /Pixel 4 XL/i, name: "Pixel 4 XL" },
    { regex: /Pixel 4/i, name: "Pixel 4" },
    { regex: /Pixel 3a XL/i, name: "Pixel 3a XL" },
    { regex: /Pixel 3a/i, name: "Pixel 3a" },
    { regex: /Pixel 3 XL/i, name: "Pixel 3 XL" },
    { regex: /Pixel 3/i, name: "Pixel 3" },
    { regex: /Pixel 2 XL/i, name: "Pixel 2 XL" },
    { regex: /Pixel 2/i, name: "Pixel 2" },
    { regex: /Pixel XL/i, name: "Pixel XL" },
    { regex: /Pixel/i, name: "Pixel" },
  ],
  samsung: [
    // S24 Series
    { regex: /SM-S928/i, name: "Galaxy S24 Ultra" },
    { regex: /SM-S926/i, name: "Galaxy S24+" },
    { regex: /SM-S921/i, name: "Galaxy S24" },
    // S23 Series
    { regex: /SM-S918/i, name: "Galaxy S23 Ultra" },
    { regex: /SM-S916/i, name: "Galaxy S23+" },
    { regex: /SM-S911/i, name: "Galaxy S23" },
    { regex: /SM-S711/i, name: "Galaxy S23 FE" },
    { regex: /SM-S721/i, name: "Galaxy S24 FE" },
    // S22 Series
    { regex: /SM-S908/i, name: "Galaxy S22 Ultra" },
    { regex: /SM-S906/i, name: "Galaxy S22+" },
    { regex: /SM-S901/i, name: "Galaxy S22" },
    // S21 Series
    { regex: /SM-G998/i, name: "Galaxy S21 Ultra" },
    { regex: /SM-G996/i, name: "Galaxy S21+" },
    { regex: /SM-G991/i, name: "Galaxy S21" },
    { regex: /SM-G990/i, name: "Galaxy S21 FE" },
    // S20 Series
    { regex: /SM-G988/i, name: "Galaxy S20 Ultra" },
    { regex: /SM-G986/i, name: "Galaxy S20+" },
    { regex: /SM-G985/i, name: "Galaxy S20+ 5G" },
    { regex: /SM-G980/i, name: "Galaxy S20" },
    { regex: /SM-G981/i, name: "Galaxy S20 5G" },
    { regex: /SM-G780/i, name: "Galaxy S20 FE" },
    { regex: /SM-G781/i, name: "Galaxy S20 FE 5G" },
    // S10 Series
    { regex: /SM-G977/i, name: "Galaxy S10 5G" },
    { regex: /SM-G975/i, name: "Galaxy S10+" },
    { regex: /SM-G973/i, name: "Galaxy S10" },
    { regex: /SM-G970/i, name: "Galaxy S10e" },
    { regex: /SM-G770/i, name: "Galaxy S10 Lite" },
    // S9 Series
    { regex: /SM-G965/i, name: "Galaxy S9+" },
    { regex: /SM-G960/i, name: "Galaxy S9" },
    // S8 Series
    { regex: /SM-G955/i, name: "Galaxy S8+" },
    { regex: /SM-G950/i, name: "Galaxy S8" },

    // Note Series
    { regex: /SM-N986/i, name: "Galaxy Note20 Ultra 5G" },
    { regex: /SM-N985/i, name: "Galaxy Note20 Ultra" },
    { regex: /SM-N981/i, name: "Galaxy Note20 5G" },
    { regex: /SM-N980/i, name: "Galaxy Note20" },
    { regex: /SM-N976/i, name: "Galaxy Note10+ 5G" },
    { regex: /SM-N975/i, name: "Galaxy Note10+" },
    { regex: /SM-N971/i, name: "Galaxy Note10 5G" },
    { regex: /SM-N970/i, name: "Galaxy Note10" },
    { regex: /SM-N770/i, name: "Galaxy Note10 Lite" },
    { regex: /SM-N960/i, name: "Galaxy Note9" },
    { regex: /SM-N950/i, name: "Galaxy Note8" },

    // Fold & Flip Series
    { regex: /SM-F946/i, name: "Galaxy Z Fold5" },
    { regex: /SM-F731/i, name: "Galaxy Z Flip5" },
    { regex: /SM-F936/i, name: "Galaxy Z Fold4" },
    { regex: /SM-F721/i, name: "Galaxy Z Flip4" },
    { regex: /SM-F926/i, name: "Galaxy Z Fold3" },
    { regex: /SM-F711/i, name: "Galaxy Z Flip3" },
    { regex: /SM-F916/i, name: "Galaxy Z Fold2" },
    { regex: /SM-F707/i, name: "Galaxy Z Flip 5G" },
    { regex: /SM-F700/i, name: "Galaxy Z Flip" },
    { regex: /SM-F900/i, name: "Galaxy Fold" },
    { regex: /SM-F907/i, name: "Galaxy Fold 5G" },

    // A Series
    { regex: /SM-A556/i, name: "Galaxy A55 5G" },
    { regex: /SM-A356/i, name: "Galaxy A35 5G" },
    { regex: /SM-A256/i, name: "Galaxy A25 5G" },
    { regex: /SM-A156/i, name: "Galaxy A15 5G" },
    { regex: /SM-A546/i, name: "Galaxy A54 5G" },
    { regex: /SM-A536/i, name: "Galaxy A53 5G" },
    { regex: /SM-A528/i, name: "Galaxy A52s 5G" },
    { regex: /SM-A526/i, name: "Galaxy A52 5G" },
    { regex: /SM-A525/i, name: "Galaxy A52" },
    { regex: /SM-A515/i, name: "Galaxy A51" },
    { regex: /SM-A516/i, name: "Galaxy A51 5G" },
    { regex: /SM-A505/i, name: "Galaxy A50" },
    { regex: /SM-A346/i, name: "Galaxy A34 5G" },
    { regex: /SM-A336/i, name: "Galaxy A33 5G" },
    { regex: /SM-A326/i, name: "Galaxy A32 5G" },
    { regex: /SM-A325/i, name: "Galaxy A32" },
    { regex: /SM-A245/i, name: "Galaxy A24" },
    { regex: /SM-A236/i, name: "Galaxy A23 5G" },
    { regex: /SM-A235/i, name: "Galaxy A23" },
    { regex: /SM-A226/i, name: "Galaxy A22 5G" },
    { regex: /SM-A225/i, name: "Galaxy A22" },
    { regex: /SM-A146/i, name: "Galaxy A14 5G" },
    { regex: /SM-A145/i, name: "Galaxy A14" },
    { regex: /SM-A136/i, name: "Galaxy A13 5G" },
    { regex: /SM-A135/i, name: "Galaxy A13" },
    { regex: /SM-A125/i, name: "Galaxy A12" },
    { regex: /SM-A736/i, name: "Galaxy A73 5G" },
    { regex: /SM-A725/i, name: "Galaxy A72" },
    { regex: /SM-A715/i, name: "Galaxy A71" },
    { regex: /SM-A716/i, name: "Galaxy A71 5G" },
    { regex: /SM-A705/i, name: "Galaxy A70" },
  ],
  oneplus: [
    { regex: /CPH2551/i, name: "OnePlus Open" },
    { regex: /CPH2491|CPH2493/i, name: "OnePlus Nord 3 5G" },
    { regex: /CPH2569/i, name: "OnePlus Nord CE 3 5G" },
    { regex: /IV2201/i, name: "OnePlus Nord CE 2 5G" },
    { regex: /EB2101|EB2103/i, name: "OnePlus Nord CE 5G" },
    { regex: /CPH2573|CPH2581/i, name: "OnePlus 12" },
    { regex: /CPH2583|CPH2609/i, name: "OnePlus 12R" },
    { regex: /CPH2447|CPH2449|CPH2451/i, name: "OnePlus 11" },
    { regex: /CPH2413|CPH2415|CPH2417/i, name: "OnePlus 10T" },
    { regex: /NE2210|NE2211|NE2213|NE2215|NE2217/i, name: "OnePlus 10 Pro" },
    { regex: /LE2110|LE2111|LE2113|LE2115/i, name: "OnePlus 9" },
    { regex: /LE2120|LE2121|LE2123|LE2125/i, name: "OnePlus 9 Pro" },
    { regex: /MT2110|MT2111/i, name: "OnePlus 9RT" },
    { regex: /KB2000|KB2001|KB2003|KB2005/i, name: "OnePlus 8T" },
    { regex: /IN2010|IN2011|IN2013|IN2015|IN2017/i, name: "OnePlus 8" },
    { regex: /IN2020|IN2021|IN2023|IN2025/i, name: "OnePlus 8 Pro" },
    { regex: /HD1900|HD1901|HD1903|HD1907/i, name: "OnePlus 7T" },
    { regex: /HD1910|HD1911|HD1913|HD1917/i, name: "OnePlus 7T Pro" },
    { regex: /GM1910|GM1911|GM1913|GM1915|GM1917/i, name: "OnePlus 7 Pro" },
    { regex: /GM1900|GM1901|GM1903|GM1905/i, name: "OnePlus 7" },
    { regex: /ONEPLUS A6010|ONEPLUS A6013/i, name: "OnePlus 6T" },
    { regex: /ONEPLUS A6000|ONEPLUS A6003/i, name: "OnePlus 6" },
    { regex: /ONEPLUS A5010/i, name: "OnePlus 5T" },
    { regex: /ONEPLUS A5000/i, name: "OnePlus 5" },
    { regex: /ONEPLUS A3000|ONEPLUS A3003/i, name: "OnePlus 3T" },
    { regex: /ONEPLUS A3001/i, name: "OnePlus 3" },
    // Nord Series
    { regex: /AC2001|AC2003/i, name: "OnePlus Nord" },
    { regex: /DN2101|DN2103/i, name: "OnePlus Nord 2 5G" },
    { regex: /CPH2465|CPH2467/i, name: "OnePlus Nord CE 3 Lite" }
  ],
  xiaomi: [
    // Mi Series
    { regex: /23127PN0CG|23127PN0CC/i, name: "Xiaomi 14" },
    { regex: /23116PN5BC|23116PN5BG/i, name: "Xiaomi 14 Pro" },
    { regex: /2211133G|2211133C/i, name: "Xiaomi 13" },
    { regex: /2210132G|2210132C/i, name: "Xiaomi 13 Pro" },
    { regex: /2201123G|2201123C/i, name: "Xiaomi 12" },
    { regex: /2201122G|2201122C/i, name: "Xiaomi 12 Pro" },
    { regex: /M2101K9AG|M2101K9C/i, name: "Mi 11 Lite" },
    { regex: /M2011K2G|M2011K2C/i, name: "Mi 11" },
    { regex: /M2007J3SG|M2007J3SC/i, name: "Mi 10T Pro" },
    { regex: /M2007J3SY/i, name: "Mi 10T" },
    { regex: /M2001J2G|M2001J2C/i, name: "Mi 10" },

    // POCO Series
    { regex: /23049PCD8G/i, name: "POCO F5" },
    { regex: /23013PC75G/i, name: "POCO F5 Pro" },
    { regex: /22011211G/i, name: "POCO F4 GT" },
    { regex: /22021211RC/i, name: "POCO F4" },
    { regex: /M2012K11AG|M2012K11AC/i, name: "POCO F3" },
    { regex: /M2102J20SG|M2102J20S/i, name: "POCO X3 Pro" },
    { regex: /M2007J20CG|M2007J20CT/i, name: "POCO X3 NFC" },
    { regex: /M2003J6CI/i, name: "POCO M2 Pro" },

    // Redmi Series
    { regex: /23053RN02Y/i, name: "Redmi Note 12S" },
    { regex: /22101316G/i, name: "Redmi Note 12 Pro" },
    { regex: /2201116SG|2201116TG/i, name: "Redmi Note 11 Pro" },
    { regex: /2201117TY/i, name: "Redmi Note 11S" },
    { regex: /2201117PG/i, name: "Redmi Note 11" },
    { regex: /M2101K7BG|M2101K7BI/i, name: "Redmi Note 10S" },
    { regex: /M2101K6G|M2101K6R/i, name: "Redmi Note 10 Pro" },
    { regex: /M2101K7AG/i, name: "Redmi Note 10" },
    { regex: /M2003J15SG|M2003J15SS/i, name: "Redmi Note 9" },
    { regex: /M1908C3JG|M1908C3JH/i, name: "Redmi Note 8" },
    { regex: /M1908C3XG/i, name: "Redmi 8" },
  ],
  motorola: [
    { regex: /XT2301/i, name: "Edge 40 Pro" },
    { regex: /XT2303/i, name: "Edge 40" },
    { regex: /XT2201/i, name: "Edge 30 Pro" },
    { regex: /XT2203/i, name: "Edge 30 Neo" },
    { regex: /XT2125/i, name: "Moto G100" },
    { regex: /XT2063/i, name: "Edge+" },
    { regex: /XT2075/i, name: "Moto G 5G Plus" },
    { regex: /XT2115/i, name: "Moto G Stylus (2021)" },
    { regex: /XT2041/i, name: "Moto G Fast" },
    { regex: /XT1962/i, name: "Moto G7" },
  ],
  sony: [
    { regex: /XQ-DQ72|XQ-DQ62|XQ-DQ52/i, name: "Xperia 1 V" },
    { regex: /XQ-CT72|XQ-CT62|XQ-CT52/i, name: "Xperia 1 IV" },
    { regex: /XQ-BC72|XQ-BC62|XQ-BC52/i, name: "Xperia 1 III" },
    { regex: /SO-51A|SOG01/i, name: "Xperia 1 II" },
    { regex: /SO-03L|SOV40/i, name: "Xperia 1" },
    { regex: /XQ-DE72|XQ-DE52/i, name: "Xperia 5 V" },
    { regex: /XQ-CQ72|XQ-CQ52/i, name: "Xperia 5 IV" },
    { regex: /XQ-DC72|XQ-DC52/i, name: "Xperia 10 V" },
  ],
  nothing: [
    { regex: /A063/i, name: "Phone (1)" },
    { regex: /A065/i, name: "Phone (2)" },
    { regex: /A142/i, name: "Phone (2a)" },
  ],
  lg: [
    { regex: /LM-G900/i, name: "LG Velvet" },
    { regex: /LM-F100/i, name: "LG Wing" },
    { regex: /LM-G850/i, name: "LG G8X ThinQ" },
    { regex: /LM-G820/i, name: "LG G8 ThinQ" },
    { regex: /LM-V600/i, name: "LG V60 ThinQ" },
    { regex: /LM-V500/i, name: "LG V50 ThinQ" },
  ],
  huawei: [
    { regex: /ALT-AL00|ALT-L29/i, name: "P60 Pro" },
    { regex: /JAD-AL00|JAD-LX9/i, name: "P50 Pro" },
    { regex: /ELS-NX9|ELS-N04/i, name: "P40 Pro" },
    { regex: /ANA-NX9/i, name: "P40" },
    { regex: /VOG-L29|VOG-L09/i, name: "P30 Pro" },
    { regex: /ELE-L29/i, name: "P30" },
    { regex: /NOH-NX9/i, name: "Mate 40 Pro" },
    { regex: /LIO-L29/i, name: "Mate 30 Pro" },
  ],
  asus: [
    { regex: /AI2205/i, name: "ROG Phone 7" },
    { regex: /AI2202/i, name: "Zenfone 9" },
    { regex: /AI2109/i, name: "ROG Phone 6" },
    { regex: /ZS590KS/i, name: "Zenfone 8" },
    { regex: /ZS673KS/i, name: "ROG Phone 5" },
  ],
};

// Global flat lookup for brand-less matching or direct model lookups
const FLAT_MAPPINGS: { regex: RegExp; brand: string; name: string }[] = [];
for (const [brandKey, rules] of Object.entries(BRAND_MAPPINGS)) {
  const brandDisplay = brandKey.charAt(0).toUpperCase() + brandKey.slice(1);
  for (const rule of rules) {
    FLAT_MAPPINGS.push({
      regex: rule.regex,
      brand: brandDisplay,
      name: rule.name,
    });
  }
}

/**
 * Standardize brand casing for display
 */
export function cleanBrandName(brand: string): string {
  if (!brand) return "Android";
  const b = brand.toLowerCase().trim();
  if (b === "samsung") return "Samsung";
  if (b === "google") return "Google";
  if (b === "oneplus") return "OnePlus";
  if (b === "xiaomi") return "Xiaomi";
  if (b === "poco" || b === "redmi") return "Xiaomi";
  if (b === "sony") return "Sony";
  if (b === "motorola" || b === "moto") return "Motorola";
  if (b === "nothing") return "Nothing";
  if (b === "lg") return "LG";
  if (b === "huawei") return "Huawei";
  if (b === "asus") return "ASUS";
  if (b === "lenovo") return "Lenovo";
  if (b === "htc") return "HTC";
  // Return nicely capitalized
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

/**
 * Resolve raw device info strings (brand, model, and marketName) to marketing representations
 */
/**
 * Resolve raw device info strings (brand, model, and marketName) to marketing representations.
 * Strips the company/brand name prefix from the front of the marketing name.
 */
export function resolveDeviceDetails(
  model: string,
  brand?: string,
  marketName?: string
): { brand: string; marketingName: string } {
  const rawModel = (model || "").trim();
  const rawBrand = (brand || "").trim();
  const rawMarket = (marketName || "").trim();

  const cleanBrand = cleanBrandName(rawBrand);

  // 0. Prioritize official user-facing marketing name if available from system property
  if (
    rawMarket &&
    rawMarket.toLowerCase() !== "android" &&
    rawMarket.toLowerCase() !== "unknown" &&
    rawMarket.toLowerCase() !== rawBrand.toLowerCase()
  ) {
    // Strip brand name prefix from the front of rawMarket if present
    let cleanMarket = rawMarket;
    const brandPrefixRegex = new RegExp(`^${cleanBrand}\\s+`, "i");
    if (brandPrefixRegex.test(cleanMarket)) {
      cleanMarket = cleanMarket.replace(brandPrefixRegex, "");
    }
    return {
      brand: cleanBrand,
      marketingName: cleanMarket,
    };
  }

  // 1. Try to search rules matching specified brand
  if (rawBrand) {
    const brandLower = rawBrand.toLowerCase();
    const specificRules = BRAND_MAPPINGS[brandLower];
    if (specificRules) {
      for (const rule of specificRules) {
        if (rule.regex.test(rawModel)) {
          let finalName = rule.name;
          const brandPrefixRegex = new RegExp(`^${cleanBrand}\\s+`, "i");
          if (brandPrefixRegex.test(finalName)) {
            finalName = finalName.replace(brandPrefixRegex, "");
          }
          return {
            brand: cleanBrand,
            marketingName: finalName,
          };
        }
      }
    }
  }

  // 2. Try to match globally using flat list
  for (const mapping of FLAT_MAPPINGS) {
    if (mapping.regex.test(rawModel)) {
      let finalName = mapping.name;
      const brandPrefixRegex = new RegExp(`^${mapping.brand}\\s+`, "i");
      if (brandPrefixRegex.test(finalName)) {
        finalName = finalName.replace(brandPrefixRegex, "");
      }
      return {
        brand: mapping.brand,
        marketingName: finalName,
      };
    }
  }

  // 3. Fallback intelligence for unmapped models
  let cleanModel = rawModel;

  // If model starts with brand name, extract it
  const brandPrefixRegex = new RegExp(`^${cleanBrand}\\s+`, "i");
  if (brandPrefixRegex.test(cleanModel)) {
    cleanModel = cleanModel.replace(brandPrefixRegex, "");
  }

  // Formatting specific cleanups
  if (cleanBrand === "Samsung" && cleanModel.startsWith("SM-")) {
    const cleanNum = cleanModel.replace(/^SM-/, "").split("/")[0];
    
    // Smart S-series family patterns (S22, S23, S24, S25, etc.)
    const sSeriesMatch = cleanNum.match(/^S9(\d)(\d)/i);
    if (sSeriesMatch) {
      const gen = parseInt(sSeriesMatch[1], 10);
      const variant = sSeriesMatch[2];
      const modelYear = 22 + gen; // 0->22, 1->23, 2->24, 3->25
      const suffix = variant === "8" ? " Ultra" : variant === "6" ? "+" : "";
      return {
        brand: "Samsung",
        marketingName: `Galaxy S${modelYear}${suffix}`,
      };
    }

    // Smart A-series family patterns
    const aSeriesMatch = cleanNum.match(/^A(\d)(\d)\d/i);
    if (aSeriesMatch) {
      return {
        brand: "Samsung",
        marketingName: `Galaxy A${aSeriesMatch[1]}${aSeriesMatch[2]} 5G`,
      };
    }
    const mSeriesMatch = cleanNum.match(/^M(\d)(\d)\d/i);
    if (mSeriesMatch) {
      return {
        brand: "Samsung",
        marketingName: `Galaxy M${mSeriesMatch[1]}${mSeriesMatch[2]}`,
      };
    }
    const fSeriesMatch = cleanNum.match(/^F(\d)(\d)\d/i);
    if (fSeriesMatch) {
      if (cleanNum.startsWith("F9")) {
        return {
          brand: "Samsung",
          marketingName: `Galaxy Z Fold`,
        };
      }
      if (cleanNum.startsWith("F7")) {
        return {
          brand: "Samsung",
          marketingName: `Galaxy Z Flip`,
        };
      }
      return {
        brand: "Samsung",
        marketingName: `Galaxy F${fSeriesMatch[1]}${fSeriesMatch[2]}`,
      };
    }

    return {
      brand: "Samsung",
      marketingName: `Galaxy ${cleanNum}`,
    };
  }

  // If it's a pixel but unmapped in regexes, make it look nice
  if (cleanBrand === "Google" && /pixel/i.test(cleanModel)) {
    let finalModel = cleanModel;
    const brandPrefixRegex = new RegExp(`^${cleanBrand}\\s+`, "i");
    if (brandPrefixRegex.test(finalModel)) {
      finalModel = finalModel.replace(brandPrefixRegex, "");
    }
    return {
      brand: "Google",
      marketingName: finalModel,
    };
  }

  // General fallback: return cleaned model string
  return {
    brand: cleanBrand,
    marketingName: cleanModel || "Device",
  };
}
