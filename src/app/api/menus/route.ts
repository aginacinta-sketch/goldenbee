import { db } from "@/lib/db";
import { pastikanMenuGaleri } from "@/lib/menus";
import { serializeModel } from "@/lib/serialize";

// Menu navigasi publik (hanya yang tampil)
export async function GET() {
  try {
    // Task 96: pastikan menu "Galeri" tersedia (otomatis, sekali saja)
    await pastikanMenuGaleri();
    const items = await db.menuItem.findMany({
      where: { visible: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return Response.json(items.map(serializeModel));
  } catch (e) {
    return Response.json({ error: "Gagal memuat menu" }, { status: 500 });
  }
}
