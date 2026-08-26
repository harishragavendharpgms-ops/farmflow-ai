import { Link } from "react-router-dom";
import "./Login.css"; // We can reuse login/dashboard styles or keep it custom

function Home() {
  return (
    <div className="login-page" style={{ textAlign: "center", padding: "50px 20px" }}>
      <div className="login-card" style={{ maxWidth: "600px", margin: "0 auto", padding: "40px" }}>
        <div className="login-logo" style={{ fontSize: "3rem", marginBottom: "20px" }}>🌾</div>
        <h1 style={{ color: "#2c3e50", marginBottom: "15px" }}>Welcome to FarmFlow AI</h1>
        <p style={{ color: "#666", marginBottom: "30px", fontSize: "1.1rem" }}>
          Your smart assistant for mandi scheduling, live market insights, and effortless crop management.
        </p>

        <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
          <Link to="/login" className="login-btn" style={{ textDecoration: "none", padding: "12px 25px", background: "#27ae60", color: "white", borderRadius: "6px", fontWeight: "bold" }}>
            Login
          </Link>
          <Link to="/register" className="login-btn" style={{ textDecoration: "none", padding: "12px 25px", background: "#3498db", color: "white", borderRadius: "6px", fontWeight: "bold" }}>
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;