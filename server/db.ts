import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { User, Appeal, Notification, Department, AppealStatus, AppealCategory, UrgencyLevel, SentimentType } from "../src/types.js";

const DB_PATH = path.join(process.cwd(), "data", "smart_murojaat_db.json");

interface DBStructure {
  users: User[];
  passwords: Record<string, string>; // userId -> hashed_password
  appeals: Appeal[];
  notifications: Notification[];
  departments: Department[];
}

// SHA256 hashing for secure passport-style logins
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const defaultDepartments: Department[] = [
  {
    id: "dept_infrastructure",
    name: {
      en: "Landscaping & Roads Department",
      ru: "Департамент благоустройства и дорог",
      uz: "Obodonlashtirish va yo'llar bo'limi",
      kaa: "Abadanlastırıw hám jollar bólimi"
    },
    manager: "K. Genjebaev",
    totalAssigned: 0,
    totalResolved: 0
  },
  {
    id: "dept_utilities",
    name: {
      en: "Utilities & Energy Administration",
      ru: "Управление коммунальных услуг и энергеки",
      uz: "Kommunal xizmatlar va energiya boshqarmasi",
      kaa: "Kommunal xızmetler hám energiya basqarması"
    },
    manager: "M. Tleuov",
    totalAssigned: 0,
    totalResolved: 0
  },
  {
    id: "dept_social",
    name: {
      en: "Social Services & Welfare Department",
      ru: "Департамент социальных услуг и обеспечения",
      uz: "Ijtimoiy xizmatlar va ta'minot bo'limi",
      kaa: "Sociallıq xızmetler hám táminat bólimi"
    },
    manager: "A. Seytov",
    totalAssigned: 0,
    totalResolved: 0
  },
  {
    id: "dept_healthcare",
    name: {
      en: "Ministry of Healthcare (Regional Office)",
      ru: "Министерство здравоохранения (Рег. управление)",
      uz: "Sog'liqni saqlash vazirligi (Hududiy boshqarmasi)",
      kaa: "Densaulıqtı saqlaw ministrligi (Aymaqlıq basqarması)"
    },
    manager: "Dr. G. Embergenova",
    totalAssigned: 0,
    totalResolved: 0
  },
  {
    id: "dept_education",
    name: {
      en: "Ministry of Public Education (Regional Office)",
      ru: "Министерство народного образования (Рег. управление)",
      uz: "Xalq ta'limi vazirligi (Hududiy boshqarmasi)",
      kaa: "Xalq bilimlendiriw ministrligi (Aymaqlıq basqarması)"
    },
    manager: "B. Qutlimuratov",
    totalAssigned: 0,
    totalResolved: 0
  },
  {
    id: "dept_environment",
    name: {
      en: "Ecology & Forestry Committee",
      ru: "Комитет по экологии и лесному хозяйству",
      uz: "Ekologiya va o'rmon xo'jaligi qo'mitasi",
      kaa: "Ekologiya hám toǵay xojalıǵı komiteti"
    },
    manager: "S. Kamalov",
    totalAssigned: 0,
    totalResolved: 0
  }
];

// Helper to make mock history
function createHistory(status: AppealStatus, userName: string, daysAgo: number, note?: string) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `hist_${Math.random().toString(36).substr(2, 9)}`,
    status,
    changedBy: userName,
    timestamp: date.toISOString(),
    note
  };
}

function getPastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

