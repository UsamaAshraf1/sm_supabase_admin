import React, { useState, useEffect } from "react";
import "../styles/addforms.css";
import imageicon from "../assets/Imageicon.png";
import backicon from "../assets/back.png";
import { toast, ToastContainer } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../utils/supabaseConfig.js";

export default function AddDepartment(props) {
  const navigate = useNavigate();
  const location = useLocation();

  const [previousData] = useState(
    location.state?.data || props.previousData || null
  );

  const [department, setDepartment] = useState({
    name: previousData?.name || "",
    des: previousData?.des || "",
    shortDes: previousData?.short_des || "",
    fee: previousData?.fee || "",
    cover: previousData?.cover_img || "",
    sort_number: previousData?.sort_number || "", // new field
  });

  const [coverPhoto, setCoverPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sortNumberError, setSortNumberError] = useState("");

  const isUpdate = !!previousData?.id;

  const handleDepartmentChange = (e) => {
    const { name, value } = e.target;
    setDepartment((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing again
    if (name === "sort_number") {
      setSortNumberError("");
    }
  };

  // Check if sort_number already exists (skip current record when editing)
  const checkSortNumberExists = async (value) => {
    if (!value || isNaN(value)) {
      setSortNumberError("");
      return;
    }

    const num = parseInt(value, 10);

    try {
      let query = supabase
        .from("departments")
        .select("id")
        .eq("sort_number", num);

      // When editing → exclude current record
      if (isUpdate && previousData?.id) {
        query = query.neq("id", previousData.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Sort number check failed:", error);
        return;
      }

      if (data && data.length > 0) {
        setSortNumberError(`Sort number ${num} is already in use by another department`);
      } else {
        setSortNumberError("");
      }
    } catch (err) {
      console.error(err);
      setSortNumberError("Error checking sort number availability");
    }
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
      sort_number: "",
    });
    setCoverPhoto(null);
    setSortNumberError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;

    // Required fields validation
    if (!department.name || !department.des || !department.shortDes) {
      toast.error("Please fill required fields (Name, Description, Short Description)");
      return;
    }

    // Sort number validation
    if (department.sort_number !== "" && sortNumberError) {
      toast.error("Please fix the sort number error before submitting");
      return;
    }

    // Optional: enforce sort_number must be filled (uncomment if required)
    // if (department.sort_number === "") {
    //   toast.error("Sort Number is required");
    //   return;
    // }

    setUploading(true);
    toast.info("Processing...");

    try {
      let coverUrl = previousData?.cover_img || null;

      // 1. Upload new cover photo if selected
      if (coverPhoto) {
        const fileExt = coverPhoto.name.split(".").pop().toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("Departments")
          .upload(filePath, coverPhoto, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("Departments")
          .getPublicUrl(filePath);

        coverUrl = urlData?.publicUrl;

        if (!coverUrl) throw new Error("Failed to get public URL");
      }

      // 2. Prepare payload
      const payload = {
        name: department.name,
        desc: department.des,
        short_desc: department.shortDes,
        fee: parseFloat(department.fee) || 0,
        sort_number: department.sort_number ? parseInt(department.sort_number, 10) : null,
        status: "Active",
        cover_img: coverUrl,
      };

      let error;

      if (isUpdate) {
        ({ error } = await supabase
          .from("departments")
          .update(payload)
          .eq("id", previousData.id)
          .select()
          .single());
      } else {
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

              {/* ─── New Sort Number Field ─── */}
              <div className="field-wrapper">
                <input
                  type="number"
                  name="sort_number"
                  placeholder="Sort Number (order on website)"
                  className={`field ${sortNumberError ? "field-error" : ""}`}
                  value={department.sort_number}
                  onChange={handleDepartmentChange}
                  onBlur={(e) => checkSortNumberExists(e.target.value)}
                  disabled={uploading}
                  min="1"
                  step="1"
                />
                {sortNumberError && (
                  <div className="error-text">{sortNumberError}</div>
                )}
              </div>
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