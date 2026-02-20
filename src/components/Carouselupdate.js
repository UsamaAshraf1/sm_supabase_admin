import React, { useState } from "react";
import cross from "../assets/cross.png";
import imageicon from "../assets/Imageicon.png";
import { toast } from "react-toastify";
import supabase from "../utils/supabaseConfig";

export default function Carouselupdate(props) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!props.preData?.id) {
      toast.error("No carousel selected");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this carousel image?\nThis action cannot be undone.",
      )
    ) {
      return;
    }

    setDeleting(true);
    toast.info("Deleting...", { autoClose: false });

    try {
      // 1. Get the current record to know the image URL / path
      const { data: carouselItem, error: fetchError } = await supabase
        .from("carousel")
        .select("id, image_url")
        .eq("id", props.preData.id)
        .single();

      if (fetchError || !carouselItem) {
        throw new Error(fetchError?.message || "Carousel not found");
      }

      const imageUrl = carouselItem.image_url;

      // 2. Delete the file from Storage (if image exists)
      if (imageUrl) {
        // Extract the file path from the public URL
        // Example URL: https://xyz.supabase.co/storage/v1/object/public/Images/16987654321-random.jpg
        const urlParts = imageUrl.split("/storage/v1/object/public/Images/");
        if (urlParts.length > 1) {
          const filePath = urlParts[1]; // e.g. "16987654321-random.jpg"

          const { error: storageError } = await supabase.storage
            .from("Images")
            .remove([filePath]);

          if (storageError) {
            console.warn("Storage delete warning:", storageError);
            // You can choose to continue or throw — usually continue is safer
            // throw storageError;
          }
        }
      }

      // 3. Delete the row from the carousel table
      const { error: dbError } = await supabase
        .from("carousel")
        .delete()
        .eq("id", props.preData.id);

      if (dbError) throw dbError;

      toast.dismiss();
      toast.success("Carousel image deleted successfully!");

      // Reset & close
      props.fetchdata?.(); // refresh parent list
      props.setTrigger(false);
    } catch (err) {
      console.error("Delete carousel error:", err);
      toast.dismiss();
      toast.error(err.message || "Failed to delete carousel");
    } finally {
      setDeleting(false);
    }
  };

  // Generate preview source
  const previewSrc = props.preData.image_url
    ? `${props.preData.image_url}` // fallback for old S3 links
    : imageicon;

  return props.trigger ? (
    <div className="popup">
      <div className="popup-content">
        <div className="popup-header">
          <div className="popup-heading">Delete Carousel</div>
          <button
            className="icon-btn"
            onClick={() => props.setTrigger(false)}
            disabled={deleting}
          >
            <img src={cross} alt="close" />
          </button>
        </div>

        <div className="pop-inputs">
          <div className="linkedpop">
            <span className="form-headings half">Carousel Preview</span>
            <div className="form-row">
              <div className="image-sec-small">
                <div className="imageicon">
                  <img
                    src={previewSrc}
                    alt="carousel preview"
                    className="image"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </div>
              <div className="empty-image"></div>
            </div>

            <p
              style={{
                color: "#dc2626",
                fontSize: "14px",
                marginTop: "16px",
                textAlign: "center",
              }}
            >
              This will permanently delete record.
            </p>
          </div>

          <div className="seller-btns">
            <button
              className="seller-cancel seller-btn"
              onClick={() => props.setTrigger(false)}
              style={{ height: "40px", padding: "10px" }}
              disabled={deleting}
            >
              Cancel
            </button>

            <button
              className="seller-save seller-btn"
              onClick={handleDelete}
              style={{
                height: "40px",
                padding: "10px",
                background: deleting ? "#9ca3af" : "#dc2626",
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