// Generate realistic seeding database
function generateSeedData(): DBStructure {
  const passwords: Record<string, string> = {};

  const users: User[] = [
    {
      id: "u_citizen_1",
      username: "dilnoza",
      role: "citizen",
      firstName: "Dilnoza",
      lastName: "Mambetova",
      patronymic: "Pulatovna",
      email: "dilnoza.m@gmail.com",
      phone: "+998901234567",
      dob: "1991-04-12",
      region: "Nukus",
      address: "G'arezshizlik mahalla, 24-uy",
      passportMasked: "KA******4",
      createdAt: getPastDate(30)
    },
    {
      id: "u_citizen_2",
      username: "karim_nukus",
      role: "citizen",
      firstName: "Karim",
      lastName: "Bekjanov",
      patronymic: "Saparbaevich",
      email: "karim.bekjan@mail.ru",
      phone: "+998912345678",
      dob: "1985-09-21",
      region: "Kungrad",
      address: "Doslik jamoat xo'jaligi, Beruniy ko'chasi, 11",
      passportMasked: "KA******9",
      createdAt: getPastDate(25)
    },
    {
      id: "u_citizen_3",
      username: "alisher_kaa",
      role: "citizen",
      firstName: "Alisher",
      lastName: "Dosbergenov",
      patronymic: "Asqarovich",
      email: "alisher.d@gmail.com",
      phone: "+998933456789",
      dob: "1994-11-05",
      region: "Mo'ynoq",
      address: "Aral ko'chasi, 45-uy",
      passportMasked: "KA******1",
      createdAt: getPastDate(20)
    },
    {
      id: "u_admin",
      username: "admin",
      role: "admin",
      firstName: "Azat",
      lastName: "Sabirov",
      patronymic: "Urazbaevich",
      email: "azat.admin@hokimiyat.gov.uz",
      phone: "+998994567890",
      dob: "1980-01-15",
      region: "Nukus",
      address: "Hokimiyat binosi, 4-xona",
      passportMasked: "KA******5",
      createdAt: getPastDate(60)
    },
    {
      id: "u_super_admin",
      username: "hokim",
      role: "super_admin",
      firstName: "Amanbay",
      lastName: "Orynbaev",
      patronymic: "Tlesbaevich",
      email: "hokim@hokimiyat.gov.uz",
      phone: "+998909999999",
      dob: "1975-06-20",
      region: "Nukus",
      address: "Hokimiyat bosh binosi",
      passportMasked: "KA******0",
      createdAt: getPastDate(90)
    }
  ];

  // Set password hashes
  passwords["u_citizen_1"] = hashPassword("citizen123");
  passwords["u_citizen_2"] = hashPassword("citizen123");
  passwords["u_citizen_3"] = hashPassword("citizen123");
  passwords["u_admin"] = hashPassword("admin123");
  passwords["u_super_admin"] = hashPassword("hokim123");

  const appeals: Appeal[] = [
    {
      id: "app_1",
      citizenId: "u_citizen_1",
      citizenName: "Dilnoza Mambetova",
      citizenPhone: "+998901234567",
      citizenRegion: "Nukus",
      description: "Bizning ko'chamizda (G'arezshizlik ko'chasi) yo'llar juda xarob ahvolda. Chuqurlar ko'pligidan mashinalar yurishi qiyin, yomg'ir yoqqanda esa bolalar maktabga borishga qiynaladi. Iltimos, yo'limizni asfalt qilib bering.",
      address: "Nukus shahri, G'arezshizlik mahalla, 24-uy oldi",
      imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80",
      status: "in_progress",
      category: "infrastructure",
      urgency: "high",
      sentiment: "frustrated",
      aiSummary: "The road on G'arezshizlik Street in Nukus is full of potholes, making vehicle and child pedestrian passage extremely difficult, especially during rainy days.",
      suggestedDepartment: "dept_infrastructure",
      assignedDepartment: "dept_infrastructure",
      internalNotes: "Tuman yo'l boshqarmasi tomonidan tekshirildi. Navbatdagi asfaltlash dasturiga kiritildi.",
      publicResponse: "Hurmatli fuqaro, murojaatingiz o'rganildi. Yo'lingizni joriy ta'mirlash ishlari boshlandi va 20-iyulgacha yakunlanadi.",
      createdAt: getPastDate(15),
      updatedAt: getPastDate(12),
      history: [
        createHistory("new", "System (Gemini AI)", 15, "AI classified as Infrastructure with High Urgency"),
        createHistory("under_review", "Azat Sabirov", 14, "Murojaat ko'rib chiqishga olindi, mas'ullar belgilandi."),
        createHistory("in_progress", "Azat Sabirov", 12, "Yo'l boshqarmasiga topshiriq berildi va moliyaviy smeta tasdiqlandi.")
      ]
    },
    {
      id: "app_2",
      citizenId: "u_citizen_2",
      citizenName: "Karim Bekjanov",
      citizenPhone: "+998912345678",
      citizenRegion: "Kungrad",
      description: "Qo'ng'irot tumani Do'stlik jamoat xo'jaligida uch kundan beri elektr energiyasi deyarli yo'q. Kuniga faqat 1-2 soat berilyapti. Suv nasoslari ham ishlamay qoldi, ekinlar qurib ketmoqda. Iltimos yordam bering, aholi qiynalmoqda.",
      address: "Qo'ng'irot tumani, Do'stlik jamoat xo'jaligi",
      status: "new",
      category: "utilities",
      urgency: "critical",
      sentiment: "desperate",
      aiSummary: "Severe power outage lasting three days in Kungrad, causing water pumps to fail and crops to dry, leading to severe public distress.",
      suggestedDepartment: "dept_utilities",
      assignedDepartment: "dept_utilities",
      createdAt: getPastDate(2),
      updatedAt: getPastDate(2),
      history: [
        createHistory("new", "System (Gemini AI)", 2, "AI classified as Utilities with Critical Urgency due to severe water/power distress.")
      ]
    },
    {
      id: "app_3",
      citizenId: "u_citizen_3",
      citizenName: "Alisher Dosbergenov",
      citizenPhone: "+998933456789",
      citizenRegion: "Mo'ynoq",
      description: "Aral ko'chasida ichimlik suvi ta'minoti butunlay to'xtab qolgan. Oldin quvurlardan oz bo'lsa ham suv kelardi, hozir esa faqat tashiydigan suvga muhtojmiz. Bir chelak suvni 5000 so'mdan sotib olyapmiz. Suv quvurlarini almashtirib, markaziy suv yetkazishni qayta tiklashingizni so'raymiz.",
      address: "Mo'ynoq tumani, Aral ko'chasi",
      status: "under_review",
      category: "utilities",
      urgency: "high",
      sentiment: "angry",
      aiSummary: "Drinking water supply is completely halted on Aral Street in Mo'ynoq, forcing residents to purchase bucket water at premium prices.",
      suggestedDepartment: "dept_utilities",
      assignedDepartment: "dept_utilities",
      internalNotes: "Suv tarmoqlari boshqarmasining Nukus filialiga so'rov yuborildi. Hududdagi nasos stansiyasida nosozlik aniqlangan.",
      createdAt: getPastDate(8),
      updatedAt: getPastDate(6),
      history: [
        createHistory("new", "System (Gemini AI)", 8, "AI classified as Utilities with High Urgency"),
        createHistory("under_review", "Azat Sabirov", 6, "Suv xo'jaligi mas'ul xodimi jalb qilindi.")
      ]
    },
    {
      id: "app_4",
      citizenId: "u_citizen_1",
      citizenName: "Dilnoza Mambetova",
      citizenPhone: "+998901234567",
      citizenRegion: "Nukus",
      description: "Mahallamizdagi oilaviy poliklinikada shifokorlar va dori-darmonlar yetishmayapti. Keksa odamlar navbatda 3-4 soatlab turishga majbur bo'lishmoqda. Bolalar shifokori ham haftada faqat bir marta keladi.",
      address: "Nukus shahri, 12-sonli poliklinika",
      status: "resolved",
      category: "healthcare",
      urgency: "medium",
      sentiment: "frustrated",
      aiSummary: "The family clinic in Nukus lacks sufficient doctors and medicine supplies, causing long waiting queues for elderly citizens and low pediatrician availability.",
      suggestedDepartment: "dept_healthcare",
      assignedDepartment: "dept_healthcare",
      internalNotes: "Poliklinikaga qo'shimcha shtatlar ajratildi va shahar dorixonasidan dori-darmon ta'minoti yaxshilandi.",
      publicResponse: "Murojaatingiz bo'yicha 12-sonli poliklinikada dori-darmon ta'minoti nazoratga olindi. Ikki nafar umumiy amaliyot shifokori va bir nafar pediatr doimiy shtatga biriktirildi.",
      createdAt: getPastDate(25),
      updatedAt: getPastDate(10),
      history: [
        createHistory("new", "System (Gemini AI)", 25, "AI classified as Healthcare with Medium Urgency"),
        createHistory("under_review", "Azat Sabirov", 23, "Sog'liqni saqlash boshqarmasi mas'ullariga yo'naltirildi."),
        createHistory("in_progress", "Azat Sabirov", 18, "Yangi shifokorlar ishga qabul qilinmoqda va tibbiy jihozlar keltirilyapti."),
        createHistory("resolved", "Amanbay Orynbaev", 10, "Poliklinika shtatlari va dori-darmon yetkazib berish to'liq hal qilindi.")
      ]
    },
    {
      id: "app_5",
      citizenId: "u_citizen_2",
      citizenName: "Karim Bekjanov",
      citizenPhone: "+998912345678",
      citizenRegion: "Kungrad",
      description: "Qo'ng'irotdagi maktabda isitish tizimi juda yomon ahvolda. Qishda sinf xonalarida dars o'tish juda sovuq bo'ladi. Hozirdan isitish tizimini to'liq almashtirish yoki qozonxonani ta'mirlash kerak.",
      address: "Qo'ng'irot tumani, 5-sonli maktab",
      status: "in_progress",
      category: "education",
      urgency: "medium",
      sentiment: "neutral",
      aiSummary: "The heating system of School No. 5 in Kungrad is heavily degraded, and winter heating must be repaired or replaced preemptively.",
      suggestedDepartment: "dept_education",
      assignedDepartment: "dept_education",
      internalNotes: "Moliya bo'limi tomonidan joriy yilgi byudjet rejasidan mablag' ajratildi. Pudratchi aniqlanmoqda.",
      createdAt: getPastDate(12),
      updatedAt: getPastDate(10),
      history: [
        createHistory("new", "System (Gemini AI)", 12, "AI classified as Education with Medium Urgency"),
        createHistory("under_review", "Azat Sabirov", 11, "Xalq ta'limi boshqarmasiga loyiha smetasini tuzish topshirildi."),
        createHistory("in_progress", "Azat Sabirov", 10, "Ta'mirlash smetasi tasdiqlandi va mablag' ajratildi.")
      ]
    },
    {
      id: "app_6",
      citizenId: "u_citizen_3",
      citizenName: "Alisher Dosbergenov",
      citizenPhone: "+998933456789",
      citizenRegion: "Mo'ynoq",
      description: "Orol dengizining qurigan tubidan qum-tuz bo'ronlari ko'tarilishi tufayli hududimizda ekologik muammolar kuchaymoqda. Mahallamiz atrofida yashil qalqon (saksovul ekish) loyihalarini kuchaytirish kerak, daryolar oqimi ham pasaygan.",
      address: "Mo'ynoq tumani, Orolbo'yi hududi",
      status: "resolved",
      category: "environment",
      urgency: "low",
      sentiment: "neutral",
      aiSummary: "Requests intensification of 'green shield' (saxaul planting) projects around Mo'ynoq to combat sand and salt storms from the dried Aral Sea bed.",
      suggestedDepartment: "dept_environment",
      assignedDepartment: "dept_environment",
      internalNotes: "Ekologiya vazirligining hududiy bo'limi ushbu yilgi davlat dasturiga qo'shimcha saksovul maydonlarini ekishni kiritdi.",
      publicResponse: "Hurmatli fuqaro, bu yil Mo'ynoq tumani atrofida 10 ming gektardan ortiq maydonga saksovul urug'lari ekildi. Yashil qalqon yaratish davlat nazoratida.",
      createdAt: getPastDate(28),
      updatedAt: getPastDate(22),
      history: [
        createHistory("new", "System (Gemini AI)", 28, "AI classified as Environment with Low Urgency"),
        createHistory("under_review", "Azat Sabirov", 26, "Ekologiya qo'mitasiga tahliliy ma'lumot jo'natildi."),
        createHistory("resolved", "Amanbay Orynbaev", 22, "Dastur tasdiqlandi va saksovulzor ekish ishlari bo'yicha fuqaroga ma'lumot berildi.")
      ]
    },
    {
      id: "app_7",
      citizenId: "u_citizen_1",
      citizenName: "Dilnoza Mambetova",
      citizenPhone: "+998901234567",
      citizenRegion: "Nukus",
      description: "Yolg'iz ona bo'lganim sababli kam ta'minlangan oilalarga beriladigan ijtimoiy nafaqa olishda muammoga duch keldim. Mahalla raisi turli bahonalar bilan arizamni qabul qilmayapti. Iltimos, nafaqa olishimga yordam bering.",
      address: "Nukus shahri, Do'stlik mahallasi",
      status: "new",
      category: "social_services",
      urgency: "high",
      sentiment: "frustrated",
      aiSummary: "A single mother experiences bureaucratic obstacles with a mahalla chairperson who rejects her social assistance allowance application without valid grounds.",
      suggestedDepartment: "dept_social",
      assignedDepartment: "dept_social",
      createdAt: getPastDate(1),
      updatedAt: getPastDate(1),
      history: [
        createHistory("new", "System (Gemini AI)", 1, "AI classified as Social Services with High Urgency due to welfare/corruption elements.")
      ]
    }
  ];

  const notifications: Notification[] = [
    {
      id: "not_1",
      userId: "u_citizen_1",
      title: {
        en: "Appeal Status Update",
        ru: "Обновление статуса обращения",
        uz: "Murojaat holati yangilandi",
        kaa: "Múracaat jaǵdayı jańalandı"
      },
      message: {
        en: "Your appeal regarding 'pot holes on G'arezshizlik street' is now In Progress.",
        ru: "Ваше обращение по поводу 'дорог на улице Гарезшизлик' переведено в статус В процессе.",
        uz: "Sizning 'G'arezshizlik ko'chasidagi yo'llar' bo'yicha murojaatingiz 'Jarayonda' holatiga o'tkazildi.",
        kaa: "Sizdiń 'G'arezshizlik kóshesindegi jollar' boyınsha múracaatıńız 'Processte' jaǵdayına ótkizildi."
      },
      read: false,
      createdAt: getPastDate(12)
    },
    {
      id: "not_2",
      userId: "u_citizen_1",
      title: {
        en: "Appeal Resolved",
        ru: "Обращение решено",
        uz: "Murojaatingiz hal etildi",
        kaa: "Múracaatıńız sheshildi"
      },
      message: {
        en: "Your appeal regarding healthcare clinic No. 12 has been successfully resolved. Read the Hokimiyat reply.",
        ru: "Ваше обращение по поводу поликлиники №12 успешно решено. Ознакомьтесь с ответом Хокимията.",
        uz: "Sizning 12-sonli poliklinika bo'yicha murojaatingiz muvaffaqiyatli hal qilindi. Hokimiyat javobini o'qing.",
        kaa: "Sizdiń 12-sanlı poliklinika boyınsha múracaatıńız tabıslı sheshildi. Hákimlik juwabın oqıń."
      },
      read: true,
      createdAt: getPastDate(10)
    }
  ];

  // Map counts to departments
  const depts = defaultDepartments.map(d => {
    const assigned = appeals.filter(a => a.assignedDepartment === d.id).length;
    const resolved = appeals.filter(a => a.assignedDepartment === d.id && a.status === "resolved").length;
    return {
      ...d,
      totalAssigned: assigned,
      totalResolved: resolved
    };
  });

  return {
    users,
    passwords,
    appeals,
    notifications,
    departments: depts
  };
}

