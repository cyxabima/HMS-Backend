import type { Request, Response, NextFunction } from "express";
import { db } from "../db/db.js";
import { patients } from "../db/schema/index.js";
import { eq, count, or, ilike, desc, like, sql, gte } from "drizzle-orm";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";

type Patient = typeof patients.$inferSelect;

export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, cnic, gender, dateOfBirth, phone, bloodGroup, address } = req.body;

    if (!firstName || !lastName || !gender || !dateOfBirth || !phone) {
      throw new ApiError(400, "BAD_REQUEST", "Missing required patient fields.");
    }

    const currentYear = new Date().getFullYear();
    const prefix = `MR-${currentYear}-`;

    // getting last mrNumber stored
    const [lastPatient] = await db
      .select({ mrNumber: patients.mrNumber })
      .from(patients)
      .where(like(patients.mrNumber, `${prefix}%`))
      .orderBy(desc(patients.mrNumber))
      .limit(1);

    // Parse the sequence and increment and making defaults to 1 if no patients exist this year
    let sequence = 1;
    if (lastPatient && lastPatient.mrNumber) {
      const lastSeq = parseInt(lastPatient.mrNumber.split("-")[2] as string, 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }

    // Format to MR-2026-0001
    const newMrNumber = `${prefix}${sequence.toString().padStart(4, "0")}`;

    const [newPatient] = await db.insert(patients).values({
      mrNumber: newMrNumber,
      firstName,
      lastName,
      cnic: cnic || null,
      gender: gender.toUpperCase(),
      dateOfBirth: new Date(dateOfBirth),
      phone,
      bloodGroup,
      address,
    }).returning();

    if (!newPatient) throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Failed to register patient");

    return res.status(201).json(new ApiResponse<Patient>(201, newPatient, "Patient registered successfully"));
  } catch (error) {
    // TODO: pg error yoy know that
    if ((error as any).code === "23505") {
      return next(new ApiError(409, "CONFLICT", "A patient with this CNIC already exists."));
    }
    next(error);
  }
};



// TODO: add filter by date too in getPatients and export csv
export const getPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const offset = (page - 1) * limit;


    // this where condition is used to make a where clause can have mr number and other things too
    let whereCondition = undefined;
    if (search.trim() !== "") {
      const searchPattern = `%${search.trim()}%`;
      whereCondition = or(
        ilike(patients.mrNumber, searchPattern),
        ilike(patients.firstName, searchPattern),
        ilike(patients.lastName, searchPattern),
        ilike(patients.cnic, searchPattern),
        ilike(patients.phone, searchPattern)
      );
    }

    const patientsData = await db
      .select()
      .from(patients)
      .where(whereCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(patients.createdAt));

    // for pagination we are finding metadata
    const [countResult] = await db
      .select({ val: count() })
      .from(patients)
      .where(whereCondition);

    if (!countResult) {
      throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Failed to get total doctor")
    }
    const totalCount = Number(countResult.val);
    const totalPages = Math.ceil(totalCount / limit);

    const responsePayload = {
      patients: patientsData,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
      },
    };

    return res.status(200).json(new ApiResponse<typeof responsePayload>(200, responsePayload, "Patients fetched"));
  } catch (error) {
    next(error);
  }
};

export const getPatientStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalRes] = await db.select({ val: count() }).from(patients);

    if (!totalRes) {
      throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Failed to get total patients count")
    }

    // for finding the patients new this weak
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [newThisWeekRes] = await db
      .select({ val: count() })
      .from(patients)
      .where(gte(patients.createdAt, oneWeekAgo));

    if (!newThisWeekRes) {
      throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Failed to fetched new patients this week")
    }


    // This returns an array like: [{ gender: 'MALE', count: 55 }, { gender: 'FEMALE', count: 44 }]
    const demographicsData = await db
      .select({
        gender: patients.gender,
        count: count()
      })
      .from(patients)
      .groupBy(patients.gender);


    if (!demographicsData) {
      throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Failed to fetched patients demographicsData")
    }


    // therefore we need to convert the that array into simple object
    const demographics = { male: 0, female: 0, other: 0, total: 0 };
    demographicsData.forEach((row) => {
      const g = row.gender.toLowerCase();
      if (g === 'male' || g === 'female' || g === 'other') {
        demographics[g] = Number(row.count);
      }
    });
    demographics.total = (demographics.male + demographics.female + demographics.other)

    const stats = {
      totalPatients: Number(totalRes.val),
      newThisWeek: Number(newThisWeekRes.val),
      demographics,
    };

    return res.status(200).json(new ApiResponse<typeof stats>(200, stats, "Stats fetched"));
  } catch (error) {
    next(error);
  }
};

export const exportPatientsCsv = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string) || "";

    // Build the exact same search condition you used in getPatients
    let whereCondition = undefined;
    if (search.trim() !== "") {
      const searchPattern = `%${search.trim()}%`;
      whereCondition = or(
        ilike(patients.mrNumber, searchPattern),
        ilike(patients.firstName, searchPattern),
        ilike(patients.lastName, searchPattern),
        ilike(patients.cnic, searchPattern),
        ilike(patients.phone, searchPattern)
      );
    }

    const patientsData = await db
      .select()
      .from(patients)
      .where(whereCondition)
      .orderBy(desc(patients.createdAt));

    // simple csv builder
    const headers = ["MR Number", "First Name", "Last Name", "CNIC", "Phone", "Gender", "Address"];

    const csvRows = patientsData.map((p) => {
      // address may have comma so csv can break add address in quotes
      const safeAddress = p.address ? `"${p.address.replace(/"/g, '""')}"` : '""';

      return [
        p.mrNumber,
        p.firstName,
        p.lastName,
        p.cnic || "N/A",
        p.phone,
        p.gender,
        safeAddress
      ].join(","); // Join columns with commas
    });

    const csvString = [headers.join(","), ...csvRows].join("\n");

    // Set HTTP Headers to force a file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="patients_export_${new Date().toISOString().split('T')[0]}.csv"`);

    //  Send the raw string so that on frontend we can handel blobs
    return res.status(200).send(csvString);

  } catch (error) {
    next(error);
  }
};
