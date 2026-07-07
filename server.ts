import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { dbManager } from "./server/db.js";
import { analyzeAppealText, answerChatQuestion } from "./server/gemini.js";
import { User, UserRole, AppealStatus, AppealCategory, UrgencyLevel, SentimentType, Appeal } from "./src/types.js";
import dotenv from "dotenv";

dotenv.config();

// Custom types to extend Express request with parsed user details
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON request body parser with larger size limit for base64 image attachments
  app.use(express.json({ limit: "15mb" }));

  // Middleware: Authenticate requests using a custom robust base64 JWT-like token
  app.use(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
        if (decoded && decoded.exp > Date.now()) {
          req.user = {
            userId: decoded.userId,
            role: decoded.role as UserRole
          };
        }
      } catch (e) {
        // Silently skip invalid tokens
      }
    }
    next();
  });

  // Guard: require authentication
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Authentication is required." });
    }
    next();
  };

  // Guard: require specific role
  const requireRole = (allowedRoles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: "Forbidden. Insufficient permissions." });
      }
      next();
    };
  };

  // ---------------------------------------------------------
  // 1. AUTHENTICATION API
  // ---------------------------------------------------------

  // Register Citizen
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const {
      username,
      password,
      firstName,
      lastName,
      patronymic,
      email,
      phone,
      dob,
      region,
      address,
      passport
    } = req.body;

    // Strict validation
    if (!username || !password || !firstName || !lastName || !email || !phone || !dob) {
      return res.status(400).json({ error: "Please fill in all required registration fields." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Phone number must match +998XXXXXXXXX format." });
    }

    try {
      const existingUser = await dbManager.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username is already registered." });
      }

      // Mask passport series for security/PII guidelines
      let passportMasked = "";
      if (passport) {
        passportMasked = passport.substring(0, 2) + "******" + passport.substring(passport.length - 1);
      }

      const user = await dbManager.createUser({
        username,
        role: "citizen",
        firstName,
        lastName,
        patronymic,
        email,
        phone,
        dob,
        region,
        address,
        passportMasked
      }, password);

      // Create login token
      const exp = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      const token = Buffer.from(JSON.stringify({ userId: user.id, role: user.role, exp })).toString("base64");

      res.status(201).json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error during registration." });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Please enter username and password." });
    }

    try {
      const user = await dbManager.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password." });
      }

      const isValid = await dbManager.verifyPassword(user.id, password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid username or password." });
      }

      // Create token
      const exp = Date.now() + 24 * 60 * 60 * 1000;
      const token = Buffer.from(JSON.stringify({ userId: user.id, role: user.role, exp })).toString("base64");

      res.json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error during sign in." });
    }
  });

  // Get current user profile
  app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await dbManager.getUserById(req.user!.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  });

  // AI Smart Assistant Chat
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    try {
      const responseText = await answerChatQuestion(message, history || []);
      res.json({ response: responseText });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error during chat processing." });
    }
  });


  // ---------------------------------------------------------
  // 2. APPEALS API
  // ---------------------------------------------------------

  // Submit New Appeal Publicly (No login required - creates guest/citizen account automatically)
  app.post("/api/appeals/public", async (req: Request, res: Response) => {
    const {
      firstName,
      lastName,
      patronymic,
      phone,
      passport,
      description,
      address,
      imageUrl
    } = req.body;

    if (!firstName || !lastName || !phone || !passport || !description || !address) {
      return res.status(400).json({ error: "Iltimos, barcha majburiy maydonlarni to'ldiring (Ism, Familiya, Telefon, Pasport, Murojaat matni va Manzil)." });
    }

    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak." });
    }

    try {
      // Generate masked passport for security
      const cleanPassport = passport.trim().toUpperCase();
      const passportMasked = cleanPassport.length > 4 
        ? cleanPassport.substring(0, 2) + "******" + cleanPassport.substring(cleanPassport.length - 1)
        : "KA******";

      // Try to find if user with this phone or username exists, or create a guest citizen
      let citizen = await dbManager.getUserByUsername(phone);
      if (!citizen) {
        // Create user on-the-fly
        citizen = await dbManager.createUser({
          username: phone, // phone is unique username
          role: "citizen",
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          patronymic: patronymic ? patronymic.trim() : "",
          email: `${phone.replace("+", "")}@smartmurojaat.uz`,
          phone,
          dob: "1990-01-01", // Default DOB since tuman portal handles immediate issues
          region: "Shomanay", // Single specific tuman
          address: address.trim(),
          passportMasked
        }, "citizen123"); // Default standard password for simplicity
      }

      // Load existing unique categories to pass to Gemini
      const appealsList = await dbManager.getAppeals();
      const existingCategories = Array.from(new Set(appealsList.map(a => a.category).filter(Boolean)));

      // Run Gemini dynamic classification
      const aiAnalysis = await analyzeAppealText(description, existingCategories);

      if (aiAnalysis.isFlaggedInappropriate) {
        return res.status(400).json({ error: "Sizning murojaatingiz yuborilmadi. Siz 18+ga oid so'z aytdingiz" });
      }

      const appeal = await dbManager.createAppeal({
        citizenId: citizen.id,
        citizenName: `${citizen.lastName} ${citizen.firstName} ${citizen.patronymic || ""}`.trim(),
        citizenPhone: citizen.phone,
        citizenRegion: "Shomanay", // Single specific region
        citizenPassportMasked: passportMasked,
        description,
        address,
        imageUrl,
        status: "new",
        category: aiAnalysis.category,
        urgency: aiAnalysis.urgency,
        sentiment: aiAnalysis.sentiment,
        aiSummary: aiAnalysis.summary,
        suggestedDepartment: aiAnalysis.suggested_department,
        assignedDepartment: aiAnalysis.suggested_department
      });

      // Create login token for automatic post-submission authentication
      const exp = Date.now() + 24 * 60 * 60 * 1000;
      const token = Buffer.from(JSON.stringify({ userId: citizen.id, role: citizen.role, exp })).toString("base64");

      res.status(201).json({ token, user: citizen, appeal });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Murojaatni yuborishda texnik xatolik yuz berdi." });
    }
  });

  // Submit New Appeal (Authenticated Citizen)
  app.post("/api/appeals", requireAuth, requireRole(["citizen"]), async (req: AuthenticatedRequest, res: Response) => {
    const { description, address, imageUrl } = req.body;
    if (!description || !address) {
      return res.status(400).json({ error: "Please provide a description and location/address." });
    }

    try {
      const citizen = await dbManager.getUserById(req.user!.userId);
      if (!citizen) {
        return res.status(404).json({ error: "Citizen profile not found." });
      }

      // Load existing categories for dynamic matching
      const appealsList = await dbManager.getAppeals();
      const existingCategories = Array.from(new Set(appealsList.map(a => a.category).filter(Boolean)));

      // Automatically run Gemini Analysis in the backend
      const aiAnalysis = await analyzeAppealText(description, existingCategories);

      if (aiAnalysis.isFlaggedInappropriate) {
        return res.status(400).json({ error: "Sizning murojaatingiz yuborilmadi. Siz 18+ga oid so'z aytdingiz" });
      }

      const appeal = await dbManager.createAppeal({
        citizenId: citizen.id,
        citizenName: `${citizen.lastName} ${citizen.firstName} ${citizen.patronymic || ""}`.trim(),
        citizenPhone: citizen.phone,
        citizenRegion: citizen.region || "Shomanay",
        citizenPassportMasked: citizen.passportMasked,
        description,
        address,
        imageUrl,
        status: "new",
        category: aiAnalysis.category,
        urgency: aiAnalysis.urgency,
        sentiment: aiAnalysis.sentiment,
        aiSummary: aiAnalysis.summary,
        suggestedDepartment: aiAnalysis.suggested_department,
        assignedDepartment: aiAnalysis.suggested_department // Auto-route initially
      });

      res.status(201).json(appeal);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to submit appeal." });
    }
  });

  // List Appeals (Supports Role-based filters)
  app.get("/api/appeals", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const role = req.user!.role;
      const userId = req.user!.userId;

      let list: Appeal[] = [];

      if (role === "citizen") {
        // Citizens can only view their own appeals
        list = await dbManager.getAppealsByCitizen(userId);
      } else {
        // Admins and Hokim can view all appeals
        list = await dbManager.getAppeals();

        // Apply filters
        const { category, status, urgency, region, search } = req.query;

        if (category) {
          list = list.filter(a => a.category === category);
        }
        if (status) {
          list = list.filter(a => a.status === status);
        }
        if (urgency) {
          list = list.filter(a => a.urgency === urgency);
        }
        if (region) {
          list = list.filter(a => a.citizenRegion?.toLowerCase() === (region as string).toLowerCase());
        }
        if (search) {
          const q = (search as string).toLowerCase();
          list = list.filter(a =>
            a.citizenName.toLowerCase().includes(q) ||
            a.citizenPhone.includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.address.toLowerCase().includes(q) ||
            a.id.toLowerCase().includes(q)
          );
        }
      }

      // Sort appeals: newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load appeals list." });
    }
  });

  // Get Single Appeal Details
  app.get("/api/appeals/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const appeal = await dbManager.getAppealById(req.params.id);
      if (!appeal) {
        return res.status(404).json({ error: "Appeal not found." });
      }

      // Citizens can only fetch their own appeals
      if (req.user!.role === "citizen" && appeal.citizenId !== req.user!.userId) {
        return res.status(403).json({ error: "Forbidden. Access denied." });
      }

      res.json(appeal);
    } catch (err) {
      res.status(500).json({ error: "Failed to get appeal details." });
    }
  });

  // Update Appeal Status / Review (Admin and Super Admin only)
  app.put("/api/appeals/:id", requireAuth, requireRole(["admin", "super_admin"]), async (req: AuthenticatedRequest, res: Response) => {
    const { status, assignedDepartment, internalNotes, publicResponse, note } = req.body;

    try {
      const admin = await dbManager.getUserById(req.user!.userId);
      if (!admin) {
        return res.status(404).json({ error: "Admin profile not found." });
      }

      const adminName = `${admin.lastName} ${admin.firstName} (${admin.role === "super_admin" ? "Hokim" : "Staff"})`;

      const updates: Partial<Appeal> = {};
      if (status) updates.status = status as AppealStatus;
      if (assignedDepartment) updates.assignedDepartment = assignedDepartment;
      if (internalNotes !== undefined) updates.internalNotes = internalNotes;
      if (publicResponse !== undefined) updates.publicResponse = publicResponse;

      const updated = await dbManager.updateAppeal(req.params.id, updates, adminName, note);
      if (!updated) {
        return res.status(404).json({ error: "Appeal not found." });
      }

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update appeal." });
    }
  });


  // ---------------------------------------------------------
  // 3. ANALYTICS & STATISTICS API (Admin & Hokim only)
  // ---------------------------------------------------------
  app.get("/api/stats", requireAuth, requireRole(["admin", "super_admin"]), async (req: Request, res: Response) => {
    try {
      const appeals = await dbManager.getAppeals();
      const departments = await dbManager.getDepartments();

      const total = appeals.length;
      const resolved = appeals.filter(a => a.status === "resolved").length;
      const pending = appeals.filter(a => ["new", "under_review", "in_progress", "postponed"].includes(a.status)).length;
      const rejected = appeals.filter(a => ["rejected", "unresolvable"].includes(a.status)).length;

      // Status breakdown
      const statusCounts = {
        new: appeals.filter(a => a.status === "new").length,
        under_review: appeals.filter(a => a.status === "under_review").length,
        in_progress: appeals.filter(a => a.status === "in_progress").length,
        postponed: appeals.filter(a => a.status === "postponed").length,
        resolved: resolved,
        rejected: appeals.filter(a => a.status === "rejected").length,
        unresolvable: appeals.filter(a => a.status === "unresolvable").length
      };

      // Urgency distribution
      const urgencyCounts = {
        low: appeals.filter(a => a.urgency === "low").length,
        medium: appeals.filter(a => a.urgency === "medium").length,
        high: appeals.filter(a => a.urgency === "high").length,
        critical: appeals.filter(a => a.urgency === "critical").length
      };

      // Category breakdown (Dynamic based on real unique categories in appeals database)
      const uniqueCategories = Array.from(new Set(appeals.map(a => a.category).filter(Boolean)));
      const categoryBreakdown = uniqueCategories.map(cat => ({
        key: cat,
        count: appeals.filter(a => a.category === cat).length,
        resolved: appeals.filter(a => a.category === cat && a.status === "resolved").length
      }));

      // Region breakdown
      const regions = ["Nukus", "Kungrad", "Khodjeli", "Chimbay", "Ellikkala", "Beruni", "Mo'ynoq"];
      const regionBreakdown = regions.map(reg => ({
        region: reg,
        count: appeals.filter(a => a.citizenRegion?.toLowerCase() === reg.toLowerCase()).length,
        resolved: appeals.filter(a => a.citizenRegion?.toLowerCase() === reg.toLowerCase() && a.status === "resolved").length
      }));

      // Average resolution time (overall in hours)
      let totalResolutionTimeMs = 0;
      let resolvedCount = 0;

      appeals.forEach(a => {
        if (a.status === "resolved") {
          const resolvedHistory = a.history.find(h => h.status === "resolved");
          if (resolvedHistory) {
            const start = new Date(a.createdAt).getTime();
            const end = new Date(resolvedHistory.timestamp).getTime();
            totalResolutionTimeMs += (end - start);
            resolvedCount++;
          }
        }
      });

      const avgResolutionHours = resolvedCount > 0
        ? Math.round((totalResolutionTimeMs / (1000 * 60 * 60)) / resolvedCount)
        : 24; // Default to 24 hours if none resolved yet

      // Oldest unresolved appeals (up to 5)
      const oldestUnresolved = appeals
        .filter(a => a.status !== "resolved" && a.status !== "rejected")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, 5);

      // Appeals over time (group by last 7 days)
      const appealsOverTime = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dateKey = d.toDateString();

        const count = appeals.filter(a => {
          const appealDate = new Date(a.createdAt).toDateString();
          return appealDate === dateKey;
        }).length;

        const resolvedOnDay = appeals.filter(a => {
          const resolvedHistory = a.history.find(h => h.status === "resolved");
          if (resolvedHistory) {
            return new Date(resolvedHistory.timestamp).toDateString() === dateKey;
          }
          return false;
        }).length;

        appealsOverTime.push({
          date: dayStr,
          submitted: count,
          resolved: resolvedOnDay
        });
      }

      res.json({
        kpis: {
          total,
          resolved,
          pending,
          rejected,
          avgResolutionHours
        },
        statusCounts,
        urgencyCounts,
        categoryBreakdown,
        regionBreakdown,
        appealsOverTime,
        oldestUnresolved,
        departments
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate statistics." });
    }
  });


  // ---------------------------------------------------------
  // 4. NOTIFICATIONS API
  // ---------------------------------------------------------

  // Get notifications
  app.get("/api/notifications", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const notifications = await dbManager.getNotifications(req.user!.userId);
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch notifications." });
    }
  });

  // Mark notification read
  post("/api/notifications/:id/read", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await dbManager.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to mark notification as read." });
    }
  });


  // ---------------------------------------------------------
  // 5. DEPARTMENTS API
  // ---------------------------------------------------------
  app.get("/api/departments", requireAuth, async (req: Request, res: Response) => {
    try {
      const depts = await dbManager.getDepartments();
      res.json(depts);
    } catch (err) {
      res.status(500).json({ error: "Failed to load departments." });
    }
  });


  // ---------------------------------------------------------
  // VITE & STATIC FILES MIDDLEWARE
  // ---------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Fallback route registration error fix helper: Express has .post but some typings need direct call
  function post(route: string, ...handlers: any[]) {
    app.post(route, ...handlers);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Murojaat server running on http://localhost:${PORT} under environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