export class DBManager {
  private dbCache: DBStructure | null = null;
  private isLoaded = false;

  async load(): Promise<DBStructure> {
    if (this.isLoaded && this.dbCache) {
      return this.dbCache;
    }

    try {
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      const raw = await fs.readFile(DB_PATH, "utf-8");
      this.dbCache = JSON.parse(raw);
      this.isLoaded = true;
      
      // Trigger background translation for existing appeals that lack translations
      this.autoTranslateExistingAppeals().catch(err => {
        console.error("Error in background auto-translation:", err);
      });

      return this.dbCache!;
    } catch (e) {
      // Create and write seed data if database file doesn't exist
      const seed = generateSeedData();
      await this.saveData(seed);
      this.dbCache = seed;
      this.isLoaded = true;

      this.autoTranslateExistingAppeals().catch(err => {
        console.error("Error in background auto-translation on seed:", err);
      });

      return seed;
    }
  }

  async autoTranslateExistingAppeals(): Promise<void> {
    const db = await this.load();
    let updatedAny = false;

    try {
      const { translateAppealContent } = await import("./gemini.js");

      for (const appeal of db.appeals) {
        if (!appeal.translations) {
          console.log(`Auto-translating existing appeal #${appeal.id}...`);
          try {
            const translations = await translateAppealContent(
              appeal.description,
              appeal.aiSummary || "",
              appeal.category,
              appeal.publicResponse || ""
            );
            appeal.translations = translations;
            updatedAny = true;
          } catch (error) {
            console.error(`Failed to auto-translate appeal #${appeal.id}:`, error);
          }
        }
      }

      if (updatedAny) {
        await this.save();
        console.log("Auto-translation of existing appeals completed and saved to database.");
      }
    } catch (err) {
      console.error("Error loading translation module on startup:", err);
    }
  }

