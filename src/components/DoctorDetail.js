import "../styles/addforms.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import backicon from "../assets/back.png";

export default function DoctorDetail() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const doctor = state?.doctor;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCredentials({ email: "", password: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://backend-9x8p.smartcareclinic.ae/v1/doctor/create-doctor-creds",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            id: doctor.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create credentials");
      }

      alert("Credentials created successfully!");
      handleCloseModal();
      navigate("/doctors");
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!doctor) {
    return <div className="content">Doctor not found</div>;
  }

  return (
    <div className="content">
      <div className="form-header">
        <div className="back">
          <button
            className="back-btn"
            type="button"
            onClick={() => navigate("/doctors")}
          >
            <img src={backicon} alt="Back" className="back-icon" />
          </button>
        </div>
        <span className="form-heading">Doctor Details</span>
      </div>

      <div className="doctor-detail-container">
        {/* Profile Header */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="doctor-profile-header">
            {doctor.profilePhoto ? (
              <img
                src={doctor.profilePhoto}
                alt={`${doctor.name}'s profile`}
                className="doctor-profile-photo"
              />
            ) : (
              <div className="doctor-profile-placeholder">No Photo</div>
            )}
            <div className="doctor-profile-info">
              <h1>{doctor.name}</h1>
              <p className="professional-title">{doctor.professionalTitle}</p>
              <p className="average-rating">
                Rating: {doctor.averageRating} / 5
              </p>
            </div>
          </div>
          <div>
            <button
              style={{
                minWidth: "max-content",
                padding: "10px 20px",
                border: "none",
                background:
                  doctor.email !== null
                    ? "rgba(0, 0, 0, 0.3)"
                    : "rgba(61, 162, 218, .9)",
                color: "white",
                fontSize: "large",
                cursor: doctor.email !== null ? "not-allowed" : "pointer",
                borderRadius: "5px",
                opacity: doctor.email !== null ? 0.6 : 1,
              }}
              onClick={handleOpenModal}
              disabled={doctor.email !== null}
            >
              Create Credentials
            </button>
          </div>
        </div>

        {/* Doctor Details */}
        <div className="doctor-details">
          <h2>Professional Information</h2>
          <div className="detail-grid">
            {/* <div className="detail-item">
              <strong>ID:</strong> {doctor.id}
            </div> */}
            <div className="detail-item">
              <strong>Department:</strong> {doctor.department?.name || "N/A"}
            </div>
            <div className="detail-item">
              <strong>Specialties:</strong>{" "}
              {doctor.specialties?.join(", ") || "None"}
            </div>
            <div className="detail-item">
              <strong>Fees:</strong> PKR {doctor.fees}
            </div>
            <div className="detail-item">
              <strong>Primary Location:</strong>{" "}
              {doctor.primaryLocation || "N/A"}
            </div>
            <div className="detail-item">
              <strong>Experience:</strong> {doctor.experience || "N/A"}
            </div>
            <div className="detail-item">
              <strong>Languages:</strong>{" "}
              {doctor.languages?.join(", ") || "None"}
            </div>
            <div className="detail-item">
              <strong>Surgeon:</strong> {doctor.surgeon ? "Yes" : "No"}
            </div>
            <div className="detail-item">
              <strong>Regulating Authority:</strong>{" "}
              {doctor.regulatingAuthority || "N/A"}
            </div>
            <div className="detail-item">
              <strong>License Expiry:</strong>{" "}
              {doctor.licenseExpiryDate
                ? new Date(doctor.licenseExpiryDate).toLocaleDateString()
                : "N/A"}
            </div>
          </div>

          <h2>Educational Background</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <strong>Degree:</strong> {doctor.degreeQualification || "N/A"}
            </div>
            <div className="detail-item">
              <strong>University:</strong> {doctor.universityName || "N/A"}
            </div>
            <div className="detail-item">
              <strong>Year of Graduation:</strong>{" "}
              {doctor.yearOfGraduation || "N/A"}
            </div>
            <div className="detail-item">
              <strong>Certifications:</strong>{" "}
              {doctor.educationCertifications
                ? Object.entries(doctor.educationCertifications)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ")
                : "None"}
            </div>
          </div>

          <h2>Personal Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <strong>Gender:</strong> {doctor.gender || "N/A"}
            </div>
            <div className="detail-item">
              <strong>Nationality:</strong> {doctor.nationality || "N/A"}
            </div>
            <div className="detail-item">
              <strong>Mobile Number:</strong>{" "}
              {doctor.personalMobileNumber || "N/A"}
            </div>
            <div className="detail-item">
              <strong>Email:</strong> {doctor.personalEmailAddress || "N/A"}
            </div>
          </div>

          <h2>About</h2>
          <p className="about-me">
            {doctor.aboutMe || "No description available."}
          </p>

          <h2>Department Details</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <strong>Department Name:</strong>{" "}
              {doctor.department?.name || "N/A"}
            </div>
            <div className="detail-item">
              <strong>Short Description:</strong>{" "}
              {doctor.department?.shortDes || "N/A"}
            </div>
            <div className="detail-item">
              <strong>Description:</strong> {doctor.department?.des || "N/A"}
            </div>
          </div>

          <h2>Credentials</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <strong>Email:</strong>{" "}
              {doctor.email || credentials?.email || "N/A"}
            </div>
            <div className="detail-item">
              <strong>Password:</strong>{" "}
              {doctor.password || credentials?.password || "N/A"}
            </div>
          </div>
        </div>
      </div>
      <div>
        {isModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "5px",
                width: "400px",
                maxWidth: "90%",
              }}
            >
              <h2>Create Credentials</h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <div>
                  <label
                    htmlFor="email"
                    style={{ display: "block", marginBottom: "5px" }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={credentials.email}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    style={{ display: "block", marginBottom: "5px" }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid #ccc",
                      background: "white",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    style={{
                      padding: "8px 16px",
                      border: "none",
                      background: "rgba(61, 162, 218, .9)",
                      color: "white",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
