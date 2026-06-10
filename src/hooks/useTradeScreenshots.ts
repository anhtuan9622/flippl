import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export const SCREENSHOT_BUCKET = "trade-screenshots";
export const MAX_SCREENSHOT_COUNT = 3;
export const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface TradeScreenshot {
  id: string;
  trade_id: string;
  storage_path: string;
  file_name: string;
  url: string;
}

function buildStoragePath(userId: string, tradeId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${tradeId}/${crypto.randomUUID()}-${safeName}`;
}

export function useTradeScreenshots(tradeId?: string) {
  const [screenshots, setScreenshots] = useState<TradeScreenshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchScreenshots = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trade_screenshots")
        .select("id, trade_id, storage_path, file_name")
        .eq("trade_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const withUrls = await Promise.all(
        (data ?? []).map(async (row) => {
          const { data: signed } = await supabase.storage
            .from(SCREENSHOT_BUCKET)
            .createSignedUrl(row.storage_path, 3600);

          return {
            ...row,
            url: signed?.signedUrl ?? "",
          };
        })
      );

      setScreenshots(withUrls);
    } catch (error) {
      console.error("Error fetching screenshots:", error);
      toast.error("Failed to load screenshots");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tradeId) {
      fetchScreenshots(tradeId);
    } else {
      setScreenshots([]);
    }
  }, [tradeId, fetchScreenshots]);

  const uploadFiles = useCallback(
    async (files: File[], targetTradeId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Your session has expired. Log in again");
        return false;
      }

      setUploading(true);
      let successCount = 0;

      try {
        const { count: existingCount, error: countError } = await supabase
          .from("trade_screenshots")
          .select("*", { count: "exact", head: true })
          .eq("trade_id", targetTradeId);

        if (countError) throw countError;

        const remainingSlots = MAX_SCREENSHOT_COUNT - (existingCount ?? 0);
        if (remainingSlots <= 0) {
          toast.error(`Maximum of ${MAX_SCREENSHOT_COUNT} screenshots per trade`);
          return false;
        }

        const filesToUpload = files.slice(0, remainingSlots);
        if (filesToUpload.length < files.length) {
          toast.error(`Only ${remainingSlots} more screenshot${remainingSlots === 1 ? "" : "s"} allowed`);
        }

        for (const file of filesToUpload) {
          const storagePath = buildStoragePath(user.id, targetTradeId, file.name);

          const { error: uploadError } = await supabase.storage
            .from(SCREENSHOT_BUCKET)
            .upload(storagePath, file, { upsert: false });

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase.from("trade_screenshots").insert({
            trade_id: targetTradeId,
            user_id: user.id,
            storage_path: storagePath,
            file_name: file.name,
          });

          if (dbError) {
            await supabase.storage.from(SCREENSHOT_BUCKET).remove([storagePath]);
            throw dbError;
          }

          successCount++;
        }

        if (successCount > 0) {
          toast.success(
            `Uploaded ${successCount} screenshot${successCount > 1 ? "s" : ""}`
          );
          await fetchScreenshots(targetTradeId);
        }

        return true;
      } catch (error) {
        console.error("Error uploading screenshots:", error);
        toast.error("Failed to upload screenshots");
        return false;
      } finally {
        setUploading(false);
      }
    },
    [fetchScreenshots]
  );

  const deleteScreenshot = useCallback(
    async (screenshot: TradeScreenshot) => {
      try {
        const { error: storageError } = await supabase.storage
          .from(SCREENSHOT_BUCKET)
          .remove([screenshot.storage_path]);

        if (storageError) throw storageError;

        const { error: dbError } = await supabase
          .from("trade_screenshots")
          .delete()
          .eq("id", screenshot.id);

        if (dbError) throw dbError;

        setScreenshots((prev) => prev.filter((s) => s.id !== screenshot.id));
        toast.success("Screenshot removed");
        return true;
      } catch (error) {
        console.error("Error deleting screenshot:", error);
        toast.error("Failed to remove screenshot");
        return false;
      }
    },
    []
  );

  return {
    screenshots,
    loading,
    uploading,
    uploadFiles,
    deleteScreenshot,
    fetchScreenshots,
  };
}
