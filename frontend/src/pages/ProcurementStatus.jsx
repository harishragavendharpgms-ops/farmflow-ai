import "./ProcurementStatus.css";
import { Link } from "react-router-dom";

function ProcurementStatus() {
  return (
    <div className="status-page">
      <div className="status-container">
        
        <div className="status-header">
          <h2>📦 Procurement Status</h2>
          {/* This button will take us back to the Dashboard */}
          <Link to="/dashboard" className="back-btn">
            ⬅ Back to Dashboard
          </Link>
        </div>

        <div className="status-list">
          
          {/* Item 1 */}
          <div className="status-item">
            <div className="crop-info">
              <h3>Wheat (150 kg)</h3>
              <p>Submitted on: Aug 20, 2026</p>
            </div>
            <div className="status-badge scheduled">Scheduled</div>
          </div>

          {/* Item 2 */}
          <div className="status-item">
            <div className="crop-info">
              <h3>Maize (200 kg)</h3>
              <p>Submitted on: Aug 18, 2026</p>
            </div>
            <div className="status-badge processing">Processing</div>
          </div>

          {/* Item 3 */}
          <div className="status-item">
            <div className="crop-info">
              <h3>Vegetables (50 kg)</h3>
              <p>Submitted on: Aug 15, 2026</p>
            </div>
            <div className="status-badge collected">Collected</div>
          </div>

        </div>
        
      </div>
    </div>
  );
}

export default ProcurementStatus;