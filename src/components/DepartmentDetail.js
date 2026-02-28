import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import { url } from "../utils/urls.js";
import backicon from "../assets/back.png";
import imageicon from "../assets/Imageicon.png";
import deleteIcon from "../assets/delete.png";
import editIcon from "../assets/edit.png";
import supabase from "../utils/supabaseConfig.js";

export default function DepartmentDetail() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const initialDepartment = state?.department;

  const [authToken] = useState(localStorage.getItem("authToken") || "");
  const [session_id] = useState(localStorage.getItem("session_id") || "");

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Child data
  const [services, setServices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [whyChoose, setWhyChoose] = useState([]);

  // Department edit modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptFormData, setDeptFormData] = useState({
    name: "",
    desc: "",
    short_desc: "",
    fee: "",
    cover: "",
  });
  const [coverPhoto, setCoverPhoto] = useState(null);

  // Service modals + state
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [isDeleteServiceModalOpen, setIsDeleteServiceModalOpen] =
    useState(false);
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [editService, setEditService] = useState({ id: null, des: "" });
  const [deleteServiceId, setDeleteServiceId] = useState(null);

  // FAQ modal states (you can expand to full modal if needed)
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");

  // Why Choose Us (simple for now - can be turned into modal later)
  const [newWhyChoose, setNewWhyChoose] = useState("");

  const [isDeleteDeptModalOpen, setIsDeleteDeptModalOpen] = useState(false);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // ────────────────────────────────────────────────
  // Fetch main department + children
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!initialDepartment?.name) {
      setError("No department selected");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Main department
        const { data: dept, error: deptErr } = await supabase
          .from("departments")
          .select("*")
          .eq("name", initialDepartment.name)
          .maybeSingle();

        if (deptErr || !dept)
          throw new Error(deptErr?.message || "Department not found");

        setDepartment(dept);
        setDeptFormData({
          name: dept.name || "",
          desc: dept.desc || "",
          short_desc: dept.short_desc || "",
          fee: dept.fee || "",
          cover: dept.cover_img || "",
        });

        // 2. Children in parallel
        const [servicesRes, faqsRes, whyRes] = await Promise.all([
          supabase
            .from("departments_services")
            .select("*")
            .eq("department_id", dept.department_id)
            .order("created_at"),
          supabase
            .from("departments_faqs")
            .select("*")
            .eq("department_id", dept.department_id)
            .order("created_at"),
          supabase
            .from("departments_why_choose")
            .select("*")
            .eq("department_id", dept.department_id)
            .order("created_at"),
        ]);

        setServices(servicesRes.data || []);
        setFaqs(faqsRes.data || []);
        setWhyChoose(whyRes.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load department data");
        toast.error(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialDepartment?.name, refreshKey]);

  // ────────────────────────────────────────────────
  // Department Update (still using your API)
  // ────────────────────────────────────────────────
  // const handleSaveDepartment = async () => {
  //   if (!department?.id) return;

  //   toast("Updating department...", { autoClose: false });

  //   try {
  //     const formData = new FormData();
  //     formData.append("id", department.id);
  //     formData.append("name", deptFormData.name);
  //     formData.append("desc", deptFormData.desc); // ← aligned name
  //     formData.append("short_desc", deptFormData.short_desc);
  //     formData.append("fee", Number(deptFormData.fee) || 0);

  //     if (coverPhoto) {
  //       formData.append("cover", coverPhoto);
  //     }

  //     const res = await axios.put(`${url}/v1/department/update`, formData, {
  //       headers: {
  //         authtoken: authToken,
  //         sessionid: session_id,
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });

  //     toast.dismiss();
  //     toast.success("Department updated");
  //     setIsDeptModalOpen(false);
  //     setCoverPhoto(null);
  //     setRefreshKey((k) => k + 1);
  //   } catch (err) {
  //     toast.dismiss();
  //     toast.error(err.response?.data?.error || "Update failed");
  //   }
  // };

  const handleSaveDepartment = async () => {
    if (!department?.department_id) return;

    toast("Updating department...", { autoClose: false });

    try {
      let coverUrl = department.cover_img; // keep old url by default

      // ── 1. Upload new image if selected ────────────────────────────────
      if (coverPhoto) {
        const fileExt =
          coverPhoto.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${department.department_id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // organize in folder

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("Departments") // ← change to your bucket name
          .upload(filePath, coverPhoto, {
            cacheControl: "3600",
            upsert: false, // or true if you want to overwrite same path
          });

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("Departments")
          .getPublicUrl(filePath);

        coverUrl = publicUrlData.publicUrl;

        // Optional: you could also remove old image here if you want
        // (but usually better to keep old ones unless you have storage concerns)
      }

      // ── 2. Update department row ───────────────────────────────────────
      const { error: updateError } = await supabase
        .from("departments")
        .update({
          name: deptFormData.name.trim(),
          desc: deptFormData.desc.trim(),
          short_desc: deptFormData.short_desc.trim(),
          fee: Number(deptFormData.fee) || 0,
          cover_img: coverUrl,
          // updated_at: new Date().toISOString(),   // if you have trigger → skip
        })
        .eq("department_id", department.department_id);

      if (updateError) throw updateError;

      toast.dismiss();
      toast.success("Department updated successfully");

      setIsDeptModalOpen(false);
      setCoverPhoto(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error(err.message || "Failed to update department");
    }
  };

  const handleDeleteDepartment = async () => {
    if (!department?.department_id) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this department?\nThis will also delete all related services, FAQs, and Why Choose Us entries.",
      )
    ) {
      return;
    }

    toast("Deleting department...", { autoClose: false });

    try {
      // Optional: delete children first (safer, especially if no CASCADE)
      await Promise.all([
        supabase
          .from("departments_services")
          .delete()
          .eq("department_id", department.department_id),
        supabase
          .from("departments_faqs")
          .delete()
          .eq("department_id", department.department_id),
        supabase
          .from("departments_why_choose")
          .delete()
          .eq("department_id", department.department_id),
      ]);

      // Now delete the main department
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("department_id", department.department_id);

      if (error) throw error;

      toast.dismiss();
      toast.success("Department deleted successfully");

      // Redirect back to list
      navigate("/department");
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error(err.message || "Failed to delete department");
    }
  };
  // ────────────────────────────────────────────────
  // Services CRUD
  // ────────────────────────────────────────────────
  const handleAddService = async () => {
    if (!newServiceDesc.trim() || !department?.department_id) return;

    const { error } = await supabase.from("departments_services").insert({
      department_id: department.department_id,
      des: newServiceDesc.trim(),
    });

    if (error) {
      toast.error("Failed to add service: " + error.message);
      return;
    }

    toast.success("Service added");
    setNewServiceDesc("");
    setIsAddServiceModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleUpdateService = async () => {
    if (!editService.id || !editService.des.trim()) return;

    const { error } = await supabase
      .from("departments_services")
      .update({ des: editService.des.trim() })
      .eq("id", editService.id);

    if (error) {
      toast.error("Failed to update service");
      return;
    }

    toast.success("Service updated");
    setEditService({ id: null, des: "" });
    setIsEditServiceModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteService = async () => {
    if (!deleteServiceId) return;

    const { error } = await supabase
      .from("departments_services")
      .delete()
      .eq("id", deleteServiceId);

    if (error) {
      toast.error("Failed to delete service");
      return;
    }

    toast.success("Service deleted");
    setDeleteServiceId(null);
    setIsDeleteServiceModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  // ────────────────────────────────────────────────
  // FAQs CRUD (simple inline for now - can be modal-ized)
  // ────────────────────────────────────────────────
  const addFaq = async () => {
    if (
      !currentQuestion.trim() ||
      !currentAnswer.trim() ||
      !department?.department_id
    ) {
      toast.error("Question and answer required");
      return;
    }

    const { error } = await supabase.from("departments_faqs").insert({
      department_id: department.department_id,
      question: currentQuestion.trim(),
      answer: currentAnswer.trim(),
    });

    if (error) {
      toast.error("Failed to add FAQ");
      return;
    }

    toast.success("FAQ added");
    setCurrentQuestion("");
    setCurrentAnswer("");
    setRefreshKey((k) => k + 1);
  };

  const deleteFaq = async (faqId) => {
    if (!window.confirm("Delete this FAQ?")) return;

    const { error } = await supabase
      .from("departments_faqs")
      .delete()
      .eq("id", faqId);
    if (error) toast.error("Failed to delete FAQ");
    else {
      toast.success("FAQ deleted");
      setRefreshKey((k) => k + 1);
    }
  };

  // ────────────────────────────────────────────────
  // Why Choose Us CRUD (simple version)
  // ────────────────────────────────────────────────
  const addWhyChoose = async () => {
    if (!newWhyChoose.trim() || !department?.department_id) return;

    const { error } = await supabase.from("departments_why_choose").insert({
      department_id: department.department_id,
      des: newWhyChoose.trim(),
    });

    if (error) {
      toast.error("Failed to add point");
      return;
    }

    toast.success("Added to Why Choose Us");
    setNewWhyChoose("");
    setRefreshKey((k) => k + 1);
  };

  const deleteWhyChoose = async (id) => {
    if (!window.confirm("Remove this point?")) return;

    const { error } = await supabase
      .from("departments_why_choose")
      .delete()
      .eq("id", id);
    if (error) toast.error("Failed to remove");
    else {
      toast.success("Removed");
      setRefreshKey((k) => k + 1);
    }
  };

  // ────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────
  if (loading) return <div className="page">Loading...</div>;
  if (error || !department)
    return <div className="page">Error: {error || "Department not found"}</div>;

  return (
    <div className="page">
      <div className="content">
        {/* Header + Back + Delete */}
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
              onClick={() => navigate("/department")}
              style={{ background: "none", border: "none" }}
            >
              <img
                src={backicon}
                alt="Back"
                style={{ width: 28, height: 28 }}
              />
            </button>
            <h1 style={{ margin: 0, fontSize: 28 }}>Department Details</h1>
          </div>
          <div>
            <button
              onClick={() => setIsDeptModalOpen(true)}
              style={{
                padding: "10px 20px",
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: 6,
              }}
            >
              Edit Department
            </button>

            <button
              onClick={() => setIsDeleteDeptModalOpen(true)}
              style={{
                padding: "10px 20px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: 6,
                marginLeft: "12px",
              }}
            >
              Delete Department
            </button>
          </div>
        </div>

        {/* Main Info Card */}
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
            {department.cover_img ? (
              <img
                src={department.cover_img}
                alt="Cover"
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
                {department.name}
              </h2>
              <div style={{ color: "#4B5563", lineHeight: 1.6 }}>
                <p>
                  <strong>Short Description:</strong>{" "}
                  {department.short_desc || "—"}
                </p>
                <p style={{ marginTop: 12 }}>
                  <strong>Description:</strong> {department.desc || "—"}
                </p>
                <p style={{ marginTop: 12 }}>
                  <strong>Fee:</strong> {department.fee ?? "—"}
                </p>

                <p style={{ marginTop: 12 }}>
                  <strong>Status:</strong> {department.status || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Why Choose Us */}
          <section style={{ marginTop: 40 }}>
            <h3 style={{ marginBottom: 16 }}>Why Choose Us</h3>
            {whyChoose.length === 0 ? (
              <p style={{ color: "#6B7280" }}>No points added yet.</p>
            ) : (
              <ul style={{ listStyle: "disc", paddingLeft: 24, margin: 0 }}>
                {whyChoose.map((item) => (
                  <li
                    key={item.id}
                    style={{
                      marginBottom: 8,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    {item.des}
                    <button
                      onClick={() => deleteWhyChoose(item.id)}
                      style={{
                        color: "#EF4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <input
                value={newWhyChoose}
                onChange={(e) => setNewWhyChoose(e.target.value)}
                placeholder="Add new point..."
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                }}
              />
              <button
                onClick={addWhyChoose}
                style={{
                  padding: "10px 20px",
                  background: "#8B5CF6",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                }}
              >
                Add
              </button>
            </div>
          </section>

          <hr style={{ margin: "32px 0", borderColor: "#E5E7EB" }} />

          {/* Services */}
          <section>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3>Services</h3>
              <button
                onClick={() => setIsAddServiceModalOpen(true)}
                style={{
                  padding: "8px 16px",
                  background: "#10B981",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                }}
              >
                + Add Service
              </button>
            </div>

            {services.length === 0 ? (
              <p style={{ color: "#6B7280" }}>No services yet.</p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    style={{
                      padding: 16,
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>{svc.des}</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button
                        onClick={() => {
                          setEditService({ id: svc.id, des: svc.des });
                          setIsEditServiceModalOpen(true);
                        }}
                      >
                        <img src={editIcon} alt="Edit" style={{ width: 20 }} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteServiceId(svc.id);
                          setIsDeleteServiceModalOpen(true);
                        }}
                      >
                        <img
                          src={deleteIcon}
                          alt="Delete"
                          style={{ width: 20 }}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <hr style={{ margin: "32px 0", borderColor: "#E5E7EB" }} />

          {/* FAQs */}
          <section>
            <h3 style={{ marginBottom: 16 }}>FAQs</h3>

            {faqs.length === 0 ? (
              <p style={{ color: "#6B7280" }}>No FAQs yet.</p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    style={{ borderLeft: "4px solid #6366F1", paddingLeft: 16 }}
                  >
                    <strong>Q: {faq.question}</strong>
                    <p style={{ margin: "8px 0 0 0" }}>A: {faq.answer}</p>
                    <button
                      onClick={() => deleteFaq(faq.id)}
                      style={{
                        marginTop: 8,
                        color: "#EF4444",
                        background: "none",
                        border: "none",
                        fontSize: 14,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <input
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="Question"
                style={{
                  padding: "10px 14px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                }}
              />
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Answer"
                rows={3}
                style={{
                  padding: "10px 14px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                }}
              />
              <button
                onClick={addFaq}
                style={{
                  padding: "10px 20px",
                  background: "#3B82F6",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  alignSelf: "flex-start",
                }}
              >
                Add FAQ
              </button>
            </div>
          </section>
        </div>

        {/* ── Modals ─────────────────────────────────────── */}

        {/* {isDeptModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Edit Department</h2>
              <input
                value={deptFormData.name}
                onChange={(e) =>
                  setDeptFormData({ ...deptFormData, name: e.target.value })
                }
                placeholder="Name"
              />
              <textarea
                value={deptFormData.desc}
                onChange={(e) =>
                  setDeptFormData({ ...deptFormData, desc: e.target.value })
                }
                placeholder="Description"
              />
              <input
                value={deptFormData.short_desc}
                onChange={(e) =>
                  setDeptFormData({
                    ...deptFormData,
                    short_desc: e.target.value,
                  })
                }
                placeholder="Short Description"
              />
              <input
                type="number"
                value={deptFormData.fee}
                onChange={(e) =>
                  setDeptFormData({ ...deptFormData, fee: e.target.value })
                }
                placeholder="Fee"
              />

              <div style={{ margin: "16px 0" }}>
                <label>Cover Image</label>
                <input
                  type="file"
                  onChange={(e) => setCoverPhoto(e.target.files[0])}
                  accept="image/*"
                />
                {coverPhoto && <p>Selected: {coverPhoto.name}</p>}
              </div>

              <div
                style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
              >
                <button onClick={() => setIsDeptModalOpen(false)}>
                  Cancel
                </button>
                <button
                  onClick={handleSaveDepartment}
                  style={{ background: "#8B5CF6", color: "white" }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddServiceModalOpen && (
            <div className="modal">
              <h2>Add Service</h2>
              <textarea
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                placeholder="Service description"
                rows={4}
              />
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                  marginTop: 20,
                }}
              >
                <button onClick={() => setIsAddServiceModalOpen(false)}>
                  Cancel
                </button>
                <button
                  onClick={handleAddService}
                  style={{ background: "#10B981", color: "white" }}
                >
                  Add
                </button>
              </div>
            </div>
        )}

        {isEditServiceModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Edit Service</h2>
              <textarea
                value={editService.des}
                onChange={(e) =>
                  setEditService({ ...editService, des: e.target.value })
                }
                rows={4}
              />
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                  marginTop: 20,
                }}
              >
                <button onClick={() => setIsEditServiceModalOpen(false)}>
                  Cancel
                </button>
                <button
                  onClick={handleUpdateService}
                  style={{ background: "#8B5CF6", color: "white" }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleteServiceModalOpen && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 400 }}>
              <h2>Confirm Delete</h2>
              <p>Are you sure you want to delete this service?</p>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                  marginTop: 24,
                }}
              >
                <button onClick={() => setIsDeleteServiceModalOpen(false)}>
                  Cancel
                </button>
                <button
                  onClick={handleDeleteService}
                  style={{ background: "#EF4444", color: "white" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )} */}

        {isDeptModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Edit Department</h2>
                <button
                  className="close-btn"
                  onClick={() => setIsDeptModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <input
                  value={deptFormData.name}
                  onChange={(e) =>
                    setDeptFormData({ ...deptFormData, name: e.target.value })
                  }
                  placeholder="Department Name *"
                  required
                  disabled
                />
                <textarea
                  value={deptFormData.desc}
                  onChange={(e) =>
                    setDeptFormData({ ...deptFormData, desc: e.target.value })
                  }
                  placeholder="Full Description"
                  rows={4}
                />
                <input
                  value={deptFormData.short_desc}
                  onChange={(e) =>
                    setDeptFormData({
                      ...deptFormData,
                      short_desc: e.target.value,
                    })
                  }
                  placeholder="Short Description"
                />
                <input
                  type="number"
                  value={deptFormData.fee}
                  onChange={(e) =>
                    setDeptFormData({ ...deptFormData, fee: e.target.value })
                  }
                  placeholder="Fee (optional)"
                  min="0"
                />

                <div className="cover-upload">
                  <label>Cover Image</label>
                  <input
                    type="file"
                    onChange={(e) => setCoverPhoto(e.target.files?.[0] || null)}
                    accept="image/*"
                  />
                  {coverPhoto && (
                    <p className="file-name">Selected: {coverPhoto.name}</p>
                  )}
                  {!coverPhoto && department.cover_img && (
                    <p className="current-image">Current image exists</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setIsDeptModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn-save" onClick={handleSaveDepartment}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddServiceModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "480px" }}>
              <div className="modal-header">
                <h2>Add New Service</h2>
                <button
                  className="close-btn"
                  onClick={() => setIsAddServiceModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <textarea
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  placeholder="Enter service description..."
                  rows={5}
                  style={{ minHeight: "120px" }}
                />
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setIsAddServiceModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn-save" onClick={handleAddService}>
                  Add Service
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditServiceModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "480px" }}>
              <div className="modal-header">
                <h2>Edit Service</h2>
                <button
                  className="close-btn"
                  onClick={() => setIsEditServiceModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <textarea
                  value={editService.des}
                  onChange={(e) =>
                    setEditService({ ...editService, des: e.target.value })
                  }
                  rows={5}
                  style={{ minHeight: "120px" }}
                />
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setIsEditServiceModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn-save" onClick={handleUpdateService}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleteServiceModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "420px" }}>
              <div className="modal-header">
                <h2>Delete Service</h2>
                <button
                  className="close-btn"
                  onClick={() => setIsDeleteServiceModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <p style={{ fontSize: "16px", color: "#374151" }}>
                  Are you sure you want to delete this service?
                  <br />
                  This action cannot be undone.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setIsDeleteServiceModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn-delete" onClick={handleDeleteService}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleteDeptModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "420px" }}>
              <div className="modal-header">
                <h2>Delete Department</h2>
                <button
                  className="close-btn"
                  onClick={() => setIsDeleteDeptModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <p style={{ fontSize: "16px", color: "#374151" }}>
                  Are you sure you want to delete{" "}
                  <strong>{department?.name}</strong>?<br />
                  This action cannot be undone and will remove all related
                  services, FAQs, and other data.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setIsDeleteDeptModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn-delete" onClick={handleDeleteDepartment}>
                  Delete Department
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
