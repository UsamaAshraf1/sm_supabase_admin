import React, { useState } from "react";
import cross from "../assets/cross.png";
import imageicon from "../assets/Imageicon.png";
import { toast } from "react-toastify";
import { url } from "../utils/urls.js";           // ← you may not need this anymore
import axios from "axios";
import supabase from "../utils/supabaseConfig.js";

export default function Carouselcreatepop(props) {
  const [picture, setPicture] = useState(null);   // better to start with null
  const [preview, setPreview] = useState(null);   // optional: better preview handling
  const [uploading, setUploading] = useState(false);

  // Removed unused carousel state since we're only saving image now
  // If you later need description/category/status → add them back

  const authToken = localStorage.getItem("authToken") || "";
  const session_id = localStorage.getItem("session_id") || "";

  function handlePicture(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPicture(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!picture) {
      toast.error("Please select an image first");
      return;
    }

    setUploading(true);

    try {
      // 1. Create unique filename (avoid overwrites)
      const fileExt = picture.name.split(".").pop().toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${fileName}`;   // optional folder inside bucket

      // 2. Upload to Supabase Storage → bucket: "Images"
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("Images")
        .upload(filePath, picture, {
          cacheControl: "3600",
          upsert: false,               // don't overwrite if same name (unlikely)
        });

      if (uploadError) throw uploadError;

      // 3. Get public URL
      const { data: urlData } = supabase.storage
        .from("Images")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      if (!publicUrl) {
        throw new Error("Could not get public URL");
      }

      // 4. Save to database (carousel table)
      const { error: dbError } = await supabase
        .from("carousel")
        .insert({
          image_url: publicUrl,
          // Add other fields when you need them, e.g.:
          // description: "...",
          // category: "...",
          // status: true,
          // created_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      toast.success("Carousel image added successfully!");
      
      // Reset form
      setPicture(null);
      setPreview(null);
      props.fetchdata?.();           // refresh list
      props.setTrigger(false);

    } catch (error) {
      console.error("Carousel upload error:", error);
      toast.error(error.message || "Failed to create carousel");
    } finally {
      setUploading(false);
    }
  }

  return props.trigger ? (
    <div className="popup">
      <div className="popup-content">
        <div className="popup-header">
          <div className="popup-heading">Add New Carousel</div>
          <button
            className="icon-btn"
            onClick={() => {
              setPicture(null);
              setPreview(null);
              props.setTrigger(false);
            }}
          >
            <img src={cross} alt="cross icon" />
          </button>
        </div>

        <div className="pop-inputs">
          <div className="linkedpop">
            <span className="form-headings half">Upload Image</span>
            <div className="form-row">
              <div className="image-sec-small">
                <div className="imageicon">
                  <img
                    src={preview || imageicon}
                    alt="preview"
                    className="image"
                  />
                </div>
                <div className="imagehead">
                  <label htmlFor="image" style={{ cursor: "pointer" }}>
                    Upload image
                  </label>
                  <input
                    type="file"
                    id="image"
                    className="file"
                    accept="image/*"
                    onChange={handlePicture}
                    disabled={uploading}
                  />
                </div>
              </div>
              <div className="empty-image"></div>
            </div>
          </div>

          <div className="seller-btns">
            <button
              className="seller-cancel seller-btn"
              onClick={() => {
                setPicture(null);
                setPreview(null);
                props.setTrigger(false);
              }}
              style={{ height: "40px", padding: "10px" }}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              className="seller-save seller-btn"
              onClick={handleSubmit}
              style={{ height: "40px", padding: "10px" }}
              disabled={uploading || !picture}
            >
              {uploading ? "Uploading..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}