  private async saveData(data: DBStructure): Promise<void> {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    // Write atomically
    const tempPath = `${DB_PATH}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tempPath, DB_PATH);
  }

  async save(): Promise<void> {
    if (this.dbCache) {
      await this.saveData(this.dbCache);
    }
  }

  async getUsers(): Promise<User[]> {
    const db = await this.load();
    return db.users;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const db = await this.load();
    return db.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await this.load();
    return db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  async verifyPassword(userId: string, passwordPlain: string): Promise<boolean> {
    const db = await this.load();
    const storedHash = db.passwords[userId];
    if (!storedHash) return false;
    return storedHash === hashPassword(passwordPlain);
  }

  async createUser(user: Omit<User, "id" | "createdAt">, passwordPlain: string): Promise<User> {
    const db = await this.load();
    const newUser: User = {
      ...user,
      id: `u_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    db.passwords[newUser.id] = hashPassword(passwordPlain);
    await this.save();
    return newUser;
  }

  async getAppeals(): Promise<Appeal[]> {
    const db = await this.load();
    return db.appeals;
  }

  async getAppealById(id: string): Promise<Appeal | undefined> {
    const db = await this.load();
    return db.appeals.find(a => a.id === id);
  }

  async getAppealsByCitizen(citizenId: string): Promise<Appeal[]> {
    const db = await this.load();
    return db.appeals.filter(a => a.citizenId === citizenId);
  }

