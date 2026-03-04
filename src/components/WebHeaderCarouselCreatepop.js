import React, { useState } from "react";
import cross from "../assets/cross.png";
import imageicon from "../assets/Imageicon.png";
import { toast } from "react-toastify";
import supabase from "../utils/supabaseConfig.js";

export default function WebHeaderCarouselCreatepop(props) {
  const [picture, setPicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [slideNumber, setSlideNumber] = useState("");   // ✅ NEW
  const [uploading, setUploading] = useState(false);

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

    if (!slideNumber) {
      toast.error("Please enter slide number");
      return;
    }

    setUploading(true);

    try {
      // 1️⃣ Create unique filename
      const fileExt = picture.name.split(".").pop().toLowerCase();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // 2️⃣ Upload to Supabase Storage → bucket: Headers
      const { error: uploadError } = await supabase.storage
        .from("Headers")
        .upload(filePath, picture, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 3️⃣ Get public URL
      const { data: urlData } = supabase.storage
        .from("Headers")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      if (!publicUrl) {
        throw new Error("Could not get public URL");
      }

      // 4️⃣ Insert into web_main_carousel table
      const { error: dbError } = await supabase
        .from("web_main_carousel")
        .insert({
          image_url: publicUrl,
          slide_number: Number(slideNumber),  // ✅ SAVE HERE
        });

      if (dbError) throw dbError;

      toast.success("Header carousel image added successfully!");

      // Reset form
      setPicture(null);
      setPreview(null);
      setSlideNumber("");
      props.fetchdata?.();
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
          <div className="popup-heading">Add New Header Carousel</div>
          <button
            className="icon-btn"
            onClick={() => {
              setPicture(null);
              setPreview(null);
              setSlideNumber("");
              props.setTrigger(false);
            }}
          >
            <img src={cross} alt="cross icon" />
          </button>
        </div>

        <div className="pop-inputs">

          {/* ✅ SLIDE NUMBER FIELD */}
          <div className="linkedpop">
            <span className="form-headings half">Slide Number</span>
            <div className="form-row">
              <input
                type="number"
                placeholder="Enter slide number"
                value={slideNumber}
                onChange={(e) => setSlideNumber(e.target.value)}
                disabled={uploading}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "8px",
                }}
              />
            </div>
          </div>

          {/* IMAGE SECTION */}
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
            </div>
          </div>

          <div className="seller-btns">
            <button
              className="seller-cancel seller-btn"
              onClick={() => {
                setPicture(null);
                setPreview(null);
                setSlideNumber("");
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
              disabled={uploading || !picture || !slideNumber}
            >
              {uploading ? "Uploading..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}