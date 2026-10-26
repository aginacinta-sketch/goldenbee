import { db } from "@/lib/db";
import { serializeModel } from "@/lib/serialize";
import { pastikanTabelGaleri } from "@/lib/galeri";

export const dynamic = "force-dynamic";

/** GET /api/gallery — daftar foto galeri AKTIF untuk website (urut sortOrder). */
export async function GET() {
  try {
    await pastikanTabelGaleri();
    const items = await db.galleryItem.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return Response.json(items.map(serializeModel));
  } catch (e) {
    return Response.json({ error: "Gagal memuat galeri" }, { status: 500 });
  }
}
