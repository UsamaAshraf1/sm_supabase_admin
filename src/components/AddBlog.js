import React, { useState } from "react";
import "../styles/addforms.css";
import imageicon from "../assets/Imageicon.png";
import backicon from "../assets/back.png";
import { toast, ToastContainer } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../utils/supabaseConfig.js";

export default function AddBlog(props) {
  const navigate = useNavigate();
  const location = useLocation();

  const previousData = location.state?.data || props.previousData || null;

  const [blog, setBlog] = useState({
    title: previousData?.title || "",
    short_des: previousData?.short_des || "",
    des: previousData?.des || "",
    img: previousData?.img || "", // existing URL when editing
  });

  const [coverPhoto, setCoverPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isUpdate = !!previousData?.id;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBlog((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPhoto(file);
    }
  };

  const resetForm = () => {
    setBlog({
      title: "",
      short_des: "",
      des: "",
      img: "",
    });
    setCoverPhoto(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;

    if (!blog.title || !blog.short_des || !blog.des) {
      toast.error("Please fill required fields (Title, Short Description, Full Description)");
      return;
    }

    setUploading(true);
    toast.info("Processing...");

    try {
      let imageUrl = blog.img; // keep old URL if no new file

      // 1. Upload new image if selected
      if (coverPhoto) {
        const fileExt = coverPhoto.name.split(".").pop().toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("Blogs")           // ← your bucket name
          .upload(filePath, coverPhoto, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("Blogs")
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;

        if (!imageUrl) throw new Error("Failed to get public image URL");
      }

      // 2. Prepare payload
      const payload = {
        title: blog.title,
        short_desc: blog.short_des,
        des: blog.des,
        img: imageUrl || null,
        // Optional: add more fields like:
        // status: "draft" | "published",
        // author_id: currentUser.id,
        // published_at: new Date().toISOString(),
        // slug: generateSlug(blog.title),
      };

      let error;

      if (isUpdate) {
        // UPDATE
        ({ error } = await supabase
          .from("blogs")
          .update(payload)
          .eq("id", previousData.id)
          .select()
          .single());
      } else {
        // INSERT
        ({ error } = await supabase
          .from("blogs")
          .insert(payload)
          .select()
          .single());
      }

      if (error) throw error;

      toast.success(isUpdate ? "Blog updated successfully!" : "Blog created successfully!");
      resetForm();
      navigate("/Blogs"); // ← adjust if your list page is /admin/blogs, /dashboard/blogs etc.

    } catch (err) {
      console.error("Blog save error:", err);
      toast.error(err.message || "Failed to save blog");
    } finally {
      setUploading(false);
    }
  };

  // Image preview
  const previewSrc = coverPhoto
    ? URL.createObjectURL(coverPhoto)
    : blog.img || imageicon;

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
                navigate("/Blogs");
              }}
              disabled={uploading}
            >
              <img src={backicon} alt="back" className="back-icon" />
            </button>
          </div>
          <span className="form-heading">
            {blog.title || "Add Blog"}
          </span>
          <button
            type="submit"
            className="submit-btn addp"
            disabled={uploading}
          >
            {uploading ? "Saving..." : isUpdate ? "Update" : "Publish"}
          </button>
        </div>

        <div className="form-body">
          <div className="form-content">
            <div className="content-right">
              <input
                required
                type="text"
                name="title"
                placeholder="Blog Title *"
                className="field"
                value={blog.title}
                onChange={handleChange}
                disabled={uploading}
              />

              <textarea
                required
                name="short_des"
                placeholder="Short Description / Excerpt * (appears in blog listing)"
                className="field textarea"
                rows={3}
                value={blog.short_des}
                onChange={handleChange}
                disabled={uploading}
              />

              <textarea
                required
                name="des"
                placeholder="Full Blog Content *"
                className="field textarea"
                rows={12}
                value={blog.des}
                onChange={handleChange}
                disabled={uploading}
              />
            </div>

            <div className="form-image">
              <div className="image-sec">
                <div className="imageicon">
                  <img
                    src={previewSrc}
                    alt="Blog Featured Image Preview"
                    className="image"
                  />
                </div>
                <div className="imagehead">
                  <label htmlFor="coverPhoto" style={{ cursor: "pointer" }}>
                    Upload Featured Image
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
                  Upload a featured / cover image for the blog post.<br />
                  File Format: jpeg, png, webp<br />
                  Recommended Size: 1200 × 630 (good for social sharing) or 16:9 ratio
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