import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents (é -> e, etc.)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Main categories with their real subcategories — this whole tree is stored
// in Postgres via the Category self-relation (parentId), not hardcoded on
// the frontend.
const CATEGORY_TREE: Record<string, string[]> = {
  "Informatique": [
    "Ordinateurs portables", "Ordinateurs de bureau", "Écrans", "Claviers", "Souris",
    "Imprimantes", "Stockage", "Composants PC", "Accessoires informatiques", "Réseaux & Wi-Fi",
  ],
  "Climatiseurs": [
    "Climatiseurs Split", "Climatiseurs Inverter", "Climatiseurs Portables",
    "Climatiseurs Muraux", "Climatiseurs Professionnels", "Accessoires & Installation",
  ],
  "TV & Audio": [
    "Smart TV", "Téléviseurs LED", "Téléviseurs QLED", "Téléviseurs OLED", "Barres de son",
    "Home Cinema", "Enceintes", "Casques Audio", "Accessoires TV",
  ],
  "Téléphones & Tablettes": [
    "Smartphones", "Téléphones classiques", "Tablettes", "Chargeurs", "Câbles",
    "Coques & Protection", "Écouteurs", "Power Banks", "Accessoires mobiles",
  ],
  "Mobilier": [
    "Bureaux", "Chaises de bureau", "Fauteuils", "Tables", "Armoires",
    "Étagères", "Meubles TV", "Mobilier Gaming", "Accessoires de bureau",
  ],
  "Électroménager": [
    "Réfrigérateurs", "Congélateurs", "Machines à laver", "Sèche-linge", "Lave-vaisselle",
    "Fours", "Micro-ondes", "Aspirateurs", "Petits électroménagers",
  ],
  "Gaming": [
    "Consoles", "Jeux vidéo", "PC Gaming", "Écrans Gaming", "Claviers Gaming",
    "Souris Gaming", "Casques Gaming", "Manettes", "Chaises Gaming", "Accessoires Gaming",
  ],
  "Électronique & Accessoires": [
    "Routeurs & Wi-Fi", "Onduleurs UPS", "Câbles & Adaptateurs", "Chargeurs", "Multiprises",
    "Batteries", "Stockage externe", "Accessoires électroniques", "Sécurité & Surveillance",
  ],
};

