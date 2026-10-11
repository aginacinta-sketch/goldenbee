"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Check, Copy, FileVideo, Loader2, Trash2, Upload } from "lucide-react";
import { adminJson, uploadFiles } from "@/lib/client";
import type { MediaItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function AdminMedia() {
  const { toast } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminJson<MediaItem[]>("/api/media"));
    } catch (e) {
      toast({ title: "Gagal memuat media", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const doUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const res = await uploadFiles(files);
      toast({ title: "Berhasil diunggah", description: `${res.length} berkas ditambahkan ke pustaka media.` });
      await load();
    } catch (e) {
      toast({ title: "Gagal mengunggah", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const remove = async (m: MediaItem) => {
    try {
      await adminJson(`/api/admin/media/${m.id}`, { method: "DELETE" });
      toast({ title: "Media dihapus", description: m.name });
      setDeleting(null);
      await load();
    } catch (e) {
      toast({ title: "Gagal menghapus", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const copyUrl = async (m: MediaItem) => {
    const url = `${window.location.origin}/api/media/${m.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 1500);
      toast({ title: "URL disalin", description: url });
    } catch {
      toast({ title: "Gagal menyalin URL", variant: "destructive" });
    }
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="grid gap-4">
      {/* Area unggah */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          doUpload(Array.from(e.dataTransfer.files));
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition ${
          dragOver ? "border-[var(--bp-accent)] bg-[var(--bp-accent-soft)]" : "border-slate-300 bg-slate-50"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-[var(--bp-accent-dark)]" />
        ) : (
          <Upload className="h-8 w-8 text-slate-400" />
        )}
        <p className="text-sm font-medium text-slate-600">
          Tarik &amp; lepas berkas gambar/video ke sini, atau
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            doUpload(Array.from(e.target.files || []));
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
        <Button size="sm" className="bg-[var(--bp-accent)] text-white hover:bg-[var(--bp-accent-dark)]" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4" /> Pilih Berkas
        </Button>
        <p className="text-xs text-slate-400">Format: JPG, PNG, WebP, GIF, MP4, WebM · Maks. 25 MB per berkas</p>
      </div>

      {/* Galeri */}
      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Pustaka media masih kosong.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((m) => (
            <Card key={m.id} className="group overflow-hidden">
              <div className="relative aspect-square bg-slate-100">
                {m.type === "image" ? (
                   
                  <img src={`/api/media/${m.id}`} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400">
                    <FileVideo className="h-8 w-8" />
                    <span className="text-[10px] uppercase">{m.mimeType.split("/")[1]}</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-9 w-9"
                    onClick={() => copyUrl(m)}
                    aria-label="Salin URL"
                  >
                    {copiedId === m.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-9 w-9"
                    onClick={() => setDeleting(m)}
                    aria-label="Hapus media"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-2">
                <p className="truncate text-xs font-medium text-slate-700" title={m.name}>{m.name}</p>
                <p className="text-[10px] text-slate-400">{fmtSize(m.size)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus media ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Berkas “{deleting?.name}” akan dihapus permanen. Produk yang memakainya akan kehilangan gambar tersebut.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => deleting && remove(deleting)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