  async createAppeal(appeal: Omit<Appeal, "id" | "createdAt" | "updatedAt" | "history">): Promise<Appeal> {
    const db = await this.load();
    const newAppeal: Appeal = {
      ...appeal,
      id: `app_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `hist_${Math.random().toString(36).substr(2, 9)}`,
          status: "new",
          changedBy: "System (Gemini AI)",
          timestamp: new Date().toISOString(),
          note: "Appeal registered, auto-classified by AI"
        }
      ]
    };

    if (!newAppeal.translations) {
      try {
        const { translateAppealContent } = await import("./gemini.js");
        newAppeal.translations = await translateAppealContent(
          newAppeal.description,
          newAppeal.aiSummary || "",
          newAppeal.category,
          newAppeal.publicResponse || ""
        );
      } catch (err) {
        console.error("Failed to translate new appeal:", err);
      }
    }

    db.appeals.push(newAppeal);

    // Update department stats
    if (appeal.assignedDepartment) {
      const dept = db.departments.find(d => d.id === appeal.assignedDepartment);
      if (dept) {
        dept.totalAssigned += 1;
      }
    }

    await this.save();
    return newAppeal;
  }

  async updateAppeal(id: string, updates: Partial<Appeal>, updatedBy: string, statusNote?: string): Promise<Appeal | undefined> {
    const db = await this.load();
    const appeal = db.appeals.find(a => a.id === id);
    if (!appeal) return undefined;

    const oldStatus = appeal.status;
    const oldDept = appeal.assignedDepartment;

    // Apply updates
    Object.assign(appeal, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    // Regenerate translations if key fields changed
    if (updates.description || updates.aiSummary || updates.category || updates.publicResponse !== undefined) {
      try {
        const { translateAppealContent } = await import("./gemini.js");
        appeal.translations = await translateAppealContent(
          appeal.description,
          appeal.aiSummary || "",
          appeal.category,
          appeal.publicResponse || ""
        );
      } catch (err) {
        console.error("Failed to translate appeal updates:", err);
      }
    }

    // If status changed, record to history
    if (updates.status && updates.status !== oldStatus) {
      appeal.history.push({
        id: `hist_${Math.random().toString(36).substr(2, 9)}`,
        status: updates.status,
        changedBy: updatedBy,
        timestamp: new Date().toISOString(),
        note: statusNote || `Status changed from ${oldStatus} to ${updates.status}`
      });

      // Create a notification for the citizen
      const langTitles = {
        en: "Appeal Status Updated",
        ru: "Статус обращения изменен",
        uz: "Murojaat holati o'zgardi",
        kaa: "Múracaat jaǵdayı ózgerdi"
      };

      const langMessages = {
        en: `Your appeal regarding "${appeal.description.substring(0, 30)}..." has been updated to "${updates.status.replace("_", " ")}".`,
        ru: `Ваше обращение по поводу "${appeal.description.substring(0, 30)}..." переведено в статус "${updates.status}".`,
        uz: `Sizning "${appeal.description.substring(0, 30)}..." bo'yicha yuborgan murojaatingiz holati "${updates.status}" deb o'zgartirildi.`,
        kaa: `Sizdiń "${appeal.description.substring(0, 30)}..." boyınsha jollaǵan múracaatıńız jaǵdayı "${updates.status}" dep ózgertildi.`
      };

      db.notifications.push({
        id: `not_${Math.random().toString(36).substr(2, 9)}`,
        userId: appeal.citizenId,
        title: langTitles,
        message: langMessages,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    // Recalculate department stats
    db.departments = db.departments.map(d => {
      const assigned = db.appeals.filter(a => a.assignedDepartment === d.id).length;
      const resolved = db.appeals.filter(a => a.assignedDepartment === d.id && a.status === "resolved").length;
      return {
        ...d,
        totalAssigned: assigned,
        totalResolved: resolved
      };
    });

    await this.save();
    return appeal;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const db = await this.load();
    return db.notifications.filter(n => n.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const db = await this.load();
    const notification = db.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      await this.save();
      return true;
    }
    return false;
  }

  async getDepartments(): Promise<Department[]> {
    const db = await this.load();
    return db.departments;
  }
}

export const dbManager = new DBManager();