async function main() {
  // --- Admin account ---
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!", 10);
  await prisma.admin.upsert({
    where: { email: "admin@sarenza.example" },
    update: {},
    create: { email: "admin@sarenza.example", passwordHash, name: "Store Admin" },
  });

  // --- Categories + subcategories (idempotent) ---
  const subcategoryBySlug = new Map<string, { id: string; slug: string; parentSlug: string }>();

  let mainIndex = 0;
  for (const [mainName, subNames] of Object.entries(CATEGORY_TREE)) {
    const mainSlug = slugify(mainName);
    const main = await prisma.category.upsert({
      where: { slug: mainSlug },
      update: { name: mainName, sortOrder: mainIndex },
      create: { slug: mainSlug, name: mainName, sortOrder: mainIndex },
    });

    let subIndex = 0;
    for (const subName of subNames) {
      const subSlug = `${mainSlug}-${slugify(subName)}`;
      const sub = await prisma.category.upsert({
        where: { slug: subSlug },
        update: { name: subName, parentId: main.id, sortOrder: subIndex },
        create: { slug: subSlug, name: subName, parentId: main.id, sortOrder: subIndex },
      });
      subcategoryBySlug.set(subSlug, { id: sub.id, slug: subSlug, parentSlug: mainSlug });
      subIndex++;
    }
    mainIndex++;
  }

  // --- Brands ---
  const brandDefs = ["Nova", "Technix", "Lumen", "Coolix", "Ferro"];
  const brands = [];
  for (const name of brandDefs) {
    const slug = name.toLowerCase();
    brands.push(await prisma.brand.upsert({ where: { slug }, update: {}, create: { slug, name } }));
  }

  // --- Products — each one lives in a real subcategory (leaf category) ---
  const productDefs = [
    { name: "UltraBook Pro 15", sub: "informatique-ordinateurs-portables", brand: "technix", price: 1299, compareAtPrice: 1499 },
    { name: "Ecran incurve 27 QHD", sub: "informatique-ecrans", brand: "nova", price: 289, compareAtPrice: null },
    { name: "Climatiseur Split Inverter 12000 BTU", sub: "climatiseurs-climatiseurs-split", brand: "coolix", price: 749, compareAtPrice: 849 },
    { name: "Climatiseur Portable 9000 BTU", sub: "climatiseurs-climatiseurs-portables", brand: "coolix", price: 429, compareAtPrice: null },
    { name: "Smart TV QLED 55", sub: "tv-audio-smart-tv", brand: "lumen", price: 899, compareAtPrice: 1099 },
    { name: "Barre de son Home Cinema 5.1", sub: "tv-audio-barres-de-son", brand: "lumen", price: 219, compareAtPrice: null },
    { name: "Smartphone Nova X5", sub: "telephones-tablettes-smartphones", brand: "nova", price: 549, compareAtPrice: 619 },
    { name: "Tablette 10.5 128 Go", sub: "telephones-tablettes-tablettes", brand: "technix", price: 349, compareAtPrice: null },
    { name: "Bureau ajustable", sub: "mobilier-bureaux", brand: "ferro", price: 279, compareAtPrice: null },
    { name: "Chaise de bureau ergonomique", sub: "mobilier-chaises-de-bureau", brand: "ferro", price: 189, compareAtPrice: 229 },
    { name: "Refrigerateur combine 400L", sub: "electromenager-refrigerateurs", brand: "coolix", price: 899, compareAtPrice: null },
    { name: "Machine a laver 8kg", sub: "electromenager-machines-a-laver", brand: "technix", price: 549, compareAtPrice: 629 },
    { name: "Console Gaming NovaPlay X", sub: "gaming-consoles", brand: "nova", price: 499, compareAtPrice: null },
    { name: "Casque Gaming sans fil", sub: "gaming-casques-gaming", brand: "lumen", price: 129, compareAtPrice: 159 },
    { name: "Routeur Wi-Fi 6 Mesh", sub: "electronique-accessoires-routeurs-wi-fi", brand: "technix", price: 159, compareAtPrice: null },
    { name: "Onduleur UPS 1000VA", sub: "electronique-accessoires-onduleurs-ups", brand: "ferro", price: 89, compareAtPrice: null },
  ];

  for (const [i, p] of productDefs.entries()) {
    const subcategory = subcategoryBySlug.get(p.sub);
    if (!subcategory) throw new Error(`Seed error: unknown subcategory slug "${p.sub}"`);
    const brand = brands.find((b) => b.slug === p.brand)!;
    const slug = slugify(p.name);

    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: p.name,
        description:
          "Un produit sélectionné pour sa qualité et sa fiabilité, avec garantie constructeur et support après-vente.",
        sku: `SKU-${2000 + i}`,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? undefined,
        currency: "TND",
        stock: 30,
        isFeatured: i % 3 !== 2,
        isFlashOffer: p.compareAtPrice != null,
        rating: 4.2 + (i % 5) * 0.1,
        reviewCount: 15 + i * 6,
        categoryId: subcategory.id,
        brandId: brand.id,
        images: {
          create: [
            { url: `https://placehold.co/800x800?text=${encodeURIComponent(p.name)}`, publicId: `placeholder-${slug}-1`, sortOrder: 0 },
          ],
        },
      },
    });
  }

  // --- Advertisements (starter content — fully editable/deletable from the admin dashboard) ---
  const adDefs = [
    { title: "Nouvelle collection Informatique", description: "Découvrez nos derniers ordinateurs et accessoires.", imageUrl: "https://placehold.co/1600x600/163B7A/FFFFFF?text=Informatique", displayOrder: 0 },
    { title: "Climatiseurs — Offres de saison", description: "Installation incluse sur une sélection de modèles.", imageUrl: "https://placehold.co/1600x600/2F5AA8/FFFFFF?text=Climatiseurs", displayOrder: 1 },
    { title: "Gaming Zone", description: "Consoles, périphériques et accessoires gaming.", imageUrl: "https://placehold.co/1600x600/0F2B5C/FFFFFF?text=Gaming", displayOrder: 2 },
  ];
  for (const ad of adDefs) {
    const existing = await prisma.advertisement.findFirst({ where: { title: ad.title } });
    if (!existing) await prisma.advertisement.create({ data: ad });
  }

  // eslint-disable-next-line no-console
  console.log("Seed complete: 8 main categories, subcategories, brands, products, and advertisements.");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
