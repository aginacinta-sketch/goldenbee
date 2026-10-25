import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, unauthorized, badRequest } from "@/lib/admin";
import { serializeModel } from "@/lib/serialize";
import { pastikanTabelGaleri } from "@/lib/galeri";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PUT /api/admin/gallery/[id] — perbarui foto/caption/aktif/urutan. */
export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest(req))) return unauthorized();
  const { id } = await params;
  try {
    await pastikanTabelGaleri();
    const body = (await req.json()) as Record<string, unknown>;
    const image = String(body.image ?? "").trim();
    if (!image) return badRequest("Foto galeri wajib diisi.");
    const item = await db.galleryItem.update({
      where: { id },
      data: {
        image,
        caption: String(body.caption ?? "").trim(),
        active: Boolean(body.active ?? true),
        sortOrder: Number(body.sortOrder ?? 0),
      },
    });
    return Response.json(serializeModel(item));
  } catch (e) {
    return Response.json({ error: "Gagal memperbarui foto galeri" }, { status: 500 });
  }
}

/** DELETE /api/admin/gallery/[id] — hapus satu foto galeri. */
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest(req))) return unauthorized();
  const { id } = await params;
  try {
    await pastikanTabelGaleri();
    await db.galleryItem.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: "Gagal menghapus foto galeri" }, { status: 500 });
  }
}
