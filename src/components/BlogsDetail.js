import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import backicon from "../assets/back.png";
import supabase from "../utils/supabaseConfig.js";

export default function BlogsDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialBlog = location.state?.blog;

  console.log("Location state:", location.state);
  console.log("Initial blog:", initialBlog);

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    short_desc: "",
    des: "",
    img: "",
  });
  const [newImage, setNewImage] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch blog post
  useEffect(() => {
    if (!initialBlog?.title) {
      setError("No blog selected");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("blogs")
          .select("*")
          .eq("title", initialBlog.title)
          .maybeSingle();

        if (fetchError || !data) {
          throw new Error(fetchError?.message || "Blog not found");
        }

        setBlog(data);
        setFormData({
          title: data.title || "",
          short_desc: data.short_desc || "",
          des: data.des || "",
          img: data.img || "",
        });
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load blog data");
        toast.error(err.message || "Failed to load blog");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialBlog?.title, refreshKey]); // fixed dependency

  // Handle Update
  const handleSave = async () => {
    if (!blog?.id) return; // adjust if your PK has different name (e.g. blog_id)

    toast("Updating blog...", { autoClose: false });

    try {
      let imageUrl = blog.img; // keep existing

      if (newImage) {
        const fileExt = newImage.name.split(".").pop()?.toLowerCase() || "jpg";
        const timestamp = Date.now();
        const fileName = `${blog.id || "new"}-${timestamp}.${fileExt}`;
        const filePath = `blogs/${fileName}`; // optional folder for organization

        const { error: uploadError } = await supabase.storage
          .from("Blogs")
          .upload(filePath, newImage, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from("Blogs")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("blogs")
        .update({
          title: formData.title.trim(),
          short_desc: formData.short_desc.trim(),
          des: formData.des.trim(),
          img: imageUrl,
        })
        .eq("id", blog.id);

      if (updateError) throw updateError;

      toast.dismiss();
      toast.success("Blog updated successfully");
      setIsEditModalOpen(false);
      setNewImage(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error(err.message || "Failed to update blog");
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!blog?.id) return;

    if (!window.confirm(`Delete blog "${blog.title}"? This cannot be undone.`)) {
      return;
    }

    toast("Deleting blog...", { autoClose: false });

    try {
      const { error: deleteError } = await supabase
        .from("blogs")
        .delete()
        .eq("id", blog.id);

      if (deleteError) throw deleteError;

      // Optional: clean up storage
      if (blog.img) {
        try {
          const pathParts = blog.img.split("/");
          const filePath = pathParts.slice(-2).join("/"); // assumes Blogs/{filename}
          await supabase.storage.from("Blogs").remove([filePath]);
        } catch (storageErr) {
          console.warn("Could not delete old image:", storageErr);
        }
      }

      toast.dismiss();
      toast.success("Blog deleted successfully");
      navigate("/blogs"); // ← adjust to your actual blog list route
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error(err.message || "Failed to delete blog");
    }
  };

  if (loading) return <div className="page">Loading...</div>;
  if (error || !blog)
    return <div className="page">Error: {error || "Blog not found"}</div>;

  return (
    <div className="page">
      <div className="content">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => navigate("/blogs")} // ← adjust route if needed
              style={{ background: "none", border: "none" }}
            >
              <img src={backicon} alt="Back" style={{ width: 28, height: 28 }} />
            </button>
            <h1 style={{ margin: 0, fontSize: 28 }}>Blog Details</h1>
          </div>
          <div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              style={{
                padding: "10px 20px",
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: 6,
              }}
            >
              Edit Blog
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              style={{
                padding: "10px 20px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: 6,
                marginLeft: "12px",
              }}
            >
              Delete Blog
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 32 }}>
            {blog.img ? (
              <img
                src={blog.img}
                alt={blog.title}
                style={{ width: 300, height: 200, objectFit: "cover", borderRadius: 12 }}
              />
            ) : (
              <div
                style={{
                  width: 300,
                  height: 200,
                  background: "#f1f5f9",
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.1rem",
                  color: "#6b7280",
                }}
              >
                No Image
              </div>
            )}

            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 12px 0", fontSize: 28 }}>{blog.title}</h2>
              <div style={{ color: "#4B5563", lineHeight: 1.7 }}>
                <p>
                  <strong>Short Description:</strong><br />
                  {blog.short_desc || "—"}
                </p>
                <p style={{ marginTop: 16 }}>
                  <strong>Content:</strong><br />
                  {blog.des || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Edit Blog</h2>
                <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                  ×
                </button>
              </div>

              <div className="modal-body">
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Blog Title *"
                  required
                  disabled
                  
                />
                <textarea
                  value={formData.short_desc}
                  onChange={(e) => setFormData({ ...formData, short_desc: e.target.value })}
                  placeholder="Short description / excerpt"
                  rows={3}
                />
                <textarea
                  value={formData.des}
                  onChange={(e) => setFormData({ ...formData, des: e.target.value })}
                  placeholder="Full blog content"
                  rows={8}
                />

                <div className="cover-upload">
                  <label>Featured Image</label>
                  <input
                    type="file"
                    onChange={(e) => setNewImage(e.target.files?.[0] || null)}
                    accept="image/*"
                  />
                  {newImage && <p className="file-name">Selected: {newImage.name}</p>}
                  {!newImage && blog.img && (
                    <p className="current-image">Current image exists</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn-save" onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "420px" }}>
              <div className="modal-header">
                <h2>Delete Blog</h2>
                <button className="close-btn" onClick={() => setIsDeleteModalOpen(false)}>
                  ×
                </button>
              </div>

              <div className="modal-body">
                <p style={{ fontSize: "16px", color: "#374151" }}>
                  Are you sure you want to delete<br />
                  <strong>"{blog?.title}"</strong>?<br />
                  This action cannot be undone.
                </p>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn-delete" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
      {/* Basic modal styling */}
      <style>{`
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1200;
    padding: 20px;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 560px;
    max-height: 92vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
    border: 1px solid #e5e7eb;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 600;
    color: #1f2937;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.8rem;
    color: #6b7280;
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
  }

  .close-btn:hover {
    color: #374151;
  }

  .modal-body {
    padding: 24px;
  }

  .modal-body input,
  .modal-body textarea {
    width: 100%;
    padding: 12px 14px;
    margin-bottom: 18px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 15px;
    background: #f9fafb;
    transition: border-color 0.2s;
  }

  .modal-body input:focus,
  .modal-body textarea:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  .cover-upload label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #374151;
  }

  .file-name {
    margin-top: 8px;
    color: #059669;
    font-size: 0.9rem;
  }

  .current-image {
    margin-top: 8px;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #e5e7eb;
  }

  .btn-cancel,
  .btn-save,
  .btn-delete {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    font-size: 14px;
  }

  .btn-cancel {
    background: white;
    border: 1px solid #d1d5db;
    color: #4b5563;
  }

  .btn-cancel:hover {
    background: #f3f4f6;
  }

  .btn-save {
    background: #8b5cf6;
    color: white;
  }

  .btn-save:hover {
    background: #7c3aed;
  }

  .btn-delete {
    background: #ef4444;
    color: white;
  }

  .btn-delete:hover {
    background: #dc2626;
  }
`}</style>
    </div>
  );
}
