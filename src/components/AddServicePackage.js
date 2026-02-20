import React, { useState, useEffect } from "react";
import "../styles/addforms.css";
import Select from "react-select";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import backicon from "../assets/back.png";
import imageicon from "../assets/Imageicon.png";
import { url } from "../utils/urls.js";

export default function AddServicePackage(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authToken] = useState(localStorage.getItem("authToken") || "");
  const [session_id] = useState(localStorage.getItem("session_id") || "");
  const [previousData, setPreviousData] = useState(
    location.state?.data || props.previousData || ""
  );
  const [store_id] = useState(props.storeId || previousData?.store_id || "");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [media, setMedia] = useState(previousData?.profilePhoto || "");

  // Static options for components and serviceLocationOptions
  const componentOptions = [
    { label: "Normal Saline", value: "Normal Saline" },
    { label: "Electrolytes", value: "Electrolytes" },
    { label: "Vitamin C", value: "Vitamin C" },
    { label: "Glucose", value: "Glucose" },
  ];
  const locationOptions = [
    { label: "At Home", value: "At Home" },
    { label: "Clinic", value: "Clinic" },
    { label: "Hospital", value: "Hospital" },
  ];

  // State for service package fields
  const [doctor, setDoctor] = useState({
    type: previousData?.type || "",
    name: previousData?.name || "",
    components: previousData?.components || [],
    serviceLocationOptions: previousData?.serviceLocationOptions || [],
    clinicPrice: previousData?.clinicPrice || "",
    homePrice: previousData?.homePrice || "",
    sessionPackages: previousData?.sessionPackages || [],
  });

  useEffect(() => {
    setPreviousData(location.state?.data || props.previousData || "");
    setDoctor({
      type: previousData?.type || "",
      name: previousData?.name || "",
      components: previousData?.components || [],
      serviceLocationOptions: previousData?.serviceLocationOptions || [],
      clinicPrice: previousData?.clinicPrice || "",
      homePrice: previousData?.homePrice || "",
      sessionPackages: previousData?.sessionPackages || [],
    });
    setMedia(previousData?.profilePhoto || "");
  }, [previousData, props.previousData, location.state]);

  // Handle file uploads
  const handleFileChange = (setFile) => (event) => {
    event.preventDefault();
    setFile(event.target.files[0]);
  };

  // Handle doctor field changes
  const handleDoctorChange = (e, key) => {
    setDoctor({
      ...doctor,
      [key?.name || e?.target?.name || key]: e?.value || e?.target?.value || "",
    });
  };

  // Handle array fields
  const handleArrayEvent = (e, key) => {
    setDoctor({ ...doctor, [key]: e });
  };

  // Upload media
  const uploadMedia = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("media", file);
    try {
      const response = await axios.post(
        `${url}/v1/store/media/upload`,
        formData,
        {
          headers: {
            authtoken: authToken,
            sessionid: session_id,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return "sellers/" + response.data.fileKey;
    } catch (error) {
      console.error("Media upload failed:", error);
      toast.error(error.response?.data?.message || "Media upload failed");
      return null;
    }
  };

  // Submit service package
  const formSubmit = async (formData) => {
    try {
      const endpoint = previousData?.id
        ? `${url}/v1/service-packages/update`
        : `${url}/v1/service-packages/create`;
      const response = await axios.post(endpoint, formData, {
        headers: { authtoken: authToken, sessionid: session_id },
      });
      toast.success("Service package created");
      setDoctor({
        type: "",
        name: "",
        components: [],
        serviceLocationOptions: [],
        clinicPrice: "",
        homePrice: "",
        sessionPackages: [],
      });
      setProfilePhoto(null);
      setMedia("");
      props.setPreviousData?.(null);
      navigate("/service_package");
    } catch (error) {
      console.error("Form submit error:", error);
      toast.error(error.response?.data?.error || "Request failed");
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    toast("Request loading, please wait", { progress: true });
    try {
      // const profilePhotoUrl = await uploadMedia(profilePhoto);
      // if (!profilePhotoUrl && !previousData?.profilePhoto) {
      //   toast.error("Profile photo is required");
      //   return;
      // }
      const formData = {
        ...doctor,
        id: previousData?.id,
        // profilePhoto: profilePhotoUrl || doctor.profilePhoto,
        clinicPrice: parseFloat(doctor.clinicPrice) || 0,
        homePrice: parseFloat(doctor.homePrice) || 0,
      };
      await formSubmit(formData);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Request failed");
    }
  };

  const customColor = (baseStyles) => ({
    ...baseStyles,
    backgroundColor: "rgba(239, 241, 249, 0.6)",
    minHeight: "52px",
  });

  return (
    <div className="content">
      <form className="adding-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <div className="back">
            <button
              className="back-btn"
              type="button"
              onClick={() => navigate("/service_package")}
            >
              <img src={backicon} alt="back" className="back-icon" />
            </button>
          </div>
          <span className="form-heading">
            {doctor.name || "Add Service Package"}
          </span>
          <button type="submit" className="submit-btn addp">
            {previousData?.id ? "Update" : "Create"}
          </button>
        </div>

        <div className="form-body">
          <div className="form-content">
            <div className="content-right">
              <input
                required
                type="text"
                name="type"
                placeholder="Service Type"
                className="field"
                value={doctor.type}
                onChange={handleDoctorChange}
              />
              <input
                required
                type="text"
                name="name"
                placeholder="Service Name"
                className="field"
                value={doctor.name}
                onChange={handleDoctorChange}
              />
              <Select
                isMulti
                styles={{ control: customColor }}
                options={componentOptions}
                value={doctor.components}
                onChange={(e) => handleArrayEvent(e, "components")}
                placeholder="Select Components"
                className="field"
              />
              <Select
                isMulti
                styles={{ control: customColor }}
                options={locationOptions}
                value={doctor.serviceLocationOptions}
                onChange={(e) => handleArrayEvent(e, "serviceLocationOptions")}
                placeholder="Select Service Location Options"
                className="field"
              />
              <input
                required
                type="number"
                name="clinicPrice"
                placeholder="Clinic Price"
                className="field"
                value={doctor.clinicPrice}
                onChange={handleDoctorChange}
              />
              <input
                required
                type="number"
                name="homePrice"
                placeholder="Home Price"
                className="field"
                value={doctor.homePrice}
                onChange={handleDoctorChange}
              />
              <Select
                isMulti
                styles={{ control: customColor }}
                value={doctor.sessionPackages}
                onChange={(e) => handleArrayEvent(e, "sessionPackages")}
                placeholder="Session Packages"
                className="field"
              />
            </div>
          </div>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
}
