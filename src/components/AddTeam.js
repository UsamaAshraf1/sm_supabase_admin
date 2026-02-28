import React, { useState } from "react";
import "../styles/addforms.css";
import imageicon from "../assets/Imageicon.png";
import backicon from "../assets/back.png";
import { toast, ToastContainer } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../utils/supabaseConfig.js";

export default function AddTeamMember(props) {
  const navigate = useNavigate();
  const location = useLocation();

  const previousData = location.state?.data || props.previousData || null;

  const [teamMember, setTeamMember] = useState({
    name: previousData?.name || "",
    designation: previousData?.designation || "",
    short_desc: previousData?.short_desc || "",
    img: previousData?.img || "", // existing URL when editing
  });

  const [coverPhoto, setCoverPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isUpdate = !!previousData?.id;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTeamMember((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPhoto(file);
    }
  };

  const resetForm = () => {
    setTeamMember({
      name: "",
      designation: "",
      short_desc: "",
      img: "",
    });
    setCoverPhoto(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;

    if (!teamMember.name || !teamMember.designation || !teamMember.short_desc) {
      toast.error("Please fill required fields (Name, Designation, Short Description)");
      return;
    }

    setUploading(true);
    toast.info("Processing...");

    try {
      let imageUrl = teamMember.img; // keep old URL if no new file

      // 1. Upload new image if selected
      if (coverPhoto) {
        const fileExt = coverPhoto.name.split(".").pop().toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("Team")           // ← your bucket name
          .upload(filePath, coverPhoto, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("Team")
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;

        if (!imageUrl) throw new Error("Failed to get public image URL");
      }

      // 2. Prepare payload
      const payload = {
        name: teamMember.name,
        designation: teamMember.designation,
        short_desc: teamMember.short_desc,
        img: imageUrl || null,
      };

      let error;

      if (isUpdate) {
        // UPDATE
        ({ error } = await supabase
          .from("team")
          .update(payload)
          .eq("id", previousData.id)
          .select()
          .single());
      } else {
        // INSERT
        ({ error } = await supabase
          .from("team")
          .insert(payload)
          .select()
          .single());
      }

      if (error) throw error;

      toast.success(isUpdate ? "Team member updated!" : "Team member added!");
      resetForm();
      navigate("/Team"); // ← adjust route if different

    } catch (err) {
      console.error("Team member save error:", err);
      toast.error(err.message || "Failed to save team member");
    } finally {
      setUploading(false);
    }
  };

  // Image preview
  const previewSrc = coverPhoto
    ? URL.createObjectURL(coverPhoto)
    : teamMember.img || imageicon;

  return (
    <div className="content">
      <form className="adding-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <div className="back">
            <button
              className="back-btn"
              type="button"
              onClick={() => {
                resetForm();
                navigate("/Team");
              }}
              disabled={uploading}
            >
              <img src={backicon} alt="back" className="back-icon" />
            </button>
          </div>
          <span className="form-heading">
            {teamMember.name || "Add Team Member"}
          </span>
          <button
            type="submit"
            className="submit-btn addp"
            disabled={uploading}
          >
            {uploading ? "Saving..." : isUpdate ? "Update" : "Add"}
          </button>
        </div>

        <div className="form-body">
          <div className="form-content">
            <div className="content-right">
              <input
                required
                type="text"
                name="name"
                placeholder="Full Name *"
                className="field"
                value={teamMember.name}
                onChange={handleChange}
                disabled={uploading}
              />

              <input
                required
                type="text"
                name="designation"
                placeholder="Designation / Role *"
                className="field"
                value={teamMember.designation}
                onChange={handleChange}
                disabled={uploading}
              />

              <input
                required
                type="text"
                name="short_desc"
                placeholder="Short Description / Bio *"
                className="field"
                value={teamMember.short_desc}
                onChange={handleChange}
                disabled={uploading}
              />
            </div>

            <div className="form-image">
              <div className="image-sec">
                <div className="imageicon">
                  <img
                    src={previewSrc}
                    alt="Member Preview"
                    className="image"
                  />
                </div>
                <div className="imagehead">
                  <label htmlFor="coverPhoto" style={{ cursor: "pointer" }}>
                    Upload Photo
                  </label>
                  <input
                    type="file"
                    id="coverPhoto"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file"
                    disabled={uploading}
                  />
                </div>
                <span className="imagepg">
                  Upload a profile photo for the team member.<br />
                  File Format: jpeg, png<br />
                  Recommended Size: 400×400 or 1:1 ratio
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
}