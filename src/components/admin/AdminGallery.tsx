"use client";

/**
 * AdminGallery — tab Galeri pada panel admin (Task 92).
 * Kelola foto galeri website: unggah (bisa banyak sekaligus), beri keterangan,
 * atur urutan (naik/turun), tampilkan/sembunyikan, edit, dan hapus.
 * Foto tampil di website sebagai barisan beranimasi (GallerySection).
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Images,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { adminJson, jsonInit, uploadFiles } from "@/lib/client";
import type { GalleryItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function AdminGallery({ onChanged }: { onChanged: () => void }) {
  const { toast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<GalleryItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminJson<GalleryItem[]>("/api/admin/gallery"));
    } catch (e) {
      toast({
        title: "Gagal memuat galeri",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const toggleActive = async (g: GalleryItem) => {
    try {
      await adminJson(`/api/admin/gallery/${g.id}`, jsonInit("PUT", { ...g, active: !g.active }));
      await load();
      onChanged();
    } catch (e) {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const remove = async (g: GalleryItem) => {
    try {
      await adminJson(`/api/admin/gallery/${g.id}`, { method: "DELETE" });
      toast({ title: "Foto dihapus" });
      setDeleting(null);
      await load();
      onChanged();
    } catch (e) {
      toast({ title: "Gagal menghapus", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  // Naik/turun: tukar nilai sortOrder dengan tetangga pada daftar terurut.
  const pindah = async (index: number, delta: -1 | 1) => {
    const a = items[index];
    const b = items[index + delta];
    if (!a || !b) return;
    try {
      await adminJson(`/api/admin/gallery/${a.id}`, jsonInit("PUT", { ...a, sortOrder: b.sortOrder }));
      await adminJson(`/api/admin/gallery/${b.id}`, jsonInit("PUT", { ...b, sortOrder: a.sortOrder }));
      await load();
      onChanged();
    } catch (e) {
      toast({ title: "Gagal mengubah urutan", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          Kelola foto galeri website — tampil sebagai barisan beranimasi di bawah testimoni.
        </p>
        <Button
          className="bg-[var(--bp-accent)] text-white hover:bg-[var(--bp-accent-dark)]"
          onClick={() => setCreating(true)}
        >
          <Plus className="h-4 w-4" /> Tambah Foto
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-400">
          <Images className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          Belum ada foto galeri. Klik <span className="font-semibold">Tambah Foto</span> untuk
          mengunggah — bisa beberapa foto sekaligus.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g, i) => (
            <Card key={g.id} className={g.active ? "" : "opacity-60"}>
              <CardContent className="flex flex-col gap-2.5 p-3">
                <div className="relative overflow-hidden rounded-lg border bg-slate-50">
                  { }
                  <img
                    src={g.image}
                    alt={g.caption || "Foto galeri"}
                    className="h-36 w-full object-cover"
                  />
                  {!g.active && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">
                      Tersembunyi
                    </span>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                    #{i + 1}
                  </span>
                </div>
                <p className="min-h-[2.5rem] line-clamp-2 text-sm text-slate-700">
                  {g.caption || <span className="text-slate-400">Tanpa keterangan</span>}
                </p>
                <div className="flex items-center justify-between gap-1 border-t pt-2">
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      disabled={i === 0}
                      onClick={() => pindah(i, -1)}
                      aria-label="Naikkan urutan"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      disabled={i === items.length - 1}
                      onClick={() => pindah(i, 1)}
                      aria-label="Turunkan urutan"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => toggleActive(g)}
                      aria-label={g.active ? "Sembunyikan dari website" : "Tampilkan di website"}
                    >
                      {g.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setEditing(g)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      onClick={() => setDeleting(g)}
                      aria-label="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog tambah — unggah banyak foto sekaligus */}
      <TambahFotoDialog
        key={creating ? "baru" : "tutup"}
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={async () => {
          setCreating(false);
          await load();
          onChanged();
        }}
      />

      {/* Dialog edit — satu foto */}
      <EditFotoDialog
        key={editing?.id || "edit-tutup"}
        open={!!editing}
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await load();
          onChanged();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus foto ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Foto{deleting?.caption ? ` “${deleting.caption}”` : ""} akan dihapus permanen dari galeri.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleting && remove(deleting)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Dialog unggah banyak foto: satu berkas = satu foto galeri. */
function TambahFotoDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [berkas, setBerkas] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [pratinjau, setPratinjau] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const pilihBerkas = (files: FileList | null) => {
    const daftar = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    setBerkas(daftar);
    setPratinjau(daftar.map((f) => URL.createObjectURL(f)));
  };

  const simpan = async () => {
    if (berkas.length === 0) {
      toast({ title: "Pilih foto dulu", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const hasil = await uploadFiles(berkas);
      for (const h of hasil) {
        await adminJson("/api/admin/gallery", jsonInit("POST", { image: h.url, caption }));
      }
      toast({
        title: "Tersimpan!",
        description: `${hasil.length} foto ditambahkan ke galeri.`,
      });
      setBerkas([]);
      setPratinjau([]);
      setCaption("");
      onSaved();
    } catch (e) {
      toast({ title: "Gagal mengunggah", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto nice-scroll sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Foto Galeri</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Foto (bisa pilih beberapa sekaligus) *</Label>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => pilihBerkas(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInput.current?.click()}
              className="justify-start"
            >
              <Upload className="h-4 w-4" />
              {berkas.length > 0 ? `${berkas.length} foto dipilih` : "Pilih Foto"}
            </Button>
            {pratinjau.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pratinjau.map((p, i) => (
                   
                  <img
                    key={i}
                    src={p}
                    alt={`Pratinjau ${i + 1}`}
                    className="h-16 w-16 rounded-lg border object-cover"
                  />
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Keterangan (opsional — berlaku untuk semua foto ini)</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Mis. Pengemasan ekspor madu…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={simpan}
            disabled={saving || berkas.length === 0}
            className="bg-[var(--bp-accent)] text-white hover:bg-[var(--bp-accent-dark)]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Simpan {berkas.length > 0 ? `(${berkas.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Dialog edit satu foto: ganti gambar, ubah keterangan. */
function EditFotoDialog({
  open,
  item,
  onClose,
  onSaved,
}: {
  open: boolean;
  item: GalleryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [image, setImage] = useState("");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImage(item?.image || "");
    setCaption(item?.caption || "");
  }, [item, open]);

  const unggah = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const res = await uploadFiles([files[0]]);
      if (res[0]) setImage(res[0].url);
    } catch (e) {
      toast({ title: "Gagal mengunggah", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const simpan = async () => {
    if (!item) return;
    if (!image.trim()) {
      toast({ title: "Foto wajib ada", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await adminJson(
        `/api/admin/gallery/${item.id}`,
        jsonInit("PUT", { image: image.trim(), caption, active: item.active, sortOrder: item.sortOrder })
      );
      toast({ title: "Tersimpan!" });
      onSaved();
    } catch (e) {
      toast({ title: "Gagal menyimpan", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto nice-scroll sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Foto Galeri</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {image && (
             
            <img src={image} alt="Foto terpilih" className="h-44 w-full rounded-lg border object-cover" />
          )}
          <div className="grid gap-2">
            <Label>Ganti Foto</Label>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => unggah(e.target.files)}
            />
            <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} className="justify-start">
              <Upload className="h-4 w-4" /> Unggah Foto Baru
            </Button>
            <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="atau tempel URL foto…" />
          </div>
          <div className="grid gap-2">
            <Label>Keterangan</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Mis. Pengemasan ekspor madu…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={simpan}
            disabled={saving}
            className="bg-[var(--bp-accent)] text-white hover:bg-[var(--bp-accent-dark)]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
