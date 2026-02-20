import React, { useState } from "react";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import "../styles/form.css";
import vector1 from "./../assets/smartCare_hero.jpg";
import vector2 from "./../assets/vector2.png";
import woodmark from "./../assets/Logo.svg";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { url } from "../utils/urls.js";
// axios.defaults.withCredentials = true;
import supabase from "../utils/supabaseConfig.js";

export default function Login(props) {
  // console.log(props);
  const location = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function validateForm() {
    return email.length > 0 && password.length > 0;
  }

  // function login(email, password) {
  //   toast("please wait", {
  //     progress: true,
  //   });
  //   axios
  //     .post(
  //       `${url}/v1/admin/login`,
  //       {
  //         email: email,
  //         password: password,
  //       },
  //       // {
  //       //   // headers: {
  //       //   //   "Content-Type": "application/json",
  //       //   // },
  //       // }
  //     )
  //     .then(function (response) {
  //       console.log(response.data.data);
  //       if (response.data?.success) {
  //         localStorage.setItem("login", true);
  //         localStorage.setItem("role", response.data.data.role);
  //         props.setRole(response.data.data.role);
  //         props.setLogin(true);
  //         // localStorage.setItem("authToken", response.data.data.authToken);
  //         // localStorage.setItem("session_id", response.data.data.session_id);
  //         // props.setLogin(true);
  //         // location("/");
  //       }
  //     })
  //     .catch(function (error) {
  //       toast.dismiss();
  //       toast(error.response?.data?.message || "Login failed", {
  //         type: "error",
  //       });
  //       console.log(error.response.data);
  //     });
  // }


  function login(email, password) {
    toast("Please wait...", {
      progress: true,
      autoClose: false, // keep it visible during request
    });

    supabase.auth
      .signInWithPassword({
        email: email.trim(),
        password: password,
      })
      .then(async ({ data, error }) => {
        if (error) {
          throw error; // go to catch block
        }

        // Login successful
        console.log("Logged in user:", data.user);

        // 1. Check if this user has admin role
        //    (assuming you store role in user_metadata or in profiles table)
        const userRole = data.user?.user_metadata?.role || "user";

        // Alternative: fetch from profiles table if role is stored there
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role") // or whatever column you use for role
          .eq("uid", data.user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          // PGRST116 = no rows
          console.warn("Could not fetch profile:", profileError);
        }

        const finalRole = profile?.role || userRole || "user";

        // 2. Only allow login if role is admin (or your admin roles)
        if (!["admin", "superadmin"].includes(finalRole.toLowerCase())) {
          // Logout immediately if not admin
          await supabase.auth.signOut();
          throw new Error("Access denied: Admin privileges required");
        }

        // 3. Store necessary data (similar to your original logic)
        localStorage.setItem("login", "true");
        localStorage.setItem("role", finalRole);

        // Optional: store more info
        // localStorage.setItem("user_id", data.user.id);
        // localStorage.setItem("email", data.user.email);

        // Update parent component state
        props.setRole(finalRole);
        props.setLogin(true);

        toast.dismiss();
        toast.success("Login successful");

        // Redirect to dashboard or home
        // window.location.href = "/";           // simple redirect
        // or better (if using react-router):
        // navigate("/");
      })
      .catch((error) => {
        toast.dismiss();

        let errorMessage = "Login failed";

        if (error.message?.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password";
        } else if (error.message?.includes("Access denied")) {
          errorMessage = error.message; // "Access denied: Admin privileges required"
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);

        console.error("Login error:", error);
      });
  }
  function handleSubmit(event) {
    event.preventDefault();
    login(email, password);
  }

  return (
    <div className="loginpage" style={{ height: "100vh", overflow: "hidden" }}>
      <section className="logosection tab1">
        <div className="vector1">
          <img src={vector1} alt="logoimage" style={{ height: "100vh" }} />
        </div>
      </section>
      <section className="formsection tab2">
        <div className="heading">
          <h3 className="h3">Admin Portal</h3>
          <p className="head-pg"></p>
        </div>
        <div className="form">
          <Form onSubmit={handleSubmit}>
            <div className="fields-group">
              <Form.Group className="mb-3 email" controlId="formBasicEmail">
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  className="form-field"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={password}
                  className="form-field"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>
            </div>
            <Button
              className="btn form-btn"
              variant="secondary"
              type="submit"
              disabled={!validateForm()}
              style={{ cursor: "pointer" }}
            >
              Sign in
            </Button>
          </Form>
        </div>
      </section>
      <ToastContainer />
    </div>
  );
}
