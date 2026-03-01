import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import backicon from "../assets/back.png";
import supabase from "../utils/supabaseConfig.js";

export default function TeamDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTeam = location.state?.team;

  console.log("Location state:", location.state);
  console.log("Initial team:", initialTeam);

  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    desc: "",
    short_desc: "",
    designation: "",
    fee: "",
    img: "", // we'll update this if new upload
  });
  const [newPhoto, setNewPhoto] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch team member
  useEffect(() => {
    if (!initialTeam?.name) {
      setError("No team member selected");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("team")
          .select("*")
          .eq("name", initialTeam.name)
          .maybeSingle();

        if (fetchError || !data) {
          throw new Error(fetchError?.message || "Team member not found");
        }

        setTeamMember(data);
        setFormData({
          name: data.name || "",
          desc: data.desc || "",
          short_desc: data.short_desc || "",
          designation: data.designation || "",
          fee: data.fee || "",
          img: data.img || "",
        });
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load team member data");
        toast.error(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialTeam?.name, refreshKey]);

  // Handle Update
  const handleSave = async () => {
    if (!teamMember?.id) return; // ← adjust if PK is team_id

    toast("Updating team member...", { autoClose: false });

    try {
      let imageUrl = teamMember.img; // keep existing

      if (newPhoto) {
        const fileExt = newPhoto.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${teamMember.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // optional folder

        const { error: uploadError } = await supabase.storage
          .from("Team")
          .upload(filePath, newPhoto, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from("Team")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;

        // Optional: delete old image if you want (avoid orphan files)
        // if (teamMember.img) {
        //   const oldPath = teamMember.img.split("/").pop(); // simplistic
        //   await supabase.storage.from("Team").remove([oldPath]);
        // }
      }

      const { error: updateError } = await supabase
        .from("team")
        .update({
          name: formData.name.trim(),
          short_desc: formData.short_desc.trim(),
          designation: formData.designation.trim(),
          img: imageUrl,
        })
        .eq("id", teamMember.id);

      if (updateError) throw updateError;

      toast.dismiss();
      toast.success("Team member updated successfully");
      setIsEditModalOpen(false);
      setNewPhoto(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error(err.message || "Failed to update team member");
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!teamMember?.id) return;

    if (
      !window.confirm(`Are you sure you want to delete ${teamMember.name}?`)
    ) {
      return;
    }

    toast("Deleting team member...", { autoClose: false });

    try {
      const { error } = await supabase
        .from("team")
        .delete()
        .eq("id", teamMember.id);

      if (error) throw error;

      // Optional: remove image from storage
      if (teamMember.img) {
        const filePath = teamMember.img.split("/").slice(-2).join("/"); // adjust based on your path
        await supabase.storage.from("Team").remove([filePath]);
      }

      toast.dismiss();
      toast.success("Team member deleted successfully");
      navigate("/Team"); // or "/team" — adjust route
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error(err.message || "Failed to delete team member");
    }
  };

  if (loading) return <div className="page">Loading...</div>;
  if (error || !teamMember)
    return (
      <div className="page">Error: {error || "Team member not found"}</div>
    );

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
              onClick={() => navigate("/Team")}
              style={{ background: "none", border: "none" }}
            >
              <img
                src={backicon}
                alt="Back"
                style={{ width: 28, height: 28 }}
              />
            </button>
            <h1 style={{ margin: 0, fontSize: 28 }}>Team Member Details</h1>
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
              Edit Team Member
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
              Delete Team Member
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
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
              marginBottom: 32,
            }}
          >
            {teamMember.img ? (
              <img
                src={teamMember.img}
                alt="Profile"
                style={{
                  width: 140,
                  height: 140,
                  objectFit: "cover",
                  borderRadius: 12,
                }}
              />
            ) : (
              <div
                style={{
                  width: 140,
                  height: 140,
                  background: "#f1f5f9",
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                No Image
              </div>
            )}

            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 8px 0", fontSize: 26 }}>
                {teamMember.name}
              </h2>
              <div style={{ color: "#4B5563", lineHeight: 1.6 }}>
                <p>
                  <strong>Designation:</strong> {teamMember.designation || "—"}
                </p>
                <p style={{ marginTop: 12 }}>
                  <strong>Short Description:</strong>{" "}
                  {teamMember.short_desc || "—"}
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
                <h2>Edit Team Member</h2>
                <button
                  className="close-btn"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Full Name *"
                  required
                  disabled // ← remove if name should be editable
                />
                <input
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  placeholder="Designation / Role"
                />

                <input
                  value={formData.short_desc}
                  onChange={(e) =>
                    setFormData({ ...formData, short_desc: e.target.value })
                  }
                  placeholder="Short Description / Tagline"
                />

                <div className="cover-upload">
                  <label>Profile Photo</label>
                  <input
                    type="file"
                    onChange={(e) => setNewPhoto(e.target.files?.[0] || null)}
                    accept="image/*"
                  />
                  {newPhoto && (
                    <p className="file-name">Selected: {newPhoto.name}</p>
                  )}
                  {!newPhoto && teamMember.img && (
                    <p className="current-image">Current photo exists</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                >
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
                <h2>Delete Team Member</h2>
                <button
                  className="close-btn"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <p style={{ fontSize: "16px", color: "#374151" }}>
                  Are you sure you want to delete{" "}
                  <strong>{teamMember?.name}</strong>?<br />
                  This action cannot be undone.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
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
