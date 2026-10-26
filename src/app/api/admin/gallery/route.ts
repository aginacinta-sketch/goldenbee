import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, unauthorized, badRequest } from "@/lib/admin";
import { serializeModel } from "@/lib/serialize";
import { pastikanTabelGaleri } from "@/lib/galeri";

export const dynamic = "force-dynamic";

/** GET /api/admin/gallery — seluruh foto galeri (termasuk nonaktif) untuk panel admin. */
export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return unauthorized();
  await pastikanTabelGaleri();
  const items = await db.galleryItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return Response.json(items.map(serializeModel));
}

/**
 * POST /api/admin/gallery — tambah foto galeri.
 * Menerima SATU foto ({ image }) — unggah banyak foto ditangani UI admin
 * dengan memanggil endpoint ini berulang (satu per berkas).
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return unauthorized();
  try {
    await pastikanTabelGaleri();
    const body = (await req.json()) as Record<string, unknown>;
    const image = String(body.image ?? "").trim();
    if (!image) return badRequest("Foto galeri wajib diisi.");
    const maxOrder = await db.galleryItem.aggregate({ _max: { sortOrder: true } });
    const item = await db.galleryItem.create({
      data: {
        image,
        caption: String(body.caption ?? "").trim(),
        active: Boolean(body.active ?? true),
        sortOrder: Number(body.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1),
      },
    });
    return Response.json(serializeModel(item), { status: 201 });
  } catch (e) {
    return Response.json({ error: "Gagal menambah foto galeri" }, { status: 500 });
  }
}
