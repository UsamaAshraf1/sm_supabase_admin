import React, { useState, useEffect } from "react";
import "../styles/addforms.css";
import imageicon from "../assets/Imageicon.png";
import backicon from "../assets/back.png";
import { toast, ToastContainer } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../utils/supabaseConfig.js"; // your client

export default function AddDepartment(props) {
  const navigate = useNavigate();
  const location = useLocation();

  const [previousData] = useState(
    location.state?.data || props.previousData || null
  );

  const [department, setDepartment] = useState({
    name: previousData?.name || "",
    des: previousData?.des || "",
    shortDes: previousData?.short_des || "", // match snake_case if needed
    fee: previousData?.fee || "",
    cover: previousData?.cover_img || "",
  });

  const [currentQ, setCurrentQ] = useState("");
  const [currentA, setCurrentA] = useState("");
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isUpdate = !!previousData?.id;

  const handleDepartmentChange = (e) => {
    const { name, value } = e.target;
    setDepartment((prev) => ({ ...prev, [name]: value }));
  };

  const addFaq = () => {
    if (!currentQ.trim() || !currentA.trim()) {
      toast.error("Please enter both question and answer");
      return;
    }
    setDepartment((prev) => ({
      ...prev,
    }));
    setCurrentQ("");
    setCurrentA("");
  };

  const removeFaq = (index) => {
    setDepartment((prev) => ({
      ...prev,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPhoto(file);
    }
  };

  const resetForm = () => {
    setDepartment({
      name: "",
      des: "",
      shortDes: "",
      fee: "",
      cover: "",
    });
    setCoverPhoto(null);
    setCurrentQ("");
    setCurrentA("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;

    if (!department.name || !department.des || !department.shortDes) {
      toast.error("Please fill required fields (Name, Description, Short Description)");
      return;
    }

    setUploading(true);
    toast("Processing...", { type: "info" });

    try {
      let coverUrl = department.cover_img; // keep old url if no new file

      // 1. Upload new cover photo if selected
      if (coverPhoto) {
        const fileExt = coverPhoto.name.split(".").pop().toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${fileName}`; // optional folder

        const { error: uploadError } = await supabase.storage
          .from("Departments") // ← change to your bucket name
          .upload(filePath, coverPhoto, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("Departments")
          .getPublicUrl(filePath);


        coverUrl = data.publicUrl;

        if (!coverUrl) throw new Error("Failed to get public URL");
      }

      // 2. Prepare data (match your column names)
      const payload = {
        name: department.name,
        desc: department.des,
        short_desc: department.shortDes,
        fee: parseFloat(department.fee) || 0,
        status: "Active",
        cover_img: coverUrl || null,
      };

      let error;

      if (isUpdate) {
        // UPDATE
        ({ error } = await supabase
          .from("departments")
          .update(payload)
          .eq("id", previousData.id)
          .select()
          .single());
      } else {
        // INSERT
        ({ error } = await supabase
          .from("departments")
          .insert(payload)
          .select()
          .single());
      }

      if (error) throw error;

      toast.success(isUpdate ? "Department updated!" : "Department created!");
      resetForm();
      navigate("/Department");

    } catch (err) {
      console.error("Department save error:", err);
      toast.error(err.message || "Failed to save department");
    } finally {
      setUploading(false);
    }
  };

  // Optional: fix preview if editing
  const previewSrc =
    coverPhoto
      ? URL.createObjectURL(coverPhoto)
      : department.cover
      ? department.cover
      : imageicon;

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
                navigate("/Department");
              }}
              disabled={uploading}
            >
              <img src={backicon} alt="back" className="back-icon" />
            </button>
          </div>
          <span className="form-heading">
            {department.name || "Add Department"}
          </span>
          <button
            type="submit"
            className="submit-btn addp"
            disabled={uploading}
          >
            {uploading ? "Saving..." : isUpdate ? "Update" : "Create"}
          </button>
        </div>

        <div className="form-body">
          <div className="form-content">
            <div className="content-right">
              <input
                required
                type="text"
                name="name"
                placeholder="Name *"
                className="field"
                value={department.name}
                onChange={handleDepartmentChange}
                disabled={uploading}
              />
              <input
                required
                type="text"
                name="des"
                placeholder="Description *"
                className="field"
                value={department.des}
                onChange={handleDepartmentChange}
                disabled={uploading}
              />
              <input
                required
                type="text"
                name="shortDes"
                placeholder="Short Description *"
                className="field"
                value={department.shortDes}
                onChange={handleDepartmentChange}
                disabled={uploading}
              />
             
              <input
                type="number"
                name="fee"
                placeholder="Fee"
                className="field"
                value={department.fee}
                onChange={handleDepartmentChange}
                disabled={uploading}
              />

            
            </div>

            <div className="form-image">
              <div className="image-sec">
                <div className="imageicon">
                  <img
                    src={previewSrc}
                    alt="Cover Preview"
                    className="image"
                  />
                </div>
                <div className="imagehead">
                  <label htmlFor="coverPhoto" style={{ cursor: "pointer" }}>
                    Upload Cover Photo
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
                  Upload a cover image for your department.<br />
                  File Format: jpeg, png<br />
                  Recommended Size: 600x600 (1:1)
